import { Link } from "react-router-dom";

export function TnsPage() {
  return (
    <main className="page-shell tns-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">File active</p>
          <h1>Accompagnement global</h1>
          <p className="page-intro">
            Un espace court pour recevoir, noter, qualifier la situation globale et preparer la prochaine action utile.
          </p>
        </div>
      </header>

      <section className="page-grid">
        <article className="page-card">
          <p className="referentiel-label">File active · actions</p>
          <h2>Pilotage actions Insertis</h2>
          <p>Importer un export CSV Insertis, pre-remplir les actions, filtrer les priorites et ouvrir une fiche dossier.</p>
          <Link className="primary-button" to="/pilotage-actions">
            Ouvrir le pilotage
          </Link>
        </article>

        <article className="page-card">
          <p className="referentiel-label">Rendez-vous</p>
          <h2>Fiche minute apres contact</h2>
          <p>Noter vite apres un contact, produire une trace courte et preparer la suite.</p>
          <Link className="secondary-button" to="/accompagnement-global/fiche-minute">
            Ouvrir la fiche minute
          </Link>
        </article>

        <article className="page-card">
          <p className="referentiel-label">Lecture globale</p>
          <h2>Situation professionnelle et activite</h2>
          <p>Garder les informations liees a l'activite comme sous-rubrique de la situation globale.</p>
          <Link className="secondary-button" to="/accompagnement-global/lecture-globale">
            Ouvrir la lecture globale
          </Link>
        </article>

        <article className="page-card">
          <p className="referentiel-label">Échéances · Insertis</p>
          <h2>Échéances et vigilances</h2>
          <p>Suivre les contrats à échéance, les rendez-vous à reposer, les documents attendus et les relances.</p>
          <Link className="secondary-button" to="/accompagnement-global/echeances-vigilances">
            Ouvrir les vigilances
          </Link>
        </article>
      </section>

      <Link className="back-link" to="/">
        Retour accueil
      </Link>
    </main>
  );
}
