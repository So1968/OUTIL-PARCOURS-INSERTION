import { Link } from "react-router-dom";

const alertesSynthese = [
  {
    niveau: "urgent",
    titre: "Contrats échus ou sans suite préparée",
    valeur: "0",
    detail: "À vérifier en priorité avant tout renouvellement.",
  },
  {
    niveau: "attention",
    titre: "Contrats à échéance sous 60 jours",
    valeur: "3",
    detail: "Issu de la requête Insertis : contrats à échéance à deux mois.",
  },
  {
    niveau: "veille",
    titre: "Rendez-vous à programmer",
    valeur: "2",
    detail: "Situations à sécuriser avant rupture de parcours.",
  },
  {
    niveau: "stable",
    titre: "Dossiers à jour",
    valeur: "15",
    detail: "Suivis sans alerte immédiate identifiée.",
  },
];

const lignesEcheances = [
  {
    personne: "Pierre D.",
    type: "Contrat d’accompagnement",
    source: "Requête Insertis · contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Vérifier la date de fin, préparer le renouvellement et noter la prochaine action.",
    statut: "À vérifier",
  },
  {
    personne: "Paul-Kenzo W.",
    type: "Contrat d’accompagnement",
    source: "Requête Insertis · contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Contrôler le rendez-vous prévu, la situation actuelle et le besoin de renouvellement.",
    statut: "À vérifier",
  },
  {
    personne: "Troisième situation",
    type: "Contrat d’accompagnement",
    source: "Requête Insertis · contrats à échéance à deux mois",
    echeance: "À compléter depuis Insertis",
    delai: "≤ 60 jours",
    priorite: "orange",
    action: "Identifier la personne dans l’export, compléter l’échéance et qualifier la priorité.",
    statut: "À compléter",
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
  "Type d’échéance : contrat, rendez-vous, document, orientation, formation, saisie Insertis",
  "Date d’échéance ou délai restant",
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
            décider la prochaine action et éviter qu’un contrat, un rendez-vous ou un document attendu
            disparaisse dans la charge mentale.
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
            <h2>Contrats à échéance sous deux mois</h2>
          </div>

          <div className="vigilance-table" role="table" aria-label="Contrats à échéance">
            <div className="vigilance-table-row header" role="row">
              <span>Personne</span>
              <span>Type</span>
              <span>Délai</span>
              <span>Action utile</span>
              <span>Statut</span>
            </div>
            {lignesEcheances.map((ligne) => (
              <div className="vigilance-table-row" role="row" key={ligne.personne}>
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
            <p className="referentiel-label">Repère métier</p>
            <h2>Ce que le module doit éviter</h2>
            <p>
              Une fin de contrat non anticipée, une saisie Insertis oubliée, un rendez-vous non reposé
              ou une pièce attendue qui bloque la continuité du parcours RSA.
            </p>
          </article>

          <article className="vigilance-panel">
            <p className="referentiel-label">Priorisation</p>
            <h2>Lecture rapide</h2>
            <ul className="vigilance-list compact">
              <li><b className="dot red" /> Rouge : rupture ou échéance dépassée.</li>
              <li><b className="dot orange" /> Orange : moins de 60 jours.</li>
              <li><b className="dot gold" /> Jaune : attente ou document manquant.</li>
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
          d’informations sensibles que nécessaire.
        </p>
      </section>

      <Link className="back-link" to="/accompagnement-global">
        Retour accompagnement global
      </Link>
    </main>
  );
}
