import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-dossier-parcours-brouillon";
const REPERES_STORAGE_KEY = "artag-reperes-autonomie-brouillon";

const statutsParcours = [
  "À créer",
  "Dossier ouvert",
  "Repères d’autonomie à compléter",
  "Parcours en cours",
  "Appui TNS à évaluer",
  "Appui TNS en cours",
  "En attente d’élément",
  "En veille",
  "À réorienter",
  "Clôturé",
];

const referentes = [
  "Aurore",
  "Gaëlle",
  "Héloïse",
  "Mylène",
  "Shana",
  "Référente à préciser",
];

const questionsSocle = [
  { id: "demarches", axe: "Démarches / accès aux droits", modulePrincipal: "Droits / démarches" },
  { id: "organisation", axe: "Organisation du quotidien", modulePrincipal: "" },
  { id: "budget", axe: "Budget / argent", modulePrincipal: "Budget" },
  { id: "sante", axe: "Santé / accès aux soins", modulePrincipal: "Santé" },
  { id: "mobilite", axe: "Mobilité / déplacements", modulePrincipal: "Mobilité" },
  { id: "ecritNumerique", axe: "Écrit / numérique", modulePrincipal: "Écrit / illettrisme" },
  { id: "vieFamiliale", axe: "Vie familiale / disponibilité", modulePrincipal: "Vie familiale" },
  { id: "projet", axe: "Projet / mise en mouvement", modulePrincipal: "Projet professionnel détaillé" },
];

const scoreParReponse = {
  "Ça va": 3,
  "Avec un peu d’aide": 2,
  "C’est difficile": 1,
  "Je n’y arrive pas en ce moment": 0,
};

const initialDossier = {
  numeroInsertis: "",
  numeroArtag: "",
  nom: "",
  prenom: "",
  statut: "Dossier ouvert",
  referente: "Référente à préciser",
  dateOuverture: "",
  derniereMiseAJour: "",
};

function getInitialDossier() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialDossier, ...JSON.parse(saved) } : initialDossier;
  } catch {
    return initialDossier;
  }
}

function getInitialReperes() {
  try {
    const saved = localStorage.getItem(REPERES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { reponses: {}, derniereValidation: "" };
  } catch {
    return { reponses: {}, derniereValidation: "" };
  }
}

function normaliserTexte(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formaterListe(items) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0].toLowerCase();
  }

  return `${items.slice(0, -1).map((item) => item.toLowerCase()).join(", ")} et ${items[items.length - 1].toLowerCase()}`;
}

function getAxesRenseignes(reperes) {
  return questionsSocle
    .map((item) => {
      const reponse = reperes.reponses?.[item.id] || {};
      const score = scoreParReponse[reponse.reponse];

      return {
        ...item,
        reponse: reponse.reponse || "À choisir",
        note: reponse.note || "",
        score: typeof score === "number" ? score : null,
      };
    })
    .filter((item) => item.reponse !== "À choisir" || item.note.trim());
}

function calculerLectureAutonomie(reperes) {
  const axes = getAxesRenseignes(reperes);
  const scores = axes
    .map((item) => item.score)
    .filter((score) => typeof score === "number");

  if (scores.length === 0) {
    return {
      niveau: "à préciser",
      phrase: "Les repères renseignés ne permettent pas encore de situer clairement l’autonomie de la personne.",
      axes,
    };
  }

  const moyenne = scores.reduce((total, score) => total + score, 0) / scores.length;
  const tresFragiles = axes.filter((item) => item.score === 0);
  const fragiles = axes.filter((item) => item.score === 1);

  if (tresFragiles.length > 0 || moyenne < 1) {
    return {
      niveau: "appui renforcé à organiser",
      phrase: "Les échanges font apparaître plusieurs besoins de sécurisation sur des aspects concrets du parcours. Un appui rapproché peut être proposé pour soutenir la compréhension, l’organisation et la mise en œuvre des démarches, sans conclure à une incapacité de la personne.",
      axes,
    };
  }

  if (fragiles.length >= 2 || moyenne < 1.8) {
    return {
      niveau: "appui structuré à prévoir",
      phrase: "Plusieurs repères nécessitent un accompagnement structuré afin de soutenir la priorisation, la compréhension des étapes et la mise en action dans le parcours.",
      axes,
    };
  }

  if (moyenne < 2.6) {
    return {
      niveau: "à surveiller",
      phrase: "L’autonomie est mobilisable, mais elle dépend de conditions d’appui. La personne peut avancer lorsque les étapes sont clarifiées, priorisées et rendues concrètes.",
      axes,
    };
  }

  return {
    niveau: "plutôt stabilisé",
    phrase: "L’autonomie semble plutôt stabilisée sur les repères renseignés. La personne paraît pouvoir comprendre les démarches, faire des choix et engager des actions avec un appui limité.",
    axes,
  };
}

