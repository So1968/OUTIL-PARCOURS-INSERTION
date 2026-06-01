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
  faits: "",
  freins: "",
  ressources: "",
  actionSofia: "",
  actionPersonne: "",
  actionPartenaire: "",
  echeance: "",
};

const champsLecture = [
  {
    id: "droits",
    label: "Droits / RSA / CAF",
    aide: "Situation des droits, declarations, risque de rupture.",
    options: ["A verifier", "Semble a jour", "Demarche en cours", "Blocage", "Risque de rupture"],
  },
  {
    id: "administratif",
    label: "Administratif",
    aide: "Courriers, pieces, comptes en ligne, comprehension des demandes.",
    options: ["A verifier", "Documents disponibles", "Pieces manquantes", "Courrier incompris", "Compte bloque"],
  },
  {
    id: "budget",
    label: "Budget / dettes",
    aide: "Charges, impayes, dettes, urgence financiere.",
    options: ["A verifier", "Pas d'alerte connue", "Fragile", "Dette a traiter", "Urgence"],
  },
  {
    id: "logement",
    label: "Logement",
    aide: "Stabilite, hebergement, impayes, risque de rupture.",
    options: ["A verifier", "Stable", "Fragile", "Impayes", "Urgence logement"],
  },
  {
    id: "sante",
    label: "Sante",
    aide: "Element utile au parcours, sans diagnostic medical.",
    options: ["A verifier", "Pas d'element signale", "Frein signale", "Relais a mobiliser", "Urgence / vigilance"],
  },
  {
    id: "famille",
    label: "Famille / entourage",
    aide: "Charge familiale, aidance, soutien, conflit, isolement.",
    options: ["A verifier", "Soutien present", "Charge importante", "Isolement", "Situation complexe"],
  },
  {
    id: "mobilite",
    label: "Mobilite",
    aide: "Capacite a venir aux rendez-vous et faire les demarches.",
    options: ["A verifier", "Autonome", "Limitee", "Depend d'un tiers", "Frein important"],
  },
  {
    id: "numerique",
    label: "Numerique",
    aide: "Acces aux outils, mails, comptes, scans, mots de passe.",
    options: ["A verifier", "Autonome", "Aide ponctuelle", "Difficulte importante", "Pas d'acces"],
  },
  {
    id: "activite",
    label: "Situation professionnelle / activite",
    aide: "Rubrique incluant l'activite independante si elle existe.",
    options: [
      "A clarifier",
      "Sans activite connue",
      "Projet d'activite",
      "Activite salariee",
      "Activite independante active",
      "Activite independante fragile",
      "Activite arretee / fermeture a etudier",
      "Statut ou declarations a regulariser",
    ],
  },
  {
    id: "autonomie",
    label: "Reperes d'autonomie",
    aide: "Ce que la personne peut faire seule entre deux rendez-vous.",
    options: ["A observer", "Autonomie forte", "Autonomie partielle", "Besoin d'appui regulier", "Besoin d'appui renforce"],
  },
  {
    id: "charge",
    label: "Charge du dossier",
    aide: "Repere de pilotage pour le mi-temps.",
    options: ["A evaluer", "1 - leger", "2 - regulier", "3 - complexe", "4 - lourd / urgent / bloque"],
  },
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

function genererSynthese(lecture) {
  return [
    "Lecture globale de situation",
    "",
    `Priorite du jour : ${lecture.priorite}`,
    `Droits / RSA / CAF : ${lecture.droits}`,
    `Administratif : ${lecture.administratif}`,
    `Budget / dettes : ${lecture.budget}`,
    `Logement : ${lecture.logement}`,
    `Sante : ${lecture.sante}`,
    `Famille / entourage : ${lecture.famille}`,
    `Mobilite : ${lecture.mobilite}`,
    `Numerique : ${lecture.numerique}`,
    `Situation professionnelle / activite : ${lecture.activite}`,
    `Reperes d'autonomie : ${lecture.autonomie}`,
    `Charge du dossier : ${lecture.charge}`,
    "",
    "Faits observes :",
    lecture.faits || "A completer.",
    "",
    "Freins identifies :",
    lecture.freins || "A completer.",
    "",
    "Ressources / relais :",
    lecture.ressources || "A completer.",
    "",
    "Actions prevues :",
    `- Sofia : ${lecture.actionSofia || "A completer."}`,
    `- Personne accompagnee : ${lecture.actionPersonne || "A completer."}`,
    `- Partenaire : ${lecture.actionPartenaire || "A completer."}`,
    `- Echeance : ${lecture.echeance || "A preciser."}`,
  ].join("\n");
}

export function TnsAnalysePage() {
  const [lecture, setLecture] = useState(lectureInitiale);
  const [message, setMessage] = useState("");
  const synthese = useMemo(() => genererSynthese(lecture), [lecture]);
  const repereCharge = useMemo(() => analyserCharge(lecture), [lecture]);

  function update(field, value) {
    setLecture((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(synthese);
    setMessage("Synthese copiee.");
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Accompagnement global</p>
          <h1>Lecture globale de situation</h1>
          <p className="page-intro">
            Une grille courte pour reperer le sujet prioritaire, les freins, les ressources, la charge du dossier et la prochaine action utile.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Objectif V1</p>
        <h2>Comprendre avant d'agir</h2>
        <p>
          La personne est suivie en accompagnement global. L'activite independante reste une rubrique possible de la situation professionnelle, sans devenir le titre principal du dossier.
        </p>
      </section>

      <section className="page-card">
        <h2>Priorite du jour</h2>
        <label className="insertis-summary-field">
          <span>Sujet principal a traiter maintenant</span>
          <textarea
            rows="3"
            value={lecture.priorite}
            onChange={(event) => update("priorite", event.target.value)}
            placeholder="Ex. eviter une rupture de droits, comprendre un courrier, preparer un rendez-vous, clarifier l'activite..."
          />
        </label>
      </section>

      <section className="page-card">
        <h2>Dimensions de la situation</h2>
        <div className="identity-form-grid tns-select-grid">
          {champsLecture.map((champ) => (
            <label key={champ.id}>
              <span>{champ.label}</span>
              <small>{champ.aide}</small>
              <select value={lecture[champ.id]} onChange={(event) => update(champ.id, event.target.value)}>
                {champ.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
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
        <h2>Faits, freins et ressources</h2>
        <div className="page-grid">
          <label className="insertis-summary-field">
            <span>Faits observes</span>
            <textarea rows="5" value={lecture.faits} onChange={(event) => update("faits", event.target.value)} placeholder="Faits datables et objectivables." />
          </label>
          <label className="insertis-summary-field">
            <span>Freins identifies</span>
            <textarea rows="5" value={lecture.freins} onChange={(event) => update("freins", event.target.value)} placeholder="Ce qui bloque le parcours pour le moment." />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Ressources / relais</span>
          <textarea rows="4" value={lecture.ressources} onChange={(event) => update("ressources", event.target.value)} placeholder="Personnes, partenaires, documents, competences ou relais mobilisables." />
        </label>
      </section>

      <section className="page-card">
        <h2>Plan d'action</h2>
        <div className="page-grid">
          <label className="insertis-summary-field">
            <span>Action Sofia</span>
            <textarea rows="4" value={lecture.actionSofia} onChange={(event) => update("actionSofia", event.target.value)} placeholder="Ce que je fais avant la prochaine etape." />
          </label>
          <label className="insertis-summary-field">
            <span>Action personne accompagnee</span>
            <textarea rows="4" value={lecture.actionPersonne} onChange={(event) => update("actionPersonne", event.target.value)} placeholder="Ce que la personne doit faire ou apporter." />
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
        <h2>Synthese pour trace ou Insertis</h2>
        <label className="insertis-summary-field">
          <span>Synthese generee</span>
          <textarea rows="16" value={synthese} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={copierSynthese}>Copier la synthese</button>
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
