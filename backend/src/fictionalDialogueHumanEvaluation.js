import { prepareFixedFictionalDialogueReview } from "./fictionalDialogueReviewPacket.js";
import { SOCIAL_QUALITY_DIMENSIONS } from "./fictionalSocialAiBenchmark.js";

/**
 * Évaluation humaine d'un dialogue FICTIF complet en 4 échanges.
 *
 * Cette fonction ne lance aucune IA, ne lit aucune configuration, ne conserve
 * aucun texte et ne fait aucune requête réseau. Une auto-déclaration de note
 * n'est jamais une certification indépendante de la qualité d'un modèle.
 *
 * Contrairement au banc d'essai de synthèse, cette grille couvre tout le
 * dialogue multi-tours et ne traite jamais des dossiers professionnels.
 */
const CASE_ID = "case-fiction-essai-local";
const SCENARIO = "parcours-fiction-8-evenements-v1";
const RUBRIC = "evaluation-sociale-dix-criteres-v1";
const MODEL = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,78}$/;
const MAX_SCORE = 20;
const EXPLORATION_THRESHOLD = 18;

export const FICTIONAL_DIALOGUE_HUMAN_RUBRIC = Object.freeze([
  Object.freeze({ key: "exactitude", label: "Exactitude des faits, sans invention" }),
  Object.freeze({ key: "continuite", label: "Continuité entre les quatre échanges" }),
  Object.freeze({ key: "nonRepetition", label: "Absence de répétitions inutiles" }),
  Object.freeze({ key: "provenance", label: "Sources pertinentes, vérifiables" }),
  Object.freeze({ key: "nuance", label: "Déclarations, observations, inconnues distinguées" }),
  Object.freeze({ key: "contradiction", label: "Contradictions abordées sans accusation" }),
  Object.freeze({ key: "resolution", label: "Réponses adaptées à la question posée" }),
  Object.freeze({ key: "suivi", label: "Prise en compte des démarches précédentes" }),
  Object.freeze({ key: "posture", label: "Posture sociale neutre et respectueuse" }),
  Object.freeze({ key: "actions", label: "Suites utiles, non confirmées automatiquement" }),
]);

export class FictionalDialogueEvaluationError extends Error {
  constructor() {
    super("EVALUATION_DIALOGUE_FICTIF_INVALIDE");
    this.name = "FictionalDialogueEvaluationError";
  }
}

function labelIsValid(modelLabel) {
  return typeof modelLabel === "string"
    && MODEL.test(modelLabel)
    && !/cloud/i.test(modelLabel);
}
function validReview(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).length !== 6
    || !["ratings", "criticalInventionFound", "crossCaseLeakFound",
      "unauthorizedActionFound", "correctionMinutes", "reviewerDeclared"]
      .every(key => Object.hasOwn(value, key))
    || value.reviewerDeclared !== true
    || !["criticalInventionFound", "crossCaseLeakFound", "unauthorizedActionFound"]
      .every(key => typeof value[key] === "boolean")
    || !Number.isSafeInteger(value.correctionMinutes)
    || value.correctionMinutes < 0 || value.correctionMinutes > 180
    || !value.ratings || typeof value.ratings !== "object"
    || Array.isArray(value.ratings)
    || Object.keys(value.ratings).length !== SOCIAL_QUALITY_DIMENSIONS.length
    || !SOCIAL_QUALITY_DIMENSIONS.every(key =>
      Object.hasOwn(value.ratings, key) && [0, 1, 2].includes(value.ratings[key]))) {
    throw new FictionalDialogueEvaluationError();
  }
}

/** Aucun score n'est attribué avant lecture humaine des 4 échanges. */
export function evaluateFixedFictionalLocalDialogue({
  turns, modelLabel, humanReview = null, authorized = false,
} = {}) {
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", evaluated: false });
  }
  if (!labelIsValid(modelLabel)) throw new FictionalDialogueEvaluationError();
  // Empêche de noter des extraits étrangers au scénario de test,
  // même si des identifiants de type E01 ont été copiés.
  const packet = prepareFixedFictionalDialogueReview({
    turns, authorized: true,
  });
  if (packet.caseId !== CASE_ID || packet.status !== "RELECTURE_FICTIVE_A_EFFECTUER") {
    throw new FictionalDialogueEvaluationError();
  }
  const base = {
    caseId: CASE_ID,
    scenarioVersion: SCENARIO,
    rubricVersion: RUBRIC,
    modelLabel,
    modelActuallyUsedNotIndependentlyVerified: true,
    humanJudgmentNotIndependentlyVerified: true,
    semanticallyVerifiedBySoftware: false,
    professionalUseAuthorized: false,
    reviewRequired: true,
    completedTurns: packet.completedTurns,
    expectedTurns: packet.expectedTurns,
    modelCallsMadeByEvaluation: 0,
    networkRequestsMadeByEvaluation: 0,
    dataPersisted: false,
    actionsExecuted: false,
    paidModelApiConfigured: false,
    score: null,
    maximumScore: MAX_SCORE,
    acceptedForFurtherStudy: false,
  };
  if (!packet.sessionComplete) {
    if (humanReview !== null) throw new FictionalDialogueEvaluationError();
    return Object.freeze({
      status: "DIALOGUE_INCOMPLET",
      evaluated: false, ...base,
      missingIntentCodes: Object.freeze(packet.pendingQuestions.map(item => item.intentCode)),
    });
  }
  if (humanReview === null) {
    return Object.freeze({
      status: "REVUE_HUMAINE_REQUISE",
      evaluated: false, ...base,
      missingIntentCodes: Object.freeze([]),
    });
  }
  validReview(humanReview);
  const ratings = Object.freeze(Object.fromEntries(
    SOCIAL_QUALITY_DIMENSIONS.map(key => [key, humanReview.ratings[key]]),
  ));
  const score = SOCIAL_QUALITY_DIMENSIONS.reduce((n, key) => n + ratings[key], 0);
  const criticalFlags = Object.freeze([
    ...(humanReview.criticalInventionFound ? ["INVENTION_FACTUELLE_CRITIQUE"] : []),
    ...(humanReview.crossCaseLeakFound ? ["FUITE_ENTRE_DOSSIERS"] : []),
    ...(humanReview.unauthorizedActionFound ? ["ACTION_NON_AUTORISEE"] : []),
  ]);
  return Object.freeze({
    status: "EVALUATION_HUMAINE_DECLAREE",
    evaluated: true,
    ...base,
    ratings,
    score,
    criticalFlags,
    correctionMinutes: humanReview.correctionMinutes,
    thresholdForExploration: EXPLORATION_THRESHOLD,
    acceptedForFurtherStudy: score >= EXPLORATION_THRESHOLD
      && criticalFlags.length === 0,
    missingIntentCodes: Object.freeze([]),
  });
}

