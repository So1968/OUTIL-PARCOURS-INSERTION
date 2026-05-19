import { Link } from "react-router-dom";

export function TnsCoordinationPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Coordination Appui TNS</h1>
          <p className="page-intro">
            Clarifier qui fait quoi autour d’une situation TNS : référente de
            parcours, appui technique, partenaires et personne accompagnée.
          </p>
        </div>
      </header>

      <section className="page-grid">
        <article className="page-card">
          <h2>Référente de parcours</h2>
          <p>
            Garde la continuité du parcours global, la relation d’accompagnement
            et les décisions de suivi.
          </p>
          <ul>
            <li>Suit la situation globale.</li>
            <li>Valide les étapes avec la personne.</li>
            <li>Reporte les éléments utiles dans le dossier.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>Appui TNS</h2>
          <p>
            Apporte un éclairage technique ciblé sur l’activité indépendante.
          </p>
          <ul>
            <li>Aide à comprendre statut, obligations et blocages.</li>
            <li>Objectivise les éléments utiles.</li>
            <li>Propose des relais ou orientations.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>Partenaires</h2>
          <p>
            Interviennent selon le besoin : URSSAF, impôts, CAF, France Travail,
            ADL, chambres consulaires, accompagnement création ou gestion.
          </p>
          <ul>
            <li>Ne pas multiplier les relais sans objectif clair.</li>
            <li>Identifier une prochaine action concrète.</li>
            <li>Limiter les informations transmises au nécessaire.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>Personne accompagnée</h2>
          <p>
            Reste actrice du parcours. L’outil doit aider à comprendre, choisir
            et agir, pas décider à sa place.
          </p>
          <ul>
            <li>Compréhension des démarches.</li>
            <li>Choix des actions possibles.</li>
            <li>Accord sur les relais mobilisés.</li>
          </ul>
        </article>
      </section>

      <section className="page-card">
        <h2>Décision de coordination</h2>
        <label className="insertis-summary-field">
          <span>Qui fait quoi ?</span>
          <textarea
            rows="7"
            placeholder="Ex. Référente : reprend le dossier CAF. Appui TNS : vérifie situation URSSAF. Personne : apporte le courrier reçu. Prochaine date : ..."
          />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">
          Retour Appui TNS
        </Link>
        <Link className="secondary-button" to="/parcours-social-socio-professionnel/dossier">
          Retour dossier parcours
        </Link>
      </div>
    </main>
  );
}
