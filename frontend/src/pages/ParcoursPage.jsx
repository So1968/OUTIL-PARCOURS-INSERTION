import { Link } from "react-router-dom";

export function ParcoursPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Parcours social / socio-professionnel</h1>
          <p className="page-intro">
            Entrée minimale en place. Le tronc commun métier sera construit dans les étapes
            suivantes, sans anticiper les blocs métier.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Socle exécutable validé</h2>
        <p>
          Cette page confirme le fonctionnement du routing minimal pour l'entrée parcours.
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}
