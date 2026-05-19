import { Link } from "react-router-dom";

const pointsAnalyse = [
  {
    titre: "Activité",
    aide: "Déclarée, en projet, suspendue, informelle ?",
    placeholder: "Ex. micro-entreprise déclarée, activité irrégulière, chantier ponctuel...",
  },
  {
    titre: "Documents / preuves",
    aide: "Ce qu’on peut vérifier concrètement.",
    placeholder: "SIRET, courrier URSSAF, déclaration, facture, échéance, montant...",
  },
  {
    titre: "Impact parcours",
    aide: "Ce que ça change pour le RSA, les droits ou la suite.",
    placeholder: "Impact CAF/RSA, France Travail, dette, régularisation, besoin d’explication...",
  },
  {
    titre: "Prochaine action",
    aide: "Une seule action claire pour éviter la dispersion.",
    placeholder: "Qui fait quoi, pour quand, avec quel document ?",
  },
];

export function TnsAnalysePage() {
  return (
    <main className="page-shell tns-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Analyse TNS</h1>
          <p className="page-intro">
            Une grille courte pour comprendre la situation, objectiver les faits et décider de la suite.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Mode rapide</p>
        <h2>4 points, pas plus</h2>
        <p>
          L’objectif n’est pas de tout régler : on cherche le blocage principal,
          la preuve utile et la prochaine action.
        </p>
      </section>

      <section className="page-grid">
        {pointsAnalyse.map((point, index) => (
          <article className="page-card" key={point.titre}>
            <p className="referentiel-label">Point {index + 1}</p>
            <h2>{point.titre}</h2>
            <p>{point.aide}</p>
            <label className="insertis-summary-field">
              <span>Note courte</span>
              <textarea rows="4" placeholder={point.placeholder} />
            </label>
          </article>
        ))}
      </section>

      <section className="page-card">
        <h2>Synthèse courte TNS</h2>
        <label className="insertis-summary-field">
          <span>À conserver dans le dossier</span>
          <textarea
            rows="6"
            placeholder="Situation d’activité + point à vérifier + action prévue + relais éventuel."
          />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">
          Retour Appui TNS
        </Link>
        <Link className="secondary-button" to="/appui-tns/coordination">
          Passer à la coordination
        </Link>
      </div>
    </main>
  );
}
