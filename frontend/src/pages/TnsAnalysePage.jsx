import { Link } from "react-router-dom";

const champsDiagnostic = [
  {
    label: "État de la boîte",
    aide: "Où en est l’activité aujourd’hui ?",
    options: [
      "À clarifier",
      "En idée / envie de créer",
      "Création en cours",
      "Créée et active",
      "Créée mais peu active",
      "En pause / sommeil",
      "À régulariser",
      "À fermer / radiation à envisager",
      "Activité non déclarée",
    ],
  },
  {
    label: "Statut connu",
    aide: "Ce que la personne sait déjà du cadre administratif.",
    options: [
      "À vérifier",
      "Micro-entreprise",
      "Entreprise individuelle",
      "Société",
      "Conjoint collaborateur / aide familiale",
      "Pas encore créée",
      "Statut inconnu",
    ],
  },
  {
    label: "Activité réelle",
    aide: "Est-ce qu’il se passe quelque chose concrètement ?",
    options: [
      "À préciser",
      "Pas encore démarré",
      "Quelques clients / chantiers ponctuels",
      "Activité irrégulière",
      "Activité régulière",
      "Activité arrêtée",
      "Activité difficile à prouver",
    ],
  },
  {
    label: "Chiffre d’affaires / revenus",
    aide: "Niveau de visibilité sur l’argent généré par la boîte.",
    options: [
      "Inconnu / à retrouver",
      "Aucun chiffre d’affaires",
      "Très irrégulier",
      "Régulier mais faible",
      "Régulier et significatif",
      "Déclaré mais à vérifier",
      "Non déclaré / risque à clarifier",
    ],
  },
  {
    label: "Situation administrative",
    aide: "URSSAF, impôts, CAF/RSA, courriers, échéances.",
    options: [
      "À vérifier",
      "Semble à jour",
      "Déclarations en retard",
      "Dette ou échéance urgente",
      "Courrier incompris",
      "Compte bloqué / accès perdu",
      "Risque de rupture de droits",
    ],
  },
  {
    label: "Besoin principal",
    aide: "Ce qui doit être traité en premier.",
    options: [
      "Comprendre la situation",
      "Créer l’activité",
      "Régulariser",
      "Déclarer / mettre à jour",
      "Comprendre les droits RSA / CAF",
      "Relancer l’activité",
      "Arrêter / fermer proprement",
      "Orienter vers un partenaire",
    ],
  },
];

const documentsUtiles = [
  "SIRET / avis INSEE",
  "Accès URSSAF",
  "Dernière déclaration de chiffre d’affaires",
  "Courrier CAF / RSA",
  "Courrier impôts",
  "Factures / devis",
  "Relevé ou estimation des dettes",
  "Identifiants ou accès bloqués",
];

export function TnsAnalysePage() {
  return (
    <main className="page-shell tns-page tns-diagnostic-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Diagnostic TNS — où en est la boîte ?</h1>
          <p className="page-intro">
            Une grille courte pour le premier rendez-vous : qualifier la situation,
            repérer les preuves utiles et choisir une prochaine action.
          </p>
        </div>
      </header>

      <section className="page-card tns-focus-card">
        <p className="referentiel-label">Premier rendez-vous</p>
        <h2>On qualifie avant de conseiller</h2>
        <p>
          Le but est de comprendre l’état réel de l’activité : créée ou non,
          active ou non, à jour ou non, viable ou en difficulté.
        </p>
      </section>

      <section className="page-card">
        <h2>Réponses possibles</h2>
        <div className="identity-form-grid tns-select-grid">
          {champsDiagnostic.map((champ) => (
            <label key={champ.label}>
              <span>{champ.label}</span>
              <small>{champ.aide}</small>
              <select defaultValue={champ.options[0]}>
                {champ.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Documents à demander ou vérifier</h2>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {documentsUtiles.map((document) => (
            <span key={document}>{document}</span>
          ))}
        </div>
      </section>

      <section className="page-card">
        <h2>Note courte du rendez-vous</h2>
        <label className="insertis-summary-field">
          <span>Ce qu’on retient</span>
          <textarea
            rows="5"
            placeholder="Ex. Micro-entreprise créée mais peu active. CA à retrouver. Courrier URSSAF incompris. Prochaine action : revenir avec identifiants URSSAF et dernier courrier."
          />
        </label>
      </section>

      <section className="page-card">
        <h2>Prochaine action concrète</h2>
        <div className="identity-form-grid">
          <label>
            <span>Responsable</span>
            <select defaultValue="À définir">
              <option>À définir</option>
              <option>Personne accompagnée</option>
              <option>Référente parcours</option>
              <option>Appui TNS</option>
              <option>Partenaire externe</option>
            </select>
          </label>
          <label>
            <span>Date ou échéance</span>
            <input type="date" />
          </label>
        </div>
        <label className="insertis-summary-field">
          <span>Action prévue</span>
          <textarea
            rows="4"
            placeholder="Une action claire : document à apporter, déclaration à vérifier, appel à faire, rendez-vous à programmer..."
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
