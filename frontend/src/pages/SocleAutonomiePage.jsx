import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "artag-reperes-autonomie-brouillon";

const questionsSocle = [
  {
    id: "demarches",
    axe: "Démarches / accès aux droits",
    question: "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?",
    definition: "Repérer comment la personne se situe face aux démarches administratives et aux droits.",
    source: "Socle autonomie — question 1 validée.",
    usagePro: "Observer les besoins d’appui sans conclure trop vite à une incapacité.",
    vigilance: "Ne pas confondre difficulté administrative ponctuelle et manque d’autonomie global.",
    moduleParDefaut: "Droits / démarches",
  },
  {
    id: "organisation",
    axe: "Organisation du quotidien",
    question: "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?",
    definition: "Repérer les appuis et les difficultés dans l’organisation quotidienne.",
    source: "Socle autonomie — question 2 validée.",
    usagePro: "Identifier ce qui facilite ou bloque la continuité des démarches.",
    vigilance: "Ne pas juger le mode d’organisation de la personne.",
    moduleParDefaut: "Aucun module",
  },
  {
    id: "budget",
    axe: "Budget / argent",
    question: "Pour gérer l’argent au quotidien, vous vous en sortez comment ?",
    definition: "Repérer la stabilité ou la fragilité dans la gestion de l’argent au quotidien.",
    source: "Socle autonomie — question 3 validée.",
    usagePro: "Distinguer besoin d’information, besoin d’appui et besoin d’orientation.",
    vigilance: "Éviter toute formulation culpabilisante sur l’argent.",
    moduleParDefaut: "Budget",
  },
  {
    id: "sante",
    axe: "Santé / accès aux soins",
    question: "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?",
    definition: "Repérer l’accès effectif aux soins, aux rendez-vous et aux démarches liées à la santé.",
    source: "Socle autonomie — question 4 validée.",
    usagePro: "Identifier les freins pratiques sans poser de diagnostic médical.",
    vigilance: "Ne pas médicaliser la situation ni remplacer l’avis des professionnels de santé.",
    moduleParDefaut: "Santé",
  },
  {
    id: "mobilite",
    axe: "Mobilité / déplacements",
    question: "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?",
    definition: "Repérer les possibilités et freins de déplacement dans la vie quotidienne.",
    source: "Socle autonomie — question 5 validée.",
    usagePro: "Relier la mobilité aux démarches, rendez-vous, soins, formation ou activité.",
    vigilance: "Ne pas réduire la mobilité à la possession d’un véhicule.",
    moduleParDefaut: "Mobilité",
  },
  {
    id: "ecritNumerique",
    axe: "Écrit / numérique",
    question: "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?",
    definition: "Repérer les appuis ou difficultés avec l’écrit, les documents et les démarches numériques.",
    source: "Socle autonomie — question 6 validée.",
    usagePro: "Identifier si un accompagnement, une médiation ou un relais est utile.",
    vigilance: "Ne pas exposer la personne ni la mettre en difficulté sur la lecture ou l’écriture.",
    moduleParDefaut: "Écrit / illettrisme",
  },
  {
    id: "vieFamiliale",
    axe: "Vie familiale / disponibilité",
    question: "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?",
    definition: "Repérer l’impact de la vie familiale sur la disponibilité et les démarches.",
    source: "Socle autonomie — question 7 validée.",
    usagePro: "Comprendre les contraintes sans les transformer en jugement.",
    vigilance: "Respecter la place de la famille et la singularité des équilibres.",
    moduleParDefaut: "Vie familiale",
  },
  {
    id: "projet",
    axe: "Projet / mise en mouvement",
    question: "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?",
    definition: "Repérer la capacité actuelle à engager ou poursuivre une démarche personnelle.",
    source: "Socle autonomie — question 8 validée.",
    usagePro: "Identifier les points d’appui et les conditions de mise en mouvement.",
    vigilance: "Ne pas confondre temporalité de la personne et absence de projet.",
    moduleParDefaut: "Projet professionnel détaillé",
  },
];

const niveaux = [
  "À préciser",
  "plutôt stabilisé",
  "à surveiller",
  "fragile",
  "très fragile",
];

const modules = [
  "Aucun module",
  "Droits / démarches",
  "Habitat / parcours résidentiel",
  "TNS",
  "Budget",
  "Santé",
  "Écrit / illettrisme",
  "Numérique",
  "Mobilité",
  "Vie familiale",
  "Projet professionnel détaillé",
];

const decisionsModule = [
  "non ouvert à ce stade",
  "suggéré",
  "recommandé",
  "ouvert",
  "reporté",
];

const initialReperes = {
  reponses: {},
  synthese: "",
  derniereValidation: "",
};

function getInitialReperes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialReperes, ...JSON.parse(saved) } : initialReperes;
  } catch {
    return initialReperes;
  }
}

function DidacticPanel({ item }) {
  return (
    <details className="socle-didactic">
      <summary>Repères pro</summary>
      <div className="socle-didactic-grid">
        <div>
          <strong>Définition</strong>
          <p>{item.definition}</p>
        </div>
        <div>
          <strong>Source</strong>
          <p>{item.source}</p>
        </div>
        <div>
          <strong>Usage pro</strong>
          <p>{item.usagePro}</p>
        </div>
        <div>
          <strong>Vigilance</strong>
          <p>{item.vigilance}</p>
        </div>
      </div>
    </details>
  );
}

