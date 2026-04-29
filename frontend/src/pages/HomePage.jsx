import React from "react";
import { Link } from "react-router-dom";

const parcoursSteps = [
  {
    label: "Diagnostic",
    text: "Repérer la situation, analyser les besoins et les ressources.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="10" r="5.5" />
        <path d="M14.5 14.5L20 20" />
      </svg>
    ),
  },
  {
    label: "Contrat",
    text: "Définir ensemble les objectifs et les étapes du parcours.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.5h7l3 3v14H7z" />
        <path d="M14 3.5v3h3" />
        <path d="M9 13l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Actions",
    text: "Mettre en œuvre les actions adaptées à la situation.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    ),
  },
  {
    label: "Suivi",
    text: "Suivre l’avancement, ajuster les actions et sécuriser la continuité.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.4" />
        <path d="M5.5 21a6.5 6.5 0 0113 0" />
      </svg>
    ),
  },
  {
    label: "Progression vers l’autonomie",
    text: "Consolider les acquis, gagner en autonomie et ouvrir de nouveaux horizons.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 17l5-5 4 4 7-9" />
        <path d="M15 7h5v5" />
      </svg>
    ),
  },
];

export function HomePage() {
  return (
    <main className="home-page">
      <header className="page-header">
        <div className="logo-sun">
          <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        </div>

        <Link className="direction-link" to="/direction">
          <span className="direction-door">
            <span className="direction-door-handle" />
          </span>
          Direction
        </Link>
      </header>

      <section className="home-hero">
        <h1>Outil parcours insertion</h1>
        <p className="page-intro">
          Cœur du dispositif : accompagner la progression des parcours sociaux et socio-professionnels vers l’autonomie.
        </p>
      </section>

      <section className="home-actions">
        <Link className="home-card" to="/parcours">
          <h2>Parcours social<br />socio-professionnel</h2>
          <p>Diagnostic, contrat, actions, suivi et progression vers l’autonomie.</p>
        </Link>

        <Link className="home-card home-card-light" to="/appui-tns">
          <h2>Appui TNS</h2>
          <p>Appui spécifique et complémentaire au parcours pour les situations liées à l’activité indépendante.</p>
        </Link>
      </section>

      <section className="parcours-road" aria-label="Étapes du parcours">
        <svg className="road-curve" viewBox="0 0 1500 180" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="roadArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6" />
            </marker>
          </defs>
          <path d="M10 100 C220 50, 350 40, 520 100 S760 160, 930 100 S1180 50, 1350 90 S1460 105, 1490 100" />
        </svg>

        <div className="road-steps">
          {parcoursSteps.map((step, index) => (
            <article className={`road-step road-step-${index + 1}`} key={step.label}>
              <div className="road-icon">{step.icon}</div>
              <div className="road-card">
                <h2>{step.label}</h2>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

