import { buildFixedFictionalDemoContext } from "./fictionalLocalAiDemo.js";
import { FICTIONAL_DIALOGUE_QUESTIONS } from "./fictionalLocalDialogue.js";

/**
 * Prépare une fiche de relecture du dialogue TEST à partir de ses sorties
 * déjà contrôlées. Ne consulte aucune IA, base, note ni service extérieur.
 * La présence de citations ne prouve jamais qu'une affirmation est vraie.
 */
const INTENTS = Object.freeze(Object.keys(FICTIONAL_DIALOGUE_QUESTIONS));
const TURN_FIELDS = Object.freeze([
  "intentCode", "question", "answer", "sourceEventIds", "uncertainties",
  "suggestedActions", "humanValidationRequired", "semanticallyVerified",
  "storedInDatabase", "transmitted", "sourceTrace",
]);
const SOURCE_FIELDS = Object.freeze([
  "eventId", "occurredAt", "evidenceStatus", "originalExcerptUntrusted",
  "semanticSupportVerified",
]);
const ACTION_FIELDS = Object.freeze(["title", "sourceEventIds", "confirmed"]);
const CHECKLIST = Object.freeze([
  Object.freeze({ id: "FIDELITE", label: "La réponse est-elle réellement appuyée par les extraits cités ?" }),
  Object.freeze({ id: "CHRONOLOGIE", label: "Distingue-t-elle les informations anciennes et les évolutions récentes ?" }),
  Object.freeze({ id: "NUANCE", label: "Sépare-t-elle déclarations, observations et informations non vérifiées ?" }),
  Object.freeze({ id: "POSTURE", label: "Évite-t-elle jugement de valeur, diagnostic et accusation injustifiée ?" }),
  Object.freeze({ id: "SUITES", label: "Les actions proposées sont-elles pertinentes et toujours non confirmées ?" }),
]);

export class FictionalDialogueReviewError extends Error {
  constructor() {
    super("RELECTURE_DIALOGUE_FICTIF_INVALIDE");
    this.name = "FictionalDialogueReviewError";
  }
}
function keysMatch(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}
function safeText(value, maximum) {
  return typeof value === "string" && value.trim().length >= 1
    && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
}
function validateSources(ids, known, required = []) {
  return Array.isArray(ids) && ids.length >= 1 && ids.length <= 8
    && ids.every(id => typeof id === "string" && known.has(id))
    && new Set(ids).size === ids.length
    && required.every(id => ids.includes(id));
}
function checkTurn(turn, known) {
  if (!keysMatch(turn, TURN_FIELDS)
    || !Object.hasOwn(FICTIONAL_DIALOGUE_QUESTIONS, turn.intentCode)
    || turn.question !== FICTIONAL_DIALOGUE_QUESTIONS[turn.intentCode].label
    || !safeText(turn.answer, 1600)
    || turn.answer.trim().length < 10
    || turn.humanValidationRequired !== true
    || turn.semanticallyVerified !== false
    || turn.storedInDatabase !== false || turn.transmitted !== false
    || !validateSources(turn.sourceEventIds, known,
      FICTIONAL_DIALOGUE_QUESTIONS[turn.intentCode].requiredEventIds)
    || !Array.isArray(turn.sourceTrace)
    || turn.sourceTrace.length !== turn.sourceEventIds.length
    || !Array.isArray(turn.uncertainties) || turn.uncertainties.length > 6
    || !turn.uncertainties.every(text => safeText(text, 240))
    || !Array.isArray(turn.suggestedActions) || turn.suggestedActions.length > 5) {
    throw new FictionalDialogueReviewError();
  }

  for (let i = 0; i < turn.sourceTrace.length; i += 1) {
    const source = turn.sourceTrace[i];
    const original = known.get(turn.sourceEventIds[i]);
    if (!keysMatch(source, SOURCE_FIELDS)
      || source.eventId !== turn.sourceEventIds[i]
      || source.occurredAt !== original.occurredAt
      || source.evidenceStatus !== original.evidenceStatus
      || source.originalExcerptUntrusted !== original.contentUntrusted
      || source.semanticSupportVerified !== false) {
      throw new FictionalDialogueReviewError();
    }
  }
  for (const action of turn.suggestedActions) {
    if (!keysMatch(action, ACTION_FIELDS) || !safeText(action.title, 200)
      || !validateSources(action.sourceEventIds, known)
      || action.confirmed !== false) {
      throw new FictionalDialogueReviewError();
    }
  }
}

