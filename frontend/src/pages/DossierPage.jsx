import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { champsSuiviContinuite } from "../data/continuiteModele";
import { referentielMetropoleLyon } from "../data/referentielMetropoleLyon";

const STORAGE_KEY = "artag-dossier-parcours-brouillon";
const REPERES_STORAGE_KEY = "artag-reperes-autonomie-brouillon";

const statutsParcours = [
  "À créer",
  "Dossier ouvert",
  "Diagnostic à compléter",
  "Contrat à formaliser",
  "Parcours en cours",
  "Appui TNS à évaluer",
  "Appui TNS en cours",
  "En attente d’élément",
  "En veille",
  "À réorienter",
  "Clôturé",
];

const registresParcours = [
  "À qualifier",
  "Parcours social",
  "Parcours socio-professionnel",
  "Parcours professionnel / France Travail",
  "Réorientation à étudier",
];

const referentes = [
  "Aurore",
  "Gaëlle",
  "Héloïse",
  "Mylène",
  "Shana",
  "Référente à préciser",
];

const moduleParDomaine = {
  Logement: "Habitat / parcours résidentiel",
  "Santé / handicap": "Santé",
  "Organisation familiale": "Vie familiale",
  Mobilité: "Mobilité",
  "Budget et finances": "Budget",
  Linguistique: "Linguistique / FLE",
  "Numérique et accès aux droits": "Numérique / droits / démarches",
  "Rapport à soi et à autrui": "Remobilisation / confiance",
  "Projet professionnel": "Projet professionnel détaillé",
};

