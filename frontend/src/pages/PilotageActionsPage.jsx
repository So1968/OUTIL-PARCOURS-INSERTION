import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

function detecterSeparateur(ligne) {
  const candidats = [";", ",", "\t"];
  return candidats
    .map((separateur) => ({ separateur, score: ligne.split(separateur).length }))
    .sort((a, b) => b.score - a.score)[0].separateur;
}

function parserCsv(texte) {
  const premiereLigne = String(texte || "").split(/\r?\n/).find((ligne) => ligne.trim()) || "";
  const separateur = detecterSeparateur(premiereLigne);
  const lignes = [];
  let ligne = [];
  let valeur = "";
  let guillemets = false;

  for (let i = 0; i < texte.length; i += 1) {
    const caractere = texte[i];
    const suivant = texte[i + 1];

    if (caractere === '"' && guillemets && suivant === '"') {
      valeur += '"';
      i += 1;
    } else if (caractere === '"') {
      guillemets = !guillemets;
    } else if (caractere === separateur && !guillemets) {
      ligne.push(valeur);
      valeur = "";
    } else if ((caractere === "\n" || caractere === "\r") && !guillemets) {
      if (caractere === "\r" && suivant === "\n") i += 1;
      ligne.push(valeur);
      if (ligne.some((cellule) => cellule.trim())) lignes.push(ligne);
      ligne = [];
      valeur = "";
    } else {
      valeur += caractere;
    }
  }

  ligne.push(valeur);
  if (ligne.some((cellule) => cellule.trim())) lignes.push(ligne);
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
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function dateIsoDans(nbJours) {
  const date = new Date();
  date.setDate(date.getDate() + nbJours);
  return date.toISOString().slice(0, 10);
}

function idDossier(row, index) {
  return valeur(row, ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier"]) || `dossier-${index}`;
}

function prenom(row) {
  return String(row.Prénom || row.Prenom || "").trim();
}

function nom(row) {
  return String(row.Nom || "").trim();
}

function affichageDossier(row, toutesLesLignes) {
  const p = prenom(row);
  const n = nom(row);

  if (!p && !n) return "Dossier";
  if (!p) return n.slice(0, 3);

  const doublons = toutesLesLignes.filter((item) => prenom(item).toLowerCase() === p.toLowerCase()).length;
  return doublons > 1 && n ? `${p} ${n.slice(0, 3)}` : p;
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

function tachesTypes(row) {
  const type = normaliser(valeur(row, ["Type d'accompagnement", "Type d’accompagnement", "Accompagnement"]));
  const intensite = normaliser(valeur(row, ["Intensité", "Intensite"]));
  const base = [
    "Appeler la personne",
    "Envoyer un SMS de rappel",
    "Prévoir / confirmer un rendez-vous",
    "Relancer les justificatifs",
    "Faire une trace Insertis",
  ];

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    base.push(
      "Faire un point activité / micro-entreprise",
      "Vérifier les déclarations CAF / RSA / DTR",
      "Vérifier statut, CA et démarches en cours",
      "Préparer une orientation création / activité",
    );
  } else {
    base.push(
      "Qualifier la situation globale",
      "Évaluer l’autonomie administrative",
      "Identifier les freins principaux",
      "Préparer une orientation partenaire",
    );
  }

  if (intensite.includes("renforce") || intensite.includes("intensif")) {
    base.unshift("Reprendre rapidement le dossier");
  }

  base.push("Reporter / mettre en attente", "Autre action à préciser");
  return [...new Set(base)];
}

function propositionAutomatique(row) {
  const type = normaliser(valeur(row, ["Type d'accompagnement", "Type d’accompagnement", "Accompagnement"]));
  const intensite = normaliser(valeur(row, ["Intensité", "Intensite"]));
  const ville = valeur(row, ["Ville", "Commune"]);
  const telephone = valeur(row, ["Téléphone mobile", "Telephone mobile", "Téléphone fixe", "Telephone fixe"]);
  const email = valeur(row, ["Email", "Mail", "Courriel"]);

  let priorite = "Priorité 3";
  let vigilance = "À suivre";
  let echeance = dateIsoDans(14);

  if (intensite.includes("renforce") || intensite.includes("intensif")) {
    priorite = "Priorité 2";
    vigilance = "Importante";
    echeance = dateIsoDans(7);
  }

  const actions = [];

  if (!telephone && !email) {
    actions.push("- Vérifier les coordonnées de contact");
    priorite = "Priorité 2";
    vigilance = "Importante";
    echeance = dateIsoDans(7);
  }

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    actions.push("- Faire un point activité / statut / démarches en cours");
    actions.push("- Vérifier les déclarations utiles CAF / RSA / activité");
    actions.push("- Identifier la prochaine étape réaliste du projet ou de l’activité");
  } else {
    actions.push("- Qualifier la situation globale");
    actions.push("- Identifier les freins principaux et le niveau d’autonomie");
    actions.push("- Prévoir ou confirmer un rendez-vous");
  }

  actions.push("- Faire une trace Insertis après qualification");
  if (ville) actions.push(`- Vérifier si un relais local est utile sur ${ville}`);

  return {
    priorite,
    prochaineAction: actions.join("\n"),
    echeance,
    vigilance,
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "Prérempli automatiquement à partir de l’export Insertis. À ajuster après lecture du dossier.",
  };
}

function dejaTravaille(action) {
  if (!action) return false;
  const base = actionVide();
  return (
    Boolean(action.prochaineAction) ||
    Boolean(action.echeance) ||
    Boolean(action.note) ||
    action.priorite !== base.priorite ||
    action.vigilance !== base.vigilance ||
    action.statut !== base.statut ||
    action.traceInsertis !== base.traceInsertis
  );
}

function synthese(rows, actions) {
  const lignes = ["Pilotage actions — file active Insertis", "", `Nombre de dossiers : ${rows.length}`, ""];

  rows.forEach((row, index) => {
    const id = idDossier(row, index);
    const action = { ...actionVide(), ...(actions[id] || {}) };

    lignes.push(`${affichageDossier(row, rows)} — ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "sans numéro"}`);
    lignes.push(`- Ville : ${valeur(row, ["Ville", "Commune"]) || "à préciser"} / CLI : ${row.CLI || "à préciser"}`);
    lignes.push(`- Accompagnement : ${valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "à préciser"} / Intensité : ${valeur(row, ["Intensité", "Intensite"]) || "à préciser"}`);
    lignes.push(`- Priorité : ${action.priorite}`);
    lignes.push("- Prochaine action :");
    lignes.push(action.prochaineAction || "À compléter.");
    lignes.push(`- Échéance : ${action.echeance || "à préciser"}`);
    lignes.push(`- Vigilance : ${action.vigilance}`);
    lignes.push(`- Statut : ${action.statut}`);
    lignes.push(`- Trace Insertis : ${action.traceInsertis}`);
    if (action.note) lignes.push(`- Note : ${action.note}`);
    lignes.push("");
  });

  return lignes.join("\n");
}

const s = {
  page: { minHeight: "100vh", background: "#F7F1E8", color: "#443E37", padding: "28px 24px 64px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1320px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "22px" },
  label: { margin: "0 0 6px", color: "#6F765D", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#334052", fontSize: "30px", lineHeight: 1.1 },
  intro: { margin: "8px 0 0", color: "#5D554B", fontSize: "16px", lineHeight: 1.45, maxWidth: "900px" },
  card: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "18px", padding: "20px", marginBottom: "16px", boxShadow: "0 8px 18px rgba(63,55,47,0.05)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" },
  kpi: { background: "#E8DDCC", border: "1px solid #D2C4B3", borderRadius: "16px", padding: "14px", color: "#443E37" },
  kpiActif: { outline: "3px solid #7F8A69" },
  kpiNumber: { margin: 0, fontSize: "28px", fontWeight: 900, color: "#334052" },
  kpiLabel: { margin: "4px 0 0", fontSize: "13px", color: "#5D554B", fontWeight: 800 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", background: "#FBF7EF", color: "#443E37" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", lineHeight: 1.35, background: "#FBF7EF", color: "#443E37", minHeight: "86px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "36px", padding: "8px 13px", background: "#E8DDCC", color: "#334052", fontWeight: 800, cursor: "pointer" },
  mainButton: { border: "1px solid #7F8A69", borderRadius: "999px", minHeight: "36px", padding: "8px 13px", background: "#7F8A69", color: "white", fontWeight: 800, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#E8DDCC", color: "#334052", textDecoration: "none", fontWeight: 900, border: "1px solid #D2C4B3", marginTop: "8px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" },
  th: { textAlign: "left", fontSize: "12px", color: "#4B443C", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px" },
  td: { background: "#FBF7EF", borderTop: "1px solid #D2C4B3", borderBottom: "1px solid #D2C4B3", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", color: "#443E37" },
  tdFirst: { background: "#FBF7EF", borderTop: "1px solid #D2C4B3", borderBottom: "1px solid #D2C4B3", borderLeft: "1px solid #D2C4B3", borderTopLeftRadius: "14px", borderBottomLeftRadius: "14px", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", minWidth: "170px", color: "#443E37" },
  tdLast: { background: "#FBF7EF", borderTop: "1px solid #D2C4B3", borderBottom: "1px solid #D2C4B3", borderRight: "1px solid #D2C4B3", borderTopRightRadius: "14px", borderBottomRightRadius: "14px", padding: "10px 8px", verticalAlign: "top", fontSize: "14px", minWidth: "190px", color: "#443E37" },
  small: { display: "block", color: "#5D554B", fontSize: "12px", lineHeight: 1.35, marginTop: "4px" },
  message: { color: "#6F765D", fontWeight: 900 },
};

function libelleFiltre(filtre) {
  if (filtre === "Actions") return "Actions à faire";
  if (filtre === "Urgentes") return "Vigilances urgentes";
  if (filtre === "Importantes") return "Vigilances importantes";
  if (filtre === "Traces") return "Traces Insertis à faire ou à prévoir";
  return "Tous les dossiers";
}

export function PilotageActionsPage() {
  const [rows, setRows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [recherche, setRecherche] = useState("");
  const [filtreVigilance, setFiltreVigilance] = useState("Toutes");
  const [filtreRapide, setFiltreRapide] = useState("Tous");
  const [message, setMessage] = useState("");

  const entrees = useMemo(
    () => rows.map((row, index) => ({ row, index, id: idDossier(row, index), action: { ...actionVide(), ...(actions[idDossier(row, index)] || {}) } })),
    [rows, actions],
  );

  const entreesFiltrees = useMemo(() => {
    return entrees.filter(({ row, action }) => {
      const texte = `${affichageDossier(row, rows)} ${valeur(row, ["Numéro Insertis", "Numero Insertis"])} ${row.Ville || ""} ${row.CLI || ""}`.toLowerCase();
      const okRecherche = texte.includes(recherche.toLowerCase());
      const okVigilance = filtreVigilance === "Toutes" || action.vigilance === filtreVigilance;
      const okRapide =
        filtreRapide === "Tous" ||
        (filtreRapide === "Actions" && action.statut === "À faire") ||
        (filtreRapide === "Urgentes" && action.vigilance === "Urgente") ||
        (filtreRapide === "Importantes" && action.vigilance === "Importante") ||
        (filtreRapide === "Traces" && ["À faire", "À prévoir"].includes(action.traceInsertis));

      return okRecherche && okVigilance && okRapide;
    });
  }, [entrees, rows, recherche, filtreVigilance, filtreRapide]);

  const kpis = useMemo(() => {
    const valeurs = entrees.map((entree) => entree.action);
    return {
      total: entrees.length,
      urgentes: valeurs.filter((action) => action.vigilance === "Urgente").length,
      importantes: valeurs.filter((action) => action.vigilance === "Importante").length,
      aFaire: valeurs.filter((action) => action.statut === "À faire").length,
      insertis: valeurs.filter((action) => ["À faire", "À prévoir"].includes(action.traceInsertis)).length,
    };
  }, [entrees]);

  const texteSynthese = useMemo(() => synthese(rows, actions), [rows, actions]);

  function enregistrer(nextActions) {
    setActions(nextActions);
    localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(nextActions));
  }

  function importerCsv(event) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lignes = parserCsv(String(reader.result || ""));
      const nextActions = {};

      lignes.forEach((row, index) => {
        const id = idDossier(row, index);
        const existante = { ...actionVide(), ...(actions[id] || {}) };
        nextActions[id] = dejaTravaille(existante) ? existante : { ...actionVide(), ...propositionAutomatique(row) };
      });

      setRows(lignes);
      setActions(nextActions);
      localStorage.setItem(STORAGE_ROWS, JSON.stringify(lignes));
      localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(nextActions));
      setMessage(`${lignes.length} dossiers importés et préremplis automatiquement.`);
    };

    reader.readAsText(fichier, "windows-1252");
  }

  function updateAction(id, champ, valeurAction) {
    const next = {
      ...actions,
      [id]: {
        ...actionVide(),
        ...(actions[id] || {}),
        [champ]: valeurAction,
      },
    };
    enregistrer(next);
    setMessage("Modification enregistrée.");
  }

  function ajouterTache(id, tache) {
    if (!tache) return;
    const actionActuelle = { ...actionVide(), ...(actions[id] || {}) };
    const ancienne = actionActuelle.prochaineAction || "";
    const nouvelle = ancienne.trim() ? `${ancienne.trim()}\n- ${tache}` : `- ${tache}`;
    updateAction(id, "prochaineAction", nouvelle);
  }

  function automatiserLignesVides() {
    const next = { ...actions };
    rows.forEach((row, index) => {
      const id = idDossier(row, index);
      const actuelle = { ...actionVide(), ...(next[id] || {}) };
      if (!dejaTravaille(actuelle) || !actuelle.prochaineAction) next[id] = { ...actuelle, ...propositionAutomatique(row) };
    });
    enregistrer(next);
    setMessage("Les lignes vides ont été préremplies automatiquement.");
  }

  function recalculerTouteLaFile() {
    if (!window.confirm("Recalculer toute la file va remplacer les priorités, actions et vigilances actuelles. Continuer ?")) return;
    const next = {};
    rows.forEach((row, index) => {
      next[idDossier(row, index)] = { ...actionVide(), ...propositionAutomatique(row) };
    });
    enregistrer(next);
    setMessage("Toute la file a été recalculée automatiquement.");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(texteSynthese);
    setMessage("Synthèse copiée.");
  }

  function telechargerSynthese() {
    const blob = new Blob([texteSynthese], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `pilotage_actions_insertis_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
    setMessage("Synthèse téléchargée.");
  }

  function effacerLocal() {
    if (!window.confirm("Effacer la liste importée et le suivi local ?")) return;
    localStorage.removeItem(STORAGE_ROWS);
    localStorage.removeItem(STORAGE_ACTIONS);
    setRows([]);
    setActions({});
    setMessage("Données locales effacées.");
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.header}>
          <div>
            <p style={s.label}>File active</p>
            <h1 style={s.h1}>Pilotage actions Insertis</h1>
            <p style={s.intro}>
              Importer la liste Insertis, générer automatiquement une première lecture des actions, puis ajuster dossier par dossier. Les noms complets ne sont pas affichés.
            </p>
          </div>
          <Link style={s.link} to="/">Retour accueil</Link>
        </header>

        <section style={s.card}>
          <p style={s.label}>Import et automatisation</p>
          <div style={s.grid}>
            <label>
              <span style={s.small}>Importer le CSV Insertis</span>
              <input style={s.input} type="file" accept=".csv,text/csv" onChange={importerCsv} />
            </label>
            <label>
              <span style={s.small}>Automatiser la file</span>
              <select
                style={s.input}
                value=""
                onChange={(event) => {
                  if (event.target.value === "vides") automatiserLignesVides();
                  if (event.target.value === "tout") recalculerTouteLaFile();
                  event.target.value = "";
                }}
              >
                <option value="">Choisir une action automatique...</option>
                <option value="vides">Préremplir uniquement les lignes vides</option>
                <option value="tout">Recalculer toute la file active</option>
              </select>
            </label>
          </div>
          <p style={{ margin: "10px 0 0", color: "#5D554B", fontSize: "14px" }}>
            Les données restent dans ce navigateur. Ne pas pousser les exports usagers sur GitHub.
          </p>
          {message && <p style={s.message}>{message}</p>}
        </section>

        <section style={s.grid}>
          {[
            ["Tous", kpis.total, "Dossiers"],
            ["Urgentes", kpis.urgentes, "Vigilances urgentes"],
            ["Importantes", kpis.importantes, "Vigilances importantes"],
            ["Actions", kpis.aFaire, "Actions à faire"],
            ["Traces", kpis.insertis, "Traces Insertis"],
          ].map(([filtre, nombre, libelle]) => (
            <button
              type="button"
              key={filtre}
              style={{ ...s.kpi, ...(filtreRapide === filtre ? s.kpiActif : {}), textAlign: "left", cursor: "pointer" }}
              onClick={() => setFiltreRapide(filtre)}
            >
              <p style={s.kpiNumber}>{nombre}</p>
              <p style={s.kpiLabel}>{libelle}</p>
            </button>
          ))}
        </section>

        <section style={s.card}>
          <div style={s.grid}>
            <label>
              <span style={s.small}>Recherche prénom / ville / numéro</span>
              <input style={s.input} value={recherche} onChange={(event) => setRecherche(event.target.value)} />
            </label>
            <label>
              <span style={s.small}>Filtre vigilance</span>
              <select style={s.input} value={filtreVigilance} onChange={(event) => setFiltreVigilance(event.target.value)}>
                <option>Toutes</option>
                <option>Faible</option>
                <option>À suivre</option>
                <option>Importante</option>
                <option>Urgente</option>
              </select>
            </label>
          </div>
        </section>

        {filtreRapide !== "Tous" && (
          <section style={s.card}>
            <p style={s.label}>Liste filtrée</p>
            <p style={s.intro}>Affichage en cours : <strong>{libelleFiltre(filtreRapide)}</strong>.</p>
            <button type="button" style={s.button} onClick={() => setFiltreRapide("Tous")}>Tout afficher</button>
          </section>
        )}

        <section style={s.card}>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Dossier</th>
                  <th style={s.th}>Cadre Insertis</th>
                  <th style={s.th}>Priorité</th>
                  <th style={s.th}>Prochaine action</th>
                  <th style={s.th}>Échéance</th>
                  <th style={s.th}>Vigilance</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Trace Insertis</th>
                  <th style={s.th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {entreesFiltrees.map(({ row, id, action }) => (
                  <tr key={id}>
                    <td style={s.tdFirst}>
                      <strong>{affichageDossier(row, rows)}</strong>
                      <span style={s.small}>{valeur(row, ["Numéro Insertis", "Numero Insertis"])}</span>
                      <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(id)}`}>Ouvrir dossier</Link>
                    </td>
                    <td style={s.td}>
                      <strong>{row.CLI || "CLI ?"}</strong>
                      <span style={s.small}>{row.CTM || ""}</span>
                      <span style={s.small}>{valeur(row, ["Ville", "Commune"])}</span>
                      <span style={s.small}>{valeur(row, ["Type d'accompagnement", "Type d’accompagnement"])}</span>
                      <span style={s.small}>Intensité : {valeur(row, ["Intensité", "Intensite"]) || "?"}</span>
                    </td>
                    <td style={s.td}>
                      <select style={s.input} value={action.priorite} onChange={(event) => updateAction(id, "priorite", event.target.value)}>
                        <option>À qualifier</option>
                        <option>Priorité 1</option>
                        <option>Priorité 2</option>
                        <option>Priorité 3</option>
                        <option>À reporter</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <textarea style={s.textarea} value={action.prochaineAction} onChange={(event) => updateAction(id, "prochaineAction", event.target.value)} />
                      <select style={{ ...s.input, marginTop: "8px" }} value="" onChange={(event) => { ajouterTache(id, event.target.value); event.target.value = ""; }}>
                        <option value="">Ajouter une tâche...</option>
                        {tachesTypes(row).map((tache) => <option key={tache} value={tache}>{tache}</option>)}
                      </select>
                    </td>
                    <td style={s.td}>
                      <input style={s.input} type="date" value={action.echeance} onChange={(event) => updateAction(id, "echeance", event.target.value)} />
                    </td>
                    <td style={s.td}>
                      <select style={s.input} value={action.vigilance} onChange={(event) => updateAction(id, "vigilance", event.target.value)}>
                        <option>Faible</option>
                        <option>À suivre</option>
                        <option>Importante</option>
                        <option>Urgente</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <select style={s.input} value={action.statut} onChange={(event) => updateAction(id, "statut", event.target.value)}>
                        <option>À faire</option>
                        <option>En cours</option>
                        <option>En attente</option>
                        <option>Fait</option>
                        <option>Reporté</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <select style={s.input} value={action.traceInsertis} onChange={(event) => updateAction(id, "traceInsertis", event.target.value)}>
                        <option>À prévoir</option>
                        <option>À faire</option>
                        <option>Faite</option>
                        <option>Pas nécessaire</option>
                      </select>
                    </td>
                    <td style={s.tdLast}>
                      <textarea style={s.textarea} value={action.note} onChange={(event) => updateAction(id, "note", event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && <p style={{ color: "#5D554B" }}>Aucun export Insertis importé pour le moment.</p>}

          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={copierSynthese}>Copier synthèse</button>
            <button style={s.button} type="button" onClick={telechargerSynthese}>Télécharger synthèse</button>
            <button style={s.button} type="button" onClick={effacerLocal}>Effacer données locales</button>
          </div>
        </section>
      </div>
    </main>
  );
}
