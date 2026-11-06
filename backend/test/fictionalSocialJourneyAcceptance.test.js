/**
 * Recette transversale de bout en bout : DONNEES 100 % FICTIVES.
 * La réponse "candidate" est écrite pour le test et NON générée par IA.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { selectFictionalCaseContext } from "../src/fictionalCaseContext.js";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { reviewFictionalSummaryDraft } from "../src/fictionalSummaryReview.js";
import { assembleFictionalDialogueContext } from "../src/fictionalDialogueContext.js";

const caseId = "case-fiction-parcours";
const facts = [
  ["E01", "2026-02-03", "Activité artisanale envisagée.", "DECLARATION"],
  ["E02", "2026-03-10", "Réunion d'information à rechercher.", "OBSERVATION"],
  ["E03", "2026-04-22", "Participation à la réunion annoncée.", "DECLARATION"],
  ["E04", "2026-06-08", "Création d'entreprise annoncée ; chiffre d'affaires de juin estimé à 90 euros.", "DECLARATION"],
  ["E05", "2026-09-15", "Activité interrompue selon la personne ; orientation vers un emploi salarié envisagée.", "DECLARATION"],
  ["E06", "2026-10-06", "Un courrier administratif est évoqué ; contenu non examiné.", "DECLARATION"],
  ["E07", "2026-10-20", "Rendez-vous non honoré ; courrier non examiné.", "OBSERVATION"],
  ["E08", "2026-11-04", "Projet salarié réaffirmé ; 0 euro de chiffre d'affaires de juin déclaré ; courrier présenté mais non retranscrit.", "DECLARATION"],
];
const events = facts.map(([id, occurredAt, text, evidenceStatus]) =>
  ({ id, caseId, occurredAt, text, evidenceStatus, version: 1 }));

test("continuité parcours → demande de synthèse → conversation → brouillon sourcé", () => {
  const timeline = selectFictionalCaseContext({
    caseId, asOf: "2026-11-04", events: [...events].reverse(), authorized: true,
  });
  assert.deepEqual(timeline.sourceEventIds, facts.map(row => row[0]));
  const prepared = prepareFictionalSummary({
    caseId, asOf: "2026-11-04", events: [...events].reverse(),
    authorized: true, summaryType: "ENTRETIEN",
    professionalQuestion: "Quelle évolution du parcours depuis septembre ?",
  });
  const dialogue = assembleFictionalDialogueContext({
    prepared, authorized: true, threadId: "thread-fiction-parcours",
    currentQuestion: "Rédiger une synthèse sans reprendre les anciennes difficultés résolues.",
    turns: [
      { id: "T001", threadId: "thread-fiction-parcours", caseId, occurredAt: "2026-09-16", role: "ASSISTANT_FICTIF", text: "Ancienne analyse hypothétique, à ne pas prendre pour une preuve." },
    ],
  });
  assert.deepEqual(dialogue.sourceEventIds, timeline.sourceEventIds);
  assert.equal(dialogue.dialogueHistory[0].canBeCitedAsCaseEvidence, false);

  // Réponse de simulation écrite à la main : permet de tester les contrats,
  // nullement de revendiquer une analyse IA réellement effectuée.
  const candidate = {
    caseId, asOf: "2026-11-04", summaryType: "ENTRETIEN",
    sections: [
      { kind: "EVOLUTION", text: "La personne réaffirme son intérêt pour un emploi salarié.", sourceEventIds: ["E05", "E08"] },
      { kind: "POINT_DE_VIGILANCE", text: "Le contenu du courrier reste à examiner.", sourceEventIds: ["E06", "E07", "E08"] },
      { kind: "POINT_DE_VIGILANCE", text: "Les informations déclarées sur le chiffre d'affaires de juin divergent et nécessitent une clarification.", sourceEventIds: ["E04", "E08"] },
    ],
    uncertainties: [
      { text: "Nature et contenu du courrier non établis dans le journal.", sourceEventIds: ["E06", "E08"] },
    ],
    conflicts: [
      { text: "Montants déclarés pour juin : 90 euros puis 0 euro.", sourceEventIds: ["E04", "E08"] },
    ],
    suggestedActions: [
      { title: "Examiner le courrier avec la personne.", sourceEventIds: ["E06", "E08"], confirmed: false },
      { title: "Clarifier les déclarations de chiffre d'affaires.", sourceEventIds: ["E04", "E08"], confirmed: false },
    ],
  };
  const draft = reviewFictionalSummaryDraft(prepared, candidate);
  assert.equal(draft.status, "BROUILLON_A_VERIFIER");
  assert.equal(draft.semanticallyVerified, false);
  assert.equal(draft.transmitted, false);
  assert.equal(draft.saved, false);
  assert.ok(draft.summaryPreview.includes("chiffre d'affaires"));
  assert.ok(!draft.summaryPreview.includes("réunion d'information"));
  assert.deepEqual(draft.conflicts[0].sourceEventIds, ["E04", "E08"]);
  assert.ok(draft.suggestedActions.every(a => a.confirmed === false));
});

test("retrait d'autorisation entre les étapes du parcours et la conversation", () => {
  const prepared = prepareFictionalSummary({ caseId, asOf: "2026-11-04", events, authorized: true });
  const result = assembleFictionalDialogueContext({
    prepared, authorized: false, threadId: "thread-fiction-parcours",
    turns: [], currentQuestion: "Peux-tu reprendre ce dossier ?",
  });
  assert.deepEqual(result, { status: "ACCES_REFUSE", dialogueHistory: [] });
});
