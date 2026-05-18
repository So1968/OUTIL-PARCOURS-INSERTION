import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const colleguesFictifs = [
  {
    id: "collegue-a",
    nom: "Collègue A",
    statut: "Absence temporaire",
    resume: "Relais à assurer sur plusieurs dossiers avec échéances proches.",
    dossiers: [
      {
        id: "a-1",
        titre: "Dossier test 1",
        etat: "Justificatif attendu",
        synthese: "La situation est suivie. Un document reste attendu pour poursuivre.",
        prochaineAction: "Relancer la personne sur le justificatif manquant.",
        echeance: "Cette semaine",
        relais: "Accueil informé du passage possible.",
      },
      {
        id: "a-2",
        titre: "Dossier test 2",
        etat: "Repères à compléter",
        synthese: "Les premiers éléments sont saisis, mais les repères d’autonomie ne sont pas finalisés.",
        prochaineAction: "Programmer un temps court pour compléter les repères.",
        echeance: "À planifier",
        relais: "Aucun relais externe engagé.",
      },
    ],
  },
  {
    id: "collegue-b",
    nom: "Collègue B",
    statut: "Relais ponctuel",
    resume: "Relais court, principalement pour sécuriser une prochaine étape.",
    dossiers: [
      {
        id: "b-1",
        titre: "Dossier test 3",
        etat: "Orientation partenaire à confirmer",
        synthese: "Une orientation est envisagée. La personne doit être recontactée avant transmission.",
        prochaineAction: "Vérifier l’accord de la personne avant orientation.",
        echeance: "Avant prochain rendez-vous",
        relais: "Partenaire à confirmer.",
      },
    ],
  },
  {
    id: "collegue-c",
    nom: "Collègue C",
    statut: "Continuité à organiser",
    resume: "Dossiers sans référente clairement disponible à court terme.",
    dossiers: [
      {
        id: "c-1",
        titre: "Dossier test 4",
        etat: "Prochaine étape à clarifier",
        synthese: "Le parcours ne doit pas rester sans suite. Une prochaine action doit être définie.",
        prochaineAction: "Identifier l’action minimale utile pour éviter la rupture.",
        echeance: "À préciser",
        relais: "Relais interne à désigner.",
      },
    ],
  },
];

const elementsVisibles = [
  "Synthèse courte",
  "Note de continuité",
  "Prochaine action",
  "Échéances",
  "Documents attendus",
  "Relais mobilisés",
];

const elementsProteges = [
  "Brouillons personnels",
  "Hypothèses sensibles",
  "Notes de posture non nécessaires",
  "Éléments non proportionnés à la reprise du suivi",
];

export function ContinuiteServicePage() {
  const [collegueActiveId, setCollegueActiveId] = useState(colleguesFictifs[0].id);

  const collegueActive = useMemo(() => {
    return colleguesFictifs.find((collegue) => collegue.id === collegueActiveId);
  }, [collegueActiveId]);

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

      <section className="page-card continuite-principe">
        <h2>Principe métier</h2>
        <p>
          Cette page est une maquette fonctionnelle avec des données fictives.
          Elle sert à vérifier la logique de reprise lorsqu’une collègue ou un collègue
          est absent, indisponible ou en relais temporaire.
        </p>
        <p>
          <strong>Continuité de service ≠ accès total au bureau privé de la collègue.</strong>
        </p>
      </section>

      <section className="continuite-layout">
        <aside className="page-card continuite-collegues">
          <h2>Choisir un relais</h2>

          <div className="continuite-collegue-list">
            {colleguesFictifs.map((collegue) => (
              <button
                className={collegue.id === collegueActiveId ? "continuite-collegue is-active" : "continuite-collegue"}
                key={collegue.id}
                type="button"
                onClick={() => setCollegueActiveId(collegue.id)}
              >
                <strong>{collegue.nom}</strong>
                <span>{collegue.statut}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="continuite-main">
          <article className="page-card">
            <h2>{collegueActive.nom}</h2>
            <p className="section-help">{collegueActive.resume}</p>
            <p>
              <strong>{collegueActive.dossiers.length}</strong> dossier(s) fictif(s) à reprendre.
            </p>
          </article>

          <div className="continuite-dossiers-grid">
            {collegueActive.dossiers.map((dossier) => (
              <article className="page-card continuite-dossier-card" key={dossier.id}>
                <div className="continuite-dossier-header">
                  <h2>{dossier.titre}</h2>
                  <span>{dossier.etat}</span>
                </div>

                <div className="pilotage-list">
                  <p><strong>Synthèse courte :</strong> {dossier.synthese}</p>
                  <p><strong>Prochaine action :</strong> {dossier.prochaineAction}</p>
                  <p><strong>Échéance :</strong> {dossier.echeance}</p>
                  <p><strong>Relais mobilisé :</strong> {dossier.relais}</p>
                </div>

                <Link
                  className="secondary-button"
                  to="/parcours-social-socio-professionnel/dossier"
                >
                  Reprendre les éléments utiles
                </Link>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="continuite-regles">
        <article className="page-card">
          <h2>Visible en relais</h2>
          <ul>
            {elementsVisibles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="page-card">
          <h2>Non visible automatiquement</h2>
          <ul>
            {elementsProteges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <Link className="back-link" to="/">
        Retour au bureau quotidien
      </Link>
    </main>
  );
}
