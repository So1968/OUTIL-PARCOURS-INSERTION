import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const STORAGE_ROWS = "artag-pilotage-actions-rows-v1";
const STORAGE_ACTIONS = "artag-pilotage-actions-suivi-v1";
const STORAGE_JOURNAL = "artag-pilotage-actions-journal-v1";
const STORAGE_INTERVENTIONS = "artag-pilotage-interventions-brouillons-v1";

function lireJson(cle, defaut) {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur ? JSON.parse(valeur) : defaut;
  } catch {
    return defaut;
  }
}

function valeur(row, noms) {
  for (const nom of noms) {
    if (row[nom]) return row[nom];
  }
  return "";
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

function affichageDossier(row, rows) {
  const p = prenom(row);
  const n = nom(row);
  if (!p && !n) return "Dossier";
  if (!p) return n.slice(0, 3);
  const doublons = rows.filter((item) => prenom(item).toLowerCase() === p.toLowerCase()).length;
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
    critereDateLimite: false,
    critereRisqueDroits: false,
    criterePersonneBloquee: false,
    criterePartenaireAttend: false,
    critereTraceRapide: false,
  };
}

function interventionVide() {
  return {
    date: new Date().toISOString().slice(0, 10),
    typeContact: "Entretien",
    objet: "",
    faits: "",
    parolePersonne: "",
    analyse: "",
    demarches: "",
    vigilance: "",
    suitePrevue: "",
  };
}

function scorePriorite(action) {
  return [
    action.critereDateLimite,
    action.critereRisqueDroits,
    action.criterePersonneBloquee,
    action.criterePartenaireAttend,
    action.critereTraceRapide,
  ].filter(Boolean).length;
}

function suggestionPriorite(action) {
  const score = scorePriorite(action);
  if (score >= 3) {
    return {
      score,
      priorite: "Priorité 1",
      vigilance: action.critereRisqueDroits || action.critereDateLimite ? "Urgente" : "Importante",
      phrase: "À traiter rapidement : plusieurs conséquences possibles si rien n’avance.",
    };
  }
  if (score === 2) return { score, priorite: "Priorité 2", vigilance: "Importante", phrase: "Important cette semaine, mais pas forcément à faire dans l’heure." };
  if (score === 1) return { score, priorite: "Priorité 3", vigilance: "À suivre", phrase: "À garder dans le radar, sans en faire une urgence du jour." };
  return { score, priorite: "À reporter", vigilance: "Faible", phrase: "Pas d’urgence identifiée : peut être reporté sans culpabilité." };
}

const TACHES = [
  "Appeler la personne",
  "Envoyer un SMS de rappel",
  "Prévoir / confirmer un rendez-vous",
  "Relancer les justificatifs",
  "Faire une trace Insertis",
  "Vérifier CAF / RSA / DTR",
  "Faire un point activité / micro-entreprise",
  "Contacter un partenaire",
  "Préparer une orientation",
  "Reporter / mettre en attente",
  "Autre action à préciser",
];

function texteCourt(valeurTexte, remplacement = "à compléter") {
  return String(valeurTexte || "").trim() || remplacement;
}

function genererTraceInsertis(row, rows, intervention, action) {
  return [
    `Contact du ${texteCourt(intervention.date)} — ${texteCourt(intervention.typeContact)}.`,
    `Objet : ${texteCourt(intervention.objet)}.`,
    `Éléments abordés : ${texteCourt(intervention.faits)}.`,
    intervention.parolePersonne ? `Parole de la personne : ${intervention.parolePersonne}.` : "",
    intervention.demarches ? `Action réalisée : ${intervention.demarches}.` : "",
    `Suite prévue : ${texteCourt(intervention.suitePrevue || action.prochaineAction)}.`,
    `Vigilance : ${texteCourt(intervention.vigilance || action.vigilance)}.`,
    `Dossier : ${affichageDossier(row, rows)}.`,
  ].filter(Boolean).join("\n");
}

function genererMonSuiviSocial(row, rows, intervention, action) {
  return [
    `Date de l’intervention : ${texteCourt(intervention.date)}`,
    `Type de contact : ${texteCourt(intervention.typeContact)}`,
    `Personne suivie : ${affichageDossier(row, rows)}`,
    `Numéro Insertis : ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "à préciser"}`,
    "",
    `Objet de l’intervention : ${texteCourt(intervention.objet)}`,
    "",
    `Éléments de situation / faits :\n${texteCourt(intervention.faits)}`,
    "",
    `Éléments exprimés par la personne :\n${texteCourt(intervention.parolePersonne, "non renseigné")}`,
    "",
    `Analyse professionnelle / repères :\n${texteCourt(intervention.analyse, "à compléter si nécessaire")}`,
    "",
    `Démarches réalisées :\n${texteCourt(intervention.demarches, "à compléter")}`,
    "",
    `Points de vigilance :\n${texteCourt(intervention.vigilance || action.vigilance, "aucune vigilance particulière renseignée")}`,
    "",
    `Suite prévue / prochaine action :\n${texteCourt(intervention.suitePrevue || action.prochaineAction, "à préciser")}`,
  ].join("\n");
}

