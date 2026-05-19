import React from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import {
  ROLE_APPUI_TNS,
  ROLE_DIRECTION,
  ROLE_PROFESSIONNELLE,
} from "../auth/roles";
import "../homePremium.css";

export function HomePage() {
  const { setCurrentRole } = useRole();

  return (
    <main className="home-v4 home-premium home-product">
      <header className="home-top home-product-top">
        <div className="home-left">
          <img src="/logo-artag.png" alt="ARTAG" className="artag-logo" />
          <div className="home-brand-text">
            <strong>ARTAG</strong>
            <span>Application métier</span>
          </div>
        </div>

        <div className="profile-box">
          Bonjour Sofia
          <br />
          <span>Bureau quotidien</span>
        </div>
      </header>

      <section className="home-hero-panel">
        <div className="home-hero-copy">
          <p className="hero-kicker">APPLICATION MÉTIER ARTAG</p>
          <h1>Outil parcours insertion</h1>
          <p>
            Un point d’entrée clair pour ouvrir un dossier, organiser les appuis
            et sécuriser la continuité de service.
          </p>
        </div>

        <div className="home-hero-actions" aria-label="Action principale">
          <Link
            to="/parcours-social-socio-professionnel/dossier"
            className="open-dossier-btn"
            onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
          >
            Ouvrir le dossier de suivi
          </Link>
        </div>
      </section>

      <section className="home-workspace" aria-label="Bureau quotidien">
        <article className="bureau-card home-focus-card">
          <p className="home-card-label">Repères rapides</p>
          <h2>Mon bureau</h2>
          <ul>
            <li>Dossiers à reprendre</li>
            <li>Alertes et échéances</li>
            <li>Actions du jour</li>
            <li>Brouillons professionnels</li>
          </ul>
        </article>

        <article className="bureau-card home-access-card">
          <p className="home-card-label">Accès métier</p>
          <h2>Choisir un espace</h2>
          <div className="home-access-buttons">
            <Link
              to="/parcours-social-socio-professionnel"
              onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
            >
              Parcours social / socio-professionnel
            </Link>

            <Link
              to="/appui-tns"
              onClick={() => setCurrentRole(ROLE_APPUI_TNS)}
            >
              Appui TNS
            </Link>
          </div>
        </article>

        <article className="bureau-card home-continuity-card">
          <p className="home-card-label">Relais temporaire</p>
          <h2>Continuité de service</h2>
          <p>
            Reprendre temporairement les dossiers d’une collègue ou d’un collègue,
            avec uniquement les éléments nécessaires à la continuité.
          </p>
          <div className="home-access-buttons">
            <Link
              to="/continuite-service"
              onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
            >
              Ouvrir la continuité de service
            </Link>
          </div>
        </article>
      </section>

      <Link
        className="direction-door"
        to="/direction"
        onClick={() => setCurrentRole(ROLE_DIRECTION)}
      >
        Direction / CA
      </Link>
    </main>
  );
}
