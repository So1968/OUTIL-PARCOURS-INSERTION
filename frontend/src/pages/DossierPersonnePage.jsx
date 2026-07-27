import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const STORAGE_ROWS = "artag-pilotage-actions-rows-v1";
const STORAGE_ACTIONS = "artag-pilotage-actions-suivi-v1";
const STORAGE_JOURNAL = "artag-pilotage-actions-journal-v1";
const STORAGE_INTERVENTIONS = "artag-pilotage-interventions-brouillons-v2";
const STORAGE_AUTONOMIE = "artag-pilotage-autonomie-socle-v1";

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
    faits: "",
    parolePersonne: "",
    analyse: "",
    demarches: "",
    vigilance: "",
    suitePrevue: "",
  };
}

const NIVEAUX_AUTONOMIE = [
  "Non évalué",
  "Autonome",
  "Autonomie partielle",
  "Besoin d'appui régulier",
  "Besoin d'appui renforcé",
];

const QUESTIONS_AUTONOMIE = [
  {
    id: "demarches",
    domaine: "Démarches / accès aux droits",
    question: "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?",
    repere: "Socle autonomie — question 1 validée. Repérer comment la personne se situe face aux démarches administratives et aux droits.",
  },
  {
    id: "organisation",
    domaine: "Organisation du quotidien",
    question: "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?",
    repere: "Socle autonomie — question 2 validée. Repérer les appuis et les difficultés dans l’organisation quotidienne.",
  },
  {
    id: "budget",
    domaine: "Budget / argent",
    question: "Pour gérer l’argent au quotidien, vous vous en sortez comment ?",
    repere: "Socle autonomie — question 3 validée. Repérer la stabilité ou la fragilité dans la gestion de l’argent au quotidien.",
  },
  {
    id: "sante",
    domaine: "Santé / accès aux soins",
    question: "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?",
    repere: "Socle autonomie — question 4 validée. Repérer l’accès effectif aux soins, sans poser de diagnostic médical.",
  },
  {
    id: "mobilite",
    domaine: "Mobilité / déplacements",
    question: "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?",
    repere: "Socle autonomie — question 5 validée. Ne pas réduire la mobilité à la possession d’un véhicule.",
  },
  {
    id: "ecritNumerique",
    domaine: "Écrit / numérique",
    question: "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?",
    repere: "Socle autonomie — question 6 validée. Repérer les appuis ou difficultés avec l’écrit, les documents et les démarches numériques.",
  },
  {
    id: "famille",
    domaine: "Vie familiale / disponibilité",
    question: "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?",
    repere: "Socle autonomie — question 7 validée. Comprendre les contraintes familiales sans les transformer en jugement.",
  },
  {
    id: "projet",
    domaine: "Projet / mise en mouvement",
    question: "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?",
    repere: "Socle autonomie — question 8 validée. Ne pas confondre temporalité de la personne et absence de projet.",
  },
];

const GRILLE_COMPLEMENTAIRE = [
  { domaine: "Logement", question: "Pour votre logement ou votre lieu de vie, qu’est-ce qui facilite ou bloque les démarches aujourd’hui ?" },
  { domaine: "Santé / handicap", question: "Pour votre santé, vos soins ou une situation de handicap, de quoi faut-il tenir compte dans le parcours ?" },
  { domaine: "Organisation familiale", question: "Avec l’organisation familiale, les enfants ou les proches, qu’est-ce qui peut faciliter ou limiter vos démarches ?" },
  { domaine: "Mobilité", question: "Pour vous déplacer vers les rendez-vous, les démarches, la formation ou l’emploi, ça se passe comment ?" },
  { domaine: "Budget et finances", question: "Pour le budget, les factures ou les droits, quels sont les points à sécuriser ?" },
  { domaine: "Linguistique", question: "Pour comprendre, parler, lire ou écrire en français, qu’est-ce qui est facile ou difficile ?" },
  { domaine: "Numérique et accès aux droits", question: "Pour les démarches en ligne, les comptes CAF / France Travail / administratifs, vous vous y retrouvez comment ?" },
  { domaine: "Rapport à soi et à autrui", question: "Dans la confiance, la relation aux autres ou la mise en mouvement, qu’est-ce qui aide ou freine aujourd’hui ?" },
  { domaine: "Projet professionnel", question: "Pour l’activité, la formation ou l’emploi, où en est votre projet aujourd’hui ?" },
];

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

function autonomieVide() {
  return QUESTIONS_AUTONOMIE.reduce((acc, question) => {
    acc[question.id] = "Non évalué";
    acc[`${question.id}Note`] = "";
    return acc;
  }, {});
}

