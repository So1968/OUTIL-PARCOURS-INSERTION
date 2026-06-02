import React from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import {
  ROLE_APPUI_TNS,
  ROLE_DIRECTION,
  ROLE_PROFESSIONNELLE,
} from "../auth/roles";
import "../homePremium.css";

const navigationItems = [
  { label: "Accueil", active: true, icon: "⌂" },
  { label: "File active", icon: "□", to: "/accompagnement-global" },
  { label: "Rendez-vous", icon: "◷", to: "/accompagnement-global" },
  { label: "Actions", icon: "✓", to: "/accompagnement-global/fiche-minute" },
  { label: "Parcours", icon: "⌁", to: "/accompagnement-global" },
  { label: "Référentiel", icon: "▤", to: "/accompagnement-global/lecture-globale" },
  { label: "Outils", icon: "⚙", to: "/accompagnement-global/lecture-globale" },
  { label: "Le Camping", icon: "△", to: "/accompagnement-global/lecture-globale" },
  { label: "La Caravane", icon: "▱", to: "/accompagnement-global/lecture-globale" },
];

const caravanCards = [
  {
    number: "1.",
    title: "File active",
    value: "20 dossiers",
    detail: "À traiter : 7",
    tone: "green",
    icon: "▰",
  },
  {
    number: "2.",
    title: "Rendez-vous",
    value: "Aujourd’hui : 3",
    detail: "Cette semaine : 9",
    tone: "terracotta",
    icon: "◷",
  },
  {
    number: "3.",
    title: "Actions à venir",
    value: "12 actions",
    detail: "Prioritaires : 4",
    tone: "green",
    icon: "✓",
  },
  {
    number: "4.",
    title: "Insertis à saisir",
    value: "5 à saisir",
    detail: "En attente",
    tone: "gold",
    icon: "▤",
  },
  {
    number: "5.",
    title: "Alertes référentiel",
    value: "3 alertes",
    detail: "À consulter",
    tone: "red",
    icon: "!",
  },
  {
    number: "6.",
    title: "Repères d’évolution",
    value: "8 suivis actifs",
    detail: "Mises à jour récentes",
    tone: "green",
    icon: "↗",
  },
  {
    number: "7.",
    title: "Le Camping",
    value: "Mes sujets",
    detail: "à reprendre",
    tone: "green",
    icon: "△",
  },
  {
    number: "8.",
    title: "La Caravane",
    value: "Points parcours",
    detail: "à revoir",
    tone: "gold",
    icon: "▱",
  },
];

const weekItems = [
  { text: "3 rendez-vous à venir", tone: "green" },
  { text: "2 contrats à mettre à jour", tone: "gold" },
  { text: "4 diagnostics à compléter", tone: "red" },
  { text: "2 relais à organiser", tone: "green" },
];

const appointments = [
  { time: "10:00", name: "Claire D.", detail: "Point activité indépendante" },
  { time: "14:30", name: "Julien R.", detail: "Suivi contrat d’engagement" },
  { time: "16:00", name: "Samira B.", detail: "Point lancement activité" },
];

const watchItems = [
  "2 dossiers en dépassement de délai de traitement",
  "5 contrats arrivent à échéance dans les 30 jours",
  "3 pièces justificatives manquantes",
];

