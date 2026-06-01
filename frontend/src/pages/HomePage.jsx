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
            <span>Accompagnement global</span>
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
          <p className="hero-kicker">FILE ACTIVE · MI-TEMPS · CONTINUITE</p>
          <h1>Accompagnement global</h1>
          <p>
            Suivi des personnes accompagnees, des rendez-vous, des actions et des alertes pour securiser une file active sur un mi-temps.
          </p>
        </div>

        <div className="home-hero-actions" aria-label="Action principale">
          <Link
            to="/accompagnement-global"
            className="open-dossier-btn"
            onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
          >
            Ouvrir l'accompagnement global
          </Link>
          <Link
            to="/accompagnement-global/fiche-minute"
            className="home-secondary-action"
            onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
          >
            Fiche minute rendez-vous
          </Link>
        </div>
      </section>

      <section className="home-workspace" aria-label="Bureau quotidien accompagnement global">
        <article className="bureau-card home-focus-card">
          <p className="home-card-label">Aujourd'hui</p>
          <h2>Rendez-vous du jour</h2>
          <ul>
            <li>Voir les personnes recues aujourd'hui</li>
            <li>Noter presence, absence ou report</li>
            <li>Garder une trace courte apres contact</li>
          </ul>
        </article>

        <article className="bureau-card home-access-card">
          <p className="home-card-label">File active</p>
          <h2>Dossiers accompagnes</h2>
          <p>
            Suivre les situations en accompagnement global : prochaine action, niveau de charge, documents attendus et points de vigilance.
          </p>
          <div className="home-access-buttons">
            <Link
              to="/accompagnement-global"
              onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
            >
              Ouvrir les dossiers accompagnes
            </Link>
          </div>
        </article>

        <article className="bureau-card home-continuity-card">
          <p className="home-card-label">Anti-perte</p>
          <h2>Actions · Alertes · Le Camping</h2>
          <p>
            Regrouper les actions a faire, les relances, la saisie Insertis, les questions metier et les sujets a reprendre plus tard.
          </p>
          <div className="home-access-buttons">
            <Link
              to="/accompagnement-global/lecture-globale"
              onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
            >
              Lecture globale de situation
            </Link>
          </div>
        </article>
      </section>

      <section className="home-workspace home-secondary-workspace" aria-label="Briques complementaires">
        <article className="bureau-card">
          <p className="home-card-label">Reperes</p>
          <h2>Reperes d'autonomie</h2>
          <p>
            Observer des faits professionnels : documents apportes, comprehension, demarches realisees entre deux rendez-vous, capacite a demander de l'aide.
          </p>
        </article>

        <article className="bureau-card">
          <p className="home-card-label">Insertis</p>
          <h2>Saisie preparee</h2>
          <p>
            Preparer une synthese courte : situation abordee, demarches realisees, freins identifies, actions prevues et prochaine etape.
          </p>
        </article>

        <article className="bureau-card">
          <p className="home-card-label">Brique dormante</p>
          <h2>Activite independante</h2>
          <p>
            Les elements TNS restent conserves comme sous-rubrique de la situation professionnelle, sans porter la facade officielle de l'outil.
          </p>
          <div className="home-access-buttons">
            <Link
              to="/accompagnement-global/lecture-globale"
              onClick={() => setCurrentRole(ROLE_APPUI_TNS)}
            >
              Ouvrir la sous-rubrique activite
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
