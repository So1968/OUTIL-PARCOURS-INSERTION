import test from "node:test";
import assert from "node:assert/strict";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { assembleFictionalDialogueContext } from "../src/fictionalDialogueContext.js";
import {
  evaluateFictionalSocialCandidate, compareFictionalSocialCandidates,
  FictionalSocialBenchmarkError, SOCIAL_QUALITY_DIMENSIONS,
} from "../src/fictionalSocialAiBenchmark.js";

const caseId = "case-fiction-benchmark";
const prepared = prepareFictionalSummary({
  caseId, asOf: "2026-11-04", authorized: true, summaryType: "ENTRETIEN",
  events: [
    { id: "E01", caseId, occurredAt: "2026-04-01", version: 1,
      evidenceStatus: "DECLARATION", text: "Projet d'entreprise envisagé." },
    { id: "E02", caseId, occurredAt: "2026-11-04", version: 1,
      evidenceStatus: "DECLARATION", text: "Souhait d'emploi salarié exprimé." },
  ],
});
const dialogue = assembleFictionalDialogueContext({
  prepared, authorized: true, threadId: "thread-fiction-benchmark",
  currentQuestion: "Quel changement depuis avril ?", turns: [],
});

function candidate() {
  return {
    caseId, asOf: "2026-11-04", summaryType: "ENTRETIEN",
    sections: [{
      kind: "EVOLUTION",
      text: "La personne déclare vouloir explorer un emploi salarié.",
      sourceEventIds: ["E01", "E02"],
    }],
    uncertainties: [{
      text: "Les démarches concrètes restent à préciser.",
      sourceEventIds: ["E02"],
    }],
    conflicts: [],
    suggestedActions: [{
      title: "Faire un point sur les démarches d'emploi envisagées.",
      sourceEventIds: ["E02"], confirmed: false,
    }],
  };
}
function ratings(value = 2) {
  return Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(key => [key, value]));
}
function review(patch = {}) {
  return {
    ratings: ratings(), criticalInventionFound: false, crossCaseLeakFound: false,
    correctionMinutes: 4, reviewerDeclared: true, ...patch,
  };
}
function evaluate(patch = {}) {
  return evaluateFictionalSocialCandidate({
    prepared, dialogue, candidate: candidate(), modelLabel: "fixture-alpha",
    authorized: true, ...patch,
  });
}

test("contrôle mécanique sans note ni prétention de qualité IA", () => {
  const result = evaluate();
  assert.equal(result.status, "REVUE_HUMAINE_REQUISE");
  assert.equal(result.qualityScore, null);
  assert.equal(result.evaluated, false);
  assert.equal(result.acceptedForFurtherStudy, false);
  assert.equal(result.latestEventReferenced, true);
  assert.equal(result.totalAssertions, 3);
  assert.equal(result.totalCitations, 4);
  assert.equal(result.generatedByModel, false);
  assert.equal(result.providerCalled, false);
  assert.equal(result.expenseIncurred, false);
  assert.equal(result.semanticallyVerifiedBySoftware, false);
});

test("une grille humaine déclarée de 18/20 dépasse le seuil provisoire", () => {
  const score = ratings();
  score.exactitude = 1;
  score.suivi = 1;
  const result = evaluate({ humanReview: review({ ratings: score }) });
  assert.equal(result.status, "EVALUATION_HUMAINE_DECLAREE");
  assert.equal(result.qualityScore, 18);
  assert.equal(result.maximumScore, 20);
  assert.equal(result.threshold, 18);
  assert.equal(result.acceptedForFurtherStudy, true);
  assert.equal(result.submittedHumanJudgmentIndependentlyVerified, false);
  assert.ok(Object.isFrozen(result.scores));
});

test("un 20/20 ne compense jamais une invention grave ou une fuite entre dossiers", () => {
  for (const flags of [{ criticalInventionFound: true }, { crossCaseLeakFound: true }]) {
    const result = evaluate({ humanReview: review(flags) });
    assert.equal(result.qualityScore, 20);
    assert.equal(result.acceptedForFurtherStudy, false);
    assert.equal(result.blockingIssues.length, 1);
  }
});

test("ne prétend pas qu'une revue automatisée équivaut à une personne", () => {
  assert.throws(() => evaluate({
    humanReview: review({ reviewerDeclared: false }),
  }), FictionalSocialBenchmarkError);
  assert.throws(() => evaluate({
    humanReview: review({ ratings: { ...ratings(), exactitude: 3 } }),
  }), FictionalSocialBenchmarkError);
  assert.throws(() => evaluate({
    humanReview: review({ ratings: { ...ratings(), exactitude: 1.5 } }),
  }), FictionalSocialBenchmarkError);
  assert.throws(() => evaluate({
    humanReview: review({ correctionMinutes: -1 }),
  }), FictionalSocialBenchmarkError);
});

test("refuse identifiants réels ou références de sources absentes", () => {
  assert.throws(() => evaluate({ modelLabel: "gpt-quelconque" }), FictionalSocialBenchmarkError);
  const wrong = candidate();
  wrong.sections[0].sourceEventIds = ["E99"];
  assert.throws(() => evaluate({ candidate: wrong }));
});

test("refuse toute évaluation à partir d'un contexte devenu interdit", () => {
  assert.deepEqual(evaluate({ authorized: false, humanReview: review() }), {
    status: "ACCES_REFUSE", evaluated: false,
  });
});

test("compare deux réponses fictives sur la même chronologie", () => {
  const lower = ratings(1);
  const result = compareFictionalSocialCandidates({
    prepared, dialogue, authorized: true,
    entries: [
      { modelLabel: "fixture-b", candidate: candidate(), humanReview: review({ ratings: lower, correctionMinutes: 8 }) },
      { modelLabel: "fixture-a", candidate: candidate(), humanReview: review({ correctionMinutes: 4 }) },
    ],
  });
  assert.equal(result.status, "COMPARAISON_FICTIVE");
  assert.deepEqual(result.evaluations.map(item => item.modelLabel), ["fixture-a", "fixture-b"]);
  assert.equal(result.modelCallsMade, 0);
  assert.equal(result.resultIsNotModelPerformanceProof, true);
  assert.ok(Object.isFrozen(result.evaluations));
});

test("comparaison refuse les modèles en doublon et les grilles absentes", () => {
  const first = { modelLabel: "fixture-a", candidate: candidate(), humanReview: review() };
  assert.throws(() => compareFictionalSocialCandidates({
    prepared, dialogue, authorized: true, entries: [first, first],
  }), FictionalSocialBenchmarkError);
  assert.throws(() => compareFictionalSocialCandidates({
    prepared, dialogue, authorized: true,
    entries: [first, { modelLabel: "fixture-b", candidate: candidate(), humanReview: null }],
  }), FictionalSocialBenchmarkError);
});
