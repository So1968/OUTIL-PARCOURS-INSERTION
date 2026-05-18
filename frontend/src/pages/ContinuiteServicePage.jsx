import { Link } from "react-router-dom";

const colleguesFictifs = [
  {
    nom: "Collègue A",
    statut: "Absence temporaire",
    dossiers: [
      {
        nom: "Dossier test 1",
        synthese: "Synthèse courte à relire.",
        prochaineAction: "Vérifier le justificatif attendu.",
        echeance: "Cette semaine",
      },
      {
        nom: "Dossier test 2",
        synthese: "Repères d’autonomie à compléter.",
        prochaineAction: "Préparer la prochaine rencontre.",
        echeance: "À planifier",
      },
    ],
  },
  {
    nom: "Collègue B",
    statut: "Relais ponctuel",
    dossiers: [
      {
        nom: "Dossier test 3",
        synthese: "Note de continuité à vérifier.",
        prochaineAction: "Confirmer l’orientation partenaire.",
        echeance: "Avant prochain rendez-vous",
      },
    ],
  },
  {
    nom: "Collègue C",
    statut: "Continuité à organiser",
    dossiers: [
      {
        nom: "Dossier test 4",
        synthese: "Situation à reprendre sans rupture.",
        prochaineAction: "Identifier la prochaine étape utile.",
        echeance: "À préciser",
      },
    ],
  },
];

export function ContinuiteServicePage() {
  return (
    <main className="page-shell continuite-page">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Continuité de service</h1>
          <p className="page-intro">
            Reprendre temporairement un suivi sans rupture, avec uniquement les
            éléments nécessaires à la continuité du parcours.
          </p>
        </div>
      </header>

      <section className="page-card">
        <h2>Principe métier</h2>
        <p>
          Cette page est une maquette fonctionnelle avec des données fictives.
          Elle sert à vérifier la logique de reprise d’un dossier lorsqu’une
          collègue ou un collègue est absent, indisponible ou en relais temporaire.
        </p>
        <p>
          <strong>
            Continuité de service ≠ accès total au bureau privé de la collègue.
          </strong>
        </p>
      </section>

      <section className="continuite-grid">
        {colleguesFictifs.map((collegue) => (
          <article className="page-card continuite-card" key={collegue.nom}>
            <h2>{collegue.nom}</h2>
            <p className="section-help">{collegue.statut}</p>

            <div className="pilotage-list">
              {collegue.dossiers.map((dossier) => (
                <div className="continuite-dossier" key={dossier.nom}>
                  <p><strong>{dossier.nom}</strong></p>
                  <p><strong>Synthèse courte :</strong> {dossier.synthese}</p>
                  <p><strong>Prochaine action :</strong> {dossier.prochaineAction}</p>
                  <p><strong>Échéance :</strong> {dossier.echeance}</p>
                </div>
              ))}
            </div>

            <Link
              className="secondary-button"
              to="/parcours-social-socio-professionnel/dossier"
            >
              Reprendre les éléments utiles
            </Link>
          </article>
        ))}
      </section>

      <section className="page-card">
        <h2>Éléments visibles en relais</h2>
        <div className="pilotage-list">
          <p><strong>Synthèse courte :</strong> comprendre rapidement la situation.</p>
          <p><strong>Note de continuité :</strong> poursuivre sans rupture.</p>
          <p><strong>Prochaine action :</strong> savoir quoi faire maintenant.</p>
          <p><strong>Échéances :</strong> dates, documents attendus, rendez-vous.</p>
          <p><strong>Relais mobilisés :</strong> partenaires internes ou externes déjà engagés.</p>
        </div>
      </section>

      <section className="page-card">
        <h2>Éléments non visibles automatiquement</h2>
        <div className="pilotage-list">
          <p><strong>Brouillons personnels :</strong> non transférés automatiquement.</p>
          <p><strong>Hypothèses sensibles :</strong> réservées à l’espace professionnel privé.</p>
          <p><strong>Notes de posture :</strong> visibles seulement si nécessaire et proportionné.</p>
        </div>
      </section>

      <Link className="back-link" to="/">
        Retour au bureau quotidien
      </Link>
    </main>
  );
}
