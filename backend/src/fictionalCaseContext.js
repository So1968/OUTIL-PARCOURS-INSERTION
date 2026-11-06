/**
 * Sélection de contexte pure pour recette fictive.
 * Aucun stockage, réseau, modèle IA ni accès aux routes professionnelles.
 * Ne doit jamais recevoir des dossiers réels.
 */
const CASE_ID = /^case-fiction-[a-z0-9-]{1,40}$/;
const EVENT_ID = /^E[0-9]{2,4}$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ALLOWED = new Set(["DECLARATION", "OBSERVATION", "DOCUMENT_VERIFIE", "INCONNU"]);
const MAX_EVENTS = 100;
const MAX_TEXT = 1200;

export class FictionalContextError extends Error {
  constructor() {
    super("CONTEXTE_FICTIF_INVALIDE");
    this.name = "FictionalContextError";
  }
}

function validCivilDate(value) {
  if (typeof value !== "string") return false;
  const match = DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1];
}

function validEvent(event, caseId) {
  return event && typeof event === "object" && !Array.isArray(event)
    && Object.keys(event).length === 6
    && ["id", "caseId", "occurredAt", "text", "evidenceStatus", "version"].every(k => Object.hasOwn(event, k))
    && EVENT_ID.test(event.id)
    && event.caseId === caseId
    && validCivilDate(event.occurredAt)
    && typeof event.text === "string"
    && event.text.length > 0 && event.text.length <= MAX_TEXT
    && !/[\u0000-\u001f]/.test(event.text)
    && ALLOWED.has(event.evidenceStatus)
    && Number.isSafeInteger(event.version) && event.version >= 1;
}

/**
 * L'appelant doit déjà avoir appliqué le contrôle d'accès serveur.
 * Ce prototype refuse toute donnée qui n'utilise pas les identifiants fictifs.
 * Il ne constitue PAS une barrière de confidentialité pour une application réelle.
 */
export function selectFictionalCaseContext({ caseId, asOf, events, authorized = false } = {}) {
  if (authorized !== true) return Object.freeze({ status: "ACCES_REFUSE", events: [] });
  if (!CASE_ID.test(caseId ?? "") || !validCivilDate(asOf)
    || !Array.isArray(events) || events.length > MAX_EVENTS
    || !events.every(event => validEvent(event, caseId))) {
    throw new FictionalContextError();
  }
  const ids = new Set();
  for (const event of events) {
    if (ids.has(event.id)) throw new FictionalContextError();
    ids.add(event.id);
  }
  const selected = events.filter(e => e.occurredAt <= asOf)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
    .map(e => Object.freeze({ ...e }));
  return Object.freeze({
    status: "CONTEXTE_FICTIF",
    caseId,
    asOf,
    events: Object.freeze(selected),
    sourceEventIds: Object.freeze(selected.map(e => e.id)),
    generatedSummary: false,
  });
}
