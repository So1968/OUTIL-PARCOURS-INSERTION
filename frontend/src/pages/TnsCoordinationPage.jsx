import { Link } from "react-router-dom";

const rolesCoordination = [
  {
    titre: "Référente parcours",
    role: "Garde la continuité globale.",
    action: "Valide la suite avec la personne.",
  },
  {
    titre: "Appui TNS",
    role: "Éclaire le point technique.",
    action: "Aide à objectiver statut, revenus, obligations ou blocage.",
  },
  {
    titre: "Partenaire",
    role: "Intervient sur un besoin précis.",
    action: "URSSAF, impôts, CAF, France Travail, ADL ou autre relais ciblé.",
  },
  {
    titre: "Personne accompagnée",
    role: "Reste actrice de la démarche.",
    action: "Apporte les documents, choisit l’action possible, donne son accord au relais.",
  },
];

export function TnsCoordinationPage() {
  return (
    <main className="page-shell tns-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Coordination TNS</h1>
          <p className="page-intro">
            Clarifier rapidement qui fait quoi, sans multiplier les relais ni perdre le parcours global.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Décision utile</p>
        <h2>Une coordination doit finir par une action claire</h2>
        <p>
          Pas de réunion floue : une personne responsable, une prochaine étape, une date ou un document attendu.
        </p>
      </section>

      <section className="page-grid">
        {rolesCoordination.map((item) => (
          <article className="page-card" key={item.titre}>
            <h2>{item.titre}</h2>
            <p><strong>{item.role}</strong></p>
            <p>{item.action}</p>
          </article>
        ))}
      </section>

      <section className="page-card">
        <h2>Qui fait quoi ?</h2>
        <label className="insertis-summary-field">
          <span>Décision de coordination</span>
          <textarea
            rows="6"
            placeholder="Ex. Référente : reprend le dossier CAF. Appui TNS : vérifie URSSAF. Personne : apporte le courrier. Date : ..."
          />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">
          Retour Appui TNS
        </Link>
        <Link className="secondary-button" to="/appui-tns/analyse">
          Retour analyse
        </Link>
      </div>
    </main>
  );
}
