import { Link, Navigate, useParams } from "react-router-dom";
import { modulesDomainesTravail } from "../data/modulesDomainesTravail";

const priorites = ["À qualifier", "Faible", "Moyen", "Fort", "Urgent"];

function ChampTexte({ label, placeholder, rows = 4 }) {
  return (
    <label className="insertis-summary-field">
      <span>{label}</span>
      <textarea rows={rows} placeholder={placeholder} />
    </label>
  );
}

export function ModuleDomainePage() {
  const { moduleId } = useParams();
  const module = modulesDomainesTravail.find((item) => item.id === moduleId);

  if (!module) {
    return <Navigate to="/parcours-social-socio-professionnel/dossier" replace />;
  }

  return (
    <main className="page-shell dossier-page dossier-referentiel module-domaine-page">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <p className="referentiel-label">Module de travail</p>
          <h1>{module.titre}</h1>
          <p className="page-intro">{module.finalite}</p>
        </div>
      </header>

      <section className="page-card dossier-referentiel-banner">
        <p className="referentiel-label">Objectiver sans rigidifier</p>
        <h2>Organiser le travail réel sur ce domaine</h2>
        <p>
          Ce module aide à distinguer ce qui est exprimé, observé, vérifié,
          à clarifier la priorité et à préparer une suite de parcours utile.
          Il ne remplace ni la relation d’aide, ni le jugement professionnel.
        </p>
      </section>

      <section className="dossier-layout">
        <div className="dossier-main">
          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>1. Situation actuelle</h2>
              <ChampTexte
                label="Ce que la personne exprime"
                placeholder="Noter les éléments formulés par la personne, avec ses mots quand c’est utile."
              />
              <ChampTexte
                label="Ce qui est observé / connu"
                placeholder="Noter les faits utiles, sans hypothèse inutile ni information sensible non nécessaire."
              />
            </div>
          </section>

          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>2. Appuis, freins et éléments objectivables</h2>
              <ChampTexte
                label="Forces / appuis"
                placeholder="Ressources de la personne, de la famille, du réseau, du territoire, démarches déjà réalisées."
              />
              <ChampTexte
                label="Freins / vigilances"
                placeholder="Points qui bloquent, fragilisent ou nécessitent une attention particulière."
              />
              <ChampTexte
                label="Éléments objectivables"
                placeholder="Dates, documents, droits ouverts, démarches faites, rendez-vous, partenaires contactés."
              />
            </div>
          </section>

          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>3. Priorité, actions et relais</h2>
              <div className="identity-form-grid">
                <label>
                  <span>Niveau de priorité</span>
                  <select defaultValue="À qualifier">
                    {priorites.map((priorite) => (
                      <option key={priorite} value={priorite}>{priorite}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Échéance / date à surveiller</span>
                  <input type="date" />
                </label>
              </div>

              <ChampTexte
                label="Actions possibles à décider avec la personne"
                placeholder="Lister les actions réalistes, étape par étape."
              />
              <ChampTexte
                label="Relais / partenaires"
                placeholder="Relais internes ARTAG ou partenaires de droit commun utiles."
              />
              <ChampTexte
                label="Suite prévue"
                placeholder="Prochaine action, responsable, échéance, point à vérifier."
              />
            </div>
          </section>

          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>4. Synthèse utile</h2>
              <ChampTexte
                label="Synthèse courte transférable vers Insertis"
                rows={6}
                placeholder="Formulation courte, factuelle, proportionnée, utile à la formalisation institutionnelle."
              />
              <ChampTexte
                label="Espace professionnel réservé"
                rows={5}
                placeholder="Hypothèses, éléments sensibles ou notes de posture. Non visible en relais simple."
              />
            </div>
          </section>
        </div>

        <aside className="dossier-side">
          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>À objectiver</h2>
              <ul>
                {module.elementsObjectivables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>Indicateurs simples</h2>
              <ul>
                {module.indicateursSimples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="page-card collapsible-block" open="">
            <div className="collapsible-content">
              <h2>Relais possibles</h2>
              <div className="status-stack">
                {module.relaisPossibles.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>

          <Link className="secondary-button dossier-return-button" to="/parcours-social-socio-professionnel/dossier">
            Retour au dossier
          </Link>
        </aside>
      </section>
    </main>
  );
}
