import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const lectureInitiale = {
  priorite: "A clarifier",
  droits: "A verifier",
  administratif: "A verifier",
  budget: "A verifier",
  logement: "A verifier",
  sante: "A verifier",
  famille: "A verifier",
  mobilite: "A verifier",
  numerique: "A verifier",
  activite: "A clarifier",
  autonomie: "A observer",
  charge: "A evaluer",
  actionSofia: "",
  actionPersonne: "",
  actionPartenaire: "",
  echeance: "",
};

const champsLecture = [
  { id: "droits", label: "Droits / RSA / CAF", aide: "Situation des droits, declarations, risque de rupture.", options: ["A verifier", "Semble a jour", "Demarche en cours", "Blocage", "Risque de rupture"] },
  { id: "administratif", label: "Administratif", aide: "Courriers, pieces, comptes en ligne, comprehension des demandes.", options: ["A verifier", "Documents disponibles", "Pieces manquantes", "Courrier incompris", "Compte bloque"] },
  { id: "budget", label: "Budget / dettes", aide: "Charges, impayes, dettes, urgence financiere.", options: ["A verifier", "Pas d'alerte connue", "Fragile", "Dette a traiter", "Urgence"] },
  { id: "logement", label: "Logement", aide: "Stabilite, hebergement, impayes, risque de rupture.", options: ["A verifier", "Stable", "Fragile", "Impayes", "Urgence logement"] },
  { id: "sante", label: "Sante", aide: "Element utile au parcours, sans diagnostic medical.", options: ["A verifier", "Pas d'element signale", "Frein signale", "Relais a mobiliser", "Urgence / vigilance"] },
  { id: "famille", label: "Famille / entourage", aide: "Charge familiale, aidance, soutien, conflit, isolement.", options: ["A verifier", "Soutien present", "Charge importante", "Isolement", "Situation complexe"] },
  { id: "mobilite", label: "Mobilite", aide: "Capacite a venir aux rendez-vous et faire les demarches.", options: ["A verifier", "Autonome", "Limitee", "Depend d'un tiers", "Frein important"] },
  { id: "numerique", label: "Numerique", aide: "Acces aux outils, mails, comptes, scans, mots de passe.", options: ["A verifier", "Autonome", "Aide ponctuelle", "Difficulte importante", "Pas d'acces"] },
  {
    id: "activite",
    label: "Situation professionnelle / activite",
    aide: "Rubrique incluant l'activite independante si elle existe.",
    options: ["A clarifier", "Sans activite connue", "Projet d'activite", "Activite salariee", "Activite independante active", "Activite independante fragile", "Activite arretee / fermeture a etudier", "Statut ou declarations a regulariser"],
  },
  { id: "autonomie", label: "Reperes d'autonomie", aide: "Ce que la personne peut faire seule entre deux rendez-vous.", options: ["A observer", "Autonomie forte", "Autonomie partielle", "Besoin d'appui regulier", "Besoin d'appui renforce"] },
  { id: "charge", label: "Charge du dossier", aide: "Repere de pilotage pour le mi-temps.", options: ["A evaluer", "1 - leger", "2 - regulier", "3 - complexe", "4 - lourd / urgent / bloque"] },
];

function analyserCharge(lecture) {
  const valeurs = Object.values(lecture);
  const signauxForts = ["Urgence", "Urgence logement", "Urgence / vigilance", "Situation complexe", "Risque de rupture", "4 - lourd / urgent / bloque"];
  const signauxComplexes = ["Blocage", "Dette a traiter", "Fragile", "Frein important", "Difficulte importante", "Besoin d'appui renforce", "3 - complexe"];

  if (valeurs.some((valeur) => signauxForts.includes(valeur))) {
    return "Dossier a traiter en priorite : vigilance forte ou risque de rupture.";
  }

  if (valeurs.some((valeur) => signauxComplexes.includes(valeur))) {
    return "Dossier complexe : prevoir une prochaine action claire et un suivi rapproche.";
  }

  if (lecture.charge === "1 - leger") {
    return "Dossier leger : garder une trace courte et verifier la prochaine etape.";
  }

  return "Lecture a stabiliser : identifier le sujet prioritaire et la prochaine action utile.";
}

function nettoyer(texte) {
  return String(texte || "").trim().replace(/\s+/g, " ");
}

