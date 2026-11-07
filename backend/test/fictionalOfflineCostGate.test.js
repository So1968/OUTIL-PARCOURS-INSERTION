import test from "node:test";
import assert from "node:assert/strict";
import {
  FICTIONAL_LOCAL_COST_POLICY,
  checkFictionalOfflineGate,
} from "../src/fictionalOfflineCostGate.js";

test("le verrou refuse par défaut et les confirmations partielles", () => {
  for (const options of [
    {},
    { enabled: true },
    { enabled: true, fictionalOnlyAcknowledged: true },
    { enabled: true, offlineOnlyAcknowledged: true },
    { fictionalOnlyAcknowledged: true, offlineOnlyAcknowledged: true },
    { enabled: "true", fictionalOnlyAcknowledged: true, offlineOnlyAcknowledged: true },
    { enabled: true, fictionalOnlyAcknowledged: 1, offlineOnlyAcknowledged: true },
  ]) {
    const result = checkFictionalOfflineGate(options);
    assert.equal(result.status, "ESSAI_LOCAL_BLOQUE");
    assert.equal(result.permitted, false);
    assert.equal(result.paidModelApiAllowed, false);
    assert.equal(result.cloudServerConfigurationVerified, false);
  }
});

test("trois confirmations explicites autorisent seulement le prototype local fictif", () => {
  const result = checkFictionalOfflineGate({
    enabled: true, fictionalOnlyAcknowledged: true, offlineOnlyAcknowledged: true,
  });
  assert.equal(result.status, "ESSAI_LOCAL_EXPLICITEMENT_AUTORISE");
  assert.equal(result.permitted, true);
  assert.equal(result.localOnlyAttested, true);
  assert.equal(result.cloudServerConfigurationVerified, false);
  assert.equal(result.perRequestBillingConfigured, false);
  assert.equal(FICTIONAL_LOCAL_COST_POLICY.paidModelApiAllowed, false);
  assert.equal(FICTIONAL_LOCAL_COST_POLICY.remoteProviderConfigured, false);
  assert.equal(FICTIONAL_LOCAL_COST_POLICY.downloadsAllowed, false);
  assert.equal(FICTIONAL_LOCAL_COST_POLICY.hardwareAndElectricityCostsPossible, true);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(FICTIONAL_LOCAL_COST_POLICY));
});

test("un attribut d'autorisation inventé ne vaut jamais preuve de configuration serveur", () => {
  const result = checkFictionalOfflineGate({
    enabled: true, fictionalOnlyAcknowledged: true,
    offlineOnlyAcknowledged: false,
    cloudServerConfigurationVerified: true,
    paidProviderEnabled: true,
  });
  assert.equal(result.permitted, false);
  assert.equal(result.cloudServerConfigurationVerified, false);
  assert.equal(result.paidModelApiAllowed, false);
});