function texteCourt(valeurTexte, remplacement = "à compléter") {
  return String(valeurTexte || "").trim() || remplacement;
}

function reponsesAutonomie(autonomie) {
  return QUESTIONS_AUTONOMIE.map((question) => ({
    ...question,
    niveau: autonomie[question.id] || "Non évalué",
    note: texteCourt(autonomie[`${question.id}Note`], ""),
  })).filter((question) => question.niveau !== "Non évalué" || question.note);
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

function bilanAutonomie(autonomie) {
  const renseignes = QUESTIONS_AUTONOMIE.filter((question) => autonomie[question.id] && autonomie[question.id] !== "Non évalué");
  if (!renseignes.length) {
    return {
      phrase: "Socle autonomie non renseigné : l’évaluation peut être faite au prochain contact, sans remplacer l’approfondissement.",
      pointsAppui: [],
      pointsRessource: [],
    };
  }

  const pointsAppui = renseignes
    .filter((question) => ["Besoin d'appui régulier", "Besoin d'appui renforcé"].includes(autonomie[question.id]))
    .map((question) => question.domaine);

  const pointsRessource = renseignes
    .filter((question) => ["Autonome", "Autonomie partielle"].includes(autonomie[question.id]))
    .map((question) => question.domaine);

  let phrase = "Autonomie à préciser : plusieurs domaines sont renseignés, mais la lecture doit encore être consolidée avec la personne.";
  if (pointsAppui.length >= 3) phrase = "Besoin d’appui important : plusieurs domaines nécessitent un accompagnement régulier ou renforcé.";
  else if (pointsAppui.length >= 1) phrase = "Autonomie partielle : certains domaines peuvent être travaillés seuls, mais des points d’appui sont à prévoir.";
  else if (pointsRessource.length >= 4) phrase = "Autonomie globalement repérée : garder des points de vigilance sans renforcer inutilement l’accompagnement.";

  return { phrase, pointsAppui, pointsRessource };
}

function phraseNiveau(question) {
  if (question.niveau === "Autonome") return `Sur le plan ${question.domaine.toLowerCase()}, la personne apparaît autonome.`;
  if (question.niveau === "Autonomie partielle") return `Sur le plan ${question.domaine.toLowerCase()}, la personne dispose d’une autonomie partielle.`;
  if (question.niveau === "Besoin d'appui régulier") return `Sur le plan ${question.domaine.toLowerCase()}, un appui régulier semble nécessaire.`;
  if (question.niveau === "Besoin d'appui renforcé") return `Sur le plan ${question.domaine.toLowerCase()}, un appui renforcé est à prévoir.`;
  return `Sur le plan ${question.domaine.toLowerCase()}, l’autonomie reste à évaluer.`;
}

function genererSyntheseAutonomieRedigee(autonomie) {
  const reponses = reponsesAutonomie(autonomie);
  const bilan = bilanAutonomie(autonomie);
  if (!reponses.length) {
    return "L’autonomie n’est pas encore évaluée. Le socle pourra être repris avec la personne afin d’identifier les démarches qu’elle réalise seule, les domaines où un appui est nécessaire et les points à approfondir.";
  }

  const lignes = ["Synthèse autonomie — dossier écrit", "", bilan.phrase, ""];
  if (bilan.pointsRessource.length) lignes.push(`Les domaines ressources repérés sont : ${bilan.pointsRessource.join(", ")}.`);
  if (bilan.pointsAppui.length) lignes.push(`Les domaines nécessitant un appui sont : ${bilan.pointsAppui.join(", ")}.`);
  lignes.push("", "Éléments issus des réponses :");
  reponses.forEach((question) => {
    lignes.push(`- ${phraseNiveau(question)}${question.note ? ` ${question.note}` : ""}`);
  });
  lignes.push("", "Cette lecture reste à ajuster avec la personne et ne remplace pas l’approfondissement de la situation. Elle sert à orienter la suite de l’accompagnement et à éviter de renforcer inutilement ce qui peut déjà être fait seul.");
  return lignes.join("\n");
}

function genererBilanAutonomie(autonomie) {
  const bilan = bilanAutonomie(autonomie);
  const lignes = [
    "Repères autonomie — socle rapide",
    "Référentiel : démarches/droits, organisation, budget, santé, mobilité, écrit-numérique, vie familiale, projet/pouvoir d’agir.",
    "Le socle autonomie ne remplace pas l’approfondissement ; il le prépare.",
    "",
  ];

  QUESTIONS_AUTONOMIE.forEach((question) => {
    lignes.push(`${question.domaine} : ${autonomie[question.id] || "Non évalué"}`);
    const note = texteCourt(autonomie[`${question.id}Note`], "");
    if (note) lignes.push(`Note : ${note}`);
    lignes.push("");
  });

  lignes.push("Lecture professionnelle :", bilan.phrase);
  lignes.push(`Domaines d'appui : ${bilan.pointsAppui.length ? bilan.pointsAppui.join(", ") : "non repérés à ce stade"}.`);
  lignes.push(`Domaines ressources : ${bilan.pointsRessource.length ? bilan.pointsRessource.join(", ") : "à préciser"}.`);
  return lignes.join("\n");
}

function genererParcoursAutonomie(autonomie, action) {
  const bilan = bilanAutonomie(autonomie);
  return [
    "Parcours autonomie — étapes de travail",
    "",
    `Lecture actuelle : ${bilan.phrase}`,
    `Points d’appui : ${bilan.pointsAppui.length ? bilan.pointsAppui.join(", ") : "à repérer avec la personne"}.`,
    `Points ressources : ${bilan.pointsRessource.length ? bilan.pointsRessource.join(", ") : "à préciser"}.`,
    "",
    "Prochaine étape utile :",
    action.prochaineAction || "Choisir avec la personne une action simple et réaliste à faire avant le prochain contact.",
    "",
    "Principe de travail : ne pas faire à la place si la personne peut faire avec un appui léger ; renforcer seulement les domaines bloquants.",
  ].join("\n");
}

function genererTraceInsertis(row, rows, intervention, action, autonomie) {
  const bilan = bilanAutonomie(autonomie);
  return [
    `Éléments abordés : ${texteCourt(intervention.faits)}.`,
    bilan.pointsAppui.length || bilan.pointsRessource.length ? `Autonomie : ${bilan.phrase}` : "",
    intervention.parolePersonne ? `Parole de la personne : ${intervention.parolePersonne}.` : "",
    intervention.analyse ? `Analyse professionnelle : ${intervention.analyse}.` : "",
    intervention.demarches ? `Démarches réalisées : ${intervention.demarches}.` : "",
    `Vigilance : ${texteCourt(intervention.vigilance || action.vigilance, "aucune vigilance particulière renseignée")}.`,
    `Suite prévue : ${texteCourt(intervention.suitePrevue || action.prochaineAction)}.`,
    `Dossier : ${affichageDossier(row, rows)}.`,
  ].filter(Boolean).join("\n");
}

function genererMonSuiviSocial(intervention, action, syntheseAutonomie) {
  return [
    `Faits / situation abordée :\n${texteCourt(intervention.faits)}`,
    "",
    `Évaluation de l’autonomie :\n${texteCourt(syntheseAutonomie, "à compléter après le socle autonomie")}`,
    "",
    `Parole de la personne :\n${texteCourt(intervention.parolePersonne, "non renseigné")}`,
    "",
    `Analyse professionnelle :\n${texteCourt(intervention.analyse, "à compléter si nécessaire")}`,
    "",
    `Démarches réalisées :\n${texteCourt(intervention.demarches, "à compléter")}`,
    "",
    `Vigilance :\n${texteCourt(intervention.vigilance || action.vigilance, "aucune vigilance particulière renseignée")}`,
    "",
    `Suite prévue :\n${texteCourt(intervention.suitePrevue || action.prochaineAction, "à préciser")}`,
  ].join("\n");
}

function syntheseDossier(row, rows, action, journal, autonomie) {
  const suggestion = suggestionPriorite(action);
  const bilan = bilanAutonomie(autonomie);
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
    "Repères autonomie :",
    `- Lecture : ${bilan.phrase}`,
    `- Domaines d'appui : ${bilan.pointsAppui.length ? bilan.pointsAppui.join(", ") : "non repérés à ce stade"}`,
    `- Domaines ressources : ${bilan.pointsRessource.length ? bilan.pointsRessource.join(", ") : "à préciser"}`,
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
  page: { minHeight: "100vh", background: "#171a18", color: "#f4efe6", padding: "24px 22px 56px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "1180px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", marginBottom: "18px" },
  card: { background: "#242822", border: "1px solid #46513f", borderRadius: "18px", padding: "18px", marginBottom: "16px", boxShadow: "0 12px 24px rgba(0,0,0,0.18)" },
  cardSoft: { background: "#2c3029", border: "1px solid #59634f", borderRadius: "16px", padding: "14px", marginBottom: "12px" },
  cardWarm: { background: "#332f27", border: "1px solid #6f624b", borderRadius: "16px", padding: "14px", marginBottom: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  twoColumns: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", alignItems: "start" },
  threeColumns: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" },
  questionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", alignItems: "start", padding: "14px", border: "1px solid #59634f", borderRadius: "14px", background: "#242822", marginTop: "10px" },
  label: { margin: "0 0 6px", color: "#b7c7a6", fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#fff8ea", fontSize: "30px", lineHeight: 1.1 },
  h2: { margin: "0 0 8px", color: "#fff8ea", fontSize: "22px", lineHeight: 1.2 },
  h3: { margin: "0 0 8px", color: "#fff8ea", fontSize: "17px", lineHeight: 1.2 },
  intro: { margin: "6px 0 0", color: "#d7cfbf", fontSize: "15px", lineHeight: 1.45 },
  info: { margin: "5px 0", color: "#e2dac9", lineHeight: 1.4 },
  field: { display: "grid", gap: "6px", fontWeight: 800, color: "#f1eadc", fontSize: "14px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #66735b", borderRadius: "10px", padding: "9px 10px", fontSize: "14px", background: "#171a18", color: "#fff8ea" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #66735b", borderRadius: "10px", padding: "9px 10px", fontSize: "14px", lineHeight: 1.35, background: "#171a18", color: "#fff8ea", minHeight: "92px" },
  actions: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #66735b", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#2c3029", color: "#fff8ea", fontWeight: 900, cursor: "pointer" },
  mainButton: { border: "1px solid #9baa7e", borderRadius: "999px", minHeight: "34px", padding: "7px 12px", background: "#7f8a69", color: "white", fontWeight: 900, cursor: "pointer" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#2c3029", color: "#fff8ea", textDecoration: "none", fontWeight: 900, border: "1px solid #66735b" },
  badge: { display: "inline-flex", alignItems: "center", border: "1px solid #66735b", borderRadius: "999px", padding: "6px 10px", background: "#171a18", color: "#fff8ea", fontWeight: 900, fontSize: "13px" },
  badgeAlert: { display: "inline-flex", alignItems: "center", border: "1px solid #b89b5e", borderRadius: "999px", padding: "6px 10px", background: "#403621", color: "#ffe9b8", fontWeight: 900, fontSize: "13px" },
  scoreBox: { background: "#332f27", border: "1px solid #6f624b", borderRadius: "14px", padding: "14px", marginTop: "12px" },
  timeline: { display: "grid", gap: "10px", marginTop: "12px" },
  timelineItem: { background: "#1d211d", borderLeft: "4px solid #9baa7e", borderRadius: "12px", padding: "12px", borderTop: "1px solid #3f4939", borderRight: "1px solid #3f4939", borderBottom: "1px solid #3f4939" },
  checkboxLine: { display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", color: "#f1eadc", fontWeight: 800 },
  checkboxText: { display: "block", fontSize: "13px", color: "#c9c0ad", fontWeight: 500, marginTop: "2px" },
  message: { color: "#c7d9ad", fontWeight: 900, margin: 0 },
  summary: { cursor: "pointer", fontWeight: 900, color: "#fff8ea", fontSize: "18px", listStyle: "none" },
  summaryHelp: { display: "block", marginTop: "4px", color: "#d7cfbf", fontSize: "14px", fontWeight: 500 },
};

export function DossierPersonnePage() {
  const { dossierId = "" } = useParams();
  const idCourant = decodeURIComponent(dossierId);
  const [rows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [actions, setActions] = useState(() => lireJson(STORAGE_ACTIONS, {}));
  const [journaux, setJournaux] = useState(() => lireJson(STORAGE_JOURNAL, {}));
  const [interventions, setInterventions] = useState(() => lireJson(STORAGE_INTERVENTIONS, {}));
  const [autonomies, setAutonomies] = useState(() => lireJson(STORAGE_AUTONOMIE, {}));
  const [dateNote, setDateNote] = useState(new Date().toISOString().slice(0, 10));
  const [typeNote, setTypeNote] = useState("Contact");
  const [nouvelleNote, setNouvelleNote] = useState("");
  const [message, setMessage] = useState("");

  const index = rows.findIndex((row, i) => idDossier(row, i) === idCourant);
  const row = index >= 0 ? rows[index] : null;
  const action = row ? { ...actionVide(), ...(actions[idCourant] || {}) } : actionVide();
  const intervention = row ? { ...interventionVide(), ...(interventions[idCourant] || {}) } : interventionVide();
  const autonomie = row ? { ...autonomieVide(), ...(autonomies[idCourant] || {}) } : autonomieVide();
  const journal = row
    ? [...(journaux[idCourant] || [])].sort((a, b) => `${b.date || ""} ${b.createdAt || ""}`.localeCompare(`${a.date || ""} ${a.createdAt || ""}`))
    : [];

  const derniereNote = journal[0] || null;
  const notesRecentes = journal.slice(0, 4);
  const suggestion = suggestionPriorite(action);
  const bilanSocle = useMemo(() => bilanAutonomie(autonomie), [autonomie]);
  const syntheseAutonomieRedigee = useMemo(() => genererSyntheseAutonomieRedigee(autonomie), [autonomie]);
  const texteAutonomie = useMemo(() => genererBilanAutonomie(autonomie), [autonomie]);
  const parcoursAutonomie = useMemo(() => genererParcoursAutonomie(autonomie, action), [autonomie, action]);
  const synthese = useMemo(() => (row ? syntheseDossier(row, rows, action, journal, autonomie) : ""), [row, rows, action, journal, autonomie]);
  const traceInsertis = useMemo(() => (row ? genererTraceInsertis(row, rows, intervention, action, autonomie) : ""), [row, rows, intervention, action, autonomie]);
  const noteMonSuiviSocial = useMemo(() => genererMonSuiviSocial(intervention, action, syntheseAutonomieRedigee), [intervention, action, syntheseAutonomieRedigee]);

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

  function updateAutonomie(champ, v) {
    const nextAutonomie = { ...autonomie, [champ]: v };
    const next = { ...autonomies, [idCourant]: nextAutonomie };
    setAutonomies(next);
    localStorage.setItem(STORAGE_AUTONOMIE, JSON.stringify(next));
    setMessage("Repères autonomie enregistrés.");
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
    const contenu = String(texte || "").trim();
    if (!contenu) return;
    const entree = { id: String(Date.now()), date, type, texte: contenu, createdAt: new Date().toISOString() };
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

  function ajouterAutonomieAuJournal() {
    ajouterEntreeJournal("Synthèse autonomie", syntheseAutonomieRedigee, new Date().toISOString().slice(0, 10));
    setMessage("Synthèse autonomie ajoutée au journal.");
  }

  function ajouterParcoursAuJournal() {
    ajouterEntreeJournal("Parcours autonomie", parcoursAutonomie, new Date().toISOString().slice(0, 10));
    setMessage("Parcours autonomie ajouté au journal.");
  }

  function alimenterAnalyseAvecAutonomie() {
    const base = texteCourt(intervention.analyse, "");
    const ajout = syntheseAutonomieRedigee.trim();
    const prochaineAnalyse = base ? `${base}\n\n${ajout}` : ajout;
    updateIntervention("analyse", prochaineAnalyse);
    setMessage("Synthèse autonomie ajoutée dans l’analyse professionnelle.");
  }

  function ajouterInterventionAuJournal() {
    ajouterEntreeJournal("Intervention / suivi social", noteMonSuiviSocial, new Date().toISOString().slice(0, 10));
    enregistrerAction({ ...action, traceInsertis: "À faire", prochaineAction: intervention.suitePrevue || action.prochaineAction });
    setMessage("Intervention ajoutée au journal. Trace Insertis marquée à faire.");
  }

  function copierTexte(texte, libelle) {
    navigator.clipboard?.writeText(texte);
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
            <p style={s.intro}>Fiche de travail enrichie : reprise rapide, journal visible, action du moment et note sociale. Les grilles restent rangées, mais elles ne disparaissent pas.</p>
          </div>
          <Link style={s.link} to="/pilotage-actions">Retour pilotage</Link>
        </header>

        {message && <section style={s.cardSoft}><p style={s.message}>{message}</p></section>}

        <section style={s.card}>
          <p style={s.label}>Tableau de reprise</p>
          <div style={s.threeColumns}>
            <div style={s.cardSoft}>
              <p style={s.label}>Cadre</p>
              <p style={s.info}><strong>Insertis :</strong> {valeur(row, ["Numéro Insertis", "Numero Insertis"]) || "à préciser"}</p>
              <p style={s.info}><strong>Ville / CLI :</strong> {valeur(row, ["Ville", "Commune"]) || "à préciser"} — {row.CLI || "à préciser"}</p>
              <p style={s.info}><strong>Accompagnement :</strong> {valeur(row, ["Type d'accompagnement", "Type d’accompagnement"]) || "à préciser"}</p>
            </div>
            <div style={s.cardSoft}>
              <p style={s.label}>Action du moment</p>
              <p style={s.info}><strong>Priorité :</strong> <span style={suggestion.score >= 2 ? s.badgeAlert : s.badge}>{action.priorite}</span></p>
              <p style={s.info}><strong>Échéance :</strong> {action.echeance || "à préciser"}</p>
              <p style={s.info}><strong>Vigilance :</strong> {action.vigilance}</p>
            </div>
            <div style={s.cardWarm}>
              <p style={s.label}>Lecture rapide</p>
              <p style={s.info}><strong>Dernier contact :</strong> {derniereNote ? `${derniereNote.date} — ${derniereNote.type}` : "aucun journal pour le moment"}</p>
              <p style={s.info}><strong>Autonomie :</strong> {bilanSocle.pointsAppui.length ? `${bilanSocle.pointsAppui.length} domaine(s) d’appui repéré(s)` : "à préciser si utile"}</p>
              <p style={s.info}><strong>Trace Insertis :</strong> {action.traceInsertis}</p>
            </div>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>1. Journal + action</p>
          <h2 style={s.h2}>Reprendre, noter, décider la suite</h2>
          <div style={s.twoColumns}>
            <div>
              <h3 style={s.h3}>Journal récent</h3>
              {notesRecentes.length === 0 ? (
                <p style={s.info}>Aucune note journalisée pour le moment.</p>
              ) : (
                <div style={s.timeline}>
                  {notesRecentes.map((item) => (
                    <article key={item.id} style={s.timelineItem}>
                      <p style={{ ...s.info, margin: 0 }}><strong>{item.date} — {item.type}</strong></p>
                      <p style={{ ...s.info, marginBottom: 0 }}>{item.texte}</p>
                    </article>
                  ))}
                </div>
              )}
              <details style={{ marginTop: "14px" }}>
                <summary style={s.summary}>Voir tout le journal<span style={s.summaryHelp}>Historique complet classé du plus récent au plus ancien.</span></summary>
                <div style={s.timeline}>
                  {journal.length === 0 ? <p style={s.info}>Aucune note journalisée pour le moment.</p> : journal.map((item) => (
                    <article key={item.id} style={s.timelineItem}>
                      <p style={{ ...s.info, margin: 0 }}><strong>{item.date} — {item.type}</strong></p>
                      <p style={{ ...s.info, marginBottom: 0 }}>{item.texte}</p>
                    </article>
                  ))}
                </div>
              </details>
            </div>

            <div>
              <h3 style={s.h3}>Nouvelle trace rapide</h3>
              <div style={s.grid}>
                <label style={s.field}>Date<input style={s.input} type="date" value={dateNote} onChange={(event) => setDateNote(event.target.value)} /></label>
                <label style={s.field}>Type<select style={s.input} value={typeNote} onChange={(event) => setTypeNote(event.target.value)}><option>Contact</option><option>Administratif</option><option>Échéance</option><option>Vigilance</option><option>Partenaire</option><option>À reprendre</option></select></label>
              </div>
              <label style={{ ...s.field, marginTop: "12px" }}>Note rapide<textarea style={s.textarea} value={nouvelleNote} onChange={(event) => setNouvelleNote(event.target.value)} placeholder="Noter l’essentiel tout de suite : échange, action faite, point à reprendre." /></label>
              <button style={s.mainButton} type="button" onClick={ajouterJournal}>Ajouter au journal</button>

              <h3 style={{ ...s.h3, marginTop: "18px" }}>Prochaine action</h3>
              <label style={s.field}>Ce qui est à faire<textarea style={s.textarea} value={action.prochaineAction} onChange={(event) => updateAction("prochaineAction", event.target.value)} placeholder="La prochaine chose concrète à faire." /></label>
              <select style={{ ...s.input, marginTop: "8px" }} value="" onChange={(event) => { ajouterTache(event.target.value); event.target.value = ""; }}>
                <option value="">Ajouter une tâche rapide...</option>
                {TACHES.map((tache) => <option key={tache} value={tache}>{tache}</option>)}
              </select>
              <div style={{ ...s.grid, marginTop: "12px" }}>
                <label style={s.field}>Échéance<input style={s.input} type="date" value={action.echeance} onChange={(event) => updateAction("echeance", event.target.value)} /></label>
                <label style={s.field}>Statut<select style={s.input} value={action.statut} onChange={(event) => updateAction("statut", event.target.value)}><option>À faire</option><option>En cours</option><option>En attente</option><option>Fait</option><option>Reporté</option></select></label>
              </div>
            </div>
          </div>
        </section>

        <section style={s.card}>
          <p style={s.label}>2. Note du contact</p>
          <h2 style={s.h2}>Préparer Insertis et Mon Suivi Social</h2>
          <p style={s.intro}>Cette partie reste ouverte parce qu’elle sert pendant l’entretien. Les textes prêts à copier sont juste en dessous.</p>
          <div style={{ ...s.grid, marginTop: "14px" }}>
            <label style={s.field}>Faits / situation abordée<textarea style={s.textarea} value={intervention.faits} onChange={(event) => updateIntervention("faits", event.target.value)} /></label>
            <label style={s.field}>Parole de la personne<textarea style={s.textarea} value={intervention.parolePersonne} onChange={(event) => updateIntervention("parolePersonne", event.target.value)} /></label>
            <label style={s.field}>Analyse professionnelle<textarea style={s.textarea} value={intervention.analyse} onChange={(event) => updateIntervention("analyse", event.target.value)} /></label>
            <label style={s.field}>Démarches réalisées<textarea style={s.textarea} value={intervention.demarches} onChange={(event) => updateIntervention("demarches", event.target.value)} /></label>
            <label style={s.field}>Vigilance<textarea style={s.textarea} value={intervention.vigilance} onChange={(event) => updateIntervention("vigilance", event.target.value)} /></label>
            <label style={s.field}>Suite prévue<textarea style={s.textarea} value={intervention.suitePrevue} onChange={(event) => updateIntervention("suitePrevue", event.target.value)} /></label>
          </div>

          <details style={{ marginTop: "14px" }}>
            <summary style={s.summary}>Textes prêts à copier<span style={s.summaryHelp}>Insertis, Mon Suivi Social et ajout direct au journal.</span></summary>
            <div style={{ ...s.grid, marginTop: "12px" }}>
              <label style={s.field}>Texte court pour Insertis<textarea style={{ ...s.textarea, minHeight: "170px" }} readOnly value={traceInsertis} /></label>
              <label style={s.field}>Note pour Mon Suivi Social<textarea style={{ ...s.textarea, minHeight: "170px" }} readOnly value={noteMonSuiviSocial} /></label>
            </div>
            <div style={s.actions}>
              <button style={s.mainButton} type="button" onClick={() => copierTexte(traceInsertis, "Texte Insertis")}>Copier pour Insertis</button>
              <button style={s.mainButton} type="button" onClick={() => copierTexte(noteMonSuiviSocial, "Note Mon Suivi Social")}>Copier pour Mon Suivi Social</button>
              <button style={s.button} type="button" onClick={ajouterInterventionAuJournal}>Ajouter au journal + marquer Insertis à faire</button>
            </div>
          </details>
        </section>

        <details style={s.card}>
          <summary style={s.summary}>3. Autonomie / parcours<span style={s.summaryHelp}>Socle, parcours et relecture institutionnelle rangés ensemble.</span></summary>
          <div style={s.scoreBox}>
            <p style={s.info}><strong>Lecture actuelle :</strong> {bilanSocle.phrase}</p>
            <p style={s.info}><strong>Domaines d’appui :</strong> {bilanSocle.pointsAppui.length ? bilanSocle.pointsAppui.join(", ") : "non repérés à ce stade"}</p>
            <p style={s.info}><strong>Domaines ressources :</strong> {bilanSocle.pointsRessource.length ? bilanSocle.pointsRessource.join(", ") : "à préciser"}</p>
          </div>

          <details style={s.cardSoft}>
            <summary style={s.summary}>Socle autonomie — 8 questions validées</summary>
            {QUESTIONS_AUTONOMIE.map((question, index) => (
              <div style={s.questionGrid} key={question.id}>
                <div>
                  <p style={s.label}>{index + 1}. {question.domaine}</p>
                  <p style={s.info}><strong>{question.question}</strong></p>
                  <p style={s.info}>{question.repere}</p>
                </div>
                <div style={s.field}>
                  <span>Niveau repéré</span>
                  <select style={s.input} value={autonomie[question.id]} onChange={(event) => updateAutonomie(question.id, event.target.value)}>
                    {NIVEAUX_AUTONOMIE.map((niveau) => <option key={niveau}>{niveau}</option>)}
                  </select>
                  <span>Réponse / observation courte</span>
                  <textarea style={s.textarea} value={autonomie[`${question.id}Note`]} onChange={(event) => updateAutonomie(`${question.id}Note`, event.target.value)} placeholder="Noter uniquement l’utile." />
                </div>
              </div>
            ))}
          </details>

          <details style={s.cardSoft}>
            <summary style={s.summary}>Parcours autonomie</summary>
            <textarea style={{ ...s.textarea, minHeight: "220px", marginTop: "12px" }} readOnly value={parcoursAutonomie} />
            <div style={s.actions}>
              <button style={s.mainButton} type="button" onClick={() => copierTexte(parcoursAutonomie, "Parcours autonomie")}>Copier parcours autonomie</button>
              <button style={s.button} type="button" onClick={ajouterParcoursAuJournal}>Ajouter au journal</button>
            </div>
          </details>

          <details style={s.cardSoft}>
            <summary style={s.summary}>Relecture institutionnelle Métropole / Insertis</summary>
            <div style={{ ...s.grid, marginTop: "12px" }}>
              {GRILLE_COMPLEMENTAIRE.map((item) => (
                <article key={item.domaine} style={s.scoreBox}>
                  <p style={s.label}>{item.domaine}</p>
                  <p style={s.info}><strong>{item.question}</strong></p>
                </article>
              ))}
            </div>
          </details>

          <details style={s.cardSoft}>
            <summary style={s.summary}>Synthèse autonomie détaillée</summary>
            <div style={{ ...s.grid, marginTop: "12px" }}>
              <label style={s.field}>Synthèse rédigée<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={syntheseAutonomieRedigee} /></label>
              <label style={s.field}>Repères détaillés<textarea style={{ ...s.textarea, minHeight: "220px" }} readOnly value={texteAutonomie} /></label>
            </div>
            <div style={s.actions}>
              <button style={s.mainButton} type="button" onClick={() => copierTexte(syntheseAutonomieRedigee, "Synthèse autonomie")}>Copier synthèse autonomie</button>
              <button style={s.mainButton} type="button" onClick={alimenterAnalyseAvecAutonomie}>Alimenter l’analyse professionnelle</button>
              <button style={s.button} type="button" onClick={ajouterAutonomieAuJournal}>Ajouter synthèse au journal</button>
            </div>
          </details>
        </details>

        <details style={s.card}>
          <summary style={s.summary}>4. Pilotage / synthèse<span style={s.summaryHelp}>Réglages détaillés, justification de priorité et synthèse dossier.</span></summary>
          <div style={s.grid}>
            <label style={s.field}>Priorité retenue<select style={s.input} value={action.priorite} onChange={(event) => updateAction("priorite", event.target.value)}><option>À qualifier</option><option>Priorité 1</option><option>Priorité 2</option><option>Priorité 3</option><option>À reporter</option></select></label>
            <label style={s.field}>Vigilance<select style={s.input} value={action.vigilance} onChange={(event) => updateAction("vigilance", event.target.value)}><option>Faible</option><option>À suivre</option><option>Importante</option><option>Urgente</option></select></label>
            <label style={s.field}>Trace Insertis<select style={s.input} value={action.traceInsertis} onChange={(event) => updateAction("traceInsertis", event.target.value)}><option>À prévoir</option><option>À faire</option><option>Faite</option><option>Pas nécessaire</option></select></label>
          </div>

          <details style={s.cardSoft}>
            <summary style={s.summary}>Évaluation rapide de priorité</summary>
            <div style={s.grid}>
              {[
                ["critereDateLimite", "Date limite proche", "RDV, recours, DTR, justificatif, dette, convocation."],
                ["critereRisqueDroits", "Risque de rupture de droit ou d’aggravation", "RSA, CAF, radiation, dette, expulsion, situation qui se dégrade."],
                ["criterePersonneBloquee", "Personne bloquée sans appui", "Elle attend un retour ou ne peut pas avancer seule."],
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
              <p style={s.info}><strong>Score :</strong> {suggestion.score}/5</p>
              <p style={s.info}><strong>Priorité conseillée :</strong> {suggestion.priorite}</p>
              <p style={s.info}><strong>Vigilance conseillée :</strong> {suggestion.vigilance}</p>
              <p style={s.info}>{suggestion.phrase}</p>
              <button style={s.mainButton} type="button" onClick={appliquerSuggestion}>Appliquer la suggestion</button>
            </div>
          </details>

          <label style={{ ...s.field, marginTop: "12px" }}>Note de suivi<textarea style={s.textarea} value={action.note} onChange={(event) => updateAction("note", event.target.value)} /></label>
          <label style={{ ...s.field, marginTop: "12px" }}>Synthèse dossier<textarea style={{ ...s.textarea, minHeight: "230px" }} readOnly value={synthese} /></label>
          <div style={s.actions}>
            <button style={s.mainButton} type="button" onClick={() => copierTexte(synthese, "Synthèse dossier")}>Copier la synthèse</button>
          </div>
        </details>
      </div>
    </main>
  );
}
