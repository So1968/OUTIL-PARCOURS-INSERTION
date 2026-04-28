import { Link } from "react-router-dom";

export function DirectionPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Direction</h1>
          <p className="page-intro">
            Acces minimal distinct en place. Les vues de pilotage et les
            indicateurs ne sont pas encore developpes dans cette etape.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Acces separe valide</h2>
        <p>
          Cette page confirme l'existence d'une entree Direction distincte du
          parcours social / socio-professionnel et de l'Appui TNS.
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour a l'accueil
      </Link>
    </main>
  );
}
