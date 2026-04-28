import { Link } from "react-router-dom";

export function ParcoursPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Parcours social / socio-professionnel</h1>
          <p className="page-intro">
            Entree minimale en place. Le tronc commun metier sera construit dans
            les etapes suivantes, sans anticiper les blocs metier.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Socle executable valide</h2>
        <p>
          Cette page confirme le fonctionnement du routing minimal pour l'entree
          parcours.
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour a l'accueil
      </Link>
    </main>
  );
}
