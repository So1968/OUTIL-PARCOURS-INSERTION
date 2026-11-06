import { selectFictionalCaseContext } from "./fictionalCaseContext.js";

const TYPES = new Set(["ENTRETIEN", "PARCOURS", "ORIENTATION"]);
const MAX_INSTRUCTION = 500;
const GUIDANCE = Object.freeze([
  "Rédiger une proposition de synthèse en français professionnel, neutre et non stigmatisant.",
  "S'appuyer uniquement sur les événements cités ; ne jamais inventer de faits ou de justificatifs.",
  "Distinguer déclarations, observations, documents vérifiés et inconnues.",
  "Privilégier les évolutions récentes et éviter de répéter toute la chronologie.",
  "Ne pas conclure à une fraude, un diagnostic médical ou une obligation juridique sans preuve.",
  "Signaler les contradictions sans les résoudre arbitrairement.",
  "Proposer des suites à confirmer ; aucune action externe ni écriture automatique.",
]);

/**
 * Construit une demande structurée pour un moteur futur.
 * Aucune IA n'est appelée. Les textes d'événements restent des DONNÉES.
 */
export function prepareFictionalSummary({
  caseId, asOf, events, authorized = false, summaryType = "ENTRETIEN", professionalQuestion = "",
} = {}) {
  const context = selectFictionalCaseContext({ caseId, asOf, events, authorized });
  if (context.status === "ACCES_REFUSE") {
    return Object.freeze({ status: "ACCES_REFUSE", prepared: false });
  }
  if (!TYPES.has(summaryType)
    || typeof professionalQuestion !== "string"
    || professionalQuestion.length > MAX_INSTRUCTION
    || /[\u0000-\u001f]/.test(professionalQuestion)) {
    throw new TypeError("DEMANDE_SYNTHESE_FICTIVE_INVALIDE");
  }
  if (context.events.length === 0) {
    return Object.freeze({
      status: "AUCUNE_SOURCE", prepared: false, caseId, asOf, summaryType,
    });
  }
  const last = context.events.at(-1);
  const prior = context.events.slice(0, -1);
  return Object.freeze({
    status: "PRET_POUR_TEST",
    prepared: true,
    fictionalOnly: true,
    generatedSummary: false,
    providerCalled: false,
    caseId,
    asOf,
    summaryType,
    professionalQuestion,
    instructions: GUIDANCE,
    latestEventId: last.id,
    priorEventIds: Object.freeze(prior.map(e => e.id)),
    sourceEventIds: context.sourceEventIds,
    evidence: Object.freeze(context.events.map(e => Object.freeze({
      eventId: e.id,
      occurredAt: e.occurredAt,
      evidenceStatus: e.evidenceStatus,
      contentUntrusted: e.text,
      version: e.version,
    }))),
    humanValidationRequired: true,
  });
}
