import { Link } from "react-router-dom";

const alertesSynthese = [
  {
    niveau: "urgent",
    titre: "Sans étape en cours",
    valeur: "À lancer",
    detail: "Requête Insertis : bénéficiaires dont toutes les étapes ont une date de fin dépassée.",
  },
  {
    niveau: "attention",
    titre: "Contrats à échéance sous 60 jours",
    valeur: "3",
    detail: "Requête Insertis : contrats à échéance à deux mois.",
  },
  {
    niveau: "veille",
    titre: "Sans entretien depuis le 23/04/2026",
    valeur: "4",
    detail: "Requête Insertis : bénéficiaires sans entretien physique individuel depuis la date saisie.",
  },
  {
    niveau: "stable",
    titre: "Dossiers à jour",
    valeur: "À calculer",
    detail: "Dossiers sans alerte immédiate après vérification des requêtes.",
  },
];

const lignesEcheances = [
  {
    personne: "Pierre D.",
    type: "Contrat d’accompagnement",
    source: "Contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Vérifier la date de fin, préparer le renouvellement et noter la prochaine action.",
    statut: "À vérifier",
  },
  {
    personne: "Paul-Kenzo W.",
    type: "Contrat d’accompagnement",
    source: "Contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Contrôler le rendez-vous prévu, la situation actuelle et le besoin de renouvellement.",
    statut: "À vérifier",
  },
  {
    personne: "Troisième situation",
    type: "Contrat d’accompagnement",
    source: "Contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Identifier la personne dans l’export, compléter l’échéance et qualifier la priorité.",
    statut: "À compléter",
  },
  {
    personne: "4 bénéficiaires",
    type: "Entretien à reprogrammer",
    source: "Bénéficiaires sans entretien · depuis le 23/04/2026",
    echeance: "Date critère : 23/04/2026",
    delai: "À traiter",
    priorite: "gold",
    action: "Vérifier s’il existe un entretien téléphonique, collectif ou physique non saisi, puis programmer ou tracer la suite.",
    statut: "À exporter",
  },
  {
    personne: "Bénéficiaires sans étape",
    type: "Étape de parcours absente",
    source: "Bénéficiaires sans étape",
    echeance: "Date à renseigner avant lancement de requête",
    delai: "Rupture possible",
    priorite: "red",
    action: "Lancer la requête avec une date de départ, exporter le résultat et créer une nouvelle étape ou une action de sécurisation.",
    statut: "À lancer",
  },
];

const requetesInsertis = [
  {
    titre: "Contrats à échéance à deux mois",
    resultat: "3 éléments",
    usage: "Anticiper les renouvellements et éviter les fins de contrat non préparées.",
  },
  {
    titre: "Bénéficiaires sans entretien",
    resultat: "4 éléments avec le critère depuis le 23/04/2026",
    usage: "Repérer les personnes sans entretien présent depuis la date saisie et reposer un contact.",
  },
  {
    titre: "Bénéficiaires sans étape",
    resultat: "À lancer après saisie d’une date",
    usage: "Repérer les parcours dont toutes les étapes sont dépassées et recréer une étape en cours.",
  },
];

const reglesRelance = [
  "J+1 : rappel doux si la pièce, l’information ou la décision manque encore.",
  "J+2 : rappel de sécurisation du parcours et de l’échéance.",
  "J+3 : point d’alerte interne si la situation bloque.",
  "J+4 : pause éventuelle pour éviter la sur-sollicitation.",
  "J+5 à J+7 : relance progressive jusqu’à clôture ou décision de relais.",
];

const champsV1 = [
  "Personne suivie",
  "Type d’échéance : contrat, entretien, étape, rendez-vous, document, orientation, formation, saisie Insertis",
  "Source de l’alerte : requête Insertis, rendez-vous, échange, document reçu",
  "Date d’échéance ou date critère de la requête",
  "Niveau de priorité : rouge, orange, jaune, vert",
  "Action attendue et personne responsable",
  "Statut : à faire, en attente, fait, relais nécessaire",
];

