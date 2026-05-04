import { Link } from "react-router-dom";

export function DossierPage() {
  return (
    <main className="page-shell">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />

        <div>
          <h1>Dossier ouvert</h1>
          <p className="page-intro">
            Vue de travail pour suivre le parcours, garder le fil et accéder au socle autonomie.
          </p>
        </div>
      </header>

      <section className="dossier-layout">
        <div className="dossier-main">
          <section className="page-card">
            <h2>Identité</h2>
            <p><strong>Personne accompagnée :</strong> dossier en cours</p>
            <p><strong>Référente :</strong> professionnelle connectée</p>
          </section>

          <section className="page-card">
            <h2>Socle autonomie</h2>
            <p>
              Repérage global rapide au premier entretien. Il prépare l’approfondissement.
            </p>

            <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
              Commencer le socle autonomie
            </Link>
          </section>

          <section className="page-card">
            <h2>Parcours</h2>
            <p>Aucun module ouvert à ce stade.</p>
          </section>
        </div>

        <aside className="dossier-side">
          <section className="page-card">
            <h2>Repères</h2>
            <p>Synthèse courte et note de continuité seront affichées ici.</p>
          </section>

          <section className="page-card">
            <h2>Historique</h2>
            <p>Aucune action enregistrée à ce stade.</p>
          </section>
        </aside>
      </section>

      <Link className="back-link" to="/parcours-social-socio-professionnel">
        Retour aux dossiers
      </Link>
    </main>
  );
}
