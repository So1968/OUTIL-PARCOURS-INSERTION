import test from "node:test";
import assert from "node:assert/strict";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { reviewFictionalSummaryDraft, FictionalSummaryReviewError } from "../src/fictionalSummaryReview.js";

const caseId = "case-fiction-alpha";
const events = [
  { id: "E01", caseId, occurredAt: "2026-04-22", text: "La réunion est déclarée accomplie.", evidenceStatus: "DECLARATION", version: 1 },
  { id: "E02", caseId, occurredAt: "2026-11-04", text: "Le projet salarié est confirmé.", evidenceStatus: "DECLARATION", version: 1 },
];
const prepared = prepareFictionalSummary({ caseId, asOf: "2026-11-04", events, authorized: true });
function proposal() {
  return {
    caseId, asOf: "2026-11-04", summaryType: "ENTRETIEN",
    sections: [
      { kind: "EVOLUTION", text: "La personne confirme vouloir explorer l'emploi salarié.", sourceEventIds: ["E02"] },
      { kind: "CONTEXTE", text: "Elle indique avoir participé à la réunion.", sourceEventIds: ["E01"] },
    ],
    uncertainties: [{ text: "Information non vérifiée.", sourceEventIds: ["E02"] }],
    conflicts: [{ text: "Points à clarifier.", sourceEventIds: ["E01", "E02"] }],
    suggestedActions: [{ title: "Clarifier la déclaration.", sourceEventIds: ["E02"], confirmed: false }],
  };
}

test("brouillon sourcé, non validé, sans transmission", () => {
  const out = reviewFictionalSummaryDraft(prepared, proposal());
  assert.equal(out.status, "BROUILLON_A_VERIFIER");
  assert.equal(out.sections[0].sourceEvidence[0].evidenceStatus, "DECLARATION");
  assert.equal(out.semanticallyVerified, false);
  assert.equal(out.humanValidationRequired, true);
  assert.equal(out.transmitted, false);
  assert.equal(out.saved, false);
  assert.equal(out.providerCalled, false);
  assert.equal(out.suggestedActions[0].confirmed, false);
  assert.ok(Object.isFrozen(out.sections[0]));
});

test("refuse les sources inconnues et les dossiers étrangers", () => {
  const q = proposal();
  q.sections[0].sourceEventIds = ["E93"];
  assert.throws(() => reviewFictionalSummaryDraft(prepared, q), FictionalSummaryReviewError);
  const foreign = proposal();
  foreign.caseId = "case-fiction-beta";
  assert.throws(() => reviewFictionalSummaryDraft(prepared, foreign), FictionalSummaryReviewError);
});

test("l'entretien doit citer le dernier événement", () => {
  const q = proposal();
  q.sections = [{ kind: "CONTEXTE", text: "Réunion mentionnée.", sourceEventIds: ["E01"] }];
  assert.throws(() => reviewFictionalSummaryDraft(prepared, q), FictionalSummaryReviewError);
});

test("refuse toute confirmation et champ d'action externe", () => {
  const q = proposal();
  q.suggestedActions[0].confirmed = true;
  assert.throws(() => reviewFictionalSummaryDraft(prepared, q), FictionalSummaryReviewError);
  assert.throws(() => reviewFictionalSummaryDraft(prepared, { ...proposal(), sendToOutlook: true }), FictionalSummaryReviewError);
});

test("une contradiction exige deux sources différentes", () => {
  const q = proposal();
  q.conflicts = [{ text: "Écart.", sourceEventIds: ["E02", "E02"] }];
  assert.throws(() => reviewFictionalSummaryDraft(prepared, q), FictionalSummaryReviewError);
});

test("refuse contenu vide, références absentes, caractère de contrôle", () => {
  for (const [field, value] of [["sourceEventIds", []], ["text", " "], ["text", "texte\nintrus"]]) {
    const q = proposal();
    q.sections[0][field] = value;
    assert.throws(() => reviewFictionalSummaryDraft(prepared, q), FictionalSummaryReviewError);
  }
});

test("la révocation de l'accès interdit la revue", () => {
  const denied = prepareFictionalSummary({ caseId, asOf: "2026-11-04", events, authorized: false });
  assert.throws(() => reviewFictionalSummaryDraft(denied, proposal()), FictionalSummaryReviewError);
});

test("la revue structurelle n'atteste pas de la véracité du texte", () => {
  const q = proposal();
  q.sections[0].text = "Cette phrase pourrait contenir une erreur factuelle.";
  const out = reviewFictionalSummaryDraft(prepared, q);
  assert.equal(out.semanticallyVerified, false);
});
