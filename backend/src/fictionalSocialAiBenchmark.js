import { reviewFictionalModelFixture } from "./fictionalSocialAiContract.js";

/**
 * Banc d'essai STRUCTUREL et grille d'évaluation humaine pour des parcours
 * entièrement fictifs. Aucune IA n'est exécutée : candidates = réponses
 * préparées manuellement. Aucune persistance, aucun coût et aucun appel externe.
 *
 * Les évaluations ne prouvent pas la fiabilité d'un futur modèle sur des
 * personnes réelles. La pertinence des citations est à examiner humainement.
 */
export const SOCIAL_QUALITY_DIMENSIONS = Object.freeze([
  "exactitude",
  "continuite",
  "nonRepetition",
  "provenance",
  "nuance",
  "contradiction",
  "resolution",
  "suivi",
  "posture",
  "actions",
]);
const LABEL = /^fixture-[a-z0-9-]{1,40}$/;
const SCORE_LIMIT = 20;
const ACCEPTANCE_THRESHOLD = 18;

export class FictionalSocialBenchmarkError extends Error {
  constructor() {
    super("EVALUATION_SOCIALE_FICTIVE_INVALIDE");
    this.name = "FictionalSocialBenchmarkError";
  }
}

function validHumanReview(review) {
  if (!review || typeof review !== "object" || Array.isArray(review)
    || Object.keys(review).length !== 5
    || !["ratings", "criticalInventionFound", "crossCaseLeakFound",
      "correctionMinutes", "reviewerDeclared"].every(k => Object.hasOwn(review, k))
    || review.reviewerDeclared !== true
    || typeof review.criticalInventionFound !== "boolean"
    || typeof review.crossCaseLeakFound !== "boolean"
    || !Number.isSafeInteger(review.correctionMinutes)
    || review.correctionMinutes < 0 || review.correctionMinutes > 180
    || !review.ratings || typeof review.ratings !== "object" || Array.isArray(review.ratings)
    || Object.keys(review.ratings).length !== SOCIAL_QUALITY_DIMENSIONS.length
    || !SOCIAL_QUALITY_DIMENSIONS.every(k =>
      Object.hasOwn(review.ratings, k) && [0, 1, 2].includes(review.ratings[k]))) {
    throw new FictionalSocialBenchmarkError();
  }
}

function safeLabel(label) {
  if (!LABEL.test(label ?? "")) throw new FictionalSocialBenchmarkError();
}

/**
 * Retourne d'abord les vérifications mécaniques, SANS score de qualité.
 * Un score existe uniquement si une grille de lecture humaine est déclarée.
 */
export function evaluateFictionalSocialCandidate({
  prepared, dialogue, candidate, modelLabel, humanReview = null, authorized = false,
} = {}) {
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", evaluated: false });
  }
  safeLabel(modelLabel);
  const result = reviewFictionalModelFixture({ prepared, dialogue, candidate, authorized });
  const draft = result.draft;
  const totalAssertions = draft.sections.length + draft.uncertainties.length
    + draft.conflicts.length + draft.suggestedActions.length;
  const totalCitations = [
    ...draft.sections, ...draft.uncertainties, ...draft.conflicts, ...draft.suggestedActions,
  ].reduce((sum, item) => sum + item.sourceEventIds.length, 0);
  const base = {
    modelLabel,
    fictionalOnly: true,
    generatedByModel: false,
    providerCalled: false,
    expenseIncurred: false,
    semanticallyVerifiedBySoftware: false,
    submittedHumanJudgmentIndependentlyVerified: false,
    candidateStructureAccepted: true,
    totalAssertions,
    totalCitations,
    latestEventReferenced: draft.sections.some(section =>
      section.sourceEventIds.includes(prepared.latestEventId)),
    requiresProfessionalValidation: true,
    saved: false,
    transmitted: false,
  };
  if (humanReview === null) {
    return Object.freeze({
      status: "REVUE_HUMAINE_REQUISE",
      evaluated: false,
      ...base,
      qualityScore: null,
      acceptedForFurtherStudy: false,
    });
  }
  validHumanReview(humanReview);
  const scores = Object.freeze(Object.fromEntries(
    SOCIAL_QUALITY_DIMENSIONS.map(key => [key, humanReview.ratings[key]]),
  ));
  const qualityScore = SOCIAL_QUALITY_DIMENSIONS.reduce((sum, key) => sum + scores[key], 0);
  const blockingIssues = Object.freeze([
    ...(humanReview.criticalInventionFound ? ["INVENTION_FACTUELLE_CRITIQUE"] : []),
    ...(humanReview.crossCaseLeakFound ? ["FUITE_ENTRE_DOSSIERS"] : []),
  ]);
  return Object.freeze({
    status: "EVALUATION_HUMAINE_DECLAREE",
    evaluated: true,
    ...base,
    scores,
    qualityScore,
    maximumScore: SCORE_LIMIT,
    threshold: ACCEPTANCE_THRESHOLD,
    correctionMinutes: humanReview.correctionMinutes,
    blockingIssues,
    acceptedForFurtherStudy: qualityScore >= ACCEPTANCE_THRESHOLD && blockingIssues.length === 0,
  });
}

/** Compare seulement des scénarios identiques et des évaluations déclarées. */
export function compareFictionalSocialCandidates({
  prepared, dialogue, entries, authorized = false,
} = {}) {
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", compared: false });
  }
  if (!Array.isArray(entries) || entries.length < 2 || entries.length > 4
    || entries.some(item => !item || typeof item !== "object" || Array.isArray(item)
      || Object.keys(item).length !== 3
      || !["modelLabel", "candidate", "humanReview"].every(k => Object.hasOwn(item, k)))) {
    throw new FictionalSocialBenchmarkError();
  }
  const labels = entries.map(entry => entry.modelLabel);
  if (new Set(labels).size !== labels.length) throw new FictionalSocialBenchmarkError();
  const evaluations = entries.map(entry => evaluateFictionalSocialCandidate({
    prepared, dialogue, ...entry, authorized: true,
  }));
  if (evaluations.some(entry => !entry.evaluated)) throw new FictionalSocialBenchmarkError();
  evaluations.sort((a, b) => b.qualityScore - a.qualityScore
    || a.correctionMinutes - b.correctionMinutes
    || a.modelLabel.localeCompare(b.modelLabel));
  return Object.freeze({
    status: "COMPARAISON_FICTIVE",
    compared: true,
    modelCallsMade: 0,
    sourceCaseId: prepared.caseId,
    evaluations: Object.freeze(evaluations),
    resultIsNotModelPerformanceProof: true,
  });
}
