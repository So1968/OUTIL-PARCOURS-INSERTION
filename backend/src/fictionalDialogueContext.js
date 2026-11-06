/**
 * Contexte conversationnel fictif associé à UN seul dossier.
 * Les échanges antérieurs sont des éléments de contexte, pas des faits probants.
 * Aucun stockage, appel IA ni route professionnelle.
 */
const CASE_ID = /^case-fiction-[a-z0-9-]{1,40}$/;
const THREAD_ID = /^thread-fiction-[a-z0-9-]{1,40}$/;
const TURN_ID = /^T[0-9]{3,5}$/;
const ROLES = new Set(["PROFESSIONNELLE", "ASSISTANT_FICTIF"]);
const MAX_TURNS = 60;

export class FictionalDialogueError extends Error {
  constructor() {
    super("DIALOGUE_FICTIF_INVALIDE");
    this.name = "FictionalDialogueError";
  }
}

function civilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day >= 1 && day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function safeText(value, max) {
  return typeof value === "string" && value.trim().length >= 1
    && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}

function validTurn(turn, caseId, threadId) {
  return turn !== null && typeof turn === "object" && !Array.isArray(turn)
    && Object.keys(turn).length === 6
    && ["id", "threadId", "caseId", "occurredAt", "role", "text"].every(k => Object.hasOwn(turn, k))
    && TURN_ID.test(turn.id) && turn.threadId === threadId && turn.caseId === caseId
    && civilDate(turn.occurredAt) && ROLES.has(turn.role) && safeText(turn.text, 1200);
}

export function assembleFictionalDialogueContext({
  prepared, authorized = false, threadId, turns = [], currentQuestion,
} = {}) {
  // Le changement d'habilitation invalide un contexte pourtant préparé auparavant.
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", dialogueHistory: [] });
  }
  if (!prepared || prepared.status !== "PRET_POUR_TEST" || prepared.fictionalOnly !== true
    || prepared.humanValidationRequired !== true || prepared.prepared !== true
    || !CASE_ID.test(prepared.caseId ?? "")
    || !civilDate(prepared.asOf) || !THREAD_ID.test(threadId ?? "")
    || !Array.isArray(prepared.evidence) || prepared.evidence.length < 1
    || !Array.isArray(prepared.sourceEventIds)
    || !Array.isArray(turns) || turns.length > MAX_TURNS
    || !safeText(currentQuestion, 500)
    || !turns.every(turn => validTurn(turn, prepared.caseId, threadId))) {
    throw new FictionalDialogueError();
  }
  const ids = new Set();
  for (const turn of turns) {
    if (ids.has(turn.id)) throw new FictionalDialogueError();
    ids.add(turn.id);
  }
  const chronological = turns.filter(t => t.occurredAt <= prepared.asOf)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id))
    .map(t => Object.freeze({
      id: t.id,
      occurredAt: t.occurredAt,
      role: t.role,
      contentUntrusted: t.text,
      canBeCitedAsCaseEvidence: false,
    }));
  return Object.freeze({
    status: "DIALOGUE_FICTIF_PREPARE",
    caseId: prepared.caseId, threadId, asOf: prepared.asOf,
    currentProfessionalQuestion: currentQuestion.trim(),
    sourceEventIds: Object.freeze([...prepared.sourceEventIds]),
    dialogueHistory: Object.freeze(chronological),
    assistantHistoryIsNotEvidence: true,
    sourceOfTruthRemainsCaseEvents: true,
    providerCalled: false,
    persisted: false,
  });
}
