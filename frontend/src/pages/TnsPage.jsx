import { Link } from "react-router-dom";

export function TnsPage() {
  return (
    <main className="page-shell tns-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Appui TNS</h1>
          <p className="page-intro">
            Un espace court pour éclairer une situation liée à l’activité indépendante,
            sans reprendre tout le parcours.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Objectif du jour</p>
        <h2>Comprendre vite, décider sobrement, garder une trace utile</h2>
        <div className="pilotage-list">
          <p><strong>1. Clarifier :</strong> quelle activité, quel blocage, quelle urgence ?</p>
          <p><strong>2. Objectiver :</strong> quels documents, dates, montants ou courriers ?</p>
          <p><strong>3. Orienter :</strong> qui fait quoi ensuite, avec quel relais ?</p>
        </div>
      </section>

      <section className="page-grid">
        <article className="page-card">
          <p className="referentiel-label">Analyse</p>
          <h2>Situation TNS</h2>
          <p>
            Statut, activité, revenus, blocages administratifs et impact sur le parcours.
          </p>

          <Link className="primary-button" to="/appui-tns/analyse">
            Ouvrir l’analyse
          </Link>
        </article>

        <article className="page-card">
          <p className="referentiel-label">Coordination</p>
          <h2>Qui fait quoi ?</h2>
          <p>
            Référente, appui TNS, partenaires et personne accompagnée : chacun sa place.
          </p>

          <Link className="secondary-button" to="/appui-tns/coordination">
            Organiser la coordination
          </Link>
        </article>
      </section>

      <section className="page-card">
        <h2>Règle simple</h2>
        <p>
          <strong>Appui TNS = éclairer une situation, pas créer un parcours parallèle.</strong>
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
