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
    .map((separateur) => ({ separateur, score: String(ligne || "").split(separateur).length }))
    .sort((a, b) => b.score - a.score)[0].separateur;
}

function parserCsv(texte) {
  const contenu = String(texte || "");
  const premiereLigne = contenu.split(/\r?\n/).find((ligne) => ligne.trim()) || "";
  const separateur = detecterSeparateur(premiereLigne);
  const lignes = [];
  let ligne = [];
  let valeur = "";
  let guillemets = false;

  for (let i = 0; i < contenu.length; i += 1) {
    const caractere = contenu[i];
    const suivant = contenu[i + 1];

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
  return valeur(row, ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier", "Identifiant"]) || `dossier-${index}`;
}

function prenom(row) {
  return String(row.Prénom || row.Prenom || row.Prénom_usager || row.Prenom_usager || "").trim();
}

function nom(row) {
  return String(row.Nom || row.Nom_usager || "").trim();
}

function affichageDossier(row, toutesLesLignes) {
  const p = prenom(row);
  const n = nom(row);
  if (!p && !n) return valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "Dossier";
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
  const base = [
    "Qualifier la situation sociale globale",
    "Préparer la note de suivi social",
    "Faire une trace Insertis courte",
    "Prévoir / confirmer un rendez-vous",
    "Relancer les justificatifs",
    "Contacter un partenaire",
  ];

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    base.push("Faire un point activité / statut / déclarations", "Vérifier CAF / RSA / DTR", "Identifier la prochaine étape réaliste de l’activité");
  }

  base.push("Mettre en attente", "Autre action à préciser");
  return [...new Set(base)];
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

  if (type.includes("activite") || type.includes("tns") || type.includes("micro") || type.includes("itineraire")) {
    actions.push("- Faire un point activité / statut / démarches en cours");
    actions.push("- Vérifier les déclarations utiles CAF / RSA / activité");
  } else {
    actions.push("- Qualifier la situation sociale globale");
    actions.push("- Identifier le sujet prioritaire et le niveau d’autonomie");
  }

  actions.push("- Rédiger une trace courte après lecture du dossier");

  return {
    priorite,
    prochaineAction: actions.join("\n"),
    echeance,
    vigilance,
    statut: "À faire",
    traceInsertis: "À prévoir",
    note: "Prérempli automatiquement. À ajuster après lecture du dossier.",
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
  if (!rows.length) return "Aucune file active importée.";
  const lignes = ["Pilotage actions — file active Insertis", "", `Nombre de dossiers : ${rows.length}`, ""];

  rows.forEach((row, index) => {
    const id = idDossier(row, index);
    const action = { ...actionVide(), ...(actions[id] || {}) };
    lignes.push(`${affichageDossier(row, rows)} — ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "sans numéro"}`);
    lignes.push(`- Cadre : ${valeur(row, ["Ville", "Commune"]) || "ville à préciser"} / ${valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "accompagnement à préciser"}`);
    lignes.push(`- Priorité : ${action.priorite}`);
    lignes.push(`- Prochaine action : ${action.prochaineAction || "à compléter"}`);
    lignes.push(`- Échéance : ${action.echeance || "à préciser"}`);
    lignes.push(`- Vigilance : ${action.vigilance}`);
    lignes.push(`- Statut : ${action.statut}`);
    lignes.push(`- Trace Insertis : ${action.traceInsertis}`);
    if (action.note) lignes.push(`- Note : ${action.note}`);
    lignes.push("");
  });

  return lignes.join("\n");
}

const palette = {
  fond: "#0D1117",
  panneau: "#151B23",
  panneau2: "#111820",
  bord: "#303A46",
  texte: "#E7EDF3",
  texteFaible: "#AAB6C3",
  titre: "#F4F7FA",
  accent: "#8EA36D",
  accentFonce: "#25331F",
  danger: "#F4B183",
};

const s = {
  page: { minHeight: "100vh", background: palette.fond, color: palette.texte, padding: "18px 20px 56px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1280px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "14px" },
  label: { margin: "0 0 6px", color: palette.accent, fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: palette.titre, fontSize: "26px", lineHeight: 1.1 },
  intro: { margin: "7px 0 0", color: palette.texteFaible, fontSize: "14px", lineHeight: 1.45, maxWidth: "860px" },
  card: { background: palette.panneau, border: `1px solid ${palette.bord}`, borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 10px 26px rgba(0,0,0,0.18)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" },
  twoCols: { display: "grid", gridTemplateColumns: "minmax(260px, 0.75fr) minmax(360px, 1.25fr)", gap: "12px", alignItems: "start" },
  input: { width: "100%", boxSizing: "border-box", border: `1px solid ${palette.bord}`, borderRadius: "10px", padding: "9px 10px", fontSize: "14px", background: palette.panneau2, color: palette.texte },
  textarea: { width: "100%", boxSizing: "border-box", border: `1px solid ${palette.bord}`, borderRadius: "10px", padding: "9px 10px", fontSize: "14px", lineHeight: 1.35, background: palette.panneau2, color: palette.texte, minHeight: "80px" },
  small: { display: "block", color: palette.texteFaible, fontSize: "12px", lineHeight: 1.35, margin: "0 0 5px" },
  button: { border: `1px solid ${palette.bord}`, borderRadius: "999px", minHeight: "36px", padding: "8px 13px", background: palette.panneau2, color: palette.texte, fontWeight: 800, cursor: "pointer" },
  mainButton: { border: `1px solid ${palette.accent}`, borderRadius: "999px", minHeight: "36px", padding: "8px 14px", background: palette.accent, color: "#111820", fontWeight: 900, cursor: "pointer" },
  actions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" },
  kpi: { background: palette.accentFonce, border: `1px solid ${palette.accent}`, borderRadius: "14px", padding: "12px", color: palette.texte, textAlign: "left", cursor: "pointer" },
  kpiOff: { background: palette.panneau, border: `1px solid ${palette.bord}` },
  kpiNumber: { margin: 0, fontSize: "24px", fontWeight: 900, color: palette.titre },
  kpiLabel: { margin: "3px 0 0", fontSize: "12px", color: palette.texteFaible, fontWeight: 800 },
  listItem: { display: "grid", gridTemplateColumns: "minmax(160px, 0.65fr) minmax(260px, 1fr) minmax(150px, 0.7fr)", gap: "10px", alignItems: "start", padding: "12px", border: `1px solid ${palette.bord}`, borderRadius: "14px", background: palette.panneau2, marginBottom: "8px" },
  badge: { display: "inline-flex", borderRadius: "999px", padding: "4px 8px", background: palette.accentFonce, color: palette.texte, border: `1px solid ${palette.accent}`, fontSize: "12px", fontWeight: 800 },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: palette.accent, color: "#111820", textDecoration: "none", fontWeight: 900, border: `1px solid ${palette.accent}` },
  empty: { border: `1px dashed ${palette.bord}`, borderRadius: "16px", padding: "22px", background: palette.panneau2, color: palette.texteFaible },
  message: { color: palette.accent, fontWeight: 900 },
};

function libelleFiltre(filtre) {
  if (filtre === "Actions") return "Actions à faire";
  if (filtre === "Urgentes") return "Vigilences urgentes";
  if (filtre === "Importantes") return "Vigilances importantes";
  if (filtre === "Traces") return "Traces Insertis";
  return "Tous";
}

export function PilotageActionsPage() {
  const [rows, setRows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [recherche, setRecherche] = useState("");
  const [filtreRapide, setFiltreRapide] = useState("Tous");
  const [message, setMessage] = useState("");
  const [manuel, setManuel] = useState({ prenom: "", numero: "", ville: "", accompagnement: "" });

  const entrees = useMemo(
    () => rows.map((row, index) => ({ row, index, id: idDossier(row, index), action: { ...actionVide(), ...(actions[idDossier(row, index)] || {}) } })),
    [rows, actions],
  );

  const entreesFiltrees = useMemo(() => {
    return entrees.filter(({ row, action }) => {
      const texte = normaliser(`${affichageDossier(row, rows)} ${valeur(row, ["Numéro Insertis", "Numero Insertis"])} ${valeur(row, ["Ville", "Commune"])} ${row.CLI || ""}`);
      const okRecherche = !recherche.trim() || texte.includes(normaliser(recherche));
      const okRapide =
        filtreRapide === "Tous" ||
        (filtreRapide === "Actions" && action.statut === "À faire") ||
        (filtreRapide === "Urgentes" && action.vigilance === "Urgente") ||
        (filtreRapide === "Importantes" && action.vigilance === "Importante") ||
        (filtreRapide === "Traces" && ["À faire", "À prévoir"].includes(action.traceInsertis));
      return okRecherche && okRapide;
    });
  }, [entrees, rows, recherche, filtreRapide]);

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

  function enregistrerRows(nextRows) {
    setRows(nextRows);
    localStorage.setItem(STORAGE_ROWS, JSON.stringify(nextRows));
  }

  function enregistrerActions(nextActions) {
    setActions(nextActions);
    localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(nextActions));
  }

  function importerCsv(event) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lignes = parserCsv(String(reader.result || ""));
      if (!lignes.length) {
        setMessage("Le fichier n’a pas été reconnu. Il faut un export CSV Insertis, pas un fichier Excel .xlsx.");
        return;
      }

      const nextActions = {};
      lignes.forEach((row, index) => {
        const id = idDossier(row, index);
        const existante = { ...actionVide(), ...(actions[id] || {}) };
        nextActions[id] = dejaTravaille(existante) ? existante : { ...actionVide(), ...propositionAutomatique(row) };
      });

      enregistrerRows(lignes);
      enregistrerActions(nextActions);
      setMessage(`${lignes.length} dossiers importés. Clique sur “Ouvrir dossier” pour travailler la personne.`);
    };
    reader.readAsText(fichier, "windows-1252");
  }

  function creerDossierManuel() {
    const numero = manuel.numero.trim() || `manuel-${Date.now()}`;
    const row = {
      "Numéro Insertis": numero,
      Prénom: manuel.prenom.trim() || "Dossier",
      Ville: manuel.ville.trim(),
      "Type d'accompagnement": manuel.accompagnement.trim() || "Accompagnement global",
      Intensité: "À qualifier",
      CLI: "",
      CTM: "",
    };
    const nextRows = [...rows, row];
    const nextActions = { ...actions, [numero]: { ...actionVide(), ...propositionAutomatique(row), note: "Dossier créé manuellement. À compléter après lecture." } };
    enregistrerRows(nextRows);
    enregistrerActions(nextActions);
    setManuel({ prenom: "", numero: "", ville: "", accompagnement: "" });
    setMessage("Dossier manuel créé. Tu peux l’ouvrir et travailler directement.");
  }

  function updateAction(id, champ, valeurAction) {
    const next = { ...actions, [id]: { ...actionVide(), ...(actions[id] || {}), [champ]: valeurAction } };
    enregistrerActions(next);
    setMessage("Modification enregistrée.");
  }

  function automatiserLignesVides() {
    if (!rows.length) {
      setMessage("Importe d’abord un CSV ou crée un dossier manuel.");
      return;
    }
    const next = { ...actions };
    rows.forEach((row, index) => {
      const id = idDossier(row, index);
      const actuelle = { ...actionVide(), ...(next[id] || {}) };
      if (!dejaTravaille(actuelle) || !actuelle.prochaineAction) next[id] = { ...actuelle, ...propositionAutomatique(row) };
    });
    enregistrerActions(next);
    setMessage("Les dossiers sans action ont été préremplis.");
  }

  function ajouterTache(id, tache) {
    if (!tache) return;
    const actionActuelle = { ...actionVide(), ...(actions[id] || {}) };
    const ancienne = actionActuelle.prochaineAction || "";
    const nouvelle = ancienne.trim() ? `${ancienne.trim()}\n- ${tache}` : `- ${tache}`;
    updateAction(id, "prochaineAction", nouvelle);
  }

  function copierSynthese() {
    navigator.clipboard.writeText(texteSynthese);
    setMessage(rows.length ? "Synthèse copiée." : "Aucune file active à copier.");
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
            <p style={s.label}>Poste de travail</p>
            <h1 style={s.h1}>Pilotage des dossiers</h1>
            <p style={s.intro}>Objectif : arriver vite à la personne. Import CSV ou dossier manuel, recherche, ouverture du dossier, puis saisie sociale unique.</p>
          </div>
        </header>

        <section style={s.twoCols}>
          <div style={s.card}>
            <p style={s.label}>1. Alimenter la file</p>
            <label>
              <span style={s.small}>Importer un export CSV Insertis</span>
              <input style={s.input} type="file" accept=".csv,text/csv" onChange={importerCsv} />
            </label>
            <div style={s.actions}>
              <button style={s.button} type="button" onClick={automatiserLignesVides}>Préremplir les dossiers sans action</button>
              <button style={s.button} type="button" onClick={effacerLocal}>Effacer données locales</button>
            </div>
            <p style={s.intro}>Les données restent dans ce navigateur. Ne pas pousser les exports usagers sur GitHub.</p>
          </div>

          <div style={s.card}>
            <p style={s.label}>Sans CSV</p>
            <h2 style={{ ...s.h1, fontSize: "20px" }}>Créer un dossier manuel</h2>
            <div style={s.grid}>
              <label><span style={s.small}>Prénom ou repère</span><input style={s.input} value={manuel.prenom} onChange={(event) => setManuel({ ...manuel, prenom: event.target.value })} placeholder="Ex. Antoinette" /></label>
              <label><span style={s.small}>Numéro Insertis si connu</span><input style={s.input} value={manuel.numero} onChange={(event) => setManuel({ ...manuel, numero: event.target.value })} placeholder="Facultatif" /></label>
              <label><span style={s.small}>Ville</span><input style={s.input} value={manuel.ville} onChange={(event) => setManuel({ ...manuel, ville: event.target.value })} /></label>
              <label><span style={s.small}>Accompagnement</span><input style={s.input} value={manuel.accompagnement} onChange={(event) => setManuel({ ...manuel, accompagnement: event.target.value })} placeholder="Accompagnement global" /></label>
            </div>
            <div style={s.actions}>
              <button style={s.mainButton} type="button" onClick={creerDossierManuel}>Créer et travailler le dossier</button>
            </div>
          </div>
        </section>

        {message && <p style={s.message}>{message}</p>}

        <section style={s.card}>
          <p style={s.label}>2. Trouver la personne</p>
          <div style={s.grid}>
            <label>
              <span style={s.small}>Recherche prénom / ville / numéro</span>
              <input style={s.input} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Tape un prénom, une ville ou un numéro" />
            </label>
          </div>
          <div style={{ ...s.grid, marginTop: "12px" }}>
            {[
              ["Tous", kpis.total, "Dossiers"],
              ["Actions", kpis.aFaire, "Actions à faire"],
              ["Traces", kpis.insertis, "Traces Insertis"],
              ["Urgentes", kpis.urgentes, "Urgentes"],
              ["Importantes", kpis.importantes, "Importantes"],
            ].map(([filtre, nombre, libelle]) => (
              <button key={filtre} type="button" style={{ ...s.kpi, ...(filtreRapide === filtre ? {} : s.kpiOff) }} onClick={() => setFiltreRapide(filtre)}>
                <p style={s.kpiNumber}>{nombre}</p>
                <p style={s.kpiLabel}>{libelle}</p>
              </button>
            ))}
          </div>
        </section>

        <section style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={s.label}>3. Ouvrir le dossier</p>
              <h2 style={{ ...s.h1, fontSize: "20px" }}>{libelleFiltre(filtreRapide)} — {entreesFiltrees.length} résultat(s)</h2>
            </div>
            <button style={s.button} type="button" onClick={copierSynthese}>Copier synthèse file</button>
          </div>

          {!rows.length && (
            <div style={s.empty}>
              <strong>Aucune personne dans la file pour l’instant.</strong>
              <p>Importe un CSV Insertis ou crée un dossier manuel. Tant qu’il n’y a pas de personne, les indicateurs restent à zéro et les boutons ne produisent rien.</p>
            </div>
          )}

          {rows.length > 0 && entreesFiltrees.length === 0 && (
            <div style={s.empty}>Aucun dossier ne correspond à la recherche ou au filtre.</div>
          )}

          {entreesFiltrees.map(({ row, id, action }) => (
            <article style={s.listItem} key={id}>
              <div>
                <strong style={{ color: palette.titre, fontSize: "16px" }}>{affichageDossier(row, rows)}</strong>
                <span style={s.small}>{valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "sans numéro"}</span>
                <span style={s.small}>{valeur(row, ["Ville", "Commune"]) || "ville à préciser"}</span>
                <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(id)}`}>Ouvrir dossier</Link>
              </div>

              <div>
                <span style={s.badge}>{action.priorite}</span>{" "}
                <span style={s.badge}>{action.vigilance}</span>{" "}
                <span style={s.badge}>{action.traceInsertis}</span>
                <label style={{ display: "block", marginTop: "8px" }}>
                  <span style={s.small}>Prochaine action</span>
                  <textarea style={s.textarea} value={action.prochaineAction} onChange={(event) => updateAction(id, "prochaineAction", event.target.value)} />
                </label>
                <select style={{ ...s.input, marginTop: "8px" }} value="" onChange={(event) => { ajouterTache(id, event.target.value); event.target.value = ""; }}>
                  <option value="">Ajouter une tâche utile...</option>
                  {tachesTypes(row).map((tache) => <option key={tache} value={tache}>{tache}</option>)}
                </select>
              </div>

              <div>
                <label><span style={s.small}>Statut</span><select style={s.input} value={action.statut} onChange={(event) => updateAction(id, "statut", event.target.value)}><option>À faire</option><option>En cours</option><option>En attente</option><option>Fait</option><option>Reporté</option></select></label>
                <label><span style={s.small}>Échéance</span><input style={s.input} type="date" value={action.echeance} onChange={(event) => updateAction(id, "echeance", event.target.value)} /></label>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
