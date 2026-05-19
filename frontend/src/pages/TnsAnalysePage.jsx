import { Link } from "react-router-dom";

export function TnsAnalysePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Analyse TNS</h1>
          <p className="page-intro">
            Clarifier une situation liée à l’activité indépendante sans sortir la
            personne de son parcours global. L’appui TNS éclaire, organise et
            oriente ; il ne remplace pas la référente de parcours.
          </p>
        </div>
      </header>

      <section className="page-grid">
        <article className="page-card">
          <h2>1. Situation d’activité</h2>
          <p>
            Repérer le type d’activité, le statut, le niveau d’activité réel,
            les revenus connus et les obligations principales.
          </p>
          <ul>
            <li>Activité déclarée, en projet, suspendue ou informelle.</li>
            <li>Micro-entreprise, indépendant, commerce, prestation, chantier.</li>
            <li>Revenus déclarés, irréguliers, absents ou à clarifier.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>2. Points à objectiver</h2>
          <p>
            Rassembler des éléments concrets avant d’orienter ou de conclure.
          </p>
          <ul>
            <li>Numéro SIRET, URSSAF, impôts, déclarations.</li>
            <li>Chiffre d’affaires, factures, charges, dettes éventuelles.</li>
            <li>Courriers reçus, échéances, blocages administratifs.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>3. Impact sur le parcours</h2>
          <p>
            Lire l’activité indépendante dans le parcours social ou
            socio-professionnel, sans en faire une file autonome.
          </p>
          <ul>
            <li>Impact sur RSA / CAF / France Travail.</li>
            <li>Besoin d’explication, de régularisation ou d’orientation.</li>
            <li>Étape réaliste à proposer avec la personne.</li>
          </ul>
        </article>

        <article className="page-card">
          <h2>4. Suite utile</h2>
          <p>
            Préparer une action claire et une synthèse courte pour le dossier.
          </p>
          <ul>
            <li>Action à faire.</li>
            <li>Document attendu.</li>
            <li>Relais ou partenaire à mobiliser.</li>
          </ul>
        </article>
      </section>

      <section className="page-card">
        <h2>Synthèse courte TNS</h2>
        <label className="insertis-summary-field">
          <span>Éléments à retenir</span>
          <textarea
            rows="7"
            placeholder="Synthèse factuelle : situation d’activité, point à vérifier, action prévue, relais éventuel."
          />
        </label>
      </section>

      <div className="identity-actions">
        <Link className="secondary-button" to="/appui-tns">
          Retour Appui TNS
        </Link>
        <Link className="secondary-button" to="/parcours-social-socio-professionnel/dossier">
          Retour dossier parcours
        </Link>
      </div>
    </main>
  );
}