export function SocleAutonomiePage() {
  const [reperes, setReperes] = useState(getInitialReperes);
  const [message, setMessage] = useState("");

  const dateDuJour = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR");
  }, []);

  const questionsValidees = questionsSocle.filter((item) => {
    return reperes.reponses[item.id]?.valide;
  });

  function getReponse(id, moduleParDefaut) {
    return {
      note: "",
      niveau: "À préciser",
      module: moduleParDefaut,
      decisionModule: "non ouvert à ce stade",
      valide: false,
      ...(reperes.reponses[id] || {}),
    };
  }

  function updateReponse(id, field, value) {
    setReperes((current) => ({
      ...current,
      reponses: {
        ...current.reponses,
        [id]: {
          ...(current.reponses[id] || {}),
          [field]: value,
          valide: field === "valide" ? value : false,
        },
      },
    }));
    setMessage("");
  }

  function validerQuestion(item) {
    setReperes((current) => ({
      ...current,
      reponses: {
        ...current.reponses,
        [item.id]: {
          ...getReponse(item.id, item.moduleParDefaut),
          ...(current.reponses[item.id] || {}),
          valide: true,
        },
      },
    }));
    setMessage(`Repère validé : ${item.axe}`);
  }

  function updateSynthese(value) {
    setReperes((current) => ({
      ...current,
      synthese: value,
    }));
    setMessage("");
  }

  function validerReperes() {
    const updated = {
      ...reperes,
      derniereValidation: dateDuJour,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setReperes(updated);
    setMessage("Repères d’autonomie validés et conservés dans ce navigateur.");
  }

  return (
    <main className="page-shell socle-page">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>Repères d’autonomie</h1>
          <p className="page-intro">
            Repérage global rapide. Ces repères ne remplacent pas l’approfondissement ; ils le préparent.
          </p>
        </div>
      </header>

      <section className="socle-status-card">
        <div>
          <strong>{questionsValidees.length} / {questionsSocle.length}</strong>
          <span> repères validés</span>
        </div>
        <p>Dernière validation : {reperes.derniereValidation || "Non validé"}</p>
      </section>

      {message && <p className="validation-message">{message}</p>}

      <section className="socle-list">
        {questionsSocle.map((item, index) => {
          const reponse = getReponse(item.id, item.moduleParDefaut);

          return (
            <article className={`page-card socle-question-card ${reponse.valide ? "is-valid" : ""}`} key={item.id}>
              <div className="socle-question-top">
                <span className="socle-question-number">{index + 1}</span>
                <div>
                  <h2>{item.axe}</h2>
                  <p className="socle-oral-question">{item.question}</p>
                  <DidacticPanel item={item} />
                </div>
              </div>

              <div className="socle-fields-grid">
                <label className="socle-field socle-field-wide">
                  <span>Note professionnelle</span>
                  <textarea
                    value={reponse.note}
                    onChange={(event) => updateReponse(item.id, "note", event.target.value)}
                    placeholder="Éléments utiles à la continuité du suivi, sans note sensible."
                  />
                </label>

                <label className="socle-field">
                  <span>Lecture professionnelle de l’axe</span>
                  <select
                    value={reponse.niveau}
                    onChange={(event) => updateReponse(item.id, "niveau", event.target.value)}
                  >
                    {niveaux.map((niveau) => (
                      <option key={niveau} value={niveau}>
                        {niveau}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="socle-field">
                  <span>Module éventuellement concerné</span>
                  <select
                    value={reponse.module}
                    onChange={(event) => updateReponse(item.id, "module", event.target.value)}
                  >
                    {modules.map((module) => (
                      <option key={module} value={module}>
                        {module}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="socle-field">
                  <span>Décision professionnelle</span>
                  <select
                    value={reponse.decisionModule}
                    onChange={(event) => updateReponse(item.id, "decisionModule", event.target.value)}
                  >
                    {decisionsModule.map((decision) => (
                      <option key={decision} value={decision}>
                        {decision}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button className="primary-button socle-card-button" type="button" onClick={() => validerQuestion(item)}>
                Valider ce repère
              </button>
            </article>
          );
        })}
      </section>

      <section className="page-card socle-final-card">
        <h2>Synthèse courte des repères</h2>
        <p className="section-help">
          Cette synthèse aide à préparer la suite du parcours. Elle ne remplace pas les modules d’approfondissement.
        </p>

        <textarea
          className="socle-final-textarea"
          value={reperes.synthese}
          onChange={(event) => updateSynthese(event.target.value)}
          placeholder="Points d’appui, fragilités à surveiller, modules éventuellement utiles, prochaine étape..."
        />

        <button className="primary-button socle-final-button" type="button" onClick={validerReperes}>
          Valider les repères d’autonomie
        </button>
      </section>

      <Link className="secondary-button socle-return-button" to="/parcours-social-socio-professionnel/dossier">
        Retour au dossier
      </Link>
    </main>
  );
}