function deduireModulesRecommandes(reperes) {
  const modules = [];

  function ajouter(nom, motif, niveau = "À valider") {
    if (!nom) {
      return;
    }

    const existing = modules.find((item) => item.nom === nom);

    if (existing) {
      existing.motifs = Array.from(new Set([...existing.motifs, motif]));
      existing.niveau =
        existing.niveau === "À valider en priorité" || niveau === "À valider en priorité"
          ? "À valider en priorité"
          : "À valider";
      return;
    }

    modules.push({ nom, niveau, motifs: [motif] });
  }

  getAxesRenseignes(reperes).forEach((item) => {
    const note = normaliserTexte(item.note);

    if (item.score === 2 && item.modulePrincipal) {
      ajouter(item.modulePrincipal, `${item.axe} est à surveiller et peut nécessiter un appui ponctuel.`, "À valider");
    }

    if ((item.score === 1 || item.score === 0) && item.modulePrincipal) {
      ajouter(item.modulePrincipal, `${item.axe} appelle un appui prioritaire pour sécuriser la continuité du parcours.`, "À valider en priorité");
    }

    if (
      (item.id === "demarches" || item.id === "ecritNumerique") &&
      /(numerique|internet|telephone|mail|compte|en ligne|ordinateur|smartphone|application|caf|msa|impot|urssaf)/.test(note)
    ) {
      ajouter("Numérique", "Les éléments recueillis font apparaître un besoin lié aux démarches numériques.", item.score <= 1 ? "À valider en priorité" : "À valider");
    }

    if (
      item.id === "projet" &&
      /(tns|independant|independante|micro|auto|entreprise|chantier|facture|commerce|activite|devis|urssaf)/.test(note)
    ) {
      ajouter("TNS", "Les éléments recueillis évoquent une activité indépendante ou un projet nécessitant un appui spécialisé.", "À valider");
    }

    if (/(logement|habitat|aire|stationnement|terrain|caravane|domicile|bail|loyer|impaye)/.test(note)) {
      ajouter("Habitat / parcours résidentiel", "Les éléments recueillis font apparaître une question liée à l’habitat ou au lieu de vie.", item.score <= 1 ? "À valider en priorité" : "À valider");
    }
  });

  return modules;
}

function genererSyntheseProfessionnelle(reperes) {
  const lecture = calculerLectureAutonomie(reperes);
  const axes = lecture.axes;
  const stabilises = axes.filter((item) => item.score === 3).map((item) => item.axe);
  const aSoutenir = axes.filter((item) => item.score === 2).map((item) => item.axe);
  const vigilances = axes.filter((item) => item.score === 1 || item.score === 0).map((item) => item.axe);
  const notes = axes
    .filter((item) => item.note.trim())
    .map((item) => `Concernant ${item.axe.toLowerCase()}, ${item.note.trim()}`);

  const lignes = [
    "Repères d’autonomie — lecture professionnelle prudente :",
    lecture.phrase,
  ];

  if (stabilises.length > 0) {
    lignes.push("");
    lignes.push(`Points d’appui : ${formaterListe(stabilises)} semblent aujourd’hui plus accessibles et peuvent soutenir la suite du parcours.`);
  }

  if (aSoutenir.length > 0) {
    lignes.push("");
    lignes.push(`Points à soutenir : ${formaterListe(aSoutenir)} peuvent avancer avec un appui ponctuel ou une reprise étape par étape.`);
  }

  if (vigilances.length > 0) {
    lignes.push("");
    lignes.push(`Points de vigilance : ${formaterListe(vigilances)} appellent une attention particulière. Ces éléments peuvent nécessiter un cadre d’appui plus sécurisant, sans conclusion définitive sur la personne.`);
  }

  if (notes.length > 0) {
    lignes.push("");
    lignes.push("Éléments utiles recueillis pendant l’échange :");
    lignes.push(notes.join("\n"));
  }

  lignes.push("");
  lignes.push("Suite utile : prioriser les démarches à partir des points d’appui, sécuriser les points de vigilance et choisir les modules à valider selon ce qui peut réellement aider la personne à comprendre, décider et agir.");

  return lignes.join("\n");
}

function BlocRepliable({ title, children, defaultOpen = true }) {
  return (
    <details className="page-card collapsible-block" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <span className="collapse-indicator">▾</span>
      </summary>
      <div className="collapsible-content">
        {children}
      </div>
    </details>
  );
}

