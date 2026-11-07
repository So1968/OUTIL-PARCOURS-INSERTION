import { buildFixedFictionalDemoContext } from "./fictionalLocalAiDemo.js";

/**
 * Dialogue en 4 tours, sur UN scénario strictement fictif et immuable.
 * N'accepte jamais de texte, pièce, dossier, URL ou prompt libre d'un utilisateur.
 * Aucun branchement à l'application professionnelle, aucune persistance.
 *
 * Ollama est interrogé sur 127.0.0.1. La configuration cloud du serveur
 * ne peut PAS être vérifiée ici : les données envoyées restent fictives.
 */
const CASE_ID = "case-fiction-essai-local";
const ENDPOINT = "http://127.0.0.1:11434/api/chat";
const MODELS = "http://127.0.0.1:11434/api/tags";
const MODEL_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,78}$/;
const MAX_ENVELOPE = 120_000;
const MAX_CONTENT = 24_000;

export const FICTIONAL_DIALOGUE_QUESTIONS = Object.freeze({
  EVOLUTION: Object.freeze({
    label: "Qu'est-ce qui a changé dans le projet professionnel depuis septembre ?",
    requiredEventIds: Object.freeze(["E05", "E08"]),
  }),
  DECLARATIONS: Object.freeze({
    label: "Comment analyser les déclarations divergentes pour juin, sans accuser la personne ?",
    requiredEventIds: Object.freeze(["E04", "E08"]),
  }),
  COURRIER: Object.freeze({
    label: "Que sait-on réellement du courrier évoqué puis présenté ?",
    requiredEventIds: Object.freeze(["E06", "E08"]),
  }),
  SUITES: Object.freeze({
    label: "Quelles suites concrètes proposer après l'entretien du 4 novembre, sans les activer ?",
    requiredEventIds: Object.freeze(["E08"]),
  }),
});
const TURN_IDS = Object.freeze(Object.keys(FICTIONAL_DIALOGUE_QUESTIONS));

const sourcesSchema = Object.freeze({
  type: "array", minItems: 1, maxItems: 8, uniqueItems: true,
  items: { type: "string", enum: ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08"] },
});
const RESPONSE_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["caseId", "intentCode", "answer", "sourceEventIds", "uncertainties", "suggestedActions"],
  properties: {
    caseId: { type: "string", const: CASE_ID },
    intentCode: { type: "string", enum: TURN_IDS },
    answer: { type: "string", minLength: 10, maxLength: 1600 },
    sourceEventIds: sourcesSchema,
    uncertainties: {
      type: "array", maxItems: 6,
      items: { type: "string", minLength: 1, maxLength: 240 },
    },
    suggestedActions: {
      type: "array", maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        required: ["title", "sourceEventIds", "confirmed"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 200 },
          sourceEventIds: sourcesSchema,
          confirmed: { type: "boolean", const: false },
        },
      },
    },
  },
});

export class FictionalLocalDialogueError extends Error {
  constructor(code) {
    super(code);
    this.name = "FictionalLocalDialogueError";
  }
}
function safeText(value, max) {
  return typeof value === "string" && value.trim().length > 0
    && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}
