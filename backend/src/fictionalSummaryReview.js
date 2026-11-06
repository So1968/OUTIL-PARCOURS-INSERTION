/**
 * Valide la STRUCTURE d'un brouillon hypothétique sur données fictives.
 * Aucun appel IA, réseau, stockage ou vérification sémantique.
 */
const CASE_ID = /^case-fiction-[a-z0-9-]{1,40}$/;
const EVENT_ID = /^E[0-9]{2,4}$/;
const KINDS = new Set(["CONTEXTE", "EVOLUTION", "POINT_DE_VIGILANCE", "SUITE"]);
const STATUS = new Set(["DECLARATION", "OBSERVATION", "DOCUMENT_VERIFIE", "INCONNU"]);
const OUTPUT_KEYS = ["caseId", "asOf", "summaryType", "sections", "uncertainties", "conflicts", "suggestedActions"];
const SECTION_KEYS = ["kind", "text", "sourceEventIds"];
const ITEM_KEYS = ["text", "sourceEventIds"];
const ACTION_KEYS = ["title", "sourceEventIds", "confirmed"];
export class FictionalSummaryReviewError extends Error {
  constructor() {
    super("BROUILLON_FICTIF_INVALIDE");
    this.name = "FictionalSummaryReviewError";
  }
}
function shape(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
}
function safeText(value, max = 1200) {
  return typeof value === "string" && value.trim().length > 0
    && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}
function citations(ids, known, minimum = 1) {
  return Array.isArray(ids) && ids.length >= minimum && ids.length <= 12
    && ids.every(id => typeof id === "string" && known.has(id))
    && new Set(ids).size === ids.length;
}
function validatePreparation(prepared) {
  if (!prepared || prepared.status !== "PRET_POUR_TEST" || prepared.prepared !== true
    || prepared.fictionalOnly !== true || prepared.humanValidationRequired !== true
    || prepared.providerCalled !== false || prepared.generatedSummary !== false
    || !CASE_ID.test(prepared.caseId ?? "") || !Array.isArray(prepared.evidence)
    || prepared.evidence.length < 1 || prepared.evidence.length > 100
    || !Array.isArray(prepared.sourceEventIds)
    || prepared.sourceEventIds.length !== prepared.evidence.length) {
    throw new FictionalSummaryReviewError();
  }
  const ids = new Set();
  for (let i = 0; i < prepared.evidence.length; i += 1) {
    const e = prepared.evidence[i];
    if (!e || !EVENT_ID.test(e.eventId ?? "")
      || prepared.sourceEventIds[i] !== e.eventId
      || ids.has(e.eventId) || !STATUS.has(e.evidenceStatus)) {
      throw new FictionalSummaryReviewError();
    }
    ids.add(e.eventId);
  }
  if (!ids.has(prepared.latestEventId)) throw new FictionalSummaryReviewError();
  return ids;
}
function evidenceItem(item, keys, known, minSources) {
  if (!shape(item, keys) || !safeText(item.text)
    || !citations(item.sourceEventIds, known, minSources)) {
    throw new FictionalSummaryReviewError();
  }
  return Object.freeze({ text: item.text.trim(), sourceEventIds: Object.freeze([...item.sourceEventIds]) });
}
export function reviewFictionalSummaryDraft(prepared, candidate) {
  const known = validatePreparation(prepared);
  if (!shape(candidate, OUTPUT_KEYS) || candidate.caseId !== prepared.caseId
    || candidate.asOf !== prepared.asOf || candidate.summaryType !== prepared.summaryType
    || !Array.isArray(candidate.sections) || candidate.sections.length < 1 || candidate.sections.length > 10
    || !Array.isArray(candidate.uncertainties) || candidate.uncertainties.length > 10
    || !Array.isArray(candidate.conflicts) || candidate.conflicts.length > 6
    || !Array.isArray(candidate.suggestedActions) || candidate.suggestedActions.length > 6) {
    throw new FictionalSummaryReviewError();
  }
  const sections = candidate.sections.map(item => {
    const checked = evidenceItem(item, SECTION_KEYS, known, 1);
    if (!KINDS.has(item.kind)) throw new FictionalSummaryReviewError();
    return Object.freeze({ kind: item.kind, ...checked });
  });
  const uncertainties = candidate.uncertainties.map(item => evidenceItem(item, ITEM_KEYS, known, 1));
  const conflicts = candidate.conflicts.map(item => evidenceItem(item, ITEM_KEYS, known, 2));
  const suggestedActions = candidate.suggestedActions.map(item => {
    if (!shape(item, ACTION_KEYS) || !safeText(item.title, 200)
      || !citations(item.sourceEventIds, known) || item.confirmed !== false) {
      throw new FictionalSummaryReviewError();
    }
    return Object.freeze({
      title: item.title.trim(), sourceEventIds: Object.freeze([...item.sourceEventIds]), confirmed: false,
    });
  });
  if (prepared.summaryType === "ENTRETIEN"
    && !sections.some(section => section.sourceEventIds.includes(prepared.latestEventId))) {
    throw new FictionalSummaryReviewError();
  }
  const statuses = new Map(prepared.evidence.map(e => [e.eventId, e.evidenceStatus]));
  const citedSections = sections.map(section => Object.freeze({
    ...section,
    sourceEvidence: Object.freeze(section.sourceEventIds.map(eventId =>
      Object.freeze({ eventId, evidenceStatus: statuses.get(eventId) }))),
  }));
  return Object.freeze({
    status: "BROUILLON_A_VERIFIER",
    caseId: candidate.caseId, asOf: candidate.asOf, summaryType: candidate.summaryType,
    summaryPreview: citedSections.map(x => x.text).join("\n\n"),
    sections: Object.freeze(citedSections),
    uncertainties: Object.freeze(uncertainties),
    conflicts: Object.freeze(conflicts),
    suggestedActions: Object.freeze(suggestedActions),
    semanticallyVerified: false, humanValidationRequired: true,
    saved: false, transmitted: false, providerCalled: false,
  });
}