function syntheseDossier(row, rows, action, journal) {
  const suggestion = suggestionPriorite(action);
  return [
    `Dossier — ${affichageDossier(row, rows)}`,
    "",
    `Numéro Insertis : ${valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "à préciser"}`,
    `Ville : ${valeur(row, ["Ville", "Commune"]) || "à préciser"}`,
    `CLI : ${row.CLI || "à préciser"}`,
    `CTM : ${row.CTM || "à préciser"}`,
    `Type d’accompagnement : ${valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "à préciser"}`,
    `Intensité : ${valeur(row, ["Intensité", "Intensite"]) || "à préciser"}`,
    "",
    "Évaluation priorité :",
    `- Score : ${suggestion.score}/5`,
    `- Priorité conseillée : ${suggestion.priorite}`,
    `- Vigilance conseillée : ${suggestion.vigilance}`,
    `- Lecture : ${suggestion.phrase}`,
    "",
    "Pilotage actuel :",
    `- Priorité retenue : ${action.priorite}`,
    `- Prochaine action : ${action.prochaineAction || "à compléter"}`,
    `- Échéance : ${action.echeance || "à préciser"}`,
    `- Vigilance retenue : ${action.vigilance}`,
    `- Statut : ${action.statut}`,
    `- Trace Insertis : ${action.traceInsertis}`,
    `- Note de suivi : ${action.note || "aucune note"}`,
    "",
    "Journal récent :",
    journal.length ? journal.slice(0, 8).map((item) => `- ${item.date} — ${item.type} : ${item.texte}`).join("\n") : "- Aucun élément journalisé pour le moment.",
  ].join("\n");
}

