import { Link } from "react-router-dom";

export function ParcoursPage() {
  return (
    <main className="page-shell parcours-shell">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Parcours social / socio-professionnel</h1>
          <p className="page-intro">
            Retrouver un dossier existant ou ouvrir un nouveau parcours.
          </p>
        </div>
      </header>

      <section className="parcours-grid">
        <article className="page-card parcours-card">
          <h2>Dossier existant</h2>
          <p>Retrouver un parcours déjà ouvert et poursuivre le suivi.</p>

          <input
            className="search-input"
            type="text"
            placeholder="Nom, prénom, identifiant..."
          />

          <Link className="secondary-button" to="/parcours-social-socio-professionnel/dossier">
            Accéder au dossier
          </Link>
        </article>

        <article className="page-card parcours-card parcours-card-primary">
          <h2>Démarrer un parcours</h2>
          <p>
            Créer un dossier avant de renseigner le socle autonomie et les premières étapes.
          </p>

          <Link className="primary-button" to="/parcours-social-socio-professionnel/dossier">
            Créer un dossier
          </Link>
        </article>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
