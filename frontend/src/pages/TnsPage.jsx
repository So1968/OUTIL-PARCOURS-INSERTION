import { Link } from "react-router-dom";

export function TnsPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Appui TNS</h1>
          <p className="page-intro">
            Entree minimale distincte en place. L'appui aux situations liees a
            l'activite independante sera construit dans les etapes suivantes,
            sans anticiper les blocs metier.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Acces Appui TNS valide</h2>
        <p>
          Cette page confirme l'existence d'une entree Appui TNS distincte du
          parcours social / socio-professionnel et de la direction.
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour a l'accueil
      </Link>
    </main>
  );
}
