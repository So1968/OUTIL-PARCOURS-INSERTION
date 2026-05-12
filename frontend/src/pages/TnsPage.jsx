import { Link } from "react-router-dom";

export function TnsPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Appui TNS</h1>
          <p className="page-intro">
            Espace d’appui ciblé aux situations liées à l’activité indépendante.
            Cette entrée ne crée pas une file active autonome : elle vient en
            appui des parcours déjà suivis, avec une logique d’analyse,
            d’éclairage, de coordination et d’orientation.
          </p>
        </div>
      </header>

      <section className="page-grid">
        <article className="page-card">
          <h2>Analyser une situation TNS</h2>
          <p>
            Repérer les questions liées à l’activité indépendante : statut,
            revenus, obligations déclaratives, difficultés administratives,
            articulation avec le parcours RSA et besoins d’orientation.
          </p>

          <Link className="primary-button" to="/appui-tns/analyse">
            Ouvrir une analyse TNS
          </Link>
        </article>

        <article className="page-card">
          <h2>Coordonner l’appui</h2>
          <p>
            Clarifier ce qui relève du référent de parcours, de l’appui TNS,
            des ressources internes et des partenaires externes, sans se
            substituer aux acteurs spécialisés.
          </p>

          <Link className="secondary-button" to="/appui-tns/coordination">
            Voir la coordination
          </Link>
        </article>
      </section>

      <section className="page-card">
        <h2>Principe de cadrage</h2>
        <p>
          L’appui TNS est un appui technique ciblé. Il aide à structurer,
          comprendre et orienter les situations liées à l’activité indépendante,
          tout en maintenant le référent de parcours comme point de continuité.
        </p>
        <p>
          <strong>
            Appui TNS = éclairer une situation, pas reprendre tout le parcours.
          </strong>
        </p>
      </section>

      <Link className="back-link" to="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
