import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const cadreInitial = {
  rsa: "A verifier",
  parcours: "A verifier",
  activite: "A verifier",
  besoinPrincipal: "A verifier",
  elementsDepart: "",
  vigilance: "",
};

const options = {
  rsa: ["A verifier", "Beneficiaire RSA", "Pas RSA", "RSA interrompu / a verifier"],
  parcours: ["A verifier", "Parcours socioprofessionnel", "Parcours social", "Autre parcours / inconnu"],
  activite: [
    "A verifier",
    "Activite independante exercee",
    "Projet de creation d'activite",
    "Activite arretee / radiation a clarifier",
    "Pas d'activite independante ni projet",
  ],
  besoinPrincipal: [
    "A verifier",
    "Principalement lie a l'activite",
    "Mixte : social et activite",
    "Principalement social / hors activite",
    "Urgence sociale dominante",
  ],
};

function estDansCadre(cadre) {
  return (
    cadre.rsa === "Beneficiaire RSA" &&
    cadre.parcours === "Parcours socioprofessionnel" &&
    ["Activite independante exercee", "Projet de creation d'activite"].includes(cadre.activite) &&
    cadre.besoinPrincipal === "Principalement lie a l'activite"
  );
}

function estAClarifier(cadre) {
  return [cadre.rsa, cadre.parcours, cadre.activite, cadre.besoinPrincipal].some((valeur) => valeur === "A verifier" || valeur === "");
}

function verdictCadre(cadre) {
  if (estDansCadre(cadre)) {
    return {
      titre: "Dans le cadre d'orientation",
      texte: "La situation correspond aux criteres indiques : RSA, parcours socioprofessionnel, activite independante ou projet de creation, besoin principalement lie a l'activite.",
    };
  }

  if (estAClarifier(cadre)) {
    return {
      titre: "Cadre a verifier avant demarrage",
      texte: "Il manque au moins un element pour confirmer l'orientation. Demander un court relais ou quelques elements de contexte avant de qualifier la prise en charge.",
    };
  }

  return {
    titre: "Situation a discuter au cas par cas",
    texte: "La situation ne correspond pas completement au cadre annonce ou presente un besoin dominant hors activite. Prevoir un echange avant integration dans la file active.",
  };
}

function genererPhraseOrientation(cadre, verdict) {
  const elements = cadre.elementsDepart.trim();
  const vigilance = cadre.vigilance.trim();
  const details = elements ? ` Elements de depart : ${elements}.` : "";
  const pointVigilance = vigilance ? ` Point de vigilance : ${vigilance}.` : "";

  return `Orientation examinee : ${cadre.rsa}, ${cadre.parcours}, ${cadre.activite}, besoin ${cadre.besoinPrincipal.toLowerCase()}. Conclusion : ${verdict.titre.toLowerCase()}.${details}${pointVigilance}`;
}

export function CadreOrientationPage() {
  const [cadre, setCadre] = useState(cadreInitial);
  const [message, setMessage] = useState("");
  const verdict = useMemo(() => verdictCadre(cadre), [cadre]);
  const phrase = useMemo(() => genererPhraseOrientation(cadre, verdict), [cadre, verdict]);

  function update(champ, valeur) {
    setCadre((current) => ({ ...current, [champ]: valeur }));
    setMessage("");
  }

  function copierPhrase() {
    navigator.clipboard.writeText(phrase);
    setMessage("Phrase d'orientation copiee.");
  }

  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Cadre d'orientation</p>
          <h1>Accompagnement socioprofessionnel — activite independante</h1>
          <p className="page-intro">
            Verifier rapidement si une orientation entre dans le cadre : RSA, parcours socioprofessionnel, activite independante ou projet de creation, besoin principalement lie a l'activite.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Critere central</p>
        <h2>{verdict.titre}</h2>
        <p>{verdict.texte}</p>
      </section>

      <section className="page-card">
        <h2>1. Verifier les criteres</h2>
        <div className="identity-form-grid tns-select-grid">
          <label>
            <span>RSA</span>
            <select value={cadre.rsa} onChange={(event) => update("rsa", event.target.value)}>
              {options.rsa.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Parcours</span>
            <select value={cadre.parcours} onChange={(event) => update("parcours", event.target.value)}>
              {options.parcours.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Activite / projet</span>
            <select value={cadre.activite} onChange={(event) => update("activite", event.target.value)}>
              {options.activite.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Besoin principal</span>
            <select value={cadre.besoinPrincipal} onChange={(event) => update("besoinPrincipal", event.target.value)}>
              {options.besoinPrincipal.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="page-card">
        <h2>2. Elements utiles au depart</h2>
        <label className="insertis-summary-field">
          <span>Relais attendu / contexte transmis</span>
          <textarea rows="4" value={cadre.elementsDepart} onChange={(event) => update("elementsDepart", event.target.value)} placeholder="Situation actuelle, motif de l'orientation, demarches deja engagees, attentes prioritaires..." />
        </label>
        <label className="insertis-summary-field">
          <span>Point de vigilance eventuel</span>
          <textarea rows="3" value={cadre.vigilance} onChange={(event) => update("vigilance", event.target.value)} placeholder="Situation limite, urgence sociale, information manquante, besoin de validation cas par cas..." />
        </label>
      </section>

      <section className="page-card">
        <h2>3. Phrase courte de cadrage</h2>
        <p className="section-help">
          Cette phrase sert a garder une trace de l'orientation. Elle n'est pas un releve complet de situation.
        </p>
        <label className="insertis-summary-field">
          <span>Phrase generee</span>
          <textarea rows="5" value={phrase} readOnly />
        </label>
        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={copierPhrase}>Copier la phrase</button>
          {message && <p className="validation-message">{message}</p>}
        </div>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/accompagnement-global">Retour accompagnement global</Link>
        <Link className="secondary-button" to="/accompagnement-global/fiche-minute">Fiche minute</Link>
        <Link className="secondary-button" to="/accompagnement-global/lecture-globale">Lecture globale</Link>
      </div>
    </main>
  );
}
