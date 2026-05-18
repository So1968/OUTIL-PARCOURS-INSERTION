import React from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import {
  ROLE_APPUI_TNS,
  ROLE_DIRECTION,
  ROLE_PROFESSIONNELLE,
} from "../auth/roles";

const parcoursSteps = [
  "Accueillir",
  "Consolider",
  "Approfondir",
  "Agir",
  "Stabiliser",
];

export function HomePage() {
  const { setCurrentRole } = useRole();

  return (
    <main className="home-page">
      <header className="home-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />

        <Link
          className="direction-link"
          to="/direction"
          onClick={() => setCurrentRole(ROLE_DIRECTION)}
        >
          Direction
        </Link>
      </header>

      <section className="home-hero">
        <p className="home-kicker">Application métier ARTAG</p>
        <h1>Outil parcours insertion</h1>
        <p className="page-intro">
          Une entrée commune pour suivre les parcours, organiser les appuis et
          sécuriser la continuité de service.
        </p>
      </section>

      <section className="home-actions" aria-label="Entrées principales">
        <Link
          className="home-card"
          to="/parcours-social-socio-professionnel"
          onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
        >
          <span className="home-card-label">Entrée principale</span>
          <h2>Parcours social / socio-professionnel</h2>
          <p>
            Ouvrir ou reprendre un dossier de parcours, suivre les repères,
            les relais et les prochaines étapes.
          </p>
        </Link>

        <Link
          className="home-card home-card-light"
          to="/appui-tns"
          onClick={() => setCurrentRole(ROLE_APPUI_TNS)}
        >
          <span className="home-card-label">Appui ciblé</span>
          <h2>Appui TNS</h2>
          <p>
            Structurer l’appui aux situations liées à l’activité indépendante,
            sans reprendre tout le parcours.
          </p>
        </Link>
      </section>

      <section className="home-process" aria-label="Repères de parcours">
        <h2>Repères de parcours</h2>
        <div className="home-process-grid">
          {parcoursSteps.map((step) => (
            <span className="home-process-step" key={step}>
              {step}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
