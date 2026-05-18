import React from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import {
  ROLE_APPUI_TNS,
  ROLE_DIRECTION,
  ROLE_PROFESSIONNELLE,
} from "../auth/roles";

export function HomePage() {
  const { setCurrentRole } = useRole();

  return (
    <main className="home-v4">
      <header className="home-top">
        <div className="home-left">
          <img src="/logo-artag.png" alt="ARTAG" className="artag-logo" />
        </div>

        <div className="profile-box">
          Bonjour Sofia
          <br />
          <span>Bureau quotidien</span>
        </div>
      </header>

      <section className="hero">
        <p className="hero-kicker">APPLICATION MÉTIER ARTAG</p>
        <h1>Outil parcours insertion</h1>
        <p>
          Reprendre les dossiers, sécuriser la continuité et organiser les appuis.
        </p>

        <Link
          to="/parcours-social-socio-professionnel/dossier"
          className="open-dossier-btn"
          onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
        >
          + Reprendre un dossier
        </Link>
      </section>

      <section className="cards-grid">
        <article className="bureau-card">
          <h2>Mon bureau</h2>
          <ul>
            <li>Mes dossiers à reprendre</li>
            <li>Mes alertes</li>
            <li>Mes actions du jour</li>
            <li>Mes brouillons professionnels</li>
          </ul>
        </article>

        <article className="bureau-card">
          <h2>Mes accès métier</h2>
          <div className="home-access-buttons">
            <Link
              to="/parcours-social-socio-professionnel"
              onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
            >
              Parcours
            </Link>

            <Link
              to="/appui-tns"
              onClick={() => setCurrentRole(ROLE_APPUI_TNS)}
            >
              Appui TNS
            </Link>
          </div>
        </article>

        <article className="bureau-card">
          <h2>Continuité de service</h2>
          <p>
            Reprendre temporairement les dossiers d’une collègue ou d’un collègue,
            avec les éléments nécessaires à la continuité.
          </p>
          <ul>
            <li>Synthèse courte</li>
            <li>Note de continuité</li>
            <li>Prochaine action</li>
            <li>Échéances et documents attendus</li>
          </ul>

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

