import { Link } from "react-router-dom";

const indicateursGouvernance = [
  "Nombre de parcours accompagnés",
  "Évolution des parcours actifs",
  "Besoins récurrents par grands modules",
  "Appuis TNS repérés ou engagés",
  "Alertes continuité agrégées",
  "Délais moyens de reprise",
  "Charge globale par mission",
  "Points de tension structurels",
  "Écart entre moyens disponibles et activité constatée",
];

export function GouvernancePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Gouvernance / CA — lecture agrégée</h1>
          <p className="page-intro">
            Vue destinée à suivre la mise en œuvre du cadre associatif et du
            projet social, sans accès aux dossiers individuels.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Lecture agrégée</h2>
        <p>
          Lecture agrégée = on voit l’ensemble, pas les personnes.
        </p>
        <p>
          Cette vue ne donne accès ni aux noms des personnes accompagnées, ni aux
          notes professionnelles, ni aux synthèses Insertis, ni aux données
          sensibles individuelles.
        </p>
      </section>

      <section className="page-card">
        <h2>Indicateurs à construire</h2>
        <div className="pilotage-list">
          {indicateursGouvernance.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Rôle du CA</h2>
        <p>
          Le CA ne pilote pas les dossiers ; il vérifie que le cadre associatif
          qu’il a validé est réellement mis en œuvre dans des conditions
          soutenables.
        </p>
      </section>

      <Link className="back-link" to="/direction">
        Retour à la porte Direction
      </Link>
    </main>
  );
}