function normalizeTitle(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr").replace(/\s+/g, " ").trim();
}

/**
 * Cette fonction prépare une RELECTURE, et non une évaluation.
 * Elle refuse les sources altérées et les traces provenant d'autres dossiers.
 * Aucun score automatique, aucune tâche créée.
 */
export function prepareFixedFictionalDialogueReview({
  turns, authorized = false,
} = {}) {
  if (authorized !== true) {
    return Object.freeze({ status: "ACCES_REFUSE", prepared: false });
  }
  if (!Array.isArray(turns) || turns.length > INTENTS.length) {
    throw new FictionalDialogueReviewError();
  }
  const request = buildFixedFictionalDemoContext().request;
  const known = new Map(request.evidence.map(event => [event.eventId, event]));
  const seen = new Set();
  for (const turn of turns) {
    checkTurn(turn, known);
    if (seen.has(turn.intentCode)) throw new FictionalDialogueReviewError();
    seen.add(turn.intentCode);
  }

  const reviewItems = Object.freeze(turns.map(turn => Object.freeze({
    intentCode: turn.intentCode,
    question: turn.question,
    proposedAnswerUnverified: turn.answer,
    sourcesToCheck: Object.freeze(turn.sourceTrace.map(source =>
      Object.freeze({ ...source }))),
    uncertaintiesToCheck: Object.freeze([...turn.uncertainties]),
    suggestionsToCheck: Object.freeze(turn.suggestedActions.map(action =>
      Object.freeze({
        title: action.title,
        sourceEventIds: Object.freeze([...action.sourceEventIds]),
        confirmed: false,
      }))),
    checklist: CHECKLIST,
    checkedByProfessional: false,
  })));

  const repeated = new Map();
  for (const item of reviewItems) {
    for (const action of item.suggestionsToCheck) {
      const key = normalizeTitle(action.title);
      const entry = repeated.get(key);
      if (entry) {
        if (!entry.intentCodes.includes(item.intentCode)) entry.intentCodes.push(item.intentCode);
      } else {
        repeated.set(key, { title: action.title, intentCodes: [item.intentCode] });
      }
    }
  }
  const repeatedActionSuggestions = Object.freeze([...repeated.values()]
    .filter(item => item.intentCodes.length >= 2)
    .map(item => Object.freeze({
      title: item.title,
      mentionedIn: Object.freeze([...item.intentCodes]),
      requiresHumanDeduplication: true,
    })));

  const missing = Object.freeze(INTENTS
    .filter(intentCode => !seen.has(intentCode))
    .map(intentCode => Object.freeze({
      intentCode,
      question: FICTIONAL_DIALOGUE_QUESTIONS[intentCode].label,
    })));

  return Object.freeze({
    status: "RELECTURE_FICTIVE_A_EFFECTUER",
    caseId: request.caseId,
    asOf: request.asOf,
    completedTurns: turns.length,
    expectedTurns: INTENTS.length,
    sessionComplete: turns.length === INTENTS.length,
    pendingQuestions: missing,
    reviewItems,
    repeatedActionSuggestions,
    humanReviewRequired: true,
    semanticallyVerified: false,
    humanRatingProvided: false,
    professionalDecisionMade: false,
    saved: false,
    transmitted: false,
    providerCalledByReview: false,
  });
}