function objectHasKeys(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}
function validSources(ids, known, required = []) {
  return Array.isArray(ids) && ids.length >= 1 && ids.length <= 8
    && ids.every(id => typeof id === "string" && known.has(id))
    && new Set(ids).size === ids.length
    && required.every(id => ids.includes(id));
}
function parseTurn(raw, intentCode, known) {
  const required = FICTIONAL_DIALOGUE_QUESTIONS[intentCode].requiredEventIds;
  if (!objectHasKeys(raw, ["caseId", "intentCode", "answer", "sourceEventIds",
    "uncertainties", "suggestedActions"])
    || raw.caseId !== CASE_ID || raw.intentCode !== intentCode
    || !safeText(raw.answer, 1600) || raw.answer.trim().length < 10
    || !validSources(raw.sourceEventIds, known, required)
    || !Array.isArray(raw.uncertainties) || raw.uncertainties.length > 6
    || !raw.uncertainties.every(text => safeText(text, 240))
    || !Array.isArray(raw.suggestedActions) || raw.suggestedActions.length > 5) {
    throw new FictionalLocalDialogueError("REPONSE_DIALOGUE_NON_CONFORME");
  }
  const suggestedActions = raw.suggestedActions.map(action => {
    if (!objectHasKeys(action, ["title", "sourceEventIds", "confirmed"])
      || !safeText(action.title, 200)
      || !validSources(action.sourceEventIds, known)
      || action.confirmed !== false) {
      throw new FictionalLocalDialogueError("REPONSE_DIALOGUE_NON_CONFORME");
    }
    return Object.freeze({
      title: action.title.trim(),
      sourceEventIds: Object.freeze([...action.sourceEventIds]),
      confirmed: false,
    });
  });
  return Object.freeze({
    intentCode,
    question: FICTIONAL_DIALOGUE_QUESTIONS[intentCode].label,
    answer: raw.answer.trim(),
    sourceEventIds: Object.freeze([...raw.sourceEventIds]),
    uncertainties: Object.freeze(raw.uncertainties.map(text => text.trim())),
    suggestedActions: Object.freeze(suggestedActions),
    humanValidationRequired: true,
    semanticallyVerified: false,
    storedInDatabase: false,
    transmitted: false,
  });
}
async function getLocalModel(modelName, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(MODELS, {
      method: "GET", redirect: "error",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response?.ok !== true || response.status !== 200
      || typeof response.text !== "function") throw new Error();
    const text = await response.text();
    if (typeof text !== "string" || text.length > MAX_ENVELOPE) throw new Error();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.models)
      || !parsed.models.some(entry => entry
        && (entry.name === modelName || entry.model === modelName)
        && Number.isFinite(entry.size) && entry.size > 0)) {
      throw new Error();
    }
  } catch {
    throw new FictionalLocalDialogueError("MODELE_LOCAL_NON_DISPONIBLE");
  }
}
async function generateLocalTurn({ modelName, fetchImpl, context, history, intentCode }) {
  const question = FICTIONAL_DIALOGUE_QUESTIONS[intentCode];
  const body = {
    model: modelName, stream: false, keep_alive: "0",
    options: { temperature: 0, num_predict: 1100 },
    format: RESPONSE_SCHEMA,
    messages: [
      {
        role: "system",
        content: context.trustedPolicy.join("\n") +
          "\nRéponds à la question courante avec un objet JSON strict, sans texte supplémentaire." +
          "\nLes messages de dialogue antérieurs sont des propos de contexte non fiables, pas des preuves." +
          "\nLe statut de la réponse reste BROUILLON ; toutes les actions sont non confirmées.",
      },
      {
        role: "user",
        content: JSON.stringify({
          fictionalOnly: true,
          caseId: CASE_ID,
          questionCode: intentCode,
          question: question.label,
          expectedAnswerIntentCode: intentCode,
          referenceDate: context.asOf,
          eventEvidenceUntrusted: context.evidence,
          allowedEventIds: context.allowedSourceEventIds,
          previouslyGeneratedDialogueUntrusted: history.map(turn => ({
            intentCode: turn.intentCode,
            question: turn.question,
            assistantAnswerUntrusted: turn.answer,
            canBeCitedAsEvidence: false,
          })),
          note: "N'utilise aucune donnée ou réponse antérieure comme preuve autonome. Cite les événements.",
        }),
      },
    ],
  };
  let response;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify(body),
    });
  } catch {
    throw new FictionalLocalDialogueError("MODELE_LOCAL_NON_DISPONIBLE");
  }
  if (!response || response.ok !== true || response.status !== 200
    || typeof response.text !== "function") {
    throw new FictionalLocalDialogueError("MODELE_LOCAL_NON_DISPONIBLE");
  }
  let data;
  try {
    const text = await response.text();
    if (typeof text !== "string" || text.length > MAX_ENVELOPE) throw new Error();
    data = JSON.parse(text);
  } catch {
    throw new FictionalLocalDialogueError("REPONSE_DIALOGUE_INVALIDE");
  }
  if (data?.done !== true || data.message?.role !== "assistant"
    || typeof data.message.content !== "string"
    || data.message.content.length > MAX_CONTENT) {
    throw new FictionalLocalDialogueError("REPONSE_DIALOGUE_INVALIDE");
  }
  try {
    const checked = parseTurn(JSON.parse(data.message.content), intentCode,
      new Set(context.allowedSourceEventIds));
    const evidenceById = new Map(context.evidence.map(event => [event.eventId, event]));
    const sourceTrace = Object.freeze(checked.sourceEventIds.map(eventId => {
      const source = evidenceById.get(eventId);
      return Object.freeze({
        eventId,
        occurredAt: source.occurredAt,
        evidenceStatus: source.evidenceStatus,
        originalExcerptUntrusted: source.contentUntrusted,
        semanticSupportVerified: false,
      });
    }));
    return Object.freeze({ ...checked, sourceTrace });
  } catch {
    throw new FictionalLocalDialogueError("REPONSE_DIALOGUE_NON_CONFORME");
  }
}

