/**
 * Recette transversale entièrement fictive. Aucun fournisseur IA, aucun appel
 * à Internet, aucun dossier réel. Vérifie seulement les interfaces du prototype.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { prepareFictionalSummary } from "../src/fictionalSummaryPreparation.js";
import { assembleFictionalDialogueContext } from "../src/fictionalDialogueContext.js";
import {
  buildFictionalSocialAiRequest, reviewFictionalModelFixture,
} from "../src/fictionalSocialAiContract.js";
import {
  searchFictionalSocialReferences, attachFictionalReferences,
} from "../src/fictionalReferenceSearch.js";

test("entretien fictif → dialogue → référence datée → brouillon à contrôler", () => {
  const caseId = "case-fiction-rag";
  const events = [
    { id: "E01", caseId, occurredAt: "2026-04-10",
      text: "La personne explore une activité indépendante.",
      evidenceStatus: "DECLARATION", version: 1 },
    { id: "E02", caseId, occurredAt: "2026-11-04",
      text: "La personne souhaite désormais explorer un emploi salarié.",
      evidenceStatus: "DECLARATION", version: 1 },
  ];
  const prepared = prepareFictionalSummary({
    caseId, asOf: "2026-11-04", authorized: true, events, summaryType: "ENTRETIEN",
  });
  const dialogue = assembleFictionalDialogueContext({
    prepared, authorized: true, threadId: "thread-fiction-rag",
    currentQuestion: "Comment analyser cette évolution du parcours ?",
    turns: [{ id: "T001", caseId, threadId: "thread-fiction-rag",
      occurredAt: "2026-06-01", role: "PROFESSIONNELLE",
      text: "Échange antérieur sur les démarches possibles." }],
  });
  const request = buildFictionalSocialAiRequest({
    prepared, dialogue, authorized: true,
  });
  const refs = [{
    id: "ref-fiction-emploi", title: "Accompagnement vers emploi (document fictif)",
    sourceType: "RECOMMANDATION", scope: "NATIONAL",
    publishedAt: "2026-01-01", effectiveFrom: "2026-01-02",
    effectiveTo: null,
    excerpt: "Document fictif invitant à considérer les attentes exprimées et les ressources.",
    keywords: ["emploi", "accompagnement", "parcours"],
  }, {
    id: "ref-fiction-ancienne", title: "Ancienne recommandation emploi (fictive)",
    sourceType: "RECOMMANDATION", scope: "NATIONAL",
    publishedAt: "2025-01-01", effectiveFrom: "2025-01-02",
    effectiveTo: "2026-05-01",
    excerpt: "Ancien document fictif, ne pas appliquer au 4 novembre 2026.",
    keywords: ["emploi", "parcours"],
  }];
  const found = searchFictionalSocialReferences({
    query: "accompagnement emploi parcours", asOf: prepared.asOf, references: refs,
  });
  assert.deepEqual(found.results.map(r => r.referenceId), ["ref-fiction-emploi"]);
  const enriched = attachFictionalReferences({
    request, searchResult: found, authorized: true,
  });
  assert.equal(enriched.untrustedReferenceExcerpts.length, 1);
  assert.equal(enriched.legalSourcesValidated, false);
  assert.equal(enriched.providerConfigured, false);
  const candidate = {
    caseId, asOf: "2026-11-04", summaryType: "ENTRETIEN",
    sections: [
      { kind: "EVOLUTION",
        text: "La personne souhaite explorer une recherche d'emploi salarié.",
        sourceEventIds: ["E01", "E02"] },
    ],
    uncertainties: [
      { text: "Les démarches concrètes restent à préciser.", sourceEventIds: ["E02"] },
    ],
    conflicts: [],
    suggestedActions: [
      { title: "Faire le point sur les démarches possibles.", sourceEventIds: ["E02"], confirmed: false },
    ],
  };
  const reviewed = reviewFictionalModelFixture({
    prepared, dialogue, candidate, authorized: true,
  });
  assert.equal(reviewed.draft.status, "BROUILLON_A_VERIFIER");
  assert.equal(reviewed.modelUsed, false);
  assert.equal(reviewed.expenseIncurred, false);
  assert.equal(reviewed.draft.humanValidationRequired, true);
  assert.equal(reviewed.draft.semanticallyVerified, false);
  assert.equal(reviewed.draft.transmitted, false);
});
