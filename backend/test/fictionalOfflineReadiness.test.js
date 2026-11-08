import test from "node:test";
import assert from "node:assert/strict";
import { inspectFictionalLocalAiReadiness, FictionalOfflineReadinessError } from "../src/fictionalOfflineReadiness.js";

const GiB = 1024 ** 3;
function inspect(configFileContent, overrides = {}) {
  return inspectFictionalLocalAiReadiness({
    configFileContent,
    totalMemoryBytes: 16 * GiB,
    freeMemoryBytes: 8 * GiB,
    ...overrides,
  });
}

test("le diagnostic reste passif, sans requête, téléchargement ni validation de facturation", () => {
  const result = inspect('{"disable_ollama_cloud":true}');
  assert.equal(result.status, "DIAGNOSTIC_LOCAL_SANS_INFERENCE");
  assert.equal(result.fileCloudSetting, "DESACTIVATION_DECLAREE_DANS_FICHIER");
  assert.equal(result.localConfigurationFileSuggestsNoCloud, true);
  assert.equal(result.serviceCloudModeVerified, false);
  assert.equal(result.serviceNoCloudFlagVerified, false);
  assert.equal(result.networkRequestsMade, 0);
  assert.equal(result.modelCallsMade, 0);
  assert.equal(result.modelsDownloaded, 0);
  assert.equal(result.noRemoteBillingProven, false);
  assert.equal(result.readyForRealCaseData, false);
  assert.equal(result.readyForRealInference, false);
  assert.equal(result.hostMemoryGiB, 16);
  assert.equal(result.freeMemoryGiB, 8);
  assert.equal(result.modelResourceAdequacyVerified, false);
  assert.ok(result.blockers.includes("SERVICE_OLLAMA_CLOUD_DESACTIVE_NON_VERIFIE"));
  assert.equal(result.manualVerificationNeeded, true);
  assert.ok(Object.isFrozen(result.blockers));
  assert.ok(Object.isFrozen(result));
});

test("un client avec OLLAMA_NO_CLOUD ne prouve jamais le réglage du service", () => {
  const result = inspect(null, { ollamaNoCloudInThisProcess: true });
  assert.equal(result.clientProcessNoCloudFlagSeen, true);
  assert.equal(result.fileCloudSetting, "CONFIG_FICHIER_ABSENT");
  assert.equal(result.localConfigurationFileSuggestsNoCloud, false);
  assert.equal(result.serviceCloudModeVerified, false);
  assert.ok(result.blockers.includes("DESACTIVATION_CLOUD_DU_SERVICE_NON_ETABLIE"));
});

test("un réglage cloud permissif, manquant, illisible ou trop long ne déverrouille rien", () => {
  const cases = [
    ['{"disable_ollama_cloud":false}', "CLOUD_AUTORISE_DANS_FICHIER"],
    ['{"other_setting":true}', "DESACTIVATION_ABSENTE_DU_FICHIER"],
    ["not json", "CONFIG_JSON_INVALIDE"],
    ["[]", "CONFIG_JSON_INVALIDE"],
    ["null", "CONFIG_JSON_INVALIDE"],
    ["x".repeat(4097), "CONFIG_FICHIER_NON_LISIBLE"],
  ];
  for (const [input, status] of cases) {
    const output = inspect(input);
    assert.equal(output.fileCloudSetting, status);
    assert.equal(output.localConfigurationFileSuggestsNoCloud, false);
    assert.equal(output.readyForRealInference, false);
    assert.equal(output.paidProviderConfiguredByDiagnostic, false);
  }
});

test("la mémoire disponible n'est jamais présentée comme une garantie de modèle compatible", () => {
  const tiny = inspect('{"disable_ollama_cloud":true}', {
    totalMemoryBytes: GiB, freeMemoryBytes: GiB / 2,
  });
  assert.equal(tiny.hostMemoryGiB, 1);
  assert.equal(tiny.freeMemoryGiB, 0.5);
  assert.equal(tiny.modelResourceAdequacyVerified, false);
  const ample = inspect('{"disable_ollama_cloud":true}', {
    totalMemoryBytes: 64 * GiB, freeMemoryBytes: 48 * GiB,
  });
  assert.equal(ample.modelResourceAdequacyVerified, false);
});

test("les entrées de diagnostic incohérentes sont refusées", () => {
  for (const parameters of [
    { totalMemoryBytes: -1, freeMemoryBytes: 0 },
    { totalMemoryBytes: GiB, freeMemoryBytes: GiB + 1 },
    { totalMemoryBytes: "16GiB", freeMemoryBytes: 1 },
    { totalMemoryBytes: GiB, freeMemoryBytes: 3.5 },
    { totalMemoryBytes: GiB, freeMemoryBytes: 1, ollamaNoCloudInThisProcess: "1" },
  ]) {
    assert.throws(() => inspectFictionalLocalAiReadiness(parameters),
      FictionalOfflineReadinessError);
  }
});

test("un contenu potentiellement confidentiel de configuration n'est jamais retourné", () => {
  const secret = "FAUX_TOKEN_DE_TEST_NE_PAS_REPRODUIRE";
  const result = inspect(JSON.stringify({
    disable_ollama_cloud: true,
    secretTestOnly: secret,
  }));
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(result.localConfigurationFileSuggestsNoCloud, true);
});
