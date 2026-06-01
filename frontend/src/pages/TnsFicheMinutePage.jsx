import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-accompagnement-global-fiche-minute-test";

const ficheVide = {
  dateContact: "",
  typeContact: "Rendez-vous presentiel",
  situationActivite: "Situation professionnelle a clarifier",
  sujets: [],
  faits: "",
  parole: "",
  pointsAEclaircir: "",
  actionSuivante: "",
  responsable: "A definir",
  documentAttendu: "",
  echeance: "",
  vigilance: "A suivre",
};

const sujetsRendezVous = [
  "Droits RSA / CAF",
  "Situation administrative",
  "Budget / dettes",
  "Logement",
  "Sante",
  "Famille",
  "Mobilite",
  "Numerique",
  "Documents manquants",
  "Rendez-vous / orientation",
  "Situation professionnelle",
  "Activite independante",
];

const situationsActivite = [
  "Situation professionnelle a clarifier",
  "Sans activite declaree",
  "Projet d'activite",
  "Activite salariee",
  "Activite independante active",
  "Activite independante fragile",
  "Activite arretee / fermeture a etudier",
  "Situation administrative a regulariser",
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
    "Fiche minute — accompagnement global",
    "",
    `Date / contact : ${fiche.dateContact || "a preciser"} — ${fiche.typeContact}`,
    `Situation professionnelle / activite : ${fiche.situationActivite}`,
    fiche.sujets.length ? `Sujets travailles : ${fiche.sujets.join(", ")}` : "Sujets travailles : a preciser",
    "",
    "Faits observes :",
    fiche.faits || "A completer.",
    "",
    "Parole de la personne :",
    fiche.parole || "A completer.",
    "",
    "Points a eclaircir :",
    fiche.pointsAEclaircir || "A completer.",
    "",
    "Action suivante :",
    fiche.actionSuivante || "A completer.",
    "",
    `Responsable : ${fiche.responsable}`,
    `Document attendu : ${fiche.documentAttendu || "a preciser"}`,
    `Echeance : ${fiche.echeance || "a preciser"}`,
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
    setMessage("Fiche conservee dans ce navigateur pour le test.");
  }

  function copierSynthese() {
    navigator.clipboard.writeText(synthese);
    setMessage("Synthese copiee.");
  }

  function vider() {
    localStorage.removeItem(STORAGE_KEY);
    setFiche(ficheVide);
    setMessage("Fiche remise a zero.");
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Prototype test — accompagnement global</p>
          <h1>Fiche minute apres contact</h1>
          <p className="page-intro">
            Noter vite ce qu'il faut retenir, produire une trace courte et preparer la suite.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <h2>Que faut-il retenir de ce contact ?</h2>
        <p>
          L'objectif est de distinguer les faits, la parole de la personne, les points a eclaircir et l'action suivante.
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
              <option>Rendez-vous presentiel</option>
              <option>Appel telephonique</option>
              <option>Message / SMS / WhatsApp</option>
              <option>Echange partenaire</option>
              <option>Contact informel utile</option>
            </select>
          </label>
          <label>
            <span>Situation professionnelle / activite</span>
            <select value={fiche.situationActivite} onChange={(event) => update("situationActivite", event.target.value)}>
              {situationsActivite.map((situation) => <option key={situation}>{situation}</option>)}
            </select>
          </label>
          <label>
            <span>Vigilance</span>
            <select value={fiche.vigilance} onChange={(event) => update("vigilance", event.target.value)}>
              <option>Faible</option>
              <option>A suivre</option>
              <option>Importante</option>
              <option>Urgente</option>
            </select>
          </label>
        </div>
      </section>

      <section className="page-card">
        <h2>2. Sujets travailles</h2>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {sujetsRendezVous.map((sujet) => (
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
            <span>Faits observes</span>
            <textarea rows="5" value={fiche.faits} onChange={(event) => update("faits", event.target.value)} placeholder="Ce qui est objectivable : document apporte, courrier recu, demarche realisee..." />
          </label>
          <label className="insertis-summary-field">
            <span>Parole de la personne</span>
            <textarea rows="5" value={fiche.parole} onChange={(event) => update("parole", event.target.value)} placeholder="Ce que la personne dit, explique, demande ou ressent." />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Points a eclaircir</span>
          <textarea rows="4" value={fiche.pointsAEclaircir} onChange={(event) => update("pointsAEclaircir", event.target.value)} placeholder="Ce qui reste a verifier : droits, documents, rendez-vous, situation professionnelle..." />
        </label>
      </section>

      <section className="page-card">
        <h2>4. Action suivante</h2>
        <div className="identity-form-grid">
          <label>
            <span>Responsable</span>
            <select value={fiche.responsable} onChange={(event) => update("responsable", event.target.value)}>
              <option>A definir</option>
              <option>Personne accompagnee</option>
              <option>Referente parcours</option>
              <option>Partenaire externe</option>
            </select>
          </label>
          <label>
            <span>Document attendu</span>
            <input value={fiche.documentAttendu} onChange={(event) => update("documentAttendu", event.target.value)} placeholder="Ex. piece d'identite, courrier CAF, justificatif..." />
          </label>
          <label>
            <span>Echeance</span>
            <input type="date" value={fiche.echeance} onChange={(event) => update("echeance", event.target.value)} />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Action suivante</span>
          <textarea rows="4" value={fiche.actionSuivante} onChange={(event) => update("actionSuivante", event.target.value)} placeholder="Qui fait quoi, pour quand, avec quel document ?" />
        </label>
      </section>

      <section className="page-card">
        <h2>5. Synthese produite</h2>
        <label className="insertis-summary-field">
          <span>Trace courte generee</span>
          <textarea rows="12" value={synthese} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={enregistrer}>Enregistrer la fiche test</button>
          <button className="secondary-button" type="button" onClick={copierSynthese}>Copier la synthese</button>
          <button className="secondary-button" type="button" onClick={vider}>Remettre a zero</button>
          {message && <p className="validation-message">{message}</p>}
        </div>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/accompagnement-global">Retour accompagnement global</Link>
        <Link className="secondary-button" to="/accompagnement-global/lecture-globale">Lecture globale</Link>
      </div>
    </main>
  );
}
