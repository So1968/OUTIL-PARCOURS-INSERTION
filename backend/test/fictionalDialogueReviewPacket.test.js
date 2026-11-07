import test from "node:test";
import assert from "node:assert/strict";
import {
  createFixedFictionalLocalDialogue,
} from "../src/fictionalLocalDialogue.js";
import {
  prepareFixedFictionalDialogueReview,
  FictionalDialogueReviewError,
} from "../src/fictionalDialogueReviewPacket.js";

const modelName = "qwen3:8b";
const relevant = {
  EVOLUTION: ["E05", "E08"],
  DECLARATIONS: ["E04", "E08"],
  COURRIER: ["E06", "E08"],
  SUITES: ["E08"],
};
function fakeLocal() {
  let networkCalls = 0;
  const fetchImpl = async (url, options) => {
    networkCalls += 1;
    if (url.endsWith("/api/tags")) {
      return {
        ok: true, status: 200,
        text: async () => JSON.stringify({
          models: [{ name: modelName, size: 5_000_000_000 }],
        }),
      };
    }
    const input = JSON.parse(JSON.parse(options.body).messages[1].content);
    const intentCode = input.questionCode;
    return {
      ok: true, status: 200,
      text: async () => JSON.stringify({
        done: true,
        message: {
          role: "assistant",
          content: JSON.stringify({
            caseId: "case-fiction-essai-local",
            intentCode,
            answer: "Brouillon artificiel sur " + intentCode + " à vérifier par la professionnelle.",
            sourceEventIds: relevant[intentCode],
            uncertainties: ["L'interprétation exige une vérification humaine."],
            suggestedActions: [{
              title: "Faire le point avec la personne accompagnée.",
              sourceEventIds: ["E08"],
              confirmed: false,
            }],
          }),
        },
      }),
    };
  };
  return {
    createSession: () => createFixedFictionalLocalDialogue({
      enabled: true, fictionalOnlyAcknowledged: true,
      offlineOnlyAcknowledged: true, modelName, fetchImpl,
    }),
    getCallCount: () => networkCalls,
  };
}
async function sampleHistory(count = 4) {
  const fake = fakeLocal();
  const session = fake.createSession();
  for (const intent of Object.keys(relevant).slice(0, count)) await session.ask(intent);
  return { turns: session.getHistory(), networkCalls: fake.getCallCount() };
}

test("le dialogue complet prépare quatre fiches sourcées sans validation automatique", async () => {
  const { turns, networkCalls } = await sampleHistory();
  assert.equal(networkCalls, 8);
  const packet = prepareFixedFictionalDialogueReview({ turns, authorized: true });
  assert.equal(packet.status, "RELECTURE_FICTIVE_A_EFFECTUER");
  assert.equal(packet.caseId, "case-fiction-essai-local");
  assert.equal(packet.completedTurns, 4);
  assert.equal(packet.expectedTurns, 4);
  assert.equal(packet.sessionComplete, true);
  assert.deepEqual(packet.pendingQuestions, []);
  assert.equal(packet.reviewItems.length, 4);
  assert.ok(packet.reviewItems.every(item =>
    item.checkedByProfessional === false
    && item.checklist.length === 5
    && item.sourcesToCheck.every(source =>
      source.semanticSupportVerified === false && source.originalExcerptUntrusted.length > 0)
    && item.suggestionsToCheck.every(action => action.confirmed === false)));
  assert.equal(packet.repeatedActionSuggestions.length, 1);
  assert.deepEqual(packet.repeatedActionSuggestions[0].mentionedIn,
    ["EVOLUTION", "DECLARATIONS", "COURRIER", "SUITES"]);
  assert.equal(packet.humanRatingProvided, false);
  assert.equal(packet.professionalDecisionMade, false);
  assert.equal(packet.semanticallyVerified, false);
  assert.equal(packet.providerCalledByReview, false);
  assert.equal(packet.saved, false);
  assert.equal(packet.transmitted, false);
  assert.ok(Object.isFrozen(packet.reviewItems[0].sourcesToCheck[0]));
  assert.ok(Object.isFrozen(packet.repeatedActionSuggestions[0]));
});

test("une conversation partielle montre ce qui manque mais n'invente aucune réponse", async () => {
  const { turns } = await sampleHistory(2);
  const packet = prepareFixedFictionalDialogueReview({ turns, authorized: true });
  assert.equal(packet.completedTurns, 2);
  assert.equal(packet.sessionComplete, false);
  assert.deepEqual(packet.pendingQuestions.map(q => q.intentCode), ["COURRIER", "SUITES"]);
  assert.equal(packet.reviewItems.length, 2);
});

test("l'historique vide produit uniquement les questions à examiner", () => {
  const packet = prepareFixedFictionalDialogueReview({ turns: [], authorized: true });
  assert.equal(packet.completedTurns, 0);
  assert.equal(packet.sessionComplete, false);
  assert.equal(packet.pendingQuestions.length, 4);
  assert.deepEqual(packet.reviewItems, []);
  assert.deepEqual(packet.repeatedActionSuggestions, []);
});

test("un accès refusé ne révèle aucun texte ni identifiant de dossier", async () => {
  const { turns } = await sampleHistory(1);
  assert.deepEqual(prepareFixedFictionalDialogueReview({ turns, authorized: false }),
    { status: "ACCES_REFUSE", prepared: false });
});

test("un extrait altéré ou étranger entraîne un refus et non une relecture erronée", async () => {
  const { turns } = await sampleHistory(1);
  const altered = {
    ...turns[0],
    sourceTrace: [{ ...turns[0].sourceTrace[0], originalExcerptUntrusted: "Autre dossier" },
      turns[0].sourceTrace[1]],
  };
  assert.throws(() => prepareFixedFictionalDialogueReview({
    turns: [altered], authorized: true,
  }), FictionalDialogueReviewError);
  const foreign = { ...turns[0], sourceEventIds: ["E99", "E08"] };
  assert.throws(() => prepareFixedFictionalDialogueReview({
    turns: [foreign], authorized: true,
  }), FictionalDialogueReviewError);
  const spoofed = { ...turns[0], semanticallyVerified: true };
  assert.throws(() => prepareFixedFictionalDialogueReview({
    turns: [spoofed], authorized: true,
  }), FictionalDialogueReviewError);
});

test("ne permet ni doublon, ni action prétendument confirmée", async () => {
  const { turns } = await sampleHistory(1);
  assert.throws(() => prepareFixedFictionalDialogueReview({
    turns: [turns[0], turns[0]], authorized: true,
  }), FictionalDialogueReviewError);
  const invalid = { ...turns[0], suggestedActions: [
    { ...turns[0].suggestedActions[0], confirmed: true },
  ] };
  assert.throws(() => prepareFixedFictionalDialogueReview({
    turns: [invalid], authorized: true,
  }), FictionalDialogueReviewError);
});

test("la relecture n'ajoute pas d'appels réseau au dialogue simulé", async () => {
  const fake = fakeLocal();
  const session = fake.createSession();
  await session.ask("EVOLUTION");
  const before = fake.getCallCount();
  prepareFixedFictionalDialogueReview({ turns: session.getHistory(), authorized: true });
  assert.equal(fake.getCallCount(), before);
});
