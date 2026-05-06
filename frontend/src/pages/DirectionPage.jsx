import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import { ROLE_DIRECTION, ROLE_GOUVERNANCE_CA } from "../auth/roles";

export function DirectionPage() {
  const { setCurrentRole } = useRole();

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
            Suivre la charge réelle, les alertes continuité, les actions à venir,
            les appuis TNS, les délais et les besoins de régulation du service.
          </p>

          <Link
            className="primary-button"
            to="/direction/regulation"
            onClick={() => setCurrentRole(ROLE_DIRECTION)}
          >
            Accéder à la régulation direction
          </Link>
        </article>

        <article className="page-card">
          <h2>Gouvernance / CA — lecture agrégée</h2>
          <p>
            Voir l’ensemble, pas les personnes. Cette lecture suit la mise en
            œuvre du cadre associatif et du projet social à partir d’indicateurs
            globaux, non nominatifs et non intrusifs.
          </p>

          <Link
            className="secondary-button"
            to="/direction/gouvernance"
            onClick={() => setCurrentRole(ROLE_GOUVERNANCE_CA)}
          >
            Accéder à la lecture gouvernance
          </Link>
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
          <strong>Lecture agrégée = on voit l’ensemble, pas les personnes.</strong>
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
