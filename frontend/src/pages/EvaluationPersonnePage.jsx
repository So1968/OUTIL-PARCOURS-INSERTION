import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

const STORAGE_ROWS = "artag-pilotage-actions-rows-v1";
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
  return valeur(row, ["Numéro Insertis", "Numero Insertis", "N° Insertis", "N° dossier", "Numero dossier"]) || row.__id || `dossier-${index}`;
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

const QUESTIONS_AUTONOMIE = [
  {
    id: "demarches",
    domaine: "Papiers et droits",
    question: "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?",
  },
  {
    id: "organisation",
    domaine: "Organisation",
    question: "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?",
  },
  {
    id: "budget",
    domaine: "Budget",
    question: "Pour gérer l’argent au quotidien, vous vous en sortez comment ?",
  },
  {
    id: "sante",
    domaine: "Santé",
    question: "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?",
  },
  {
    id: "mobilite",
    domaine: "Déplacements",
    question: "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?",
  },
  {
    id: "ecritNumerique",
    domaine: "Courriers et téléphone",
    question: "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?",
  },
  {
    id: "famille",
    domaine: "Famille et disponibilité",
    question: "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?",
  },
  {
    id: "projet",
    domaine: "Projet personnel",
    question: "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?",
  },
];

const REPONSES_USAGER = [
  { label: "Je me débrouille seul(e)", niveau: "Autonome" },
  { label: "J’y arrive avec un petit appui", niveau: "Autonomie partielle" },
  { label: "J’ai besoin d’aide régulièrement", niveau: "Besoin d'appui régulier" },
  { label: "C’est bloquant pour moi", niveau: "Besoin d'appui renforcé" },
];

function autonomieVide() {
  return QUESTIONS_AUTONOMIE.reduce((acc, question) => {
    acc[question.id] = "Non évalué";
    acc[`${question.id}Note`] = "";
    return acc;
  }, {});
}

function resumeAutonomie(autonomie) {
  const renseignes = QUESTIONS_AUTONOMIE.filter((question) => autonomie[question.id] && autonomie[question.id] !== "Non évalué");
  const appuis = renseignes.filter((question) => ["Besoin d'appui régulier", "Besoin d'appui renforcé"].includes(autonomie[question.id]));
  const ressources = renseignes.filter((question) => ["Autonome", "Autonomie partielle"].includes(autonomie[question.id]));

  if (!renseignes.length) return "L’évaluation n’est pas encore commencée.";
  if (appuis.length >= 3) return "Plusieurs domaines semblent nécessiter un appui. Cela permet de prioriser ce qui est le plus difficile aujourd’hui.";
  if (appuis.length >= 1) return "Certains domaines peuvent être faits seul(e), d’autres nécessitent un appui.";
  if (ressources.length >= 4) return "Plusieurs domaines sont repérés comme ressources. On peut éviter de faire à la place quand ce n’est pas nécessaire.";
  return "L’évaluation est en cours. Elle sert à mieux comprendre ce qui aide ou ce qui bloque.";
}

