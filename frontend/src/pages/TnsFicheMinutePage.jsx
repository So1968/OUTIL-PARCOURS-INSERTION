import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-tns-fiche-minute-test";

const ficheVide = {
  dateContact: "",
  typeContact: "Rendez-vous présentiel",
  situationTns: "Création d’activité à éclairer",
  sujets: [],
  faits: "",
  parole: "",
  pointsAEclaircir: "",
  actionSuivante: "",
  responsable: "À définir",
  documentAttendu: "",
  echeance: "",
  vigilance: "À suivre",
};

const sujetsTns = [
  "Création d’activité",
  "SIRET / immatriculation",
  "Statut",
  "URSSAF",
  "Impôts",
  "CAF / RSA",
  "Chiffre d’affaires",
  "Factures / devis",
  "Documents manquants",
  "Régularisation",
  "Fermeture / radiation",
];

const situationsTns = [
  "Création d’activité à éclairer",
  "Création en cours",
  "Activité créée et active",
  "Activité créée mais fragile",
  "Situation administrative à régulariser",
  "Activité arrêtée / fermeture à étudier",
  "Situation à qualifier",
];

function getInitialFiche() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...ficheVide, ...JSON.parse(saved) } : ficheVide;
  } catch {
    return ficheVide;
  }
}

function genererSynthese(fiche) {
  return [
    "Fiche minute TNS — trace courte après contact",
    "",
    `Date / contact : ${fiche.dateContact || "à préciser"} — ${fiche.typeContact}`,
    `Situation TNS : ${fiche.situationTns}`,
    fiche.sujets.length ? `Sujets travaillés : ${fiche.sujets.join(", ")}` : "Sujets travaillés : à préciser",
    "",
    "Faits observés :",
    fiche.faits || "À compléter.",
    "",
    "Parole de la personne :",
    fiche.parole || "À compléter.",
    "",
    "Points à éclaircir :",
    fiche.pointsAEclaircir || "À compléter.",
    "",
    "Action suivante :",
    fiche.actionSuivante || "À compléter.",
    "",
    `Responsable : ${fiche.responsable}`,
    `Document attendu : ${fiche.documentAttendu || "à préciser"}`,
    `Échéance : ${fiche.echeance || "à préciser"}`,
    `Vigilance : ${fiche.vigilance}`,
  ].join("\n");
}

