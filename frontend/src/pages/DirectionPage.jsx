import { Link } from "react-router-dom";

export function DirectionPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Direction</h1>
          <p className="page-intro">
            Porte de pilotage de l’outil de parcours et d’appui insertion ARTAG.
            Cette entrée distingue la régulation opérationnelle de la direction
            et la lecture agrégée destinée à la gouvernance.
          </p>
        </div>
      </header>

      <section className="page-grid">
        <article className="page-card">
          <h2>Direction — régulation opérationnelle</h2>
          <p>
            Cette lecture sert à suivre la charge réelle, les alertes continuité,
            les actions à venir, les appuis TNS, les délais et les besoins de
            régulation du service.
          </p>
          <p>
            Elle aide la direction à ajuster l’organisation du travail sans
            remplacer les échanges d’équipe ni l’analyse professionnelle.
          </p>
        </article>

        <article className="page-card">
          <h2>Gouvernance / CA — lecture agrégée</h2>
          <p>
            Cette lecture permet de voir l’ensemble, pas les personnes. Elle est
            destinée à suivre la mise en œuvre du cadre associatif et du projet
            social à partir d’indicateurs globaux, non nominatifs et non
            intrusifs.
          </p>
          <p>
            Elle ne donne accès ni aux dossiers individuels, ni aux notes
            professionnelles, ni aux synthèses Insertis.
          </p>
        </article>
      </section>

      <section className="page-card">
        <h2>Principe de séparation</h2>
        <p>
          La porte Direction donne accès aux lectures de pilotage : régulation
          opérationnelle pour la direction, lecture agrégée pour la gouvernance /
          CA.
        </p>
        <p>
          Lecture agrégée = on voit l’ensemble, pas les personnes.
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
