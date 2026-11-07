import test from "node:test";
import assert from "node:assert/strict";
import {
  createFixedFictionalLocalDialogue,
  FICTIONAL_DIALOGUE_QUESTIONS,
  FictionalLocalDialogueError,
} from "../src/fictionalLocalDialogue.js";

const modelName = "qwen3:8b";
const sourcesByIntent = {
  EVOLUTION: ["E05", "E08"],
  DECLARATIONS: ["E04", "E08"],
  COURRIER: ["E06", "E08"],
  SUITES: ["E08"],
};
function draftFor(intentCode) {
  return {
    caseId: "case-fiction-essai-local",
    intentCode,
    answer: "Proposition fictive sur " + intentCode + ", à confirmer par la professionnelle.",
    sourceEventIds: [...sourcesByIntent[intentCode]],
    uncertainties: ["Contenu et démarches à vérifier."],
    suggestedActions: [{
      title: "Reprendre les informations avec la personne accompagnée.",
      sourceEventIds: ["E08"],
      confirmed: false,
    }],
  };
}
const asResponse = value => ({
  ok: true, status: 200, text: async () => JSON.stringify(value),
});
function mockLocal({
  makeDraft = draftFor, modelExists = true, failOnPost = false, waitOnPost = null,
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/api/tags")) {
      return asResponse({
        models: modelExists ? [{
          name: modelName, model: modelName, size: 5_500_000_000,
        }] : [],
      });
    }
    if (failOnPost) throw new Error("SECRET_SIMULE_NE_PAS_EXPOSER");
    if (waitOnPost) await waitOnPost;
    const sent = JSON.parse(options.body);
    const input = JSON.parse(sent.messages[1].content);
    return asResponse({
      done: true,
      message: {
        role: "assistant",
        content: JSON.stringify(makeDraft(input.questionCode)),
      },
    });
  };
  return { fetchImpl, calls };
}
function session(transport = mockLocal(), extra = {}) {
  return createFixedFictionalLocalDialogue({
    enabled: true, fictionalOnlyAcknowledged: true,
    modelName, fetchImpl: transport.fetchImpl, ...extra,
  });
}

test("la démonstration est désactivée par défaut et ne contacte rien", async () => {
  const t = mockLocal();
  const s = createFixedFictionalLocalDialogue({ fetchImpl: t.fetchImpl });
  assert.equal(s.status, "DEMONSTRATION_DESACTIVEE");
  assert.deepEqual(s.getHistory(), []);
  assert.deepEqual(await s.ask("EVOLUTION"),
    { status: "DEMONSTRATION_DESACTIVEE", modelCalled: false });
  assert.deepEqual(t.calls, []);
  const other = createFixedFictionalLocalDialogue({
    enabled: true, fictionalOnlyAcknowledged: false,
    modelName, fetchImpl: t.fetchImpl,
  });
  assert.equal(other.status, "DEMONSTRATION_DESACTIVEE");
  assert.deepEqual(t.calls, []);
});

test("quatre tours fictifs conservent les échanges et les sources dans un fil local", async () => {
  const t = mockLocal();
  const s = session(t);
  const intents = Object.keys(FICTIONAL_DIALOGUE_QUESTIONS);
  for (let i = 0; i < intents.length; i += 1) {
    const reply = await s.ask(intents[i]);
    assert.equal(reply.status, "REPONSE_FICTIVE_NON_VALIDEE");
    assert.equal(reply.turnNumber, i + 1);
    assert.equal(reply.intentCode, intents[i]);
    assert.equal(reply.turn.semanticallyVerified, false);
    assert.equal(reply.turn.humanValidationRequired, true);
    assert.equal(reply.turn.transmitted, false);
    assert.equal(reply.turn.storedInDatabase, false);
    assert.deepEqual(reply.turn.sourceTrace.map(source => source.eventId),
      reply.turn.sourceEventIds);
    assert.ok(reply.turn.sourceTrace.every(source => source.semanticSupportVerified === false));
    assert.ok(reply.turn.sourceTrace.every(source => typeof source.originalExcerptUntrusted === "string"));
    assert.ok(Object.isFrozen(reply.turn.sourceTrace));
    assert.equal(reply.saved, false);
    assert.equal(reply.qualityScore, null);
    assert.equal(reply.cloudConfigurationVerified, false);
  }
  assert.equal(s.getHistory().length, 4);
  assert.ok(Object.isFrozen(s.getHistory()));
  assert.ok(Object.isFrozen(s.getHistory()[0]));
  assert.equal(t.calls.length, 8);
  for (let i = 0; i < 4; i += 1) {
    assert.deepEqual([t.calls[2 * i].options.method, t.calls[2 * i].url],
      ["GET", "http://127.0.0.1:11434/api/tags"]);
    assert.deepEqual([t.calls[2 * i + 1].options.method, t.calls[2 * i + 1].url],
      ["POST", "http://127.0.0.1:11434/api/chat"]);
    assert.equal(t.calls[2 * i + 1].options.redirect, "error");
    const sent = JSON.parse(t.calls[2 * i + 1].options.body);
    const body = JSON.parse(sent.messages[1].content);
    assert.equal(body.caseId, "case-fiction-essai-local");
    assert.equal(body.fictionalOnly, true);
    assert.equal(body.eventEvidenceUntrusted.length, 8);
    assert.equal(body.allowedEventIds.length, 8);
    assert.equal(body.previouslyGeneratedDialogueUntrusted.length, i);
    assert.ok(body.previouslyGeneratedDialogueUntrusted.every(
      turn => turn.canBeCitedAsEvidence === false));
    assert.equal(sent.stream, false);
    assert.equal(sent.model, modelName);
    assert.equal(sent.messages[0].role, "system");
    assert.equal(sent.messages[1].role, "user");
  }
  assert.equal(s.getHistory()[0].answer.includes("EVOLUTION"), true);
});