export function DossierPage() {
  const [dossier, setDossier] = useState(getInitialDossier);
  const [reperes] = useState(getInitialReperes);
  const [messageValidation, setMessageValidation] = useState("");

  const dateDuJour = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR");
  }, []);

  const lectureAutonomie = useMemo(() => {
    return calculerLectureAutonomie(reperes);
  }, [reperes]);

  const syntheseProfessionnelle = useMemo(() => {
    return genererSyntheseProfessionnelle(reperes);
  }, [reperes]);

  const modulesRecommandes = useMemo(() => {
    return deduireModulesRecommandes(reperes);
  }, [reperes]);

  function updateDossier(field, value) {
    setDossier((current) => ({
      ...current,
      [field]: value,
    }));
    setMessageValidation("");
  }

  function validerParcours() {
    const dossierValide = {
      ...dossier,
      derniereMiseAJour: dateDuJour,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dossierValide));
    setDossier(dossierValide);
    setMessageValidation("Parcours validé et conservé dans ce navigateur.");
  }

  return (
    <main className="page-shell dossier-page">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Dossier parcours</h1>
          <p className="page-intro">
            Vue de continuité interne — ne remplace pas Insertis.
          </p>
        </div>
      </header>

      <BlocRepliable title="Identité / références">
        <div className="identity-form-grid">
          <label>
            <span>N° Insertis</span>
            <input
              type="text"
              placeholder="Ex. INS-..."
              value={dossier.numeroInsertis}
              onChange={(event) => updateDossier("numeroInsertis", event.target.value)}
            />
          </label>

          <label>
            <span>N° ARTAG</span>
            <input
              type="text"
              placeholder="Ex. ARTAG-..."
              value={dossier.numeroArtag}
              onChange={(event) => updateDossier("numeroArtag", event.target.value)}
            />
          </label>

          <label>
            <span>Nom</span>
            <input
              type="text"
              placeholder="Nom de famille"
              value={dossier.nom}
              onChange={(event) => updateDossier("nom", event.target.value)}
            />
          </label>

          <label>
            <span>Prénom</span>
            <input
              type="text"
              placeholder="Prénom"
              value={dossier.prenom}
              onChange={(event) => updateDossier("prenom", event.target.value)}
            />
          </label>

          <label>
            <span>Statut du parcours</span>
            <select
              value={dossier.statut}
              onChange={(event) => updateDossier("statut", event.target.value)}
            >
              {statutsParcours.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Référente</span>
            <select
              value={dossier.referente}
              onChange={(event) => updateDossier("referente", event.target.value)}
            >
              {referentes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date d’ouverture</span>
            <input
              type="date"
              value={dossier.dateOuverture}
              onChange={(event) => updateDossier("dateOuverture", event.target.value)}
            />
          </label>

          <label>
            <span>Dernière mise à jour</span>
            <input
              type="text"
              value={dossier.derniereMiseAJour || "Non validé"}
              readOnly
            />
          </label>
        </div>

        <div className="identity-actions">
          <button className="primary-button" type="button" onClick={validerParcours}>
            Valider le parcours
          </button>

          {messageValidation && (
            <p className="validation-message">{messageValidation}</p>
          )}
        </div>
      </BlocRepliable>

      <BlocRepliable title="Chemin de parcours">
        <div className="parcours-track">
          <span className="track-step active">Accueil</span>
          <span className="track-step active">Dossier ouvert</span>
          <span className="track-step">Repères d’autonomie</span>
          <span className="track-step">Modules utiles</span>
          <span className="track-step">Synthèse</span>
        </div>
      </BlocRepliable>

      <section className="dossier-layout">
        <div className="dossier-main">
          <BlocRepliable title="Continuité de service">
            <p className="section-help">
              Éléments utiles à la continuité du suivi. Les notes sensibles ne sont pas affichées ici.
            </p>

            <div className="pilotage-list">
              <p><strong>Repères d’autonomie :</strong> {reperes.derniereValidation ? `enregistrés le ${reperes.derniereValidation}` : "à compléter"}</p>
              <p><strong>Synthèse courte :</strong> à consolider à partir de la lecture professionnelle</p>
              <p><strong>Note de continuité :</strong> à vérifier</p>
              <p><strong>Modules ouverts :</strong> aucun module ouvert automatiquement</p>
            </div>

            <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
              Commencer les repères d’autonomie
            </Link>
          </BlocRepliable>

          <BlocRepliable title="Synthèse professionnelle des repères d’autonomie">
            <div className="dossier-autonomie-summary">
              <p><strong>Lecture interne :</strong> {lectureAutonomie.niveau}</p>
              <textarea value={syntheseProfessionnelle} readOnly />
            </div>
          </BlocRepliable>

          <BlocRepliable title="Modules utiles à valider">
            {modulesRecommandes.length > 0 ? (
              <div className="dossier-modules-list">
                {modulesRecommandes.map((module) => (
                  <article className="dossier-module-item" key={module.nom}>
                    <div>
                      <strong>{module.nom}</strong>
                      <span>{module.niveau}</span>
                    </div>
                    <ul>
                      {module.motifs.map((motif) => (
                        <li key={motif}>{motif}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="section-help">
                Aucun module recommandé à valider à ce stade. La professionnelle garde la décision finale.
              </p>
            )}
          </BlocRepliable>

          <BlocRepliable title="Relais internes / externes">
            <p className="section-help">
              Espace de repérage des relais utiles. Un relais ne transfère pas tout le dossier ;
              il transmet le juste nécessaire pour sécuriser la suite du parcours.
            </p>

            <div className="dossier-modules-list">
              <article className="dossier-module-item">
                <div>
                  <strong>Relais internes</strong>
                  <span>À mobiliser si nécessaire</span>
                </div>
                <ul>
                  <li>Accueil : information simple, rendez-vous, document attendu ou passage à signaler.</li>
                  <li>Relais logement / habitat : situation d’habitat ou de lieu de vie ayant un impact sur le parcours.</li>
                </ul>
              </article>

              <article className="dossier-module-item">
                <div>
                  <strong>Relais externes</strong>
                  <span>Selon le besoin repéré</span>
                </div>
                <ul>
                  <li>CAF, CPAM, France Travail, Maison de la Métropole.</li>
                  <li>URSSAF, impôts, ADL selon conditions d’orientation.</li>
                  <li>Partenaires santé, mobilité, budget, formation ou logement selon la situation.</li>
                </ul>
              </article>
            </div>

            <p className="section-help">
              Toute orientation doit être expliquée à la personne, proportionnée au besoin,
              et suivie dans la continuité du parcours.
            </p>
          </BlocRepliable>
          <BlocRepliable title="Synthèse transférable vers Insertis">
            <p className="section-help">
              Synthèse courte destinée à être copiée dans Insertis. Elle ne remplace pas l’analyse professionnelle et doit être ajustée avant transfert.
            </p>

            <label className="insertis-summary-field">
              <span>Synthèse courte</span>
              <textarea
                id="synthese-insertis"
                rows="8"
                defaultValue={genererSyntheseProfessionnelle(reperes)}
                aria-label="Synthèse transférable vers Insertis"
              />
            </label>

            <div className="identity-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  const zone = document.getElementById("synthese-insertis");
                  if (zone) {
                    navigator.clipboard.writeText(zone.value);
                  }
                }}
              >
                Copier la synthèse
              </button>
            </div>

            <p className="section-help">
              Cette synthèse est une aide à la rédaction. Elle doit être relue et ajustée par la professionnelle avant transfert dans Insertis.
            </p>
          </BlocRepliable>
          <BlocRepliable title="Alertes continuité / prochaines étapes">
            <div className="pilotage-list">
              <p><strong>Priorité :</strong> clarifier la demande principale</p>
              <p><strong>Action suivante :</strong> programmer ou finaliser les repères d’autonomie</p>
              <p><strong>Point à ne pas oublier :</strong> reporter les éléments officiels dans Insertis</p>
            </div>
          </BlocRepliable>
        </div>

        <aside className="dossier-side">
          <BlocRepliable title="Repères rapides">
            <div className="status-stack">
              <span>Parcours : {dossier.statut}</span>
              <span>Référente : {dossier.referente}</span>
              <span>Repères : {reperes.derniereValidation ? "enregistrés" : "à compléter"}</span>
              <span>Insertis : à vérifier</span>
            </div>
          </BlocRepliable>

          <BlocRepliable title="Appui TNS">
            <p><strong>Statut :</strong> non évalué</p>
            <p><strong>Besoin :</strong> à préciser si concerné</p>
            <p className="section-help">
              L’appui TNS complète le parcours. Il ne remplace pas le suivi global.
            </p>
          </BlocRepliable>

          <BlocRepliable title="Historique / traçabilité">
            <p><strong>Aujourd’hui :</strong> dossier ouvert</p>
            <p><strong>À suivre :</strong> repères d’autonomie</p>
          </BlocRepliable>

          <Link className="secondary-button dossier-return-button" to="/parcours-social-socio-professionnel">
            Retour aux parcours
          </Link>
        </aside>
      </section>
    </main>
  );
}