export function TnsFicheMinutePage() {
  const [fiche, setFiche] = useState(getInitialFiche);
  const [message, setMessage] = useState("");
  const synthese = useMemo(() => genererSynthese(fiche), [fiche]);

  function update(field, value) {
    setFiche((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function toggleSujet(sujet) {
    setFiche((current) => ({
      ...current,
      sujets: current.sujets.includes(sujet)
        ? current.sujets.filter((item) => item !== sujet)
        : [...current.sujets, sujet],
    }));
    setMessage("");
  }

  function enregistrer() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fiche));
    setMessage("Fiche minute conservée dans ce navigateur pour le test.");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(synthese);
    setMessage("Synthèse copiée.");
  }

  function vider() {
    localStorage.removeItem(STORAGE_KEY);
    setFiche(ficheVide);
    setMessage("Fiche remise à zéro.");
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Prototype test — Appui TNS</p>
          <h1>Fiche minute après contact TNS</h1>
          <p className="page-intro">
            Noter vite ce qu’il faut retenir, produire une trace courte et préparer la suite.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <h2>Que faut-il retenir de ce contact ?</h2>
        <p>
          L’objectif est de distinguer les faits, la parole de la personne, les points à éclaircir et l’action suivante.
        </p>
      </section>

      <section className="page-card">
        <h2>1. Cadre du contact</h2>
        <div className="identity-form-grid">
          <label>
            <span>Date du contact</span>
            <input type="date" value={fiche.dateContact} onChange={(event) => update("dateContact", event.target.value)} />
          </label>
          <label>
            <span>Type de contact</span>
            <select value={fiche.typeContact} onChange={(event) => update("typeContact", event.target.value)}>
              <option>Rendez-vous présentiel</option>
              <option>Appel téléphonique</option>
              <option>Message / SMS / WhatsApp</option>
              <option>Échange partenaire</option>
              <option>Contact informel utile</option>
            </select>
          </label>
          <label>
            <span>Situation TNS</span>
            <select value={fiche.situationTns} onChange={(event) => update("situationTns", event.target.value)}>
              {situationsTns.map((situation) => <option key={situation}>{situation}</option>)}
            </select>
          </label>
          <label>
            <span>Vigilance</span>
            <select value={fiche.vigilance} onChange={(event) => update("vigilance", event.target.value)}>
              <option>Faible</option>
              <option>À suivre</option>
              <option>Importante</option>
              <option>Urgente</option>
            </select>
          </label>
        </div>
      </section>

      <section className="page-card">
        <h2>2. Sujets travaillés</h2>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {sujetsTns.map((sujet) => (
            <label key={sujet} className="checkbox-chip">
              <input type="checkbox" checked={fiche.sujets.includes(sujet)} onChange={() => toggleSujet(sujet)} />
              <span>{sujet}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>3. Lecture professionnelle</h2>
        <div className="page-grid">
          <label className="insertis-summary-field">
            <span>Faits observés</span>
            <textarea rows="5" value={fiche.faits} onChange={(event) => update("faits", event.target.value)} placeholder="Ce qui est objectivable : document apporté, courrier reçu, SIRET existant..." />
          </label>
          <label className="insertis-summary-field">
            <span>Parole de la personne</span>
            <textarea rows="5" value={fiche.parole} onChange={(event) => update("parole", event.target.value)} placeholder="Ce que la personne dit, explique, demande ou ressent." />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Points à éclaircir</span>
          <textarea rows="4" value={fiche.pointsAEclaircir} onChange={(event) => update("pointsAEclaircir", event.target.value)} placeholder="Ce qui reste à vérifier : statut, URSSAF, CAF/RSA, chiffre d’affaires..." />
        </label>
      </section>

      <section className="page-card">
        <h2>4. Action suivante</h2>
        <div className="identity-form-grid">
          <label>
            <span>Responsable</span>
            <select value={fiche.responsable} onChange={(event) => update("responsable", event.target.value)}>
              <option>À définir</option>
              <option>Personne accompagnée</option>
              <option>Référente parcours</option>
              <option>Appui TNS</option>
              <option>Partenaire externe</option>
            </select>
          </label>
          <label>
            <span>Document attendu</span>
            <input value={fiche.documentAttendu} onChange={(event) => update("documentAttendu", event.target.value)} placeholder="Ex. pièce d’identité, SIRET, courrier URSSAF..." />
          </label>
          <label>
            <span>Échéance</span>
            <input type="date" value={fiche.echeance} onChange={(event) => update("echeance", event.target.value)} />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Action suivante</span>
          <textarea rows="4" value={fiche.actionSuivante} onChange={(event) => update("actionSuivante", event.target.value)} placeholder="Qui fait quoi, pour quand, avec quel document ?" />
        </label>
      </section>

      <section className="page-card">
        <h2>5. Synthèse produite</h2>
        <label className="insertis-summary-field">
          <span>Trace courte générée</span>
          <textarea rows="12" value={synthese} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={enregistrer}>Enregistrer la fiche test</button>
          <button className="secondary-button" type="button" onClick={copierSynthese}>Copier la synthèse</button>
          <button className="secondary-button" type="button" onClick={vider}>Remettre à zéro</button>
          {message && <p className="validation-message">{message}</p>}
        </div>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">Retour Appui TNS</Link>
        <Link className="secondary-button" to="/appui-tns/analyse">Diagnostic TNS</Link>
      </div>
    </main>
  );
}