test("répéter un échange ou fournir une question libre ne produit aucun appel", async () => {
  const t = mockLocal();
  const s = session(t);
  await s.ask("EVOLUTION");
  const count = t.calls.length;
  for (const bad of ["Explique-moi un dossier réel", "http://evil.example", "__proto__", null]) {
    await assert.rejects(() => s.ask(bad), FictionalLocalDialogueError);
  }
  await assert.rejects(() => s.ask("EVOLUTION"), {
    name: "FictionalLocalDialogueError",
    message: "QUESTION_DEJA_TRAITEE",
  });
  assert.equal(t.calls.length, count);
  assert.equal(s.getHistory().length, 1);
});

test("refuse un modèle absent, un alias cloud et un nom de domaine", async () => {
  const t = mockLocal({ modelExists: false });
  const s = session(t);
  await assert.rejects(() => s.ask("EVOLUTION"), {
    name: "FictionalLocalDialogueError", message: "MODELE_LOCAL_NON_DISPONIBLE",
  });
  assert.deepEqual(t.calls.map(call => call.options.method), ["GET"]);
  for (const name of ["gpt-oss:cloud", "my-cloud-backend", "https://example.org", ""]) {
    assert.throws(() => session(mockLocal(), { modelName: name }),
      FictionalLocalDialogueError);
  }
});

test("les citations requises par sujet doivent toutes figurer dans la réponse", async () => {
  const missing = mockLocal({
    makeDraft: code => ({ ...draftFor(code), sourceEventIds: ["E08"] }),
  });
  const s = session(missing);
  await assert.rejects(() => s.ask("DECLARATIONS"), {
    name: "FictionalLocalDialogueError", message: "REPONSE_DIALOGUE_NON_CONFORME",
  });
  assert.deepEqual(s.getHistory(), []);
});

test("refuse une source étrangère et les actions préconfirmées", async () => {
  const fakeForeign = mockLocal({
    makeDraft: code => ({ ...draftFor(code), sourceEventIds: ["E05", "E08", "E99"] }),
  });
  await assert.rejects(() => session(fakeForeign).ask("EVOLUTION"), FictionalLocalDialogueError);
  const auto = mockLocal({
    makeDraft: code => ({
      ...draftFor(code),
      suggestedActions: [{
        title: "Envoyer sans autorisation",
        sourceEventIds: ["E08"], confirmed: true,
      }],
    }),
  });
  await assert.rejects(() => session(auto).ask("SUITES"), FictionalLocalDialogueError);
});

test("une erreur de modèle reste sans historisation et ne divulgue pas le détail", async () => {
  const t = mockLocal({ failOnPost: true });
  const s = session(t);
  await assert.rejects(() => s.ask("EVOLUTION"), {
    name: "FictionalLocalDialogueError", message: "MODELE_LOCAL_NON_DISPONIBLE",
  });
  assert.equal(s.getHistory().length, 0);
});

test("un deuxième appel simultané est refusé avant toute seconde requête", async () => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const t = mockLocal({ waitOnPost: waiting });
  const s = session(t);
  const first = s.ask("EVOLUTION");
  await assert.rejects(() => s.ask("COURRIER"), {
    name: "FictionalLocalDialogueError", message: "DIALOGUE_DEJA_EN_COURS",
  });
  release();
  await first;
  assert.equal(s.getHistory().length, 1);
  assert.deepEqual(t.calls.map(call => call.options.method), ["GET", "POST"]);
});