function PanelCard({ title, icon, children }) {
  return (
    <article className="caravan-side-panel">
      <div className="caravan-panel-heading">
        <span className="caravan-panel-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

function CaravanCard({ number, title, value, detail, tone, icon }) {
  return (
    <article className="caravan-module-card">
      <span className={`caravan-module-icon ${tone}`}>{icon}</span>
      <div className="caravan-module-copy">
        <h3>
          <span>{number}</span> {title}
        </h3>
        <strong className={tone}>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export function HomePage() {
  const { setCurrentRole } = useRole();

  const setProfessionalRole = () => setCurrentRole(ROLE_PROFESSIONNELLE);

  return (
    <main className="home-caravan-shell" aria-label="Accueil poste de pilotage ARTAG">
      <aside className="caravan-sidebar" aria-label="Navigation principale">
        <div className="caravan-brand">
          <img src="/logo-artag.png" alt="ARTAG" className="caravan-brand-logo" />
          <strong>ARTAG</strong>
        </div>

        <nav className="caravan-nav">
          {navigationItems.map((item) => {
            const className = `caravan-nav-item ${item.active ? "active" : ""}`;
            if (item.to) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={className}
                  onClick={setProfessionalRole}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            }

            return (
              <span key={item.label} className={className}>
                <span>{item.icon}</span>
                {item.label}
              </span>
            );
          })}
        </nav>

        <div className="caravan-sidebar-tools">
          <span className="caravan-nav-item muted"><span>⌕</span>Rechercher</span>
          <span className="caravan-nav-item muted"><span>✉</span>Messages <b>2</b></span>
          <span className="caravan-nav-item muted"><span>⚙</span>Paramètres</span>
        </div>

        <div className="caravan-user-card">
          <span className="caravan-avatar">SM</span>
          <div>
            <strong>Sofia Martin</strong>
            <small>Conseillère</small>
            <em>● En ligne</em>
          </div>
        </div>
      </aside>

      <section className="caravan-main">
        <header className="caravan-topbar">
          <div />
          <div className="caravan-topbar-actions">
            <span aria-label="Notifications">♢</span>
            <span className="caravan-avatar small">SM</span>
          </div>
        </header>

        <section className="caravan-hero-copy">
          <p className="caravan-kicker">POSTE DE PILOTAGE · RÉFÉRENTIEL · FILE ACTIVE</p>
          <h1>Poste de pilotage RSA – activité indépendante</h1>
          <p className="caravan-hero-subtitle">
            Voir la file active, les rendez-vous, les actions et les repères du parcours.
          </p>
        </section>

        <section className="caravan-dashboard-grid">
          <section className="caravan-scene" aria-label="Tableau de bord en forme de caravane">
            <div className="modern-caravan">
              <div className="caravan-roof" />
              <div className="caravan-front-window" />
              <div className="caravan-side-window" />
              <div className="caravan-door-shape">
                <span />
              </div>
              <div className="caravan-trim top" />
              <div className="caravan-trim middle" />
              <div className="caravan-prestige">PRESTIGE</div>

              <div className="caravan-modules-grid">
                {caravanCards.map((card) => (
                  <CaravanCard key={card.title} {...card} />
                ))}
              </div>

              <Link
                to="/accompagnement-global"
                className="caravan-enter-button"
                onClick={setProfessionalRole}
              >
                <span>↳</span>
                <div>
                  <strong>Entrer dans la caravane</strong>
                  <small>Ouvrir le tableau de bord</small>
                </div>
              </Link>

              <div className="caravan-wheel wheel-one" />
              <div className="caravan-wheel wheel-two" />
              <div className="caravan-step" />
            </div>

            <div className="caravan-plant plant-left" />
            <div className="caravan-plant plant-right" />
            <div className="caravan-lantern" />
            <div className="caravan-rug" />

            <section className="caravan-overview-strip" aria-label="Vue d’ensemble">
              <article>
                <h2>Vue d’ensemble</h2>
                <div className="overview-metrics">
                  <span><small>Dossiers en cours</small><strong>20</strong></span>
                  <span><small>Actions en cours</small><strong>12</strong></span>
                  <span><small>Rendez-vous cette semaine</small><strong>9</strong></span>
                </div>
              </article>
              <article>
                <h2>Avancement global</h2>
                <div className="global-progress">
                  <strong>68%</strong>
                  <span>des suivis à jour</span>
                  <i aria-hidden="true" />
                </div>
              </article>
              <article>
                <h2>Repères clés</h2>
                <p>8 suivis actifs avec évolution positive</p>
                <p>4 passages d’étape cette semaine</p>
              </article>
            </section>

            <p className="caravan-security-note">
              ARTAG est un outil sécurisé et conforme au référentiel socio-professionnel. Vos données sont protégées.
            </p>
          </section>

          <aside className="caravan-right-column" aria-label="Informations de la semaine">
            <PanelCard title="Cette semaine" icon="◷">
              <ul className="caravan-status-list">
                {weekItems.map((item) => (
                  <li key={item.text} className={item.tone}>{item.text}</li>
                ))}
              </ul>
              <Link to="/accompagnement-global" onClick={setProfessionalRole}>Voir le détail</Link>
            </PanelCard>

            <PanelCard title="Prochains rendez-vous" icon="◴">
              <div className="caravan-appointments">
                {appointments.map((appointment) => (
                  <Link
                    key={`${appointment.time}-${appointment.name}`}
                    to="/accompagnement-global"
                    onClick={setProfessionalRole}
                  >
                    <time>{appointment.time}</time>
                    <span>
                      <strong>{appointment.name}</strong>
                      <small>{appointment.detail}</small>
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/accompagnement-global" onClick={setProfessionalRole}>Voir tous les rendez-vous</Link>
            </PanelCard>

            <PanelCard title="À surveiller" icon="◎">
              <ul className="caravan-watch-list">
                {watchItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link to="/accompagnement-global/lecture-globale" onClick={setProfessionalRole}>Voir toutes les alertes</Link>
            </PanelCard>
          </aside>
        </section>

        <Link
          className="direction-door"
          to="/direction"
          onClick={() => setCurrentRole(ROLE_DIRECTION)}
        >
          Direction / CA
        </Link>

        <Link
          className="tns-discreet-door"
          to="/accompagnement-global/lecture-globale"
          onClick={() => setCurrentRole(ROLE_APPUI_TNS)}
        >
          Sous-rubrique activité indépendante
        </Link>
      </section>
    </main>
  );
}
