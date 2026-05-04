import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
  const [statut, setStatut] = useState("Dossier ouvert");
  const [referente, setReferente] = useState("Référente à préciser");

  const derniereMiseAJour = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR");
  }, []);

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
            <input type="text" placeholder="Ex. INS-..." />
          </label>

          <label>
            <span>N° ARTAG</span>
            <input type="text" placeholder="Ex. ARTAG-..." />
          </label>

          <label>
            <span>Nom</span>
            <input type="text" placeholder="Nom de famille" />
          </label>

          <label>
            <span>Prénom</span>
            <input type="text" placeholder="Prénom" />
          </label>

          <label>
            <span>Statut du parcours</span>
            <select value={statut} onChange={(event) => setStatut(event.target.value)}>
              {statutsParcours.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Référente</span>
            <select value={referente} onChange={(event) => setReferente(event.target.value)}>
              {referentes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date d’ouverture</span>
            <input type="date" />
          </label>

          <label>
            <span>Dernière mise à jour</span>
            <input type="text" value={derniereMiseAJour} readOnly />
          </label>
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
              <span>Parcours : {statut}</span>
              <span>Référente : {referente}</span>
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

          <BlocRepliable title="Retour">
            <Link className="secondary-button" to="/parcours-social-socio-professionnel">
              Retour aux parcours
            </Link>
          </BlocRepliable>
        </aside>
      </section>
    </main>
  );
}