const questionsSocle = referentielMetropoleLyon.domainesDiagnostic.map((domaine) => ({
  id: domaine
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  axe: domaine,
  modulePrincipal: moduleParDomaine[domaine] || "",
}));

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
  registreParcours: "À qualifier",
  referente: "Référente à préciser",
  dateOuverture: "",
  derniereMiseAJour: "",
  dateDiagnostic: "",
  dateContrat: "",
  prochaineActualisation: "",
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

    if (/(tns|independant|independante|micro|auto|entreprise|chantier|facture|commerce|activite|devis|urssaf)/.test(note)) {
      ajouter("TNS", "Les éléments recueillis évoquent une activité indépendante ou un projet nécessitant un appui spécialisé.", "À valider");
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
    "Diagnostic commun — lecture professionnelle prudente :",
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
  lignes.push("Suite utile : prioriser les démarches à partir des points d’appui, sécuriser les points de vigilance, choisir les étapes adaptées et reporter les éléments utiles dans Insertis.");

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

export function DossierPage({ mode = "complet" }) {
  const [dossier, setDossier] = useState(getInitialDossier);
  const [reperes] = useState(getInitialReperes);
  const [messageValidation, setMessageValidation] = useState("");
  const isContinuiteMode = mode === "continuite";

  const valeursSuiviContinuite = {
    "derniere-action": "Dossier ouvert / diagnostic commun en cours.",
    "prochaine-action": "Clarifier la demande principale, le registre de parcours et les étapes adaptées.",
    "document-attendu": "À préciser si un justificatif est nécessaire.",
    "relais-mobilise": "Aucun relais confirmé à ce stade.",
    "niveau-vigilance": "À ajuster selon l’échéance, le risque de rupture ou l’urgence sociale.",
    "date-mise-a-jour": "À actualiser lors de chaque reprise ou transmission.",
  };

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
    <main className="page-shell dossier-page dossier-referentiel">
      <header className="page-header page-header-simple">
        <img className="page-logo" src="/logo-artag.png" alt="ARTAG" />
        <div>
          <h1>{isContinuiteMode ? "Dossier partagé / continuité" : "Dossier parcours"}</h1>
          <p className="page-intro">
            {isContinuiteMode
              ? "Vue limitée aux éléments utiles à la reprise temporaire du suivi. Les espaces privés professionnels ne sont pas affichés."
              : "Vue de travail alignée sur les repères Métropole : diagnostic commun, contrat, étapes, actualisation et Insertis."}
          </p>
        </div>
      </header>

      <section className="page-card dossier-referentiel-banner">
        <p className="referentiel-label">Cadre Métropole de Lyon</p>
        <h2>Diagnostic, contrat, étapes et actualisation</h2>
        <p>
          Le dossier aide à structurer le suivi, mais Insertis reste l’outil officiel de diagnostic,
          de contrat, de suivi et de partage du parcours.
        </p>
      </section>

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
            <span>Registre de parcours</span>
            <select
              value={dossier.registreParcours}
              onChange={(event) => updateDossier("registreParcours", event.target.value)}
            >
              {registresParcours.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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
            <span>Date du diagnostic</span>
            <input
              type="date"
              value={dossier.dateDiagnostic}
              onChange={(event) => updateDossier("dateDiagnostic", event.target.value)}
            />
          </label>

          <label>
            <span>Date du contrat</span>
            <input
              type="date"
              value={dossier.dateContrat}
              onChange={(event) => updateDossier("dateContrat", event.target.value)}
            />
          </label>

          <label>
            <span>Prochaine actualisation</span>
            <input
              type="date"
              value={dossier.prochaineActualisation}
              onChange={(event) => updateDossier("prochaineActualisation", event.target.value)}
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
          <span className="track-step active">Orientation</span>
          <span className="track-step active">Diagnostic</span>
          <span className="track-step">Contrat</span>
          <span className="track-step">Étapes</span>
          <span className="track-step">Actualisation</span>
          <span className="track-step">Réorientation si besoin</span>
        </div>
      </BlocRepliable>

      <BlocRepliable title="Diagnostic commun — 9 domaines Métropole" defaultOpen={!isContinuiteMode}>
        <p className="section-help">
          Ces domaines structurent l’évaluation globale de la situation. Ils permettent de repérer les besoins,
          les freins, les points d’appui et les objectifs à formaliser dans Insertis.
        </p>
        <div className="referentiel-domaines-grid dossier-domaines-grid">
          {referentielMetropoleLyon.domainesDiagnostic.map((domaine) => (
            <span key={domaine}>{domaine}</span>
          ))}
        </div>
      </BlocRepliable>

      <section className="dossier-layout">
        <div className="dossier-main">
          <BlocRepliable title="Dossier partagé / continuité">
            <p className="section-help">
              Espace commun utile à la reprise du parcours. Il contient les éléments
              nécessaires à la continuité du suivi, sans afficher les notes sensibles
              ni les brouillons professionnels.
            </p>

            <div className="dossier-modules-list">
              {champsSuiviContinuite.map((champ) => (
                <article className="dossier-module-item" key={champ.id}>
                  <div>
                    <strong>{champ.libelle}</strong>
                    <span>{champ.statut}</span>
                  </div>
                  <p>{valeursSuiviContinuite[champ.id]}</p>
                </article>
              ))}
            </div>

            <div className="pilotage-list">
              <p><strong>Ce qui peut être transmis en relais :</strong> synthèse courte, prochaine action, échéance, document attendu, relais mobilisé.</p>
              <p><strong>Ce qui reste protégé :</strong> brouillons personnels, hypothèses sensibles, notes non nécessaires à la reprise.</p>
            </div>

            <div className="identity-actions">
              <Link className="primary-button" to="/parcours-social-socio-professionnel/socle">
                Compléter le diagnostic
              </Link>

              <Link className="secondary-button" to="/continuite-service">
                Voir la continuité de service
              </Link>
            </div>
          </BlocRepliable>

          {!isContinuiteMode && (
            <BlocRepliable title="Espace professionnel réservé" defaultOpen={false}>
              <p className="section-help">
                Espace strictement interne à la professionnelle. Il soutient le raisonnement,
                la préparation et la posture professionnelle. Ces éléments ne sont pas copiés
                automatiquement dans Insertis et ne sont pas visibles en relais simple.
              </p>

              <div className="pilotage-list">
                <p><strong>Hypothèses de travail :</strong> à formuler prudemment et à réviser au fil du parcours.</p>
                <p><strong>Posture professionnelle :</strong> points d’attention dans la relation d’aide.</p>
                <p><strong>Notes sensibles :</strong> uniquement si elles sont utiles, proportionnées et nécessaires.</p>
                <p><strong>Brouillons :</strong> espace de préparation avant synthèse partageable.</p>
              </div>

              <p className="section-help">
                Principe : le dossier partagé suit la personne ; l’espace professionnel réservé
                soutient le travail de la professionnelle.
              </p>
            </BlocRepliable>
          )}

          {!isContinuiteMode && (
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
          )}

          {!isContinuiteMode && (
            <BlocRepliable title="Synthèse transférable vers Insertis">
              <p className="section-help">
                Synthèse courte destinée à être copiée dans Insertis. Elle ne remplace pas
                l’analyse professionnelle et doit être ajustée avant transfert.
              </p>

              <label className="insertis-summary-field">
                <span>Synthèse courte</span>
                <textarea
                  id="synthese-insertis"
                  rows="8"
                  defaultValue={syntheseProfessionnelle}
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
                Cette synthèse est une aide à la rédaction. Elle doit être relue et ajustée
                par la professionnelle avant transfert dans Insertis.
              </p>
            </BlocRepliable>
          )}

          <BlocRepliable title="Relais / prochaines étapes">
            <p className="section-help">
              Espace de repérage des relais utiles et des actions à ne pas perdre.
              Un relais transmet le juste nécessaire pour sécuriser la suite du parcours.
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

            <div className="pilotage-list">
              <p><strong>Priorité :</strong> clarifier la demande principale.</p>
              <p><strong>Action suivante :</strong> compléter ou actualiser le diagnostic commun.</p>
              <p><strong>Point à ne pas oublier :</strong> reporter les éléments officiels dans Insertis.</p>
            </div>
          </BlocRepliable>
        </div>

        {isContinuiteMode ? (
          <aside className="dossier-side">
            <BlocRepliable title="Vue relais limitée">
              <div className="status-stack">
                <span>Mode : continuité de service</span>
                <span>Accès : éléments utiles uniquement</span>
                <span>Registre : {dossier.registreParcours}</span>
                <span>Diagnostic : {dossier.dateDiagnostic || "à compléter"}</span>
                <span>Insertis : à reporter par la professionnelle référente</span>
              </div>
            </BlocRepliable>

            <BlocRepliable title="Non visible dans ce mode">
              <p className="section-help">
                Les brouillons personnels, hypothèses sensibles, notes de posture et espaces professionnels réservés ne sont pas affichés en reprise simple.
              </p>
            </BlocRepliable>

            <Link className="secondary-button dossier-return-button" to="/continuite-service">
              Retour continuité de service
            </Link>
          </aside>
        ) : (
          <aside className="dossier-side">
            <BlocRepliable title="Repères rapides">
              <div className="status-stack">
                <span>Registre : {dossier.registreParcours}</span>
                <span>Parcours : {dossier.statut}</span>
                <span>Référente : {dossier.referente}</span>
                <span>Diagnostic : {dossier.dateDiagnostic || "à compléter"}</span>
                <span>Contrat : {dossier.dateContrat || "à formaliser"}</span>
                <span>Actualisation : {dossier.prochaineActualisation || "à planifier"}</span>
                <span>Insertis : à vérifier</span>
              </div>
            </BlocRepliable>

            <BlocRepliable title="Rappels référentiel">
              <div className="status-stack">
                <span>Social : minimum 5 RDV présentiels/an</span>
                <span>Socio-pro : 12 contacts/an</span>
                <span>Socio-pro : 7 RDV physiques/an</span>
                <span>Socio-pro : 7 temps collectifs + 4 étapes</span>
                <span>Bilan : 18 à 24 mois si socio-pro</span>
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
              <p><strong>À suivre :</strong> diagnostic commun</p>
            </BlocRepliable>

            <Link className="secondary-button dossier-return-button" to="/parcours-social-socio-professionnel">
              Retour aux parcours
            </Link>
          </aside>
        )}
      </section>
    </main>
  );
}