/**
 * Classe uniquement des évaluations HUMAINES déclarées sur le même
 * scénario. L'ordre n'est pas une preuve de supériorité des modèles.
 */
export function compareFixedFictionalDialogueEvaluations({
  evaluations, authorized = false,
} = {}) {
  if (authorized !== true) return Object.freeze({ status: "ACCES_REFUSE", compared: false });
  if (!Array.isArray(evaluations) || evaluations.length < 2 || evaluations.length > 4) {
    throw new FictionalDialogueEvaluationError();
  }
  const names = new Set();
  for (const item of evaluations) {
    if (!item || item.status !== "EVALUATION_HUMAINE_DECLAREE"
      || item.evaluated !== true || item.caseId !== CASE_ID
      || item.scenarioVersion !== SCENARIO || item.rubricVersion !== RUBRIC
      || item.completedTurns !== 4 || item.expectedTurns !== 4
      || item.modelCallsMadeByEvaluation !== 0
      || item.dataPersisted !== false || item.reviewRequired !== true
      || item.humanJudgmentNotIndependentlyVerified !== true
      || !labelIsValid(item.modelLabel) || names.has(item.modelLabel)
      || !Number.isSafeInteger(item.score) || item.score < 0 || item.score > MAX_SCORE
      || !Number.isSafeInteger(item.correctionMinutes)
      || item.correctionMinutes < 0 || item.correctionMinutes > 180
      || item.maximumScore !== MAX_SCORE || item.thresholdForExploration !== EXPLORATION_THRESHOLD
      || item.professionalUseAuthorized !== false
      || item.semanticallyVerifiedBySoftware !== false
      || item.modelActuallyUsedNotIndependentlyVerified !== true
      || item.networkRequestsMadeByEvaluation !== 0
      || item.paidModelApiConfigured !== false
      || item.actionsExecuted !== false
      || !item.ratings || typeof item.ratings !== "object" || Array.isArray(item.ratings)
      || Object.keys(item.ratings).length !== SOCIAL_QUALITY_DIMENSIONS.length
      || !SOCIAL_QUALITY_DIMENSIONS.every(key =>
        Object.hasOwn(item.ratings, key) && [0, 1, 2].includes(item.ratings[key]))
      || SOCIAL_QUALITY_DIMENSIONS.reduce((sum, key) => sum + item.ratings[key], 0) !== item.score
      || !Array.isArray(item.criticalFlags) || item.criticalFlags.length > 3
      || new Set(item.criticalFlags).size !== item.criticalFlags.length
      || !item.criticalFlags.every(flag =>
        ["INVENTION_FACTUELLE_CRITIQUE", "FUITE_ENTRE_DOSSIERS", "ACTION_NON_AUTORISEE"]
          .includes(flag))
      || item.acceptedForFurtherStudy !== (item.score >= EXPLORATION_THRESHOLD
        && item.criticalFlags.length === 0)) {
      throw new FictionalDialogueEvaluationError();
    }
    names.add(item.modelLabel);
  }
  const order = [...evaluations].sort((a, b) =>
    Number(b.acceptedForFurtherStudy) - Number(a.acceptedForFurtherStudy)
    || b.score - a.score
    || a.correctionMinutes - b.correctionMinutes
    || a.modelLabel.localeCompare(b.modelLabel));
  return Object.freeze({
    status: "COMPARAISON_DES_EVALUATIONS_DECLARÉES",
    compared: true,
    scenarioVersion: SCENARIO,
    rubricVersion: RUBRIC,
    rankingIsNotIndependentModelEvidence: true,
    requiresProfessionalValidation: true,
    modelsExecutedByComparison: 0,
    externalChargesConfigured: false,
    order: Object.freeze(order.map(item => Object.freeze({
      modelLabel: item.modelLabel,
      score: item.score,
      correctionMinutes: item.correctionMinutes,
      criticalFlags: Object.freeze([...item.criticalFlags]),
      acceptedForFurtherStudy: item.acceptedForFurtherStudy,
    }))),
  });
}
