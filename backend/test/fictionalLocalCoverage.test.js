import test from "node:test";
import assert from "node:assert/strict";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { reviewFictionalSummaryDraft } from "../src/fictionalSummaryReview.js";
import { reviewFixedFictionalCoverage, FictionalCoverageError } from "../src/fictionalLocalCoverage.js";

const caseId = "case-fiction-essai-local";
const asOf = "2026-11-04";
const ids = [
  ["E01", "2026-02-03"], ["E02", "2026-03-10"],
  ["E03", "2026-04-22"], ["E04", "2026-06-08"],
  ["E05", "2026-09-15"], ["E06", "2026-10-06"],
  ["E07", "2026-10-20"], ["E08", "2026-11-04"],
];
const prepared = prepareFictionalSummary({
  caseId, asOf, authorized: true,
  events: ids.map(([id, occurredAt]) => ({
    id, caseId, occurredAt,
    text: "Evénement professionnel fictif " + id,
    evidenceStatus: "DECLARATION", version: 1,
  })),
});

function candidate() {
  return {
    caseId, asOf, summaryType: "ENTRETIEN",
    sections: [
      { kind: "EVOLUTION", text: "Changement de projet déclaré.",
        sourceEventIds: ["E05", "E08"] },
    ],
    uncertainties: [
      { text: "Courrier non examiné.", sourceEventIds: ["E06", "E08"] },
    ],
    conflicts: [
      { text: "Déclarations divergentes.", sourceEventIds: ["E04", "E08"] },
    ],
    suggestedActions: [
      { title: "Faire un point sur les démarches.", sourceEventIds: ["E08"], confirmed: false },
    ],
  };
}
function review(input) {
  return reviewFixedFictionalCoverage(reviewFictionalSummaryDraft(prepared, input));
}

test("les quatre rubriques de citations de la scène fictive sont signalées", () => {
  const result = review(candidate());
  assert.equal(result.status, "CONTROLE_FICTIF_DES_REFERENCES");
  assert.equal(result.referencesPresentCount, 4);
  assert.equal(result.totalIndicators, 4);
  assert.equal(result.targetedReviewNeeded, false);
  assert.deepEqual(result.reviewPriorities, []);
  assert.equal(result.automaticallyApproved, false);
  assert.equal(result.semanticValidationPerformed, false);
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.qualityScore, null);
  assert.equal(result.exported, false);
  assert.equal(result.saved, false);
  assert.ok(Object.isFrozen(result.indicators));
});

test("une contradiction oubliée reste visible comme priorité de relecture", () => {
  const input = candidate();
  input.conflicts = [];
  const result = review(input);
  assert.equal(result.referencesPresentCount, 3);
  assert.equal(result.targetedReviewNeeded, true);
  assert.deepEqual(result.reviewPriorities.map(p => p.code), ["ECART_DECLARATIONS"]);
});

test("courrier et suite absents restent à relire sans inventer de synthèse", () => {
  const input = candidate();
  input.uncertainties = [];
  input.suggestedActions = [];
  const result = review(input);
  assert.equal(result.referencesPresentCount, 2);
  assert.deepEqual(result.reviewPriorities.map(p => p.code),
    ["COURRIER_NON_ANALYSE", "SUITE_A_CONFIRMER"]);
});

test("une citation mécanique ne prouve pas que le texte est exact", () => {
  const input = candidate();
  input.sections[0].text = "Cette affirmation pourrait être trompeuse.";
  const result = review(input);
  assert.equal(result.referencesPresentCount, 4);
  assert.equal(result.semanticValidationPerformed, false);
  assert.equal(result.automaticallyApproved, false);
});

test("ne permet pas de contrôler le brouillon d'un autre dossier ou un faux statut", () => {
  const draft = reviewFictionalSummaryDraft(prepared, candidate());
  assert.throws(() => reviewFixedFictionalCoverage({ ...draft,
    caseId: "case-fiction-autre" }), FictionalCoverageError);
  assert.throws(() => reviewFixedFictionalCoverage({ ...draft,
    status: "VALIDE" }), FictionalCoverageError);
  assert.throws(() => reviewFixedFictionalCoverage({ ...draft,
    transmitted: true }), FictionalCoverageError);
  assert.throws(() => reviewFixedFictionalCoverage(null), FictionalCoverageError);
});
