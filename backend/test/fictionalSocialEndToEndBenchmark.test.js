/**
 * Recette métier intégrée sur une histoire et une synthèse 100 % FICTIVES.
 * La proposition est rédigée dans ce test : AUCUNE IA ne produit le texte.
 * Ne valide pas un modèle ; confirme que les contrats peuvent s'enchaîner.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { selectFictionalRevisedTimeline } from "../src/fictionalRevisionTimeline.js";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { assembleFictionalDialogueContext } from "../src/fictionalDialogueContext.js";
import { buildFictionalSocialAiRequest, reviewFictionalModelFixture } from "../src/fictionalSocialAiContract.js";
import { searchFictionalSocialReferences, attachFictionalReferences } from "../src/fictionalReferenceSearch.js";
import {
  evaluateFictionalSocialCandidate, SOCIAL_QUALITY_DIMENSIONS,
} from "../src/fictionalSocialAiBenchmark.js";

const caseId = "case-fiction-parcours-eval";
const asOf = "2026-11-04";
function version(id, version, occurredAt, recordedAt, text, reason, evidenceStatus = "DECLARATION") {
  return { id, caseId, version, occurredAt, recordedAt, text, reason, evidenceStatus };
}
const revisions = [
  version("E01", 2, "2026-02-03", "2026-02-10", "Projet de couture envisagé.", "Correction de transcription"),
  version("E01", 1, "2026-02-03", "2026-02-03", "Projet informatique envisagé (erreur de transcription).", "Première note"),
  version("E02", 1, "2026-03-10", "2026-03-10", "Réunion d'information à rechercher.", "Entretien"),
  version("E03", 1, "2026-04-22", "2026-04-22", "Participation à la réunion déclarée.", "Entretien"),
  version("E04", 1, "2026-06-08", "2026-06-08", "Chiffre d'affaires de juin déclaré à 90 euros.", "Entretien"),
  version("E05", 1, "2026-09-15", "2026-09-15", "Souhait d'explorer un emploi salarié à temps partiel.", "Entretien"),
  version("E06", 1, "2026-10-06", "2026-10-06", "Courrier administratif évoqué, non examiné.", "Appel"),
  version("E07", 1, "2026-10-20", "2026-10-20", "Absence au rendez-vous et courrier non examiné.", "Entretien", "OBSERVATION"),
  version("E08", 1, "2026-11-04", "2026-11-04",
    "Souhait d'emploi salarié confirmé. Chiffre d'affaires de juin déclaré désormais à 0 euro. Courrier présenté sans contenu retranscrit.",
    "Entretien"),
];
const proposed = {
  caseId, asOf, summaryType: "ENTRETIEN",
  sections: [
    { kind: "EVOLUTION",
      text: "La personne confirme vouloir explorer un emploi salarié à temps partiel.",
      sourceEventIds: ["E05", "E08"] },
    { kind: "POINT_DE_VIGILANCE",
      text: "Les déclarations de chiffre d'affaires pour juin divergent et nécessitent une clarification.",
      sourceEventIds: ["E04", "E08"] },
    { kind: "SUITE",
      text: "Le contenu du courrier administratif reste à examiner.",
      sourceEventIds: ["E06", "E07", "E08"] },
  ],
  uncertainties: [{
    text: "Le contenu du courrier n'est pas documenté.",
    sourceEventIds: ["E06", "E08"],
  }],
  conflicts: [{
    text: "Pour juin, 90 euros ont été déclarés auparavant et 0 euro ensuite.",
    sourceEventIds: ["E04", "E08"],
  }],
  suggestedActions: [{
    title: "Examiner le courrier avec la personne accompagnée.",
    sourceEventIds: ["E08"], confirmed: false,
  }],
};

test("chaîne complète fictive : corrections → dialogue → référence → synthèse → évaluation humaine", () => {
  const timeline = selectFictionalRevisedTimeline({
    caseId, asOf, revisions, authorized: true,
  });
  assert.deepEqual(timeline.sourceEventIds, ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08"]);
  assert.equal(timeline.events[0].text, "Projet de couture envisagé.");
  assert.equal(timeline.events[0].version, 2);
  assert.equal(timeline.revisionTrail[0].textOfSupersededVersionsUsedAsEvidence, false);

  const prepared = prepareFictionalSummary({
    caseId, asOf, events: timeline.events, authorized: true,
    professionalQuestion: "Qu'est-ce qui change depuis septembre ?",
  });
  const dialogue = assembleFictionalDialogueContext({
    prepared, authorized: true, threadId: "thread-fiction-parcours-eval",
    currentQuestion: "Rédige la synthèse du dernier entretien sans répétitions.",
    turns: [{
      id: "T001", caseId, threadId: "thread-fiction-parcours-eval",
      occurredAt: "2026-09-16", role: "ASSISTANT_FICTIF",
      text: "Ancienne hypothèse de travail à confirmer.",
    }],
  });
  const request = buildFictionalSocialAiRequest({ prepared, dialogue, authorized: true });
  assert.ok(request.evidence.every(e => !e.contentUntrusted.includes("informatique")));
  assert.equal(request.untrustedConversationHistory[0].canBeCitedAsCaseEvidence, false);

  const search = searchFictionalSocialReferences({
    query: "accompagnement emploi", asOf, references: [{
      id: "ref-fiction-parcours", title: "Accompagnement et emploi, exemple fictif",
      sourceType: "RECOMMANDATION", scope: "NATIONAL",
      publishedAt: "2026-01-01", effectiveFrom: "2026-01-02", effectiveTo: null,
      excerpt: "Recommandation fictive : tenir compte des objectifs exprimés.",
      keywords: ["emploi", "accompagnement"],
    }],
  });
  const enriched = attachFictionalReferences({ request, searchResult: search, authorized: true });
  assert.equal(enriched.untrustedReferenceExcerpts[0].applicabilityVerified, false);
  assert.equal(enriched.legalSourcesValidated, false);

  const reviewed = reviewFictionalModelFixture({
    prepared, dialogue, candidate: proposed, authorized: true,
  });
  assert.equal(reviewed.draft.status, "BROUILLON_A_VERIFIER");
  assert.equal(reviewed.draft.semanticallyVerified, false);
  assert.equal(reviewed.modelUsed, false);
  assert.equal(reviewed.draft.conflicts[0].sourceEventIds.length, 2);
  assert.equal(reviewed.draft.suggestedActions[0].confirmed, false);
  assert.ok(!reviewed.draft.summaryPreview.includes("informatique"));

  const ratings = Object.fromEntries(SOCIAL_QUALITY_DIMENSIONS.map(k => [k, 2]));
  ratings.suivi = 1;
  ratings.provenance = 1;
  const evaluation = evaluateFictionalSocialCandidate({
    prepared, dialogue, candidate: proposed, modelLabel: "fixture-parcours",
    authorized: true,
    humanReview: {
      ratings,
      criticalInventionFound: false,
      crossCaseLeakFound: false,
      correctionMinutes: 5,
      reviewerDeclared: true,
    },
  });
  assert.equal(evaluation.qualityScore, 18);
  assert.equal(evaluation.status, "EVALUATION_HUMAINE_DECLAREE");
  assert.equal(evaluation.generatedByModel, false);
  assert.equal(evaluation.submittedHumanJudgmentIndependentlyVerified, false);
  assert.equal(evaluation.expenseIncurred, false);
});
