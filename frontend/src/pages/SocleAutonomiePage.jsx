import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { referentielMetropoleLyon } from "../data/referentielMetropoleLyon";

const STORAGE_KEY = "artag-reperes-autonomie-brouillon";

const questionsSocle = [
  {
    id: "demarches",
    axe: "Démarches / accès aux droits",
    question: "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?",
  },
  {
    id: "organisation",
    axe: "Organisation du quotidien",
    question: "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?",
  },
  {
    id: "budget",
    axe: "Budget / argent",
    question: "Pour gérer l’argent au quotidien, vous vous en sortez comment ?",
  },
  {
    id: "sante",
    axe: "Santé / accès aux soins",
    question: "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?",
  },
  {
    id: "mobilite",
    axe: "Mobilité / déplacements",
    question: "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?",
  },
  {
    id: "ecritNumerique",
    axe: "Écrit / numérique",
    question: "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?",
  },
  {
    id: "vieFamiliale",
    axe: "Vie familiale / disponibilité",
    question: "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?",
  },
  {
    id: "projet",
    axe: "Projet / mise en mouvement",
    question: "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?",
  },
];

const domainesMetropole = referentielMetropoleLyon.domainesDiagnostic;

const reponsesEntretien = [
  "À choisir",
  "Ça va",
  "Avec un peu d’aide",
  "C’est difficile",
  "Je n’y arrive pas en ce moment",
];

const initialReperes = {
  reponses: {},
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

function getMessagePositif(reponses) {
  const valeurs = Object.values(reponses || {});
  const renseignees = valeurs.filter((item) => item?.reponse && item.reponse !== "À choisir");

  if (renseignees.length === 0) {
    return "On peut prendre le temps de regarder les différents points ensemble, sans obligation de tout régler aujourd’hui.";
  }

  const pointsAccessibles = renseignees.filter((item) => item.reponse === "Ça va").length;
  const pointsAvecAppui = renseignees.filter((item) => item.reponse === "Avec un peu d’aide").length;
  const pointsDifficiles = renseignees.filter(
    (item) =>
      item.reponse === "C’est difficile" ||
      item.reponse === "Je n’y arrive pas en ce moment",
  ).length;

  if (pointsAccessibles >= 4 && pointsDifficiles === 0) {
    return "Plusieurs points semblent déjà bien tenus. Cela donne une bonne base pour organiser la suite tranquillement.";
  }

  if (pointsDifficiles >= 2) {
    return "L’échange permet de repérer les points sur lesquels il ne faut pas rester seul. L’objectif est maintenant de voir ce qui peut aider concrètement, étape par étape.";
  }

  if (pointsAvecAppui > 0 || pointsDifficiles > 0) {
    return "L’échange montre qu’il existe des choses qui avancent déjà, et d’autres qui peuvent être reprises avec un appui adapté.";
  }

  return "Les repères recueillis donnent une base utile pour préparer la suite du parcours, à votre rythme.";
}

export function SocleAutonomiePage() {
  const [reperes, setReperes] = useState(getInitialReperes);
  const [message, setMessage] = useState("");
  const [modePartage, setModePartage] = useState(false);

  const dateDuJour = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR");
  }, []);

  const questionsNotees = questionsSocle.filter((item) => {
    return reperes.reponses[item.id]?.valide;
  });

  const messagePositif = getMessagePositif(reperes.reponses);

  function getReponse(id) {
    return {
      reponse: "À choisir",
      note: "",
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

  function noterRepere(item) {
    setReperes((current) => {
      const updated = {
        ...current,
        reponses: {
          ...current.reponses,
          [item.id]: {
            ...getReponse(item.id),
            ...(current.reponses[item.id] || {}),
            valide: true,
          },
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setMessage(`Repère noté : ${item.axe}`);
  }

  function enregistrerEchange() {
    const updated = {
      ...reperes,
      derniereValidation: dateDuJour,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setReperes(updated);
    setMessage("Les repères ont été enregistrés.");
  }

  return (
    <main className={`page-shell reperes-page ${modePartage ? "is-share-mode" : ""}`}>
      <header className="page-header page-header-simple reperes-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />

        <div>
          <h1>Repères d’autonomie</h1>
          <p className="page-intro">
            Quelques questions pour mieux comprendre la situation actuelle et préparer la suite du parcours.
          </p>
        </div>
      </header>

      <section className="reperes-share-bar">
        <button
          className={modePartage ? "primary-button" : "secondary-button"}
          type="button"
          onClick={() => setModePartage((current) => !current)}
        >
          {modePartage ? "Quitter le mode partage" : "Mode partage avec la personne"}
        </button>

        <p>
          En mode partage, cet écran reste centré sur l’échange avec la personne. Les analyses professionnelles sont dans le dossier.
        </p>
      </section>

      <section className="reperes-summary">
        <div>
          <strong>{questionsNotees.length} / {questionsSocle.length}</strong>
          <span> repères notés</span>
        </div>

        <p>Dernier enregistrement : {reperes.derniereValidation || "Non enregistré"}</p>
      </section>

      <section className="reperes-positive-card">
        <h2>Ce que cet échange permet</h2>
        <p>{messagePositif}</p>
      </section>

      <section className="reperes-positive-card referentiel-complement-card">
        <h2>Grille complémentaire Métropole / Insertis</h2>
        <p>
          Ces domaines servent de repère institutionnel pour relire la situation et préparer la formalisation dans Insertis. Ils complètent les repères d’autonomie, sans les remplacer.
        </p>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {domainesMetropole.map((domaine) => (
            <span key={domaine}>{domaine}</span>
          ))}
        </div>
      </section>

      {message && <p className="validation-message">{message}</p>}

      <section className="reperes-list">
        {questionsSocle.map((item, index) => {
          const reponse = getReponse(item.id);

          return (
            <details
              className={`reperes-card ${reponse.valide ? "is-valid" : ""}`}
              key={item.id}
              open={index === 0}
            >
              <summary className="reperes-card-summary">
                <span className="reperes-number">{index + 1}</span>

                <span className="reperes-title-group">
                  <strong>{item.axe}</strong>
                  <small>{reponse.valide ? "Noté" : "À aborder"}</small>
                </span>
              </summary>

              <div className="reperes-card-body">
                <div className="reperes-question-row">
                  <p className="reperes-question">{item.question}</p>

                  <select
                    className="reperes-question-select"
                    aria-label={`Réponse pour ${item.axe}`}
                    value={reponse.reponse}
                    onChange={(event) => updateReponse(item.id, "reponse", event.target.value)}
                  >
                    {reponsesEntretien.map((choix) => (
                      <option key={choix} value={choix}>
                        {choix}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="reperes-note">
                  <span>Éléments recueillis pendant l’échange</span>
                  <textarea
                    value={reponse.note}
                    onChange={(event) => updateReponse(item.id, "note", event.target.value)}
                    placeholder="Noter uniquement les éléments utiles à la suite du parcours."
                  />
                </label>

                <button className="primary-button reperes-card-button" type="button" onClick={() => noterRepere(item)}>
                  Noter ce repère
                </button>
              </div>
            </details>
          );
        })}
      </section>

      <section className="reperes-end-actions">
        <button className="primary-button" type="button" onClick={enregistrerEchange}>
          Enregistrer l’échange
        </button>

        {!modePartage && (
          <Link className="secondary-button reperes-return-button" to="/parcours-social-socio-professionnel/dossier">
            Retour au dossier professionnel
          </Link>
        )}
      </section>
    </main>
  );
}
