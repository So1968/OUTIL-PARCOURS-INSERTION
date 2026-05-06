import { Link } from "react-router-dom";

const indicateursDirection = [
  "Charge par professionnelle",
  "Temps de travail disponible : 100 %, 80 %, autre",
  "Parcours actifs et parcours soutenus",
  "Alertes continuité ouvertes",
  "Actions à venir",
  "Appuis TNS à évaluer ou en cours",
  "Personnes en projet",
  "Délais de reprise",
];

export function DirectionRegulationPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Direction — régulation opérationnelle</h1>
          <p className="page-intro">
            Vue destinée à aider la direction à réguler le travail réel, la charge,
            les alertes et la continuité de service.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Indicateurs à construire</h2>
        <div className="pilotage-list">
          {indicateursDirection.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Principe</h2>
        <p>
          Cette vue sert à soutenir la régulation opérationnelle. Elle ne remplace
          ni les échanges d’équipe, ni l’analyse professionnelle, ni Insertis.
        </p>
        <p>
          La direction peut voir les éléments nécessaires pour ajuster
          l’organisation, sans exposer inutilement les détails sensibles des
          situations.
        </p>
      </section>

      <Link className="back-link" to="/direction">
        Retour à la porte Direction
      </Link>
    </main>
  );
}
