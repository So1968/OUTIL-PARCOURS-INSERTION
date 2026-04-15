import { Link } from "react-router-dom";

export function TnsPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Appui TNS</h1>
          <p className="page-intro">
            Entrée minimale en place. Le contenu métier TNS sera ajouté plus tard dans le tronc
            commun prévu par la documentation.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Routing minimal</h2>
        <p>Cette page sert de point d'entrée exécutable pour l'accès Appui TNS.</p>
      </section>

      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}