export function EcheancesVigilancesPage() {
  return (
    <main className="page-shell vigilance-page">
      <header className="page-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">File active · sécurisation du parcours</p>
          <h1>Échéances et vigilances</h1>
          <p className="page-intro">
            Transformer les requêtes Insertis en tableau de suivi simple : voir ce qui arrive à échéance,
            repérer les absences d’entretien ou d’étape, décider la prochaine action et éviter qu’un point
            important disparaisse dans la charge mentale.
          </p>
        </div>
      </header>

      <section className="vigilance-summary-grid" aria-label="Synthèse des vigilances">
        {alertesSynthese.map((alerte) => (
          <article className={`vigilance-summary-card ${alerte.niveau}`} key={alerte.titre}>
            <strong>{alerte.valeur}</strong>
            <h2>{alerte.titre}</h2>
            <p>{alerte.detail}</p>
          </article>
        ))}
      </section>

      <section className="vigilance-layout">
        <article className="vigilance-panel wide">
          <div className="vigilance-panel-heading">
            <p className="referentiel-label">V1 manuelle · depuis Insertis</p>
            <h2>Points de vigilance issus du tableau de bord</h2>
          </div>

          <div className="vigilance-table" role="table" aria-label="Points de vigilance">
            <div className="vigilance-table-row header" role="row">
              <span>Personne / groupe</span>
              <span>Type</span>
              <span>Délai</span>
              <span>Action utile</span>
              <span>Statut</span>
            </div>
            {lignesEcheances.map((ligne) => (
              <div className="vigilance-table-row" role="row" key={`${ligne.personne}-${ligne.type}`}>
                <span>
                  <strong>{ligne.personne}</strong>
                  <small>{ligne.source}</small>
                </span>
                <span>{ligne.type}</span>
                <span>
                  <b className={`priority-pill ${ligne.priorite}`}>{ligne.delai}</b>
                  <small>{ligne.echeance}</small>
                </span>
                <span>{ligne.action}</span>
                <span>{ligne.statut}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="vigilance-side-stack">
          <article className="vigilance-panel">
            <p className="referentiel-label">Requêtes repérées</p>
            <h2>Tableau de bord Insertis</h2>
            <ul className="vigilance-list">
              {requetesInsertis.map((requete) => (
                <li key={requete.titre}>
                  <strong>{requete.titre}</strong><br />
                  <span>{requete.resultat}</span><br />
                  <small>{requete.usage}</small>
                </li>
              ))}
            </ul>
          </article>

          <article className="vigilance-panel">
            <p className="referentiel-label">Priorisation</p>
            <h2>Lecture rapide</h2>
            <ul className="vigilance-list compact">
              <li><b className="dot red" /> Rouge : rupture ou absence d’étape en cours.</li>
              <li><b className="dot orange" /> Orange : contrat à moins de 60 jours.</li>
              <li><b className="dot gold" /> Jaune : entretien, pièce ou réponse à reprendre.</li>
              <li><b className="dot green" /> Vert : suivi à jour.</li>
            </ul>
          </article>
        </aside>
      </section>

      <section className="vigilance-layout second">
        <article className="vigilance-panel">
          <p className="referentiel-label">Relances progressives</p>
          <h2>Règle de rappel</h2>
          <ul className="vigilance-list">
            {reglesRelance.map((regle) => (
              <li key={regle}>{regle}</li>
            ))}
          </ul>
        </article>

        <article className="vigilance-panel">
          <p className="referentiel-label">Champs V1</p>
          <h2>Ce qu’il faudra saisir</h2>
          <ul className="vigilance-list">
            {champsV1.map((champ) => (
              <li key={champ}>{champ}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="vigilance-note">
        <h2>Articulation avec Insertis</h2>
        <p>
          Insertis reste l’outil officiel. Cette page sert de sas de pilotage personnel : elle aide à voir,
          prioriser et préparer les actions avant ou après la saisie officielle, sans stocker plus
          d’informations sensibles que nécessaire. Les exports de requêtes peuvent ensuite servir à alimenter
          manuellement cette V1.
        </p>
      </section>

      <Link className="back-link" to="/accompagnement-global">
        Retour accompagnement global
      </Link>
    </main>
  );
}
