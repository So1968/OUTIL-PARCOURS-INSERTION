import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectFictionalInstalledModels,
  FictionalLocalInventoryError,
} from "../src/fictionalInstalledModelInventory.js";

function fakeTransport(data = { models: [] }) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true, status: 200,
      text: async () => JSON.stringify(data),
    };
  };
  return { calls, fetchImpl };
}
const enabled = {
  enabled: true, fictionalOnlyAcknowledged: true, offlineOnlyAcknowledged: true,
};

test("aucune requête sans confirmation triple même si le transport est fourni", async () => {
  const transport = fakeTransport();
  const cases = [
    {},
    { enabled: true },
    { enabled: true, fictionalOnlyAcknowledged: true },
    { enabled: true, offlineOnlyAcknowledged: true },
    { fictionalOnlyAcknowledged: true, offlineOnlyAcknowledged: true },
  ];
  for (const flags of cases) {
    const result = await inspectFictionalInstalledModels({
      ...flags, fetchImpl: transport.fetchImpl,
    });
    assert.equal(result.status, "INVENTAIRE_DESACTIVE");
    assert.equal(result.inspected, false);
    assert.equal(result.networkRequestsMade, 0);
  }
  assert.deepEqual(transport.calls, []);
});

test("ne lit que /api/tags sur localhost, sans générer ni télécharger de modèle", async () => {
  const transport = fakeTransport({
    models: [
      { name: "qwen3:8b", model: "qwen3:8b", size: 5 * 1024 ** 3, digest: "SECRET_TEST" },
      { name: "gemma3:4b", model: "gemma3:4b", size: 3 * 1024 ** 3 },
    ],
  });
  const result = await inspectFictionalInstalledModels({
    ...enabled, fetchImpl: transport.fetchImpl,
  });
  assert.deepEqual(transport.calls.map(x => [x.options.method, x.url]), [
    ["GET", "http://127.0.0.1:11434/api/tags"],
  ]);
  assert.equal(transport.calls[0].options.redirect, "error");
  assert.equal(result.status, "MODELES_DECLARÉS_PAR_OLLAMA");
  assert.deepEqual(result.models.map(x => x.name), ["gemma3:4b", "qwen3:8b"]);
  assert.deepEqual(result.models.map(x => x.weightFileSizeGiB), [3, 5]);
  assert.equal(result.networkRequestsMade, 1);
  assert.equal(result.modelCallsMade, 0);
  assert.equal(result.generatedTokens, 0);
  assert.equal(result.modelsDownloaded, 0);
  assert.equal(result.cloudServerConfigurationVerified, false);
  assert.equal(result.noExternalBillingProven, false);
  assert.equal(result.modelLicensesVerified, false);
  assert.equal(result.machineCompatibilityVerified, false);
  assert.equal(result.safeToUseRealCaseData, false);
  assert.equal(result.providerApiChargesConfigured, false);
  assert.equal(result.models[0].licenseChecked, false);
  assert.equal(result.models[1].entirelyLocalExecutionVerified, false);
  assert.ok(!JSON.stringify(result).includes("SECRET_TEST"));
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.models));
  assert.ok(Object.isFrozen(result.models[0]));
});

test("ne propose pas les alias cloud, chemins, modèles sans poids et métadonnées douteuses", async () => {
  const transport = fakeTransport({ models: [
    { name: "qwen3:8b", size: 5_000_000_000 },
    { name: "qwen3:8b", size: 5_000_000_000 },
    { name: "gpt-oss:cloud", size: 30_000_000_000 },
    { name: "remote-cloud-company", size: 9_000_000 },
    { name: "http://evil.example/model", size: 1_000_000 },
    { name: "../outside", size: 1_000_000 },
    { name: "fake:2b", size: 0 },
    { name: "fake:7b", size: 3_000_000, model: "fake:1b" },
  ] });
  const result = await inspectFictionalInstalledModels({
    ...enabled, fetchImpl: transport.fetchImpl,
  });
  assert.deepEqual(result.models.map(x => x.name), ["qwen3:8b"]);
  assert.equal(result.excludedEntries, 7);
  assert.equal(result.onlyLocalCatalogRead, true);
});

test("un catalogue vide ne déclenche aucun téléchargement ni suggestion payante", async () => {
  const transport = fakeTransport({ models: [] });
  const result = await inspectFictionalInstalledModels({
    ...enabled, fetchImpl: transport.fetchImpl,
  });
  assert.equal(result.status, "AUCUN_MODELE_LOCAL_COMPATIBLE_DECLARÉ");
  assert.deepEqual(result.models, []);
  assert.equal(result.modelsDownloaded, 0);
  assert.equal(result.safeToUseRealCaseData, false);
});

test("les réponses trop grandes, les JSON malformés et les structures inattendues sont refusés", async () => {
  const bad = [
    "not json",
    JSON.stringify({ models: null }),
    JSON.stringify({ models: "qwen" }),
    "x".repeat(120_001),
    JSON.stringify({ models: Array.from({ length: 101 }, () => ({})) }),
  ];
  for (const body of bad) {
    await assert.rejects(
      () => inspectFictionalInstalledModels({
        ...enabled, fetchImpl: async () => ({
          ok: true, status: 200, text: async () => body,
        }),
      }),
      { name: "FictionalLocalInventoryError", message: "CATALOGUE_MODELES_INVALIDE" },
    );
  }
});

test("un service inaccessible ne divulgue pas l'erreur réseau", async () => {
  const secret = "SECRET_TEST_RESEAU_NE_PAS_DIVULGUER";
  await assert.rejects(
    () => inspectFictionalInstalledModels({
      ...enabled, fetchImpl: async () => { throw new Error(secret); },
    }),
    { name: "FictionalLocalInventoryError", message: "SERVICE_OLLAMA_INDISPONIBLE" },
  );
  await assert.rejects(
    () => inspectFictionalInstalledModels({
      ...enabled, fetchImpl: async () => ({ status: 404, ok: false }),
    }),
    FictionalLocalInventoryError,
  );
});

test("un transport non fonctionnel est rejeté sans appel", async () => {
  await assert.rejects(
    () => inspectFictionalInstalledModels({
      ...enabled, fetchImpl: {},
    }),
    { name: "FictionalLocalInventoryError", message: "TRANSPORT_LOCAL_INVALIDE" },
  );
});
