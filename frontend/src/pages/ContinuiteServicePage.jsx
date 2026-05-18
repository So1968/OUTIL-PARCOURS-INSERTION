import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRole } from "../auth/RoleContext";
import { ROLE_PROFESSIONNELLE } from "../auth/roles";
import {
  champsSuiviContinuite,
  niveauxVigilanceContinuite,
} from "../data/continuiteModele";
import {
  colleguesContinuiteFictifs,
  elementsProtegesContinuite,
} from "../data/continuiteDossiersFictifs";

const elementsVisibles = champsSuiviContinuite.map((champ) => champ.libelle);



function getNiveauVigilance(niveauId) {
  return niveauxVigilanceContinuite.find((niveau) => niveau.id === niveauId);
}
function getTexteNiveauVigilance(niveauId) {
  const niveau = getNiveauVigilance(niveauId);

  if (!niveau) {
    return "À qualifier";
  }

  return `${niveau.libelle} — ${niveau.consequence}`;
}

function getValeurSuiviContinuite(dossier, champId) {
  const valeurs = {
    "derniere-action": dossier.derniereAction,
    "prochaine-action": dossier.prochaineAction,
    "document-attendu": dossier.documentAttendu,
    "relais-mobilise": dossier.relaisMobilise,
    "niveau-vigilance": getTexteNiveauVigilance(dossier.niveauVigilanceId),
    "date-mise-a-jour": dossier.dateMiseAJour,
  };

  return valeurs[champId] || "À compléter";
}
export function ContinuiteServicePage() {
  const { setCurrentRole } = useRole();
  const [collegueActiveId, setCollegueActiveId] = useState(colleguesContinuiteFictifs[0].id);

  const collegueActive = useMemo(() => {
    return colleguesContinuiteFictifs.find((collegue) => collegue.id === collegueActiveId);
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
            {colleguesContinuiteFictifs.map((collegue) => (
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
                  {champsSuiviContinuite.map((champ) => (
                    <p key={champ.id}>
                      <strong>{champ.libelle} :</strong> {getValeurSuiviContinuite(dossier, champ.id)}
                    </p>
                  ))}
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
            {elementsProtegesContinuite.map((item) => (
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