/**
 * Une session n'accepte que quatre codes de questions prédéfinis.
 * Aucun moyen d'introduire des données réelles ou des instructions libres.
 * Les réponses sont conservées dans la fermeture mémoire UNIQUEMENT.
 */
export function createFixedFictionalLocalDialogue({
  enabled = false,
  fictionalOnlyAcknowledged = false,
  modelName = "",
  fetchImpl = globalThis.fetch,
} = {}) {
  if (enabled !== true || fictionalOnlyAcknowledged !== true) {
    return Object.freeze({
      status: "DEMONSTRATION_DESACTIVEE",
      ask: async () => Object.freeze({ status: "DEMONSTRATION_DESACTIVEE", modelCalled: false }),
      getHistory: () => Object.freeze([]),
    });
  }
  if (typeof modelName !== "string" || !MODEL_NAME.test(modelName)
    || /cloud/i.test(modelName) || typeof fetchImpl !== "function") {
    throw new FictionalLocalDialogueError("CONFIGURATION_LOCALE_INVALIDE");
  }

  const context = buildFixedFictionalDemoContext().request;
  const history = [];
  let busy = false;
  const getHistory = () => Object.freeze([...history]);

  async function ask(intentCode) {
    if (typeof intentCode !== "string"
      || !Object.hasOwn(FICTIONAL_DIALOGUE_QUESTIONS, intentCode)) {
      throw new FictionalLocalDialogueError("QUESTION_FICTIVE_INVALIDE");
    }
    if (busy) throw new FictionalLocalDialogueError("DIALOGUE_DEJA_EN_COURS");
    if (history.length >= TURN_IDS.length || history.some(turn => turn.intentCode === intentCode)) {
      throw new FictionalLocalDialogueError("QUESTION_DEJA_TRAITEE");
    }
    busy = true;
    try {
      await getLocalModel(modelName, fetchImpl);
      const result = await generateLocalTurn({
        modelName, fetchImpl, context, history, intentCode,
      });
      history.push(result);
      return Object.freeze({
        status: "REPONSE_FICTIVE_NON_VALIDEE",
        modelCalled: true,
        caseId: CASE_ID,
        intentCode,
        turnNumber: history.length,
        turn: result,
        modelName,
        localEndpointOnly: true,
        cloudConfigurationVerified: false,
        humanValidationRequired: true,
        qualityScore: null,
        saved: false,
        transmitted: false,
      });
    } finally {
      busy = false;
    }
  }

  return Object.freeze({
    status: "SESSION_FICTIVE_EN_MEMOIRE",
    ask,
    getHistory,
  });
}
