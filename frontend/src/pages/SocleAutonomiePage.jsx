import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { referentielMetropoleLyon } from "../data/referentielMetropoleLyon";

const STORAGE_KEY = "artag-reperes-autonomie-brouillon";

const questionsParDomaine = {
  Logement: "Pour votre logement ou votre lieu de vie, qu’est-ce qui facilite ou bloque les démarches aujourd’hui ?",
  "Santé / handicap": "Pour votre santé, vos soins ou une situation de handicap, de quoi faut-il tenir compte dans le parcours ?",
  "Organisation familiale": "Avec l’organisation familiale, les enfants ou les proches, qu’est-ce qui peut faciliter ou limiter vos démarches ?",
  Mobilité: "Pour vous déplacer vers les rendez-vous, les démarches, la formation ou l’emploi, ça se passe comment ?",
  "Budget et finances": "Pour le budget, les factures ou les droits, quels sont les points à sécuriser ?",
  Linguistique: "Pour comprendre, parler, lire ou écrire en français, qu’est-ce qui est facile ou difficile ?",
  "Numérique et accès aux droits": "Pour les démarches en ligne, les comptes CAF / France Travail / administratifs, vous vous y retrouvez comment ?",
  "Rapport à soi et à autrui": "Dans la confiance, la relation aux autres ou la mise en mouvement, qu’est-ce qui aide ou freine aujourd’hui ?",
  "Projet professionnel": "Pour l’activité, la formation ou l’emploi, où en est votre projet aujourd’hui ?",
};

const questionsSocle = referentielMetropoleLyon.domainesDiagnostic.map((domaine) => ({
  id: domaine
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  axe: domaine,
  question: questionsParDomaine[domaine] || "Qu’est-ce qui est important à prendre en compte sur ce point ?",
}));

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
    return "Le diagnostic peut se faire progressivement. L’objectif est de comprendre la situation sans tout régler aujourd’hui.";
  }

  const pointsAccessibles = renseignees.filter((item) => item.reponse === "Ça va").length;
  const pointsAvecAppui = renseignees.filter((item) => item.reponse === "Avec un peu d’aide").length;
  const pointsDifficiles = renseignees.filter(
    (item) =>
      item.reponse === "C’est difficile" ||
      item.reponse === "Je n’y arrive pas en ce moment",
  ).length;

  if (pointsAccessibles >= 4 && pointsDifficiles === 0) {
    return "Plusieurs domaines semblent déjà tenus. Cela donne une base solide pour organiser les étapes du parcours.";
  }

  if (pointsDifficiles >= 2) {
    return "L’échange fait ressortir des points à sécuriser. La suite doit être priorisée par étapes, avec un appui adapté.";
  }

  if (pointsAvecAppui > 0 || pointsDifficiles > 0) {
    return "Le diagnostic montre des points d’appui et des points à soutenir. La prochaine étape consiste à choisir les actions utiles.";
  }

  return "Les éléments recueillis donnent une base utile pour préparer le contrat, les étapes et l’actualisation du parcours.";
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

    setMessage(`Domaine noté : ${item.axe}`);
  }

  function enregistrerEchange() {
    const updated = {
      ...reperes,
      derniereValidation: dateDuJour,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setReperes(updated);
    setMessage("Le diagnostic commun a été enregistré.");
  }

  return (
    <main className={`page-shell reperes-page diagnostic-page ${modePartage ? "is-share-mode" : ""}`}>
      <header className="page-header page-header-simple reperes-header">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />

        <div>
          <p className="referentiel-label">Référentiel Métropole de Lyon</p>
          <h1>Diagnostic commun</h1>
          <p className="page-intro">
            Explorer les 9 domaines du référentiel pour comprendre les besoins, les freins,
            les points d’appui et préparer les étapes du parcours.
          </p>
        </div>
      </header>

      <section className="reperes-share-bar">
        <button
          className={modePartage ? "primary-button" : "secondary-button"}
          type="button"
          onClick={() => setModePartage((current) => !current)}
        >
          {modePartage ? "Quitter le mode partage" : "Mode échange avec la personne"}
        </button>

        <p>
          En mode échange, l’écran reste centré sur les questions utiles avec la personne.
          Les analyses professionnelles et hypothèses sensibles restent dans le dossier réservé.
        </p>
      </section>

      <section className="reperes-summary">
        <div>
          <strong>{questionsNotees.length} / {questionsSocle.length}</strong>
          <span> domaines notés</span>
        </div>

        <p>Dernier enregistrement : {reperes.derniereValidation || "Non enregistré"}</p>
      </section>

      <section className="reperes-positive-card">
        <p className="referentiel-label">Objectif ergonomique</p>
        <h2>Du diagnostic vers le contrat et les étapes</h2>
        <p>{messagePositif}</p>
      </section>

      <section className="reperes-positive-card">
        <p className="referentiel-label">Points à formaliser</p>
        <h2>Ce qui devra être reporté dans Insertis</h2>
        <div className="pilotage-list">
          <p><strong>Diagnostic :</strong> besoins, difficultés, points d’appui et objectifs.</p>
          <p><strong>Contrat :</strong> actions attendues, calendrier, étapes et engagements.</p>
          <p><strong>Actualisation :</strong> évolution du parcours, progression, besoin de réorientation.</p>
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
                  <small>{reponse.valide ? "Noté" : "À explorer"}</small>
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
                  <span>Éléments utiles à la suite du parcours</span>
                  <textarea
                    value={reponse.note}
                    onChange={(event) => updateReponse(item.id, "note", event.target.value)}
                    placeholder="Noter uniquement les éléments utiles, proportionnés et nécessaires au suivi."
                  />
                </label>

                <button className="primary-button reperes-card-button" type="button" onClick={() => noterRepere(item)}>
                  Noter ce domaine
                </button>
              </div>
            </details>
          );
        })}
      </section>

      <section className="reperes-end-actions">
        <button className="primary-button" type="button" onClick={enregistrerEchange}>
          Enregistrer le diagnostic
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
