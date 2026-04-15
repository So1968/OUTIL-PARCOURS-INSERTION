import { Link } from "react-router-dom";

export function DirectionPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Direction</h1>
          <p className="page-intro">
            Accès minimal distinct en place. Les vues de pilotage et les indicateurs ne sont pas
            encore développés dans cette étape.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Accès séparé</h2>
        <p>Cette page confirme l'existence d'une entrée direction distincte du parcours usager.</p>
      </section>

      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}
