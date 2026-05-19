import { Link } from "react-router-dom";
import { referentielMetropoleLyon } from "../data/referentielMetropoleLyon";

const { parcours, domainesDiagnostic } = referentielMetropoleLyon;

export function ParcoursPage() {
  return (
    <main className="page-shell parcours-shell parcours-referentiel">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Parcours social / socio-professionnel</h1>
          <p className="page-intro">
            Retrouver un dossier, créer un parcours et vérifier l’orientation selon
            les repères Métropole de Lyon.
          </p>
        </div>
      </header>

      <section className="parcours-grid parcours-actions-grid">
        <article className="page-card parcours-card">
          <p className="referentiel-label">Suivi en cours</p>
          <h2>Dossier existant</h2>
          <p>Retrouver un parcours déjà ouvert et poursuivre le suivi.</p>

          <input
            className="search-input"
            type="text"
            placeholder="Nom, prénom, identifiant..."
          />

          <Link className="secondary-button" to="/parcours-social-socio-professionnel/dossier">
            Accéder au dossier
          </Link>
        </article>

        <article className="page-card parcours-card parcours-card-primary">
          <p className="referentiel-label">Nouveau suivi</p>
          <h2>Démarrer un parcours</h2>
          <p>
            Créer un dossier avant de renseigner le diagnostic, le contrat et les
            premières étapes.
          </p>

          <Link className="primary-button" to="/parcours-social-socio-professionnel/dossier">
            Créer un dossier
          </Link>
        </article>
      </section>

      <section className="page-card referentiel-orientation-card">
        <div>
          <p className="referentiel-label">Repère d’orientation</p>
          <h2>Choisir le bon registre d’accompagnement</h2>
          <p>
            L’outil doit aider à distinguer le parcours social du parcours
            socio-professionnel, sans décider à la place de la professionnelle.
          </p>
        </div>

        <div className="referentiel-parcours-grid">
          <article>
            <h3>Parcours social</h3>
            <p>{parcours.social.cible}</p>
            <strong>{parcours.social.intensite}</strong>
          </article>

          <article>
            <h3>Parcours socio-professionnel</h3>
            <p>{parcours.socioProfessionnel.cible}</p>
            <strong>{parcours.socioProfessionnel.intensite}</strong>
          </article>
        </div>
      </section>

      <section className="page-card referentiel-diagnostic-card">
        <p className="referentiel-label">Diagnostic commun</p>
        <h2>9 domaines à explorer</h2>
        <div className="referentiel-domaines-grid">
          {domainesDiagnostic.map((domaine) => (
            <span key={domaine}>{domaine}</span>
          ))}
        </div>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
