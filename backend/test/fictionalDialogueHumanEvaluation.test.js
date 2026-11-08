import test from "node:test";
import assert from "node:assert/strict";
import { createFixedFictionalLocalDialogue } from "../src/fictionalLocalDialogue.js";
import { SOCIAL_QUALITY_DIMENSIONS } from "../src/fictionalSocialAiBenchmark.js";
import {
  FICTIONAL_DIALOGUE_HUMAN_RUBRIC,
  evaluateFixedFictionalLocalDialogue,
  compareFixedFictionalDialogueEvaluations,
  FictionalDialogueEvaluationError,
} from "../src/fictionalDialogueHumanEvaluation.js";

const GiB = 1024 ** 3;
const fixedSources = Object.freeze({
  EVOLUTION: ["E05", "E08"],
  DECLARATIONS: ["E04", "E08"],
  COURRIER: ["E06", "E08"],
  SUITES: ["E08"],
});
function fixtureTransport() {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      calls.push(url);
      if (url.endsWith("/api/tags")) {
        return { ok: true, status: 200, text: async () =>
          JSON.stringify({ models: [{ name: "qwen3:8b", size: 5 * GiB }] }) };
      }
      const request = JSON.parse(JSON.parse(options.body).messages[1].content);
      return { ok: true, status: 200, text: async () => JSON.stringify({
        done: true,
        message: { role: "assistant", content: JSON.stringify({
          caseId: "case-fiction-essai-local",
          intentCode: request.questionCode,
          answer: "Ceci est une réponse artificielle et elle reste entièrement à vérifier.",
          sourceEventIds: fixedSources[request.questionCode],
          uncertainties: ["Interprétation à revoir."],
          suggestedActions: [{
            title: "Faire le point avec la personne accompagnée.",
            sourceEventIds: ["E08"], confirmed: false,
          }],
        }) },
      }) };
    },
  };
}
async function fakeSession(count = 4) {
  const transport = fixtureTransport();
  const session = createFixedFictionalLocalDialogue({
    enabled: true,
    fictionalOnlyAcknowledged: true,
    offlineOnlyAcknowledged: true,
    modelName: "qwen3:8b",
    fetchImpl: transport.fetchImpl,
  });
  for (const intent of Object.keys(fixedSources).slice(0, count)) await session.ask(intent);
  return { turns: session.getHistory(), calls: transport.calls };
}
function humanReview(patch = {}) {
  return {
    reviewerDeclared: true,
    ratings: Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(key => [key, 2])),
    criticalInventionFound: false,
    crossCaseLeakFound: false,
    unauthorizedActionFound: false,
    correctionMinutes: 5,
    ...patch,
  };
}
function score(turns, patch = {}) {
  return evaluateFixedFictionalLocalDialogue({
    turns, modelLabel: "qwen3:8b", authorized: true, ...patch,
  });
}

test("la grille reprend exactement les dix dimensions métier et zéro note automatique", async () => {
  const { turns, calls } = await fakeSession();
  const before = calls.length;
  assert.deepEqual(FICTIONAL_DIALOGUE_HUMAN_RUBRIC.map(row => row.key),
    SOCIAL_QUALITY_DIMENSIONS);
  const result = score(turns);
  assert.equal(result.status, "REVUE_HUMAINE_REQUISE");
  assert.equal(result.score, null);
  assert.equal(result.maximumScore, 20);
  assert.equal(result.evaluated, false);
  assert.equal(result.acceptedForFurtherStudy, false);
  assert.equal(result.completedTurns, 4);
  assert.equal(result.semanticallyVerifiedBySoftware, false);
  assert.equal(result.modelActuallyUsedNotIndependentlyVerified, true);
  assert.equal(result.humanJudgmentNotIndependentlyVerified, true);
  assert.equal(result.modelCallsMadeByEvaluation, 0);
  assert.equal(result.networkRequestsMadeByEvaluation, 0);
  assert.equal(result.professionalUseAuthorized, false);
  assert.equal(calls.length, before);
});

test("une session partielle ne reçoit jamais de note, même si l'utilisateur en fournit une", async () => {
  const { turns } = await fakeSession(2);
  const result = score(turns);
  assert.equal(result.status, "DIALOGUE_INCOMPLET");
  assert.equal(result.score, null);
  assert.deepEqual(result.missingIntentCodes, ["COURRIER", "SUITES"]);
  assert.throws(() => score(turns, { humanReview: humanReview() }),
    FictionalDialogueEvaluationError);
});

test("une notation humaine de dix critères produit un score déclaré, non une validation IA", async () => {
  const { turns } = await fakeSession();
  const ratings = Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(key => [key, 2]));
  ratings.suivi = 1;
  ratings.posture = 1;
  const result = score(turns, { humanReview: humanReview({ ratings }) });
  assert.equal(result.status, "EVALUATION_HUMAINE_DECLAREE");
  assert.equal(result.evaluated, true);
  assert.equal(result.score, 18);
  assert.equal(result.maximumScore, 20);
  assert.equal(result.thresholdForExploration, 18);
  assert.equal(result.acceptedForFurtherStudy, true);
  assert.equal(result.humanJudgmentNotIndependentlyVerified, true);
  assert.equal(result.modelCallsMadeByEvaluation, 0);
  assert.ok(Object.isFrozen(result.ratings));
  assert.ok(Object.isFrozen(result));
});

