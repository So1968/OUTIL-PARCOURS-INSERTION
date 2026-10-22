import test from "node:test";
import assert from "node:assert/strict";
import {
  SYSTEMS, OPERATIONS, assertIntegrationApproved, invokeExternalIntegration,
  ExternalIntegrationDisabled, IntegrationApprovalMissing,
  UnsupportedIntegrationOperation,
} from "../src/integrationContracts.js";

const now = new Date("2026-10-22T10:00:00Z");
const config = (system = SYSTEMS.OUTLOOK) => ({
  enabled: true, system,
  approvedByArtag: true, approvedByProvider: true,
  securityReviewPassed: true, legalBasisRef: "REVUE-FICTIVE",
  validUntil: "2026-12-01T00:00:00.000Z",
  allowedOperations: [OPERATIONS.READ_CALENDAR],
});

test("tous les connecteurs sont fermés par défaut", () => {
  for (const system of Object.values(SYSTEMS)) {
    assert.throws(() => assertIntegrationApproved({
      system, operation: [...{
        INSERTIS: [OPERATIONS.PREPARE_TRACE],
        MON_SUIVI_SOCIAL: [OPERATIONS.PREPARE_TRACE],
        OUTLOOK: [OPERATIONS.READ_CALENDAR],
        ONEDRIVE: [OPERATIONS.LINK_DOCUMENT],
      }[system]][0], now,
    }), ExternalIntegrationDisabled);
  }
});

test("un drapeau enabled ne suffit pas : approbation, revue, base et durée vérifiées", () => {
  for (const excludedField of [
    "approvedByArtag", "approvedByProvider", "securityReviewPassed",
    "legalBasisRef", "validUntil", "allowedOperations",
  ]) {
    const candidate = config();
    delete candidate[excludedField];
    assert.throws(() => assertIntegrationApproved({
      system: SYSTEMS.OUTLOOK, operation: OPERATIONS.READ_CALENDAR,
      config: candidate, now,
    }), IntegrationApprovalMissing);
  }
  assert.throws(() => assertIntegrationApproved({
    system: SYSTEMS.OUTLOOK, operation: OPERATIONS.READ_CALENDAR,
    config: { ...config(), validUntil: "2026-10-01T00:00:00Z" }, now,
  }), IntegrationApprovalMissing);
});

test("opérations non prévues interdites y compris avec la bonne approbation", () => {
  assert.throws(() => assertIntegrationApproved({
    system: SYSTEMS.ONEDRIVE, operation: OPERATIONS.WRITE_CASE,
    config: config(SYSTEMS.ONEDRIVE), now,
  }), UnsupportedIntegrationOperation);
});

test("une approbation fictive ne déclenche jamais d'envoi réel", async () => {
  assert.equal(assertIntegrationApproved({
    system: SYSTEMS.OUTLOOK, operation: OPERATIONS.READ_CALENDAR, config: config(), now,
  }), true);
  await assert.rejects(
    invokeExternalIntegration({ system: SYSTEMS.OUTLOOK, operation: OPERATIONS.READ_CALENDAR }),
    ExternalIntegrationDisabled,
  );
});
