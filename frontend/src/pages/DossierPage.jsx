import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-dossier-parcours-brouillon";

const statutsParcours = [
  "À créer",
  "Dossier ouvert",
  "Socle autonomie à compléter",
  "Parcours en cours",
  "Appui TNS à évaluer",
  "Appui TNS en cours",
  "En attente d’élément",
  "En veille",
  "À réorienter",
  "Clôturé",
];

const referentes = [
  "Aurore",
  "Gaëlle",
  "Héloïse",
  "Mylène",
  "Shana",
  "Référente à préciser",
];

const initialDossier = {
  numeroInsertis: "",
  numeroArtag: "",
  nom: "",
  prenom: "",
  statut: "Dossier ouvert",
  referente: "Référente à préciser",
  dateOuverture: "",
  derniereMiseAJour: "",
};

function getInitialDossier() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialDossier, ...JSON.parse(saved) } : initialDossier;
  } catch {
    return initialDossier;
  }
}

function BlocRepliable({ title, children, defaultOpen = true }) {
  return (
    <details className="page-card collapsible-block" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <span className="collapse-indicator">▾</span>
      </summary>
      <div className="collapsible-content">
        {children}
      </div>
    </details>
  );
}

export function DossierPage() {
  const [dossier, setDossier] = useState(getInitialDossier);
  const [messageValidation, setMessageValidation] = useState("");

  const dateDuJour = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR");
  }, []);

  function updateDossier(field, value) {
    setDossier((current) => ({
      ...current,
      [field]: value,
    }));
    setMessageValidation("");
  }

  function validerParcours() {
    const dossierValide = {
      ...dossier,
      derniereMiseAJour: dateDuJour,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dossierValide));
    setDossier(dossierValide);
    setMessageValidation("Parcours validé et conservé dans ce navigateur.");
  }

  return (
    <main className="page-shell dossier-page">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Dossier parcours</h1>
          <p className="page-intro">
            Vue de continuité interne — ne remplace pas Insertis.
          </p>
        </div>
      </header>

      <BlocRepliable title="Identité du dossier">
        <div className="identity-form-grid">
          <label>
            <span>N° Insertis</span>
            <input
              type="text"
              placeholder="Ex. INS-..."
              value={dossier.numeroInsertis}
              onChange={(event) => updateDossier("numeroInsertis", event.target.value)}
            />
          </label>

          <label>
            <span>N° ARTAG</span>
            <input
              type="text"
              placeholder="Ex. ARTAG-..."
              value={dossier.numeroArtag}
              onChange={(event) => updateDossier("numeroArtag", event.target.value)}
            />
          </label>

          <label>
            <span>Nom</span>
            <input
              type="text"
              placeholder="Nom de famille"
              value={dossier.nom}
              onChange={(event) => updateDossier("nom", event.target.value)}
            />
          </label>

          <label>
            <span>Prénom</span>
            <input
              type="text"
              placeholder="Prénom"
              value={dossier.prenom}
              onChange={(event) => updateDossier("prenom", event.target.value)}
            />
          </label>

          <label>
            <span>Statut du parcours</span>
            <select
              value={dossier.statut}
              onChange={(event) => updateDossier("statut", event.target.value)}
            >
              {statutsParcours.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Référente</span>
            <select
              value={dossier.referente}
              onChange={(event) => updateDossier("referente", event.target.value)}
            >
              {referentes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date d’ouverture</span>
            <input
              type="date"
              value={dossier.dateOuverture}
              onChange={(event) => updateDossier("dateOuverture", event.target.value)}
            />
          </label>

          <label>
            <span>Dernière mise à jour</span>
            <input
              type="text"
              value={dossier.derniereMiseAJour || "Non validé"}
              readOnly
            />
          </label>
        </div>

        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={validerParcours}>
            Valider le parcours
          </button>

          {messageValidation && (
            <p className="validation-message">{messageValidation}</p>
          )}
        </div>
      </BlocRepliable>

      <BlocRepliable title="Chemin de parcours">
        <div className="parcours-track">
          <span className="track-step active">Accueil</span>
          <span className="track-step active">Dossier ouvert</span>
          <span className="track-step">Socle autonomie</span>
          <span className="track-step">Modules utiles</span>
          <span className="track-step">Synthèse</span>
        </div>
      </BlocRepliable>

      <section className="dossier-layout">
        <div className="dossier-main">
          <BlocRepliable title="Dossier partagé">
            <p className="section-help">
              Éléments utiles à la continuité du suivi. Les notes sensibles ne sont pas affichées ici.
            </p>

            <div className="pilotage-list">
              <p><strong>Socle autonomie :</strong> à compléter</p>
              <p><strong>Synthèse courte :</strong> à rédiger</p>
              <p><strong>Note de continuité :</strong> à vérifier</p>
              <p><strong>Modules ouverts :</strong> aucun module ouvert à ce stade</p>
            </div>

            <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
              Commencer le socle autonomie
            </Link>
          </BlocRepliable>

          <BlocRepliable title="Prochaines étapes utiles">
            <div className="pilotage-list">
              <p><strong>Priorité :</strong> clarifier la demande principale</p>
              <p><strong>Action suivante :</strong> programmer ou finaliser le socle autonomie</p>
              <p><strong>Point à ne pas oublier :</strong> reporter les éléments officiels dans Insertis</p>
            </div>
          </BlocRepliable>

          <BlocRepliable title="Modules utiles">
            <p className="section-help">
              Les modules seront ouverts selon les besoins repérés par le socle autonomie.
            </p>

            <div className="module-tags">
              <span>Droits</span>
              <span>Budget</span>
              <span>Habitat</span>
              <span>Écrit / numérique</span>
              <span>TNS</span>
            </div>
          </BlocRepliable>
        </div>

        <aside className="dossier-side">
          <BlocRepliable title="Repères rapides">
            <div className="status-stack">
              <span>Parcours : {dossier.statut}</span>
              <span>Référente : {dossier.referente}</span>
              <span>Socle : à compléter</span>
              <span>Insertis : à vérifier</span>
            </div>
          </BlocRepliable>

          <BlocRepliable title="Appui TNS">
            <p><strong>Statut :</strong> non évalué</p>
            <p><strong>Besoin :</strong> à préciser si concerné</p>
            <p className="section-help">
              L’appui TNS complète le parcours. Il ne remplace pas le suivi global.
            </p>
          </BlocRepliable>

          <BlocRepliable title="Chronologie">
            <p><strong>Aujourd’hui :</strong> dossier ouvert</p>
            <p><strong>À suivre :</strong> socle autonomie</p>
          </BlocRepliable>

          <Link className="secondary-button dossier-return-button" to="/parcours-social-socio-professionnel">
            Retour aux parcours
          </Link>
        </aside>
      </section>
    </main>
  );
}