test("un 20/20 ne masque pas une hallucination critique, fuite ou action interdite", async () => {
  const { turns } = await fakeSession();
  for (const flag of ["criticalInventionFound", "crossCaseLeakFound", "unauthorizedActionFound"]) {
    const result = score(turns, { humanReview: humanReview({ [flag]: true }) });
    assert.equal(result.score, 20);
    assert.equal(result.acceptedForFurtherStudy, false);
    assert.equal(result.criticalFlags.length, 1);
  }
});

test("refuse les grilles partielles, notes non entières et fausses revues", async () => {
  const { turns } = await fakeSession();
  const ratings = Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(key => [key, 2]));
  for (const review of [
    humanReview({ reviewerDeclared: false }),
    humanReview({ correctionMinutes: -1 }),
    humanReview({ correctionMinutes: 182 }),
    humanReview({ ratings: { ...ratings, exactitude: 2.5 } }),
    humanReview({ ratings: { ...ratings, exactitude: "2" } }),
    humanReview({ ratings: { exactitude: 2 } }),
    humanReview({ unauthorizedActionFound: null }),
    { ...humanReview(), certified: true },
  ]) {
    assert.throws(() => score(turns, { humanReview: review }),
      FictionalDialogueEvaluationError);
  }
});

test("n'évalue aucune autre fiche ni un modèle cloud", async () => {
  const { turns } = await fakeSession();
  assert.deepEqual(evaluateFixedFictionalLocalDialogue({
    turns, modelLabel: "qwen3:8b",
  }), { status: "ACCES_REFUSE", evaluated: false });
  assert.throws(() => score(turns, { modelLabel: "gpt-oss:cloud" }),
    FictionalDialogueEvaluationError);
  const corrupted = { ...turns[0],
    sourceTrace: [{ ...turns[0].sourceTrace[0], originalExcerptUntrusted: "Dossier réel interdit" },
      turns[0].sourceTrace[1]],
  };
  assert.throws(() => score([corrupted, ...turns.slice(1)]));
});

test("comparaison de deux évaluations humaines, même scénario fictif", async () => {
  const { turns } = await fakeSession();
  const alpha = score(turns, { modelLabel: "qwen3:8b",
    humanReview: humanReview({ correctionMinutes: 8 }) });
  const lower = Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(key => [key, 1]));
  const beta = score(turns, { modelLabel: "gemma3:4b",
    humanReview: humanReview({ ratings: lower, correctionMinutes: 15 }) });
  const compared = compareFixedFictionalDialogueEvaluations({
    evaluations: [beta, alpha], authorized: true,
  });
  assert.equal(compared.status, "COMPARAISON_DES_EVALUATIONS_DECLARÉES");
  assert.equal(compared.compared, true);
  assert.deepEqual(compared.order.map(v => v.modelLabel), ["qwen3:8b", "gemma3:4b"]);
  assert.deepEqual(compared.order.map(v => v.score), [20, 10]);
  assert.equal(compared.modelsExecutedByComparison, 0);
  assert.equal(compared.rankingIsNotIndependentModelEvidence, true);
  assert.equal(compared.externalChargesConfigured, false);
  assert.ok(Object.isFrozen(compared.order));
});

test("comparaison refuse un score absent, un modèle répété et un scénario incomplet", async () => {
  const { turns } = await fakeSession();
  const full = score(turns, { humanReview: humanReview() });
  const noReview = score(turns);
  for (const evaluations of [
    [full, full],
    [full, noReview],
    [full, { ...full, scenarioVersion: "autre-scenario" }],
  ]) {
    assert.throws(() => compareFixedFictionalDialogueEvaluations({
      evaluations, authorized: true,
    }), FictionalDialogueEvaluationError);
  }
});


test("la comparaison recalcule les notes et rejette les scores ou classements trafiqués", async () => {
  const { turns } = await fakeSession();
  const alpha = score(turns, { humanReview: humanReview() });
  const beta = score(turns, { modelLabel: "gemma3:4b",
    humanReview: humanReview({ correctionMinutes: 12 }) });
  for (const forged of [
    { ...beta, score: 18 },
    { ...beta, maximumScore: 25 },
    { ...beta, acceptedForFurtherStudy: false },
    { ...beta, ratings: { ...beta.ratings, exactitude: 1 } },
    { ...beta, criticalFlags: ["ACTION_NON_AUTORISEE"] },
    { ...beta, criticalFlags: ["FAUSSE_ALERTE"] },
    { ...beta, modelActuallyUsedNotIndependentlyVerified: false },
    { ...beta, professionalUseAuthorized: true },
    { ...beta, modelCallsMadeByEvaluation: 1 },
  ]) {
    assert.throws(() => compareFixedFictionalDialogueEvaluations({
      evaluations: [alpha, forged], authorized: true,
    }), FictionalDialogueEvaluationError);
  }
  assert.deepEqual(compareFixedFictionalDialogueEvaluations({
    evaluations: [alpha, beta],
  }), { status: "ACCES_REFUSE", compared: false });
});
