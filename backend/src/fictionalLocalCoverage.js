/**
 * Contrôle mécanique de la présence des références indispensables dans
 * UNE scène fictive précise, après revue structurelle du brouillon.
 *
 * Il vérifie UNIQUEMENT des identifiants. Il ne sait pas si une phrase dit
 * la vérité, interprète correctement une déclaration ou est bienveillante.
 * Ne jamais le présenter comme une validation métier, juridique ou humaine.
 */
const CASE_ID = "case-fiction-essai-local";
const REQUIREMENTS = Object.freeze([
  Object.freeze({
    id: "EVOLUTION_PARCOURS",
    description: "Vérifier l'évolution indépendant vers emploi salarié.",
  }),
  Object.freeze({
    id: "ECART_DECLARATIONS",
    description: "Clarifier les deux déclarations de chiffre d'affaires.",
  }),
  Object.freeze({
    id: "COURRIER_NON_ANALYSE",
    description: "Vérifier que le courrier n'a pas été supposé examiné.",
  }),
  Object.freeze({
    id: "SUITE_A_CONFIRMER",
    description: "Relire une proposition d'action sans l'exécuter.",
  }),
]);

export class FictionalCoverageError extends Error {
  constructor() {
    super("COUVERTURE_FICTIVE_INVALIDE");
    this.name = "FictionalCoverageError";
  }
}

function cites(item, eventIds) {
  return Array.isArray(item?.sourceEventIds)
    && eventIds.every(eventId => item.sourceEventIds.includes(eventId));
}

function usableList(list) {
  return Array.isArray(list) && list.every(item =>
    item !== null && typeof item === "object" && !Array.isArray(item)
    && Array.isArray(item.sourceEventIds)
    && item.sourceEventIds.every(id => typeof id === "string"));
}

/** L'évaluation ne reçoit ni noms, ni notes, ni données de dossier réelles. */
export function reviewFixedFictionalCoverage(draft) {
  if (!draft || draft.status !== "BROUILLON_A_VERIFIER"
    || draft.caseId !== CASE_ID || draft.asOf !== "2026-11-04"
    || draft.humanValidationRequired !== true
    || draft.semanticallyVerified !== false
    || draft.saved !== false || draft.transmitted !== false
    || !usableList(draft.sections) || !usableList(draft.uncertainties)
    || !usableList(draft.conflicts) || !usableList(draft.suggestedActions)) {
    throw new FictionalCoverageError();
  }
  const covered = {
    EVOLUTION_PARCOURS: draft.sections.some(section =>
      section.kind === "EVOLUTION" && cites(section, ["E05", "E08"])),
    ECART_DECLARATIONS: draft.conflicts.some(item =>
      cites(item, ["E04", "E08"])),
    COURRIER_NON_ANALYSE: draft.uncertainties.some(item =>
      cites(item, ["E06", "E08"])),
    SUITE_A_CONFIRMER: draft.suggestedActions.some(item =>
      item.confirmed === false && cites(item, ["E08"])),
  };
  const indicators = Object.freeze(REQUIREMENTS.map(item => Object.freeze({
    id: item.id,
    referencesPresent: covered[item.id],
  })));
  const reviewPriorities = Object.freeze(REQUIREMENTS
    .filter(item => !covered[item.id])
    .map(item => Object.freeze({
      code: item.id,
      actionForHumanReview: item.description,
    })));
  return Object.freeze({
    status: "CONTROLE_FICTIF_DES_REFERENCES",
    indicators,
    referencesPresentCount: indicators.filter(item => item.referencesPresent).length,
    totalIndicators: indicators.length,
    reviewPriorities,
    targetedReviewNeeded: reviewPriorities.length > 0,
    semanticValidationPerformed: false,
    automaticallyApproved: false,
    humanReviewRequired: true,
    qualityScore: null,
    exported: false,
    saved: false,
  });
}
