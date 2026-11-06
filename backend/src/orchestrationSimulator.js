/**
 * Simulateur pur, réservé aux tests fictifs. Aucun appel réseau, stockage,
 * accès Insertis/Outlook ou branchement aux routes professionnelles.
 * Les propositions ne sont jamais enregistrées automatiquement.
 */
const EVENT_TYPES = new Set(["ENTRETIEN_TERMINE"]);
const SUGGESTIONS = Object.freeze([
  Object.freeze({ code: "PREPARER_SUITE", label: "Préparer les suites de l'entretien" }),
  Object.freeze({ code: "VERIFIER_ECHEANCE", label: "Vérifier les échéances" }),
]);
const SAFE_ID = /^(?:evt-fiction|case-fiction)-[a-z0-9-]{1,40}$/;
const FIELDS = ["eventId", "source", "type", "occurredAt", "fictionalCaseId"];

export class SimulationInputError extends Error {
  constructor() {
    super("EVENEMENT_SIMULE_INVALIDE");
    this.name = "SimulationInputError";
  }
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d)$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function validate(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)
    || Object.keys(event).length !== FIELDS.length
    || !FIELDS.every(key => Object.hasOwn(event, key))
    || !SAFE_ID.test(event.eventId ?? "")
    || !event.eventId.startsWith("evt-fiction-")
    || !SAFE_ID.test(event.fictionalCaseId ?? "")
    || !event.fictionalCaseId.startsWith("case-fiction-")
    || event.source !== "SIMULATEUR_INSERTIS"
    || !EVENT_TYPES.has(event.type)
    || !validDate(event.occurredAt)) {
    throw new SimulationInputError();
  }
}

export function proposeSimulatedActions(event) {
  validate(event);
  return Object.freeze({
    eventId: event.eventId,
    status: "CONFIRMATION_REQUISE",
    proposals: SUGGESTIONS.map(item => ({ ...item, selected: false })),
  });
}

/**
 * Prépare une sortie fictive sans aucun effet externe.
 * Seule une proposition explicitement sélectionnée est incluse.
 */
export function simulateConfirmedReminder(event, { confirmed = false, selectedCodes = [] } = {}) {
  validate(event);
  if (confirmed !== true || !Array.isArray(selectedCodes)
    || selectedCodes.length === 0 || new Set(selectedCodes).size !== selectedCodes.length
    || selectedCodes.some(code => !SUGGESTIONS.some(item => item.code === code))) {
    return Object.freeze({ status: "AUCUNE_ACTION", reminders: [] });
  }
  return Object.freeze({
    status: "SIMULATION_SEULEMENT",
    reminders: selectedCodes.map(code => ({
      source: "SIMULATEUR_OUTLOOK",
      eventId: event.eventId,
      code,
      persisted: false,
      sent: false,
    })),
  });
}