function genererPhraseInsertis(lecture) {
  const priorite = nettoyer(lecture.priorite);
  const actionSofia = nettoyer(lecture.actionSofia);
  const actionPersonne = nettoyer(lecture.actionPersonne);
  const actionPartenaire = nettoyer(lecture.actionPartenaire);
  const echeance = lecture.echeance ? ` avant le ${lecture.echeance}` : "";
  const activite = lecture.activite !== "A clarifier" ? `, situation professionnelle/activite : ${lecture.activite.toLowerCase()}` : "";
  const charge = lecture.charge !== "A evaluer" ? `, charge reperee : ${lecture.charge.toLowerCase()}` : "";

  const action = actionSofia || actionPersonne || actionPartenaire;

  if (!priorite || priorite === "A clarifier") {
    return `Rendez-vous d'accompagnement global : situation abordee a preciser${activite}${charge}; prochaine action a definir.`;
  }

  if (!action) {
    return `Rendez-vous d'accompagnement global : point sur ${priorite}${activite}${charge}; prochaine action a definir.`;
  }

  return `Rendez-vous d'accompagnement global : point sur ${priorite}${activite}${charge}; prochaine action : ${action}${echeance}.`;
}

export function TnsAnalysePage() {
  const [lecture, setLecture] = useState(lectureInitiale);
  const [message, setMessage] = useState("");
  const phraseInsertis = useMemo(() => genererPhraseInsertis(lecture), [lecture]);
  const repereCharge = useMemo(() => analyserCharge(lecture), [lecture]);

  function update(field, value) {
    setLecture((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function copierPhrase() {
    navigator.clipboard.writeText(phraseInsertis);
    setMessage("Phrase Insertis copiee.");
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Accompagnement global</p>
          <h1>Lecture globale de situation</h1>
          <p className="page-intro">
            Une grille courte pour reperer le sujet prioritaire, la charge du dossier et une phrase simple a copier dans Insertis.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Objectif V1</p>
        <h2>Une phrase utile, pas un releve de situation</h2>
        <p>
          Insertis doit recevoir une trace breve de l'action realisee et de la suite prevue. Les details restent dans l'outil de suivi.
        </p>
      </section>

      <section className="page-card">
        <h2>Priorite du rendez-vous</h2>
        <label className="insertis-summary-field">
          <span>Sujet principal traite</span>
          <textarea rows="3" value={lecture.priorite} onChange={(event) => update("priorite", event.target.value)} placeholder="Ex. rupture de droits, courrier CAF, documents manquants, prochain rendez-vous, clarification activite..." />
        </label>
      </section>

      <section className="page-card">
        <h2>Reperes rapides</h2>
        <div className="identity-form-grid tns-select-grid">
          {champsLecture.map((champ) => (
            <label key={champ.id}>
              <span>{champ.label}</span>
              <small>{champ.aide}</small>
              <select value={lecture[champ.id]} onChange={(event) => update(champ.id, event.target.value)}>
                {champ.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Repere automatique</p>
        <h2>{repereCharge}</h2>
      </section>

      <section className="page-card">
        <h2>Prochaine action</h2>
        <div className="page-grid">
          <label className="insertis-summary-field">
            <span>Action Sofia</span>
            <textarea rows="4" value={lecture.actionSofia} onChange={(event) => update("actionSofia", event.target.value)} placeholder="Ex. verifier le courrier CAF, appeler partenaire, preparer orientation..." />
          </label>
          <label className="insertis-summary-field">
            <span>Action personne accompagnee</span>
            <textarea rows="4" value={lecture.actionPersonne} onChange={(event) => update("actionPersonne", event.target.value)} placeholder="Ex. apporter justificatif, revenir avec document, rappeler organisme..." />
          </label>
        </div>
        <div className="identity-form-grid">
          <label>
            <span>Action partenaire</span>
            <input value={lecture.actionPartenaire} onChange={(event) => update("actionPartenaire", event.target.value)} placeholder="Partenaire a contacter si besoin" />
          </label>
          <label>
            <span>Echeance</span>
            <input type="date" value={lecture.echeance} onChange={(event) => update("echeance", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="page-card">
        <h2>Phrase Insertis</h2>
        <p className="section-help">
          Phrase courte a copier. Elle dit ce qui a ete fait et la suite, sans exposer tout le dossier.
        </p>
        <label className="insertis-summary-field">
          <span>Phrase generee</span>
          <textarea rows="4" value={phraseInsertis} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={copierPhrase}>Copier la phrase Insertis</button>
          {message && <p className="validation-message">{message}</p>}
        </div>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/accompagnement-global">Retour accompagnement global</Link>
        <Link className="secondary-button" to="/accompagnement-global/fiche-minute">Fiche minute</Link>
      </div>
    </main>
  );
}
