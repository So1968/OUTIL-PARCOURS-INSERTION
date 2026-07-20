import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const STORAGE_ROWS = "artag-pilotage-actions-rows-v1";
const STORAGE_ACTIONS = "artag-pilotage-actions-suivi-v1";

function lireJson(cle, defaut) {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur ? JSON.parse(valeur) : defaut;
  } catch {
    return defaut;
  }
}

function sauvegarder(rows, actions) {
  localStorage.setItem(STORAGE_ROWS, JSON.stringify(rows));
  localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(actions));
}

function detecterSeparateur(ligne) {
  const candidats = [";", ",", "\t"];
  return candidats.map((separateur) => ({ separateur, score: ligne.split(separateur).length })).sort((a, b) => b.score - a.score)[0].separateur;
}

function parserCsv(texte) {
  const premiereLigne = String(texte || "").split(/\r?\n/).find((ligne) => ligne.trim()) || "";
  const separateur = detecterSeparateur(premiereLigne);
  const lignes = [];
  let ligne = [];
  let cellule = "";
  let guillemets = false;

  for (let i = 0; i < texte.length; i += 1) {
    const caractere = texte[i];
    const suivant = texte[i + 1];

    if (caractere === '"' && guillemets && suivant === '"') {
      cellule += '"';
      i += 1;
    } else if (caractere === '"') {
      guillemets = !guillemets;
    } else if (caractere === separateur && !guillemets) {
      ligne.push(cellule);
      cellule = "";
    } else if ((caractere === "\n" || caractere === "\r") && !guillemets) {
      if (caractere === "\r" && suivant === "\n") i += 1;
      ligne.push(cellule);
      if (ligne.some((valeur) => valeur.trim())) lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else {
      cellule += caractere;
    }
  }

  ligne.push(cellule);
  if (ligne.some((valeur) => valeur.trim())) lignes.push(ligne);
  if (lignes.length < 2) return [];

  const entetes = lignes[0].map((entete) => entete.trim().replace(/^\uFEFF/, ""));
  return lignes.slice(1).map((cellules) => {
    const item = {};
    entetes.forEach((entete, index) => {
      item[entete] = String(cellules[index] || "").trim();
    });
    return item;
  });
}

function valeur(row, noms) {
  for (const nom of noms) {
    if (row[nom]) return row[nom];
  }
  return "";
}

function normaliser(texte) {
  return String(texte || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function idDossier(row, index) {
  return valeur(row, ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier", "Identifiant"] ) || `dossier-${index}`;
}

function prenom(row) {
  return String(row.Prénom || row.Prenom || "").trim();
}

function nom(row) {
  return String(row.Nom || "").trim();
}

function affichageDossier(row, rows) {
  const p = prenom(row);
  const n = nom(row);
  if (!p && !n) return "Dossier";
  if (!p) return n.slice(0, 3) || "Dossier";
  const doublons = rows.filter((item) => prenom(item).toLowerCase() === p.toLowerCase()).length;
  return doublons > 1 && n ? `${p} ${n.slice(0, 3)}` : p;
}

function dateIsoDans(nbJours) {
  const date = new Date();
  date.setDate(date.getDate() + nbJours);
  return date.toISOString().slice(0, 10);
}

function actionVide() {
  return {
    priorite: "À qualifier",
    prochaineAction: "",
    echeance: "",
    vigilance: "À suivre",
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "",
  };
}

function propositionAutomatique(row) {
  const type = normaliser(valeur(row, ["Type d'accompagnement", "Type d’accompagnement", "Accompagnement"]));
  const intensite = normaliser(valeur(row, ["Intensité", "Intensite"]));
  const telephone = valeur(row, ["Téléphone mobile", "Telephone mobile", "Téléphone fixe", "Telephone fixe"]);
  const email = valeur(row, ["Email", "Mail", "Courriel"]);
  const actions = [];

  let priorite = "Priorité 3";
  let vigilance = "À suivre";
  let echeance = dateIsoDans(14);

  if (intensite.includes("renforce") || intensite.includes("intensif")) {
    priorite = "Priorité 2";
    vigilance = "Importante";
    echeance = dateIsoDans(7);
  }

  if (!telephone && !email) {
    actions.push("- Vérifier les coordonnées de contact");
    priorite = "Priorité 2";
    vigilance = "Importante";
  }

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("independant")) {
    actions.push("- Faire un point activité / statut / démarches en cours");
    actions.push("- Vérifier les déclarations utiles CAF / RSA / activité");
  } else {
    actions.push("- Qualifier la situation globale");
    actions.push("- Identifier les freins principaux et le niveau d’autonomie");
  }

  actions.push("- Préparer la trace Insertis après lecture du dossier");

  return {
    priorite,
    prochaineAction: actions.join("\n"),
    echeance,
    vigilance,
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "Prérempli automatiquement. À ajuster depuis la fiche dossier.",
  };
}

function actionDejaTravaillee(action) {
  if (!action) return false;
  const base = actionVide();
  return Boolean(action.prochaineAction || action.echeance || action.note) || action.priorite !== base.priorite || action.vigilance !== base.vigilance || action.statut !== base.statut || action.traceInsertis !== base.traceInsertis;
}

function synthese(rows, actions) {
  return rows.map((row, index) => {
    const id = idDossier(row, index);
    const action = { ...actionVide(), ...(actions[id] || {}) };
    return [
      `${affichageDossier(row, rows)} — ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || id}`,
      `Priorité : ${action.priorite}`,
      `Vigilance : ${action.vigilance}`,
      `Statut : ${action.statut}`,
      `Prochaine action : ${action.prochaineAction || "à compléter"}`,
    ].join("\n");
  }).join("\n\n");
}

const s = {
  page: { minHeight: "100vh", background: "#0f1419", color: "#F4EEE4", padding: "20px 18px 54px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1180px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", marginBottom: "16px" },
  label: { margin: "0 0 6px", color: "#B8C49A", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#FFF7EA", fontSize: "28px", lineHeight: 1.1 },
  intro: { margin: "7px 0 0", color: "#CFC6B9", fontSize: "14px", lineHeight: 1.45, maxWidth: "850px" },
  card: { background: "#171d23", border: "1px solid #313b46", borderRadius: "16px", padding: "16px", marginBottom: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #3D4652", borderRadius: "10px", padding: "9px 10px", fontSize: "14px", background: "#10161c", color: "#FFF7EA" },
  button: { border: "1px solid #5E6D4D", borderRadius: "999px", minHeight: "36px", padding: "8px 13px", background: "#22311d", color: "#FFF7EA", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #A7B77E", borderRadius: "999px", minHeight: "38px", padding: "9px 15px", background: "#7F8A69", color: "#FFF7EA", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#22311d", color: "#FFF7EA", textDecoration: "none", fontWeight: 900, border: "1px solid #5E6D4D", marginTop: "8px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  kpi: { background: "#172314", border: "1px solid #405033", borderRadius: "14px", padding: "13px", color: "#FFF7EA", textAlign: "left", cursor: "pointer" },
  kpiActif: { outline: "2px solid #A7B77E" },
  kpiNumber: { margin: 0, fontSize: "24px", fontWeight: 900, color: "#DCE8B8" },
  kpiLabel: { margin: "4px 0 0", fontSize: "13px", color: "#D0C8B9", fontWeight: 800 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" },
  th: { textAlign: "left", fontSize: "11px", color: "#AFA796", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px" },
  td: { background: "#10161c", borderTop: "1px solid #313b46", borderBottom: "1px solid #313b46", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", color: "#F4EEE4" },
  tdFirst: { background: "#10161c", border: "1px solid #313b46", borderRight: 0, borderTopLeftRadius: "12px", borderBottomLeftRadius: "12px", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", minWidth: "150px", color: "#F4EEE4" },
  tdLast: { background: "#10161c", border: "1px solid #313b46", borderLeft: 0, borderTopRightRadius: "12px", borderBottomRightRadius: "12px", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", color: "#F4EEE4" },
  small: { display: "block", color: "#B8B0A4", fontSize: "12px", lineHeight: 1.35, marginTop: "3px" },
  message: { color: "#DCE8B8", fontWeight: 900 },
};

export function PilotageActionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [recherche, setRecherche] = useState("");
  const [filtreRapide, setFiltreRapide] = useState("Tous");
  const [message, setMessage] = useState("");

  const entrees = useMemo(() => rows.map((row, index) => ({ row, index, id: idDossier(row, index), action: { ...actionVide(), ...(actions[idDossier(row, index)] || {}) } })), [rows, actions]);

  const entreesFiltrees = useMemo(() => entrees.filter(({ row, action }) => {
    const texte = `${affichageDossier(row, rows)} ${valeur(row, ["Numéro Insertis", "Numero Insertis"])} ${valeur(row, ["Ville", "Commune"])} ${row.CLI || ""}`.toLowerCase();
    const okRecherche = texte.includes(recherche.toLowerCase());
    const okFiltre = filtreRapide === "Tous" || (filtreRapide === "Actions" && action.statut === "À faire") || (filtreRapide === "Urgentes" && action.vigilance === "Urgente") || (filtreRapide === "Traces" && ["À faire", "À prévoir"].includes(action.traceInsertis));
    return okRecherche && okFiltre;
  }), [entrees, rows, recherche, filtreRapide]);

  const kpis = useMemo(() => ({
    total: entrees.length,
    actions: entrees.filter((e) => e.action.statut === "À faire").length,
    urgentes: entrees.filter((e) => e.action.vigilance === "Urgente").length,
    traces: entrees.filter((e) => ["À faire", "À prévoir"].includes(e.action.traceInsertis)).length,
  }), [entrees]);

  const texteSynthese = useMemo(() => synthese(rows, actions), [rows, actions]);

  function enregistrer(nextRows, nextActions) {
    setRows(nextRows);
    setActions(nextActions);
    sauvegarder(nextRows, nextActions);
  }

  function importerCsv(event) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lignes = parserCsv(String(reader.result || ""));
      if (!lignes.length) {
        setMessage("Aucun dossier reconnu. Il faut un export CSV Insertis, pas un fichier Excel .xlsx.");
        return;
      }

      const nextActions = {};
      lignes.forEach((row, index) => {
        const id = idDossier(row, index);
        const existante = { ...actionVide(), ...(actions[id] || {}) };
        nextActions[id] = actionDejaTravaillee(existante) ? existante : { ...actionVide(), ...propositionAutomatique(row) };
      });
      enregistrer(lignes, nextActions);
      setMessage(`${lignes.length} dossiers importés. Tu peux maintenant chercher une personne et ouvrir son dossier.`);
    };
    reader.readAsText(fichier, "windows-1252");
  }

  function creerDossierManuel() {
    const id = `manuel-${Date.now()}`;
    const row = {
      "Numéro Insertis": id,
      Prénom: "Dossier",
      Nom: "manuel",
      Ville: "",
      CLI: "",
      CTM: "",
      "Type d'accompagnement": "Dossier manuel",
      Intensité: "À qualifier",
    };
    const nextRows = [row, ...rows];
    const nextActions = { ...actions, [id]: actionVide() };
    enregistrer(nextRows, nextActions);
    navigate(`/pilotage-actions/dossier/${encodeURIComponent(id)}`);
  }

  function automatiserFile() {
    if (!rows.length) {
      setMessage("Aucune file active : importe le CSV Insertis ou crée un dossier manuel d’abord.");
      return;
    }
    const nextActions = { ...actions };
    rows.forEach((row, index) => {
      const id = idDossier(row, index);
      const actuelle = { ...actionVide(), ...(nextActions[id] || {}) };
      if (!actionDejaTravaillee(actuelle) || !actuelle.prochaineAction) nextActions[id] = { ...actuelle, ...propositionAutomatique(row) };
    });
    enregistrer(rows, nextActions);
    setMessage("File active préremplie. Ouvre ensuite un dossier pour travailler la situation.");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(texteSynthese || "Aucun dossier.");
    setMessage("Synthèse copiée.");
  }

  function effacerLocal() {
    if (!window.confirm("Effacer la file active locale ?")) return;
    localStorage.removeItem(STORAGE_ROWS);
    localStorage.removeItem(STORAGE_ACTIONS);
    setRows([]);
    setActions({});
    setMessage("File active effacée dans ce navigateur.");
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.header}>
          <div>
            <p style={s.label}>Poste de pilotage</p>
            <h1 style={s.h1}>File active</h1>
            <p style={s.intro}>Un seul chemin : importer ou créer un dossier, chercher la personne, ouvrir la fiche dossier, puis produire la trace Insertis et la note Mon Suivi Social.</p>
          </div>
        </header>

        <section style={s.card}>
          <p style={s.label}>Démarrer</p>
          <div style={s.grid}>
            <label>
              <span style={s.small}>Importer le CSV Insertis</span>
              <input style={s.input} type="file" accept=".csv,text/csv" onChange={importerCsv} />
            </label>
            <div>
              <span style={s.small}>Tester ou ajouter un dossier sans CSV</span>
              <button style={s.mainButton} type="button" onClick={creerDossierManuel}>Créer un dossier manuel</button>
            </div>
            <div>
              <span style={s.small}>Préremplir les actions si une file existe</span>
              <button style={s.button} type="button" onClick={automatiserFile}>Automatiser la file active</button>
            </div>
          </div>
          <p style={s.small}>Les données restent dans ce navigateur. Ne pas pousser les exports usagers sur GitHub.</p>
          {message && <p style={s.message}>{message}</p>}
        </section>

        <section style={s.grid}>
          {[
            ["Tous", kpis.total, "Dossiers"],
            ["Actions", kpis.actions, "Actions à faire"],
            ["Urgentes", kpis.urgentes, "Vigilances urgentes"],
            ["Traces", kpis.traces, "Traces Insertis"],
          ].map(([filtre, nombre, libelle]) => (
            <button key={filtre} type="button" style={{ ...s.kpi, ...(filtreRapide === filtre ? s.kpiActif : {}) }} onClick={() => setFiltreRapide(filtre)}>
              <p style={s.kpiNumber}>{nombre}</p>
              <p style={s.kpiLabel}>{libelle}</p>
            </button>
          ))}
        </section>

        <section style={{ ...s.card, marginTop: "14px" }}>
          <p style={s.label}>Trouver une personne</p>
          <input style={s.input} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher par prénom, ville, numéro Insertis..." />
        </section>

        <section style={s.card}>
          <p style={s.label}>Dossiers</p>
          {!rows.length && (
            <p style={s.intro}>Aucune file active importée. Utilise le CSV Insertis ou crée un dossier manuel pour tester tout de suite.</p>
          )}
          {rows.length > 0 && entreesFiltrees.length === 0 && <p style={s.intro}>Aucun dossier ne correspond à la recherche ou au filtre.</p>}
          {entreesFiltrees.length > 0 && (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Dossier</th>
                    <th style={s.th}>Cadre</th>
                    <th style={s.th}>Priorité</th>
                    <th style={s.th}>Action</th>
                    <th style={s.th}>Trace</th>
                    <th style={s.th}>Ouvrir</th>
                  </tr>
                </thead>
                <tbody>
                  {entreesFiltrees.map(({ row, id, action }) => (
                    <tr key={id}>
                      <td style={s.tdFirst}><strong>{affichageDossier(row, rows)}</strong><span style={s.small}>{valeur(row, ["Numéro Insertis", "Numero Insertis"]) || id}</span></td>
                      <td style={s.td}><span>{valeur(row, ["Ville", "Commune"]) || "Ville à préciser"}</span><span style={s.small}>{valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "Accompagnement à préciser"}</span></td>
                      <td style={s.td}>{action.priorite}<span style={s.small}>{action.vigilance}</span></td>
                      <td style={s.td}>{action.prochaineAction ? action.prochaineAction.split("\n")[0].replace(/^- /, "") : "À compléter dans la fiche"}</td>
                      <td style={s.td}>{action.traceInsertis}</td>
                      <td style={s.tdLast}><Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(id)}`}>Ouvrir le dossier</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={s.actions}>
            <button style={s.button} type="button" onClick={copierSynthese}>Copier synthèse file</button>
            <button style={s.button} type="button" onClick={effacerLocal}>Effacer données locales</button>
          </div>
        </section>
      </div>
    </main>
  );
}