const s = {
  page: { minHeight: "100vh", background: "#f4efe6", color: "#29251f", padding: "24px 18px 52px", fontFamily: "Arial, system-ui, sans-serif" },
  wrap: { maxWidth: "980px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" },
  card: { background: "#fffaf1", border: "1px solid #d8ccb8", borderRadius: "18px", padding: "18px", marginBottom: "14px", boxShadow: "0 8px 20px rgba(83,69,47,0.08)" },
  question: { background: "#fffdf7", border: "1px solid #d8ccb8", borderRadius: "16px", padding: "16px", marginBottom: "12px" },
  label: { margin: "0 0 6px", color: "#6f7b55", fontSize: "12px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" },
  h1: { margin: 0, color: "#2f3a2d", fontSize: "30px", lineHeight: 1.1 },
  h2: { margin: "0 0 8px", color: "#2f3a2d", fontSize: "21px" },
  intro: { margin: "7px 0 0", color: "#5a5145", fontSize: "16px", lineHeight: 1.45 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px", marginTop: "12px" },
  button: { border: "1px solid #aeb999", borderRadius: "14px", padding: "12px", background: "#f2eadc", color: "#2f3a2d", fontWeight: 900, cursor: "pointer", textAlign: "left" },
  buttonActive: { background: "#6f7b55", color: "white", border: "1px solid #6f7b55" },
  link: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "34px", padding: "7px 12px", borderRadius: "999px", background: "#2f3a2d", color: "white", textDecoration: "none", fontWeight: 900, border: "1px solid #2f3a2d" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #c7b9a2", borderRadius: "12px", padding: "10px", marginTop: "10px", fontSize: "15px", lineHeight: 1.35, background: "white", color: "#29251f", minHeight: "76px" },
  message: { color: "#4f653f", fontWeight: 900 },
  small: { color: "#6d6253", fontSize: "14px", lineHeight: 1.4 },
};

export function EvaluationPersonnePage() {
  const { dossierId = "" } = useParams();
  const idCourant = decodeURIComponent(dossierId);
  const [rows] = useState(() => lireJson(STORAGE_ROWS, []));
  const [autonomies, setAutonomies] = useState(() => lireJson(STORAGE_AUTONOMIE, {}));
  const [message, setMessage] = useState("");

  const index = rows.findIndex((row, i) => idDossier(row, i) === idCourant);
  const row = index >= 0 ? rows[index] : null;
  const autonomie = row ? { ...autonomieVide(), ...(autonomies[idCourant] || {}) } : autonomieVide();
  const renseignes = useMemo(() => QUESTIONS_AUTONOMIE.filter((question) => autonomie[question.id] && autonomie[question.id] !== "Non évalué").length, [autonomie]);

  function updateAutonomie(champ, v) {
    const nextAutonomie = { ...autonomie, [champ]: v };
    const next = { ...autonomies, [idCourant]: nextAutonomie };
    setAutonomies(next);
    localStorage.setItem(STORAGE_AUTONOMIE, JSON.stringify(next));
    setMessage("Réponse enregistrée.");
  }

  if (!idCourant) {
    return (
      <main style={s.page}>
        <div style={s.wrap}>
          <section style={s.card}>
            <p style={s.label}>Page personne</p>
            <h1 style={s.h1}>Choisir une personne à évaluer</h1>
            <p style={s.intro}>Cette page sert à faire l’évaluation avec la personne, sans afficher les notes professionnelles.</p>
          </section>
          {rows.length === 0 ? (
            <section style={s.card}><p style={s.intro}>Aucune file active importée pour le moment. Retourne au pilotage pour importer un CSV ou créer un dossier manuel.</p><Link style={s.link} to="/pilotage-actions">Retour pilotage</Link></section>
          ) : rows.map((item, i) => {
            const id = idDossier(item, i);
            return (
              <section key={id} style={s.card}>
                <h2 style={s.h2}>{affichageDossier(item, rows)}</h2>
                <p style={s.small}>{valeur(item, ["Ville", "Commune"]) || "Ville à préciser"} — {item.CLI || "CLI à préciser"}</p>
                <Link style={s.link} to={`/evaluation-personne/${encodeURIComponent(id)}`}>Ouvrir l’évaluation</Link>
              </section>
            );
          })}
        </div>
      </main>
    );
  }

  if (!row) {
    return (
      <main style={s.page}>
        <div style={s.wrap}>
          <section style={s.card}>
            <p style={s.label}>Page personne</p>
            <h1 style={s.h1}>Dossier introuvable</h1>
            <p style={s.intro}>Retourne au pilotage et réimporte la liste Insertis si besoin.</p>
            <Link style={s.link} to="/pilotage-actions">Retour pilotage</Link>
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
            <p style={s.label}>Page personne / auto-évaluation</p>
            <h1 style={s.h1}>Où j’en suis aujourd’hui ?</h1>
            <p style={s.intro}>Ces questions servent à repérer ce que vous faites seul(e), ce qui demande un appui, et ce qui bloque en ce moment.</p>
          </div>
          <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(idCourant)}`}>Vue pro</Link>
        </header>

        <section style={s.card}>
          <p style={s.label}>{affichageDossier(row, rows)}</p>
          <h2 style={s.h2}>{renseignes}/8 repère(s) renseigné(s)</h2>
          <p style={s.intro}>{resumeAutonomie(autonomie)}</p>
          {message && <p style={s.message}>{message}</p>}
        </section>

        {QUESTIONS_AUTONOMIE.map((question, index) => (
          <section key={question.id} style={s.question}>
            <p style={s.label}>{index + 1}. {question.domaine}</p>
            <h2 style={s.h2}>{question.question}</h2>
            <div style={s.grid}>
              {REPONSES_USAGER.map((reponse) => (
                <button
                  key={reponse.niveau}
                  type="button"
                  style={{ ...s.button, ...(autonomie[question.id] === reponse.niveau ? s.buttonActive : {}) }}
                  onClick={() => updateAutonomie(question.id, reponse.niveau)}
                >
                  {reponse.label}
                </button>
              ))}
            </div>
            <textarea
              style={s.textarea}
              value={autonomie[`${question.id}Note`] || ""}
              onChange={(event) => updateAutonomie(`${question.id}Note`, event.target.value)}
              placeholder="Ce que la personne souhaite préciser, avec ses mots..."
            />
          </section>
        ))}

        <section style={s.card}>
          <p style={s.label}>Fin de l’évaluation</p>
          <p style={s.intro}>Les réponses sont enregistrées dans le dossier et pourront être reprises dans la vue professionnelle pour construire la synthèse.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
            <Link style={s.link} to={`/pilotage-actions/dossier/${encodeURIComponent(idCourant)}`}>Revenir à la vue pro</Link>
            <Link style={{ ...s.link, background: "#6f7b55", borderColor: "#6f7b55" }} to="/evaluation-personne">Choisir une autre personne</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