const s = {
  page: { minHeight: "100vh", background: "#F7F1E8", color: "#443E37", padding: "24px 22px 56px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1080px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", marginBottom: "18px" },
  card: { background: "#FBF7EF", border: "1px solid #D2C4B3", borderRadius: "16px", padding: "18px", marginBottom: "14px", boxShadow: "0 6px 14px rgba(63,55,47,0.04)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" },
  label: { margin: "0 0 6px", color: "#6F765D", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#334052", fontSize: "28px", lineHeight: 1.1 },
  h2: { margin: "0 0 8px", color: "#334052", fontSize: "20px", lineHeight: 1.2 },
  intro: { margin: "6px 0 0", color: "#5D554B", fontSize: "15px", lineHeight: 1.4 },
  field: { display: "grid", gap: "6px", fontWeight: 800, color: "#4B443C", fontSize: "14px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", background: "#FBF7EF", color: "#443E37" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D2C4B3", borderRadius: "10px", padding: "8px 10px", fontSize: "14px", lineHeight: 1.35, background: "#FBF7EF", color: "#443E37", minHeight: "82px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #D2C4B3", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#E8DDCC", color: "#334052", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #7F8A69", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#7F8A69", color: "white", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#E8DDCC", color: "#334052", textDecoration: "none", fontWeight: 900, border: "1px solid #D2C4B3" },
  info: { margin: "5px 0", color: "#5D554B", lineHeight: 1.35 },
  scoreBox: { background: "#E8DDCC", border: "1px solid #D2C4B3", borderRadius: "14px", padding: "14px", marginTop: "12px" },
  scoreNumber: { margin: "0 0 6px", fontSize: "24px", fontWeight: 900, color: "#334052" },
  checkboxLine: { display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", color: "#4B443C", fontWeight: 800 },
  checkboxText: { display: "block", fontSize: "13px", color: "#746B60", fontWeight: 500, marginTop: "2px" },
  message: { color: "#6F765D", fontWeight: 900 },
};

export function DossierPersonnePage() {
  const { dossierId = "" } = useParams();
  const idCourant = decodeURIComponent(dossierId);
  const [rows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [journaux, setJournaux] = useState(() => lireJson(STORAGE_JOURNAL, {}));
  const [interventions, setInterventions] = useState(() => lireJson(STORAGE_INTERVENTIONS, {}));
  const [dateNote, setDateNote] = useState(new Date().toISOString().slice(0, 10));
  const [typeNote, setTypeNote] = useState("Contact");
  const [nouvelleNote, setNouvelleNote] = useState("");
  const [message, setMessage] = useState("");

  const index = rows.findIndex((row, i) => idDossier(row, i) === idCourant);
  const row = index >= 0 ? rows[index] : null;
  const action = row ? { ...actionVide(), ...(actions[idCourant] || {}) } : actionVide();
  const intervention = row ? { ...interventionVide(), ...(interventions[idCourant] || {}) } : interventionVide();
  const journal = row
    ? [...(journaux[idCourant] || [])].sort((a, b) => `${b.date || ""} ${b.createdAt || ""}`.localeCompare(`${a.date || ""} ${a.createdAt || ""}`))
    : [];
  const suggestion = suggestionPriorite(action);
  const synthese = useMemo(() => (row ? syntheseDossier(row, rows, action, journal) : ""), [row, rows, action, journal]);
  const traceInsertis = useMemo(() => (row ? genererTraceInsertis(row, rows, intervention, action) : ""), [row, rows, intervention, action]);
  const noteMonSuiviSocial = useMemo(() => (row ? genererMonSuiviSocial(row, rows, intervention, action) : ""), [row, rows, intervention, action]);

  function enregistrerAction(nextAction) {
    const next = { ...actions, [idCourant]: nextAction };
    setActions(next);
    localStorage.setItem(STORAGE_ACTIONS, JSON.stringify(next));
    setMessage("Dossier mis à jour.");
  }

  function updateAction(champ, v) {
    enregistrerAction({ ...action, [champ]: v });
  }

  function updateIntervention(champ, v) {
    const nextIntervention = { ...intervention, [champ]: v };
    const next = { ...interventions, [idCourant]: nextIntervention };
    setInterventions(next);
    localStorage.setItem(STORAGE_INTERVENTIONS, JSON.stringify(next));
    setMessage("Brouillon d’intervention enregistré.");
  }

  function ajouterTache(tache) {
    if (!tache) return;
    const ancienne = action.prochaineAction || "";
    const prochaineAction = ancienne.trim() ? `${ancienne.trim()}\n- ${tache}` : `- ${tache}`;
    updateAction("prochaineAction", prochaineAction);
  }

  function appliquerSuggestion() {
    enregistrerAction({ ...action, priorite: suggestion.priorite, vigilance: suggestion.vigilance });
    setMessage("Suggestion appliquée à la priorité et à la vigilance.");
  }

  function ajouterEntreeJournal(type, texte, date = dateNote) {
    const entree = { id: String(Date.now()), date, type, texte: texte.trim(), createdAt: new Date().toISOString() };
    const next = { ...journaux, [idCourant]: [entree, ...(journaux[idCourant] || [])] };
    setJournaux(next);
    localStorage.setItem(STORAGE_JOURNAL, JSON.stringify(next));
  }

  function ajouterJournal() {
    if (!nouvelleNote.trim()) {
      setMessage("Note vide : rien à ajouter.");
      return;
    }
    ajouterEntreeJournal(typeNote, nouvelleNote, dateNote);
    setNouvelleNote("");
    setMessage("Note ajoutée au journal du dossier.");
  }

  function ajouterInterventionAuJournal() {
    ajouterEntreeJournal("Intervention / suivi social", noteMonSuiviSocial, intervention.date);
    enregistrerAction({ ...action, traceInsertis: "À faire", prochaineAction: intervention.suitePrevue || action.prochaineAction });
    setMessage("Intervention ajoutée au journal. Trace Insertis marquée à faire.");
  }

  function copierTexte(texte, libelle) {
    navigator.clipboard.writeText(texte);
    setMessage(`${libelle} copié.`);
  }

  if (!row) {
    return (
      <main style={s.page}>
        <div style={s.wrap}>
          <section style={s.card}>
            <p style={s.label}>Dossier personne</p>
            <h1 style={s.h1}>Dossier introuvable</h1>
            <p style={s.intro}>Retourne au pilotage et réimporte la liste Insertis si besoin.</p>
            <Link style={s.link} to="/pilotage-actions">Retour au pilotage</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <header style={s.header}>
          <div>
            <p style={s.label}>Dossier personne</p>
            <h1 style={s.h1}>{affichageDossier(row, rows)}</h1>
            <p style={s.intro}>Saisie unique : une intervention peut produire une trace Insertis, une note Mon Suivi Social et une entrée de journal.</p>
          </div>
          <Link style={s.link} to="/pilotage-actions">Retour pilotage</Link>
        </header>

        <section style={s.card}>
          <p style={s.label}>Cadre Insertis</p>
          <div style={s.grid}>
            <p style={s.info}><strong>Numéro Insertis :</strong><br />{valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "à préciser"}</p>
            <p style={s.info}><strong>Ville :</strong><br />{valeur(row, ["Ville", "Commune"]) || "à préciser"}</p>
            <p style={s.info}><strong>CLI :</strong><br />{row.CLI || "à préciser"}</p>
            <p style={s.info}><strong>CTM :</strong><br />{row.CTM || "à préciser"}</p>
            <p style={s.info}><strong>Accompagnement :</strong><br />{valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "à préciser"}</p>
            <p style={s.info}><strong>Intensité :</strong><br />{valeur(row, ["Intensité", "Intensite"]) || "à préciser"}</p>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>Évaluation rapide de priorité</p>
          <p style={s.intro}>Coche ce qui est vrai. L’outil propose une priorité, mais tu gardes la main.</p>
          <div style={s.grid}>
            {[
              ["critereDateLimite", "Date limite proche", "RDV, recours, DTR, justificatif, dette, convocation."],
              ["critereRisqueDroits", "Risque de rupture de droit ou d’aggravation", "RSA, CAF, radiation, dette, expulsion, situation qui se dégrade."],
              ["criterePersonneBloquee", "Personne bloquée sans mon appui", "Elle attend ton retour ou ne peut pas avancer seule."],
              ["criterePartenaireAttend", "Partenaire en attente", "Métropole, CAF, MDM, DGFIP, bailleur, autre service."],
              ["critereTraceRapide", "Trace Insertis à faire rapidement", "Entretien réalisé, action engagée, vigilance ou décision à tracer."],
            ].map(([champ, titre, aide]) => (
              <label style={s.checkboxLine} key={champ}>
                <input type="checkbox" checked={Boolean(action[champ])} onChange={(event) => updateAction(champ, event.target.checked)} />
                <span>{titre}<span style={s.checkboxText}>{aide}</span></span>
              </label>
            ))}
          </div>
          <div style={s.scoreBox}>
            <p style={s.scoreNumber}>Score : {suggestion.score}/5</p>
            <p style={s.info}><strong>Priorité conseillée :</strong> {suggestion.priorite}</p>
            <p style={s.info}><strong>Vigilance conseillée :</strong> {suggestion.vigilance}</p>
            <p style={s.info}>{suggestion.phrase}</p>
            <button style={s.mainButton} type="button" onClick={appliquerSuggestion}>Appliquer la suggestion</button>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>Pilotage du dossier</p>
          <div style={s.grid}>
            <label style={s.field}>Priorité retenue<select style={s.input} value={action.priorite} onChange={(event) => updateAction("priorite", event.target.value)}><option>À qualifier</option><option>Priorité 1</option><option>Priorité 2</option><option>Priorité 3</option><option>À reporter</option></select></label>
            <label style={s.field}>Échéance<input style={s.input} type="date" value={action.echeance} onChange={(event) => updateAction("echeance", event.target.value)} /></label>
            <label style={s.field}>Vigilance retenue<select style={s.input} value={action.vigilance} onChange={(event) => updateAction("vigilance", event.target.value)}><option>Faible</option><option>À suivre</option><option>Importante</option><option>Urgente</option></select></label>
            <label style={s.field}>Statut<select style={s.input} value={action.statut} onChange={(event) => updateAction("statut", event.target.value)}><option>À faire</option><option>En cours</option><option>En attente</option><option>Fait</option><option>Reporté</option></select></label>
            <label style={s.field}>Trace Insertis<select style={s.input} value={action.traceInsertis} onChange={(event) => updateAction("traceInsertis", event.target.value)}><option>À prévoir</option><option>À faire</option><option>Faite</option><option>Pas nécessaire</option></select></label>
          </div>
          <div style={{ ...s.grid, marginTop: "12px" }}>
            <label style={s.field}>Prochaine action<textarea style={s.textarea} value={action.prochaineAction} onChange={(event) => updateAction("prochaineAction", event.target.value)} /><select style={{ ...s.input, marginTop: "8px" }} value="" onChange={(event) => { ajouterTache(event.target.value); event.target.value = ""; }}><option value="">Ajouter une tâche...</option>{TACHES.map((tache) => <option key={tache} value={tache}>{tache}</option>)}</select></label>
            <label style={s.field}>Note de suivi<textarea style={s.textarea} value={action.note} onChange={(event) => updateAction("note", event.target.value)} /></label>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>Saisie unique d’intervention</p>
          <h2 style={s.h2}>Insertis + Mon Suivi Social</h2>
          <p style={s.intro}>Tu remplis une fois. L’outil prépare ensuite deux textes à copier, puis peut ajouter l’intervention au journal du dossier.</p>
          <div style={s.grid}>
            <label style={s.field}>Date<input style={s.input} type="date" value={intervention.date} onChange={(event) => updateIntervention("date", event.target.value)} /></label>
            <label style={s.field}>Type de contact<select style={s.input} value={intervention.typeContact} onChange={(event) => updateIntervention("typeContact", event.target.value)}><option>Entretien</option><option>Téléphone</option><option>SMS</option><option>Mail</option><option>Partenaire</option><option>Administratif</option><option>Autre</option></select></label>
          </div>
          <div style={{ ...s.grid, marginTop: "12px" }}>
            <label style={s.field}>Objet<textarea style={s.textarea} value={intervention.objet} onChange={(event) => updateIntervention("objet", event.target.value)} /></label>
            <label style={s.field}>Faits / situation abordée<textarea style={s.textarea} value={intervention.faits} onChange={(event) => updateIntervention("faits", event.target.value)} /></label>
            <label style={s.field}>Parole de la personne<textarea style={s.textarea} value={intervention.parolePersonne} onChange={(event) => updateIntervention("parolePersonne", event.target.value)} /></label>
            <label style={s.field}>Analyse professionnelle<textarea style={s.textarea} value={intervention.analyse} onChange={(event) => updateIntervention("analyse", event.target.value)} /></label>
            <label style={s.field}>Démarches réalisées<textarea style={s.textarea} value={intervention.demarches} onChange={(event) => updateIntervention("demarches", event.target.value)} /></label>
            <label style={s.field}>Vigilance<textarea style={s.textarea} value={intervention.vigilance} onChange={(event) => updateIntervention("vigilance", event.target.value)} /></label>
            <label style={s.field}>Suite prévue<textarea style={s.textarea} value={intervention.suitePrevue} onChange={(event) => updateIntervention("suitePrevue", event.target.value)} /></label>
          </div>
          <div style={{ ...s.grid, marginTop: "12px" }}>
            <label style={s.field}>Texte court pour Insertis<textarea style={{ ...s.textarea, minHeight: "180px" }} readOnly value={traceInsertis} /></label>
            <label style={s.field}>Note pour Mon Suivi Social<textarea style={{ ...s.textarea, minHeight: "180px" }} readOnly value={noteMonSuiviSocial} /></label>
          </div>
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={() => copierTexte(traceInsertis, "Texte Insertis")}>Copier pour Insertis</button>
            <button style={s.mainButton} type="button" onClick={() => copierTexte(noteMonSuiviSocial, "Note Mon Suivi Social")}>Copier pour Mon Suivi Social</button>
            <button style={s.button} type="button" onClick={ajouterInterventionAuJournal}>Ajouter au journal + marquer Insertis à faire</button>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>Journal du dossier</p>
          <p style={s.info}>Notes classées par date, de la plus récente à la plus ancienne.</p>
          <div style={s.grid}>
            <label style={s.field}>Date<input style={s.input} type="date" value={dateNote} onChange={(event) => setDateNote(event.target.value)} /></label>
            <label style={s.field}>Type de note<select style={s.input} value={typeNote} onChange={(event) => setTypeNote(event.target.value)}><option>Contact</option><option>Administratif</option><option>Échéance</option><option>Vigilance</option><option>Partenaire</option><option>À reprendre</option></select></label>
          </div>
          <label style={{ ...s.field, marginTop: "12px" }}>Nouvelle note<textarea style={s.textarea} value={nouvelleNote} onChange={(event) => setNouvelleNote(event.target.value)} /></label>
          <button style={s.mainButton} type="button" onClick={ajouterJournal}>Ajouter au journal</button>
          <div style={{ marginTop: "16px" }}>
            {journal.length === 0 ? <p style={s.info}>Aucune note journalisée pour le moment.</p> : journal.map((item) => <article key={item.id} style={{ ...s.card, marginBottom: "10px", padding: "14px" }}><p style={{ ...s.info, margin: 0 }}><strong>{item.date} — {item.type}</strong></p><p style={{ ...s.info, marginBottom: 0, whiteSpace: "pre-wrap" }}>{item.texte}</p></article>)}
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>Synthèse dossier</p>
          <textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={synthese} />
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={() => copierTexte(synthese, "Synthèse dossier")}>Copier la synthèse</button>
            {message && <p style={s.message}>{message}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
