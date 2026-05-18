import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import { ROLE_PROFESSIONNELLE } from "../auth/roles";

const colleguesFictifs = [
  {
    id: "referente-parcours",
    nom: "Référente de parcours",
    statut: "Absence temporaire",
    resume: "Relais à assurer sur plusieurs dossiers avec échéances proches.",
    dossiers: [
      {
        id: "a-1",
        titre: "Dossier test 1",
        etat: "Justificatif attendu",
        derniereAction: "Dossier ouvert / premier point réalisé.",
        prochaineAction: "Relancer la personne sur le justificatif manquant.",
        documentAttendu: "Justificatif à préciser selon la situation.",
        relaisMobilise: "Accueil informé du passage possible.",
        niveauVigilance: "Moyen — échéance proche à surveiller.",
        dateMiseAJour: "À actualiser lors de la reprise.",
      },
      {
        id: "a-2",
        titre: "Dossier test 2",
        etat: "Repères à compléter",
        derniereAction: "Repères d’autonomie commencés.",
        prochaineAction: "Programmer un temps court pour compléter les repères.",
        documentAttendu: "Aucun document identifié à ce stade.",
        relaisMobilise: "Aucun relais externe engagé.",
        niveauVigilance: "Faible — suivi à planifier.",
        dateMiseAJour: "À actualiser après le prochain contact.",
      },
    ],
  },
  {
    id: "professionnelle-relais",
    nom: "Professionnelle en relais",
    statut: "Relais ponctuel",
    resume: "Relais court, principalement pour sécuriser une prochaine étape.",
    dossiers: [
      {
        id: "b-1",
        titre: "Dossier test 3",
        etat: "Orientation partenaire à confirmer",
        derniereAction: "Orientation envisagée, accord à vérifier.",
        prochaineAction: "Vérifier l’accord de la personne avant orientation.",
        documentAttendu: "Aucun document attendu avant accord.",
        relaisMobilise: "Partenaire à confirmer.",
        niveauVigilance: "Moyen — ne pas transmettre sans accord.",
        dateMiseAJour: "À actualiser avant orientation.",
      },
    ],
  },
  {
    id: "dossiers-a-repartir",
    nom: "Dossiers à répartir",
    statut: "Continuité à organiser",
    resume: "Dossiers sans relais confirmé à court terme.",
    dossiers: [
      {
        id: "c-1",
        titre: "Dossier test 4",
        etat: "Prochaine étape à clarifier",
        derniereAction: "Situation repérée comme nécessitant une reprise.",
        prochaineAction: "Identifier l’action minimale utile pour éviter la rupture.",
        documentAttendu: "À préciser si un justificatif est nécessaire.",
        relaisMobilise: "Relais interne à désigner.",
        niveauVigilance: "À qualifier — risque de rupture à vérifier.",
        dateMiseAJour: "À actualiser dès attribution du relais.",
      },
    ],
  },
];

const elementsVisibles = [
  "Dernière action connue",
  "Prochaine action utile",
  "Document attendu",
  "Relais mobilisé",
  "Niveau de vigilance",
  "Date de mise à jour",
];

const elementsProteges = [
  "Brouillons personnels",
  "Hypothèses sensibles",
  "Notes de posture non nécessaires",
  "Éléments non proportionnés à la reprise du suivi",
];

export function ContinuiteServicePage() {
  const { setCurrentRole } = useRole();
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
          Elle sert à vérifier la logique de reprise lorsqu’une professionnelle
          est absente, indisponible ou en relais temporaire.
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
                  <p><strong>Dernière action connue :</strong> {dossier.derniereAction}</p>
                  <p><strong>Prochaine action utile :</strong> {dossier.prochaineAction}</p>
                  <p><strong>Document attendu :</strong> {dossier.documentAttendu}</p>
                  <p><strong>Relais mobilisé :</strong> {dossier.relaisMobilise}</p>
                  <p><strong>Niveau de vigilance :</strong> {dossier.niveauVigilance}</p>
                  <p><strong>Date de mise à jour :</strong> {dossier.dateMiseAJour}</p>
                </div>

                <Link
                  className="secondary-button"
                  to="/parcours-social-socio-professionnel/dossier/continuite"
                  onClick={() => setCurrentRole(ROLE_PROFESSIONNELLE)}
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
