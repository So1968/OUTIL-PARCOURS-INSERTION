import { Link } from "react-router-dom";

export function ParcoursPage() {
  return (
    <main className="page-shell">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />

        <div>
          <h1>Parcours social / socio-professionnel</h1>
          <p className="page-intro">
            Rechercher une personne ou démarrer un nouveau parcours.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Recherche simple</h2>

        <input
          className="search-input"
          type="search"
          placeholder="Rechercher une personne ou un dossier…"
        />

        <div className="search-results">
          <div className="search-item">
            <div>
              <strong>Liste des usagers</strong>
              <p>Accéder aux dossiers existants.</p>
            </div>

            <Link className="open-link" to="/parcours-social-socio-professionnel/dossier">
              Ouvrir
            </Link>
          </div>
        </div>
      </section>

      <section className="page-card">
        <h2>Démarrer un accompagnement</h2>
        <p>Créer ou ouvrir un dossier avant de commencer le socle autonomie.</p>

        <Link className="primary-button" to="/parcours-social-socio-professionnel/dossier">
          Créer / ouvrir un dossier
        </Link>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
