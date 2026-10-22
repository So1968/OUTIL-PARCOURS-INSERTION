import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readCaseOverview, CaseAccessDenied, SecurityProviderUnavailable } from "../src/caseAccessService.js";

const caseId = randomUUID();
const userId = randomUUID();
const otherId = randomUUID();
const now = new Date("2026-10-22T10:00:00.000Z");
const record = {
  id: caseId, referentId: userId, version: 7, archivedAt: null, updatedAt: now,
  assignments: [], grants: [],
};

function fixture({ role = "REFERENTE", accountId = userId, enabled = true,
  dossier = record, auditError = null, resolveSubject = async () => userId } = {}) {
  const calls = { actor: 0, dossier: 0, audit: [], txOptions: null };
  const db = {
    $transaction: async (operation, options) => {
      calls.txOptions = options;
      return operation({
        userAccount: { findUnique: async () => {
          calls.actor++;
          return { id: accountId, role, enabled };
        } },
        caseFile: { findUnique: async () => {
          calls.dossier++;
          return dossier;
        } },
        auditEvent: { create: async (args) => {
          calls.audit.push(args);
          if (auditError) throw auditError;
          return { id: randomUUID() };
        } },
      });
    },
  };
  const run = (overrides = {}) => readCaseOverview({
    db, session: { serverOnly: "fictif" }, resolveVerifiedSubject: resolveSubject,
    caseId, now, ...overrides,
  });
  return { run, calls };
}

test("refuse un fournisseur de session absent et n'ouvre aucune transaction", async () => {
  const { run, calls } = fixture();
  await assert.rejects(run({ resolveVerifiedSubject: undefined }), SecurityProviderUnavailable);
  assert.equal(calls.actor, 0);
});

test("refuse les identifiants et sessions malformés sans consulter les données", async () => {
  const { run, calls } = fixture({ resolveSubject: async () => "role=REFERENTE" });
  await assert.rejects(run(), CaseAccessDenied);
  await assert.rejects(run({ caseId: "../../dossiers" }), CaseAccessDenied);
  assert.equal(calls.actor, 0);
});

test("l'identité et le rôle proviennent du serveur et du compte en base", async () => {
  const { run, calls } = fixture();
  const result = await run({ session: { role: "ADMIN_TECHNIQUE", id: otherId } });
  assert.deepEqual(result, { id: caseId, version: 7, updatedAt: now });
  assert.equal(Object.hasOwn(result, "assignments"), false);
  assert.equal(Object.hasOwn(result, "notes"), false);
  assert.equal(calls.audit.length, 1);
  assert.deepEqual(calls.audit[0].data, {
    caseId, actorId: userId, eventType: "CASE_OVERVIEW_READ",
    purpose: "Consultation de métadonnées de continuité",
  });
  assert.equal(calls.txOptions.isolationLevel, "Serializable");
});

test("refuse toute consultation non autorisée sans donner de métadonnée ni journal de succès", async () => {
  for (const role of ["DIRECTION", "ADMIN_TECHNIQUE", "GOUVERNANCE", "APPUI_TNS"]) {
    const { run, calls } = fixture({ role });
    await assert.rejects(run(), CaseAccessDenied);
    assert.equal(calls.audit.length, 0);
  }
  const wrong = fixture({ dossier: { ...record, referentId: otherId } });
  await assert.rejects(wrong.run(), CaseAccessDenied);
  assert.equal(wrong.calls.audit.length, 0);
});

test("refuse les dossiers archivés, les comptes désactivés ou dossiers inexistants", async () => {
  for (const config of [
    { dossier: null },
    { dossier: { ...record, archivedAt: now } },
    { enabled: false },
  ]) {
    const { run, calls } = fixture(config);
    await assert.rejects(run(), CaseAccessDenied);
    assert.equal(calls.audit.length, 0);
  }
});

test("un appui TNS ne lit les métadonnées communes qu'avec une affectation explicite", async () => {
  const { run, calls } = fixture({
    role: "APPUI_TNS", accountId: userId,
    dossier: { ...record, referentId: otherId, assignments: [
      { userId, active: true, capability: "TNS_READ" },
      { userId, active: true, capability: "SHARED_READ" },
    ] },
  });
  assert.equal((await run()).id, caseId);
  assert.equal(calls.audit.length, 1);
});

test("la direction ne lit qu'avec une dérogation valide et bornée", async () => {
  const grant = {
    userId, capability: "SHARED_READ", reason: "Relais exceptionnel fictif",
    approvedById: otherId, startsAt: new Date("2026-10-22T09:00:00Z"),
    expiresAt: new Date("2026-10-22T12:00:00Z"), revokedAt: null,
  };
  const { run } = fixture({
    role: "DIRECTION",
    dossier: { ...record, referentId: otherId, grants: [grant] },
  });
  assert.equal((await run()).id, caseId);
  await assert.rejects(run({ now: new Date("2026-10-22T12:00:00Z") }), CaseAccessDenied);
});

test("si le journal échoue, la lecture est bloquée au lieu d'être déclarée réussie", async () => {
  const { run, calls } = fixture({ auditError: new Error("Base indisponible") });
  await assert.rejects(run(), /Base indisponible/);
  assert.equal(calls.audit.length, 1);
});
