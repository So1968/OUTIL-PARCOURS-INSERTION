import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-hero">
        <div className="home-brand">
          <img src="/logo-artag.png" alt="Logo Artag" className="home-logo" />

          <div>
            <h1 className="home-title">Outil parcours insertion</h1>
            <p className="home-subtitle">
              Une entrée lisible dans les différents espaces de travail, avec
              une représentation sobre du parcours comme progression par étapes.
            </p>
          </div>
        </div>

        <div className="path-strip-soft">
          <div className="path-line-soft"></div>

          <div className="path-stages-soft">
            <div className="path-stage-soft">
              <span className="stage-dot-soft active"></span>
              <span className="stage-label-soft">Accueil</span>
            </div>

            <div className="path-stage-soft">
              <span className="stage-dot-soft"></span>
              <span className="stage-label-soft">Repérage</span>
            </div>

            <div className="path-stage-soft">
              <span className="stage-dot-soft"></span>
              <span className="stage-label-soft">Appui</span>
            </div>

            <div className="path-stage-soft">
              <span className="stage-dot-soft"></span>
              <span className="stage-label-soft">Coordination</span>
            </div>

            <div className="path-stage-soft">
              <span className="stage-dot-soft"></span>
              <span className="stage-label-soft">Orientation</span>
            </div>
          </div>

          <div className="soft-traveller" aria-hidden="true">🚶</div>
        </div>
      </section>

      <section className="entriesWrap">
        <article className="entry-card">
          <span className="entry-badge">Entrée métier</span>
          <h2 className="entry-title">Parcours social / socio-professionnel</h2>
          <p className="entry-text">
            Accès au tronc commun de parcours, dans une logique de suivi global,
            de structuration et de lisibilité.
          </p>
          <Link to="/parcours-social-socio-professionnel" className="entry-link">
            Ouvrir l’espace parcours
          </Link>
        </article>

        <article className="entry-card">
          <span className="entry-badge">Appui ciblé</span>
          <h2 className="entry-title">Appui TNS</h2>
          <p className="entry-text">
            Appui aux situations liées à l’activité indépendante, dans une
            logique d’éclairage, de coordination et d’orientation.
          </p>
          <Link to="/appui-tns" className="entry-link">
            Ouvrir l’espace Appui TNS
          </Link>
        </article>

        <article className="entry-card">
          <span className="entry-badge">Pilotage</span>
          <h2 className="entry-title">Direction</h2>
          <p className="entry-text">
            Accès aux éléments de pilotage, de structuration et de suivi
            transversal.
          </p>
          <Link to="/direction" className="entry-link">
            Ouvrir l’espace direction
          </Link>
        </article>
      </section>
    </main>
  );
}