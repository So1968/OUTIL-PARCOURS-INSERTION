import test from "node:test";
import assert from "node:assert/strict";
import {
  FictionalLocalAiError,
  previewFixedFictionalLocalAiDemo,
  runFixedFictionalLocalAiDemo,
} from "../src/fictionalLocalAiDemo.js";

const caseId = "case-fiction-essai-local";
const asOf = "2026-11-04";
function candidate() {
  return {
    caseId, asOf, summaryType: "ENTRETIEN",
    sections: [{
      kind: "EVOLUTION",
      text: "La personne confirme vouloir explorer un emploi salarié à temps partiel.",
      sourceEventIds: ["E05", "E08"],
    }, {
      kind: "POINT_DE_VIGILANCE",
      text: "Les déclarations relatives au chiffre d'affaires de juin divergent.",
      sourceEventIds: ["E04", "E08"],
    }],
    uncertainties: [{
      text: "Le contenu du courrier présenté n'est pas documenté.",
      sourceEventIds: ["E06", "E08"],
    }],
    conflicts: [{
      text: "Montants déclarés pour juin : 90 euros, puis 0 euro.",
      sourceEventIds: ["E04", "E08"],
    }],
    suggestedActions: [{
      title: "Examiner le courrier avec la personne accompagnée.",
      sourceEventIds: ["E08"], confirmed: false,
    }],
  };
}
function mockResponse(json) {
  return { ok: true, status: 200, text: async () => JSON.stringify(json) };
}
function localModelTransport({
  answer = candidate(), modelIsDownloaded = true, done = true,
} = {}) {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/api/tags")) {
      return mockResponse({
        models: modelIsDownloaded
          ? [{ name: "qwen3:8b", model: "qwen3:8b", size: 5_200_000_000 }]
          : [],
      });
    }
    return mockResponse({
      done,
      message: { role: "assistant", content: JSON.stringify(answer) },
      prompt_eval_count: 650, eval_count: 290,
    });
  };
  return { calls, fakeFetch };
}
async function call(extra = {}) {
  const transport = localModelTransport();
  const result = await runFixedFictionalLocalAiDemo({
    enabled: true, fictionalOnlyAcknowledged: true,
    modelName: "qwen3:8b", fetchImpl: transport.fakeFetch, ...extra,
  });
  return { result, transport };
}

test("prévisualisation sans appel de modèle et sans données métier", () => {
  const preview = previewFixedFictionalLocalAiDemo();
  assert.equal(preview.status, "DEMONSTRATION_FICTIVE_PREPAREE");
  assert.deepEqual(preview.sourceEventIds,
    ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08"]);
  assert.equal(preview.modelCalled, false);
  assert.equal(preview.providerConfigured, false);
  assert.equal(preview.containsRealCaseData, false);
});

test("aucune requête réseau sans les deux confirmations", async () => {
  const transport = localModelTransport();
  const cases = [
    { enabled: false, fictionalOnlyAcknowledged: true },
    { enabled: true, fictionalOnlyAcknowledged: false },
    { enabled: false, fictionalOnlyAcknowledged: false },
  ];
  for (const flags of cases) {
    const result = await runFixedFictionalLocalAiDemo({
      ...flags, modelName: "qwen3:8b", fetchImpl: transport.fakeFetch,
    });
    assert.equal(result.status, "DEMONSTRATION_DESACTIVEE");
    assert.equal(result.modelCalled, false);
  }
  assert.equal(transport.calls.length, 0);
});

test("vérifie d'abord les modèles téléchargés puis envoie un seul POST local", async () => {
  const { result, transport } = await call();
  assert.deepEqual(transport.calls.map(x => [x.options.method, x.url]), [
    ["GET", "http://127.0.0.1:11434/api/tags"],
    ["POST", "http://127.0.0.1:11434/api/chat"],
  ]);
  const body = JSON.parse(transport.calls[1].options.body);
  assert.equal(transport.calls[0].options.redirect, "error");
  assert.equal(transport.calls[1].options.redirect, "error");
  assert.equal(body.model, "qwen3:8b");
  assert.equal(body.stream, false);
  assert.equal(body.options.temperature, 0);
  assert.equal(body.messages[0].role, "system");
  assert.ok(body.messages[0].content.includes("non stigmatisant"));
  assert.equal(body.messages[1].role, "user");
  assert.equal(body.messages[1].content.includes("case-fiction-essai-local"), true);
  assert.equal(body.messages[1].content.includes("90 euros"), true);
  assert.equal(body.messages[1].content.includes("E08"), true);
  assert.equal(body.format.properties.suggestedActions.items.properties.confirmed.const, false);
  assert.equal(result.status, "BROUILLON_LOCAL_NON_VALIDE");
  assert.equal(result.generatedByModel, true);
  assert.equal(result.modelCalled, true);
  assert.equal(result.providerUsed, "OLLAMA_LOCAL");
  assert.equal(result.localEndpointOnly, true);
  assert.equal(result.cloudConfigurationVerified, false);
  assert.equal(result.humanValidationRequired, true);
  assert.equal(result.qualityScore, null);
  assert.equal(result.saved, false);
  assert.equal(result.transmitted, false);
  assert.equal(result.promptTokens, 650);
  assert.equal(result.outputTokens, 290);
  assert.equal(result.draft.semanticallyVerified, false);
  assert.equal(result.draft.suggestedActions[0].confirmed, false);
});

test("un modèle non téléchargé bloque l'appel de génération", async () => {
  const t = localModelTransport({ modelIsDownloaded: false });
  await assert.rejects(
    () => runFixedFictionalLocalAiDemo({
      enabled: true, fictionalOnlyAcknowledged: true, modelName: "qwen3:8b",
      fetchImpl: t.fakeFetch,
    }),
    { name: "FictionalLocalAiError", message: "MODELE_LOCAL_NON_TELECHARGE" },
  );
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].options.method, "GET");
});

test("interdit les alias cloud et les noms de modèle invalides sans réseau", async () => {
  const t = localModelTransport();
  for (const name of ["gpt-oss:cloud", "model-cloud", "https://ollama.com/api/chat", ""]) {
    await assert.rejects(
      () => runFixedFictionalLocalAiDemo({
        enabled: true, fictionalOnlyAcknowledged: true, modelName: name,
        fetchImpl: t.fakeFetch,
      }),
      FictionalLocalAiError,
    );
  }
  assert.equal(t.calls.length, 0);
});

test("une citation inventée ou une action confirmée entraîne un rejet intégral", async () => {
  const broken = candidate();
  broken.sections[0].sourceEventIds = ["E99"];
  for (const badAnswer of [
    broken, { ...candidate(), suggestedActions: [{
      title: "Envoyer sans relecture", sourceEventIds: ["E08"], confirmed: true,
    }] },
  ]) {
    const t = localModelTransport({ answer: badAnswer });
    await assert.rejects(
      () => runFixedFictionalLocalAiDemo({
        enabled: true, fictionalOnlyAcknowledged: true, modelName: "qwen3:8b",
        fetchImpl: t.fakeFetch,
      }),
      { name: "FictionalLocalAiError", message: "BROUILLON_MODELE_A_VERIFIER" },
    );
  }
});

test("une réponse interrompue ou malformée est refusée sans fuite de contenu", async () => {
  const t = localModelTransport({ done: false });
  await assert.rejects(
    () => runFixedFictionalLocalAiDemo({
      enabled: true, fictionalOnlyAcknowledged: true, modelName: "qwen3:8b",
      fetchImpl: t.fakeFetch,
    }),
    { name: "FictionalLocalAiError", message: "REPONSE_MODELE_INVALIDE" },
  );
  const thrown = async () => { throw new Error("SECRET_IMAGINAIRE_DANS_ERREUR_RESEAU"); };
  await assert.rejects(
    () => runFixedFictionalLocalAiDemo({
      enabled: true, fictionalOnlyAcknowledged: true, modelName: "qwen3:8b",
      fetchImpl: thrown,
    }),
    { name: "FictionalLocalAiError", message: "MODELE_LOCAL_INDISPONIBLE" },
  );
});

test("une réponse ou une liste de modèles trop volumineuse est rejetée", async () => {
  const huge = "x".repeat(120_001);
  const t = localModelTransport();
  const fake = async (url, options) => {
    if (url.endsWith("/api/tags")) return mockResponse({
      models: [{ name: "qwen3:8b", size: 5_200_000_000 }],
    });
    return { ok: true, status: 200, text: async () => huge };
  };
  await assert.rejects(
    () => runFixedFictionalLocalAiDemo({
      enabled: true, fictionalOnlyAcknowledged: true, modelName: "qwen3:8b",
      fetchImpl: fake,
    }),
    { name: "FictionalLocalAiError", message: "REPONSE_MODELE_INVALIDE" },
  );
  assert.equal(t.calls.length, 0);
});
