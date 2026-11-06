import { selectFictionalCaseContext } from "./fictionalCaseContext.js";

/**
 * Reconstruit une chronologie à partir de corrections éditoriales FICTIVES.
 * Une correction (même événement, version supérieure) remplace l'ancienne
 * lecture, sans effacer sa trace. Deux déclarations distinctes ne sont jamais
 * fusionnées : elles conservent deux identifiants d'événement.
 *
 * Aucun appel réseau, aucune persistance ni accès aux routes professionnelles.
 * L'autorisation est seulement un drapeau de simulation ; dans l'application
 * réelle, les droits devront être vérifiés par le serveur à chaque lecture.
 */
const CASE_ID = /^case-fiction-[a-z0-9-]{1,40}$/;
const EVENT_ID = /^E[0-9]{2,4}$/;
const STATUS = new Set(["DECLARATION", "OBSERVATION", "DOCUMENT_VERIFIE", "INCONNU"]);
const FIELDS = ["id", "caseId", "version", "occurredAt", "recordedAt", "evidenceStatus", "text", "reason"];

export class FictionalRevisionError extends Error {
  constructor() {
    super("REVISION_PARCOURS_FICTIF_INVALIDE");
    this.name = "FictionalRevisionError";
  }
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day >= 1 && day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31][month - 1];
}

function safeText(value, max) {
  return typeof value === "string" && value.trim().length > 0
    && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}

function validRevision(revision, caseId) {
  return revision && typeof revision === "object" && !Array.isArray(revision)
    && Object.keys(revision).length === FIELDS.length
    && FIELDS.every(field => Object.hasOwn(revision, field))
    && EVENT_ID.test(revision.id)
    && revision.caseId === caseId
    && Number.isSafeInteger(revision.version) && revision.version >= 1 && revision.version <= 100
    && validDate(revision.occurredAt) && validDate(revision.recordedAt)
    && revision.occurredAt <= revision.recordedAt
    && STATUS.has(revision.evidenceStatus)
    && safeText(revision.text, 1200)
    && safeText(revision.reason, 160);
}

/**
 * Lecture telle qu'elle était connue à une date donnée.
 * Les corrections enregistrées plus tard ne sont pas appliquées rétroactivement.
 */
export function selectFictionalRevisedTimeline({
  caseId, asOf, revisions, authorized = false,
} = {}) {
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", events: [] });
  }
  if (!CASE_ID.test(caseId ?? "") || !validDate(asOf)
    || !Array.isArray(revisions) || revisions.length > 200
    || !revisions.every(revision => validRevision(revision, caseId))) {
    throw new FictionalRevisionError();
  }

  const byEvent = new Map();
  for (const revision of revisions) {
    const chain = byEvent.get(revision.id) ?? [];
    chain.push(revision);
    byEvent.set(revision.id, chain);
  }
  if (byEvent.size > 100) throw new FictionalRevisionError();

  const current = [];
  const revisionTrail = [];
  for (const [eventId, chain] of byEvent) {
    chain.sort((a, b) => a.version - b.version);
    for (let index = 0; index < chain.length; index += 1) {
      const revision = chain[index];
      if (revision.version !== index + 1
        || (index > 0 && revision.recordedAt < chain[index - 1].recordedAt)) {
        throw new FictionalRevisionError();
      }
    }
    const known = chain.filter(revision => revision.recordedAt <= asOf);
    if (!known.length) continue;
    const chosen = known.at(-1);
    if (chosen.occurredAt > asOf) continue;

    current.push({
      id: chosen.id, caseId, occurredAt: chosen.occurredAt,
      text: chosen.text, evidenceStatus: chosen.evidenceStatus, version: chosen.version,
    });
    revisionTrail.push(Object.freeze({
      eventId,
      currentVersion: chosen.version,
      supersededVersions: Object.freeze(known.slice(0, -1).map(revision => revision.version)),
      correctionReasons: Object.freeze(known.slice(1).map(revision =>
        Object.freeze({ version: revision.version, recordedAt: revision.recordedAt, reason: revision.reason }))),
      textOfSupersededVersionsUsedAsEvidence: false,
    }));
  }

  const selected = selectFictionalCaseContext({ caseId, asOf, events: current, authorized: true });
  revisionTrail.sort((a, b) => a.eventId.localeCompare(b.eventId));
  return Object.freeze({
    status: "CHRONOLOGIE_FICTIVE_VERSIONNEE",
    caseId,
    asOf,
    events: selected.events,
    sourceEventIds: selected.sourceEventIds,
    revisionTrail: Object.freeze(revisionTrail),
    generatedSummary: false,
    historyCompletenessVerified: false,
    providerCalled: false,
    persisted: false,
  });
}
