import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readCaseIdentity, updateCaseIdentity, InvalidCaseIdentity, CaseIdentityHistoryUnavailable } from "../src/caseIdentityService.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "../src/caseAccessService.js";
import { DossierVersionConflict } from "../src/sharedNoteService.js";
import { COOKIE_NAME } from "../src/sessions.js";

const actorId = randomUUID(), caseId = randomUUID(), now = new Date("2026-10-26T18:00:00Z");
const blank = { lastName: null, firstName: null, insertisNumber: null, age: null };
const identity = { lastName: "FICTIF D’EXEMPLE", firstName: "Recette", insertisNumber: "INSERTIS-FICTIF", age: 40 };
function fixture({ role = "REFERENTE", enabled = true, expired = false, referentId = actorId,
  archivedAt = null, reference = "ARTAG-IDENTITE-FICTIVE", row = null, latest = row, version = 1,
  rows = [], count = 1, failureAt, transactionCode, referenceRevision = null } = {}) {
  const calls = { updates: [], writes: [], revisions: [], audits: [], identityReads: 0, transactions: 0 };
  const db = { webSession: {} };
  const fail = step => { if (failureAt === step) throw new Error("PANNE_FICTIVE_" + step); };
  db.$transaction = async (operation, options) => {
    calls.transactions++; assert.equal(options.isolationLevel, "Serializable");
    const result = await operation({
      webSession: { findUnique: async () => ({ userId: actorId, revokedAt: null,
        expiresAt: new Date(now.getTime() + (expired ? -1 : 60000)), user: { enabled } }) },
      userAccount: { findUnique: async () => ({ id: actorId, role, enabled }) },
      caseFile: { findUnique: async () => ({ id: caseId, referentId, archivedAt, artagReference: reference, version,
        assignments: [{ userId: actorId, capability: "SHARED_WRITE", active: true }] }),
      updateMany: async input => { calls.updates.push(input); return { count }; } },
      caseIdentity: {
        findUnique: async () => { calls.identityReads++; return row; },
        create: async ({ data }) => { fail("IDENTITY"); calls.writes.push(data); },
        updateMany: async ({ data }) => { fail("IDENTITY"); calls.writes.push(data); return { count: 1 }; },
      },
      caseReferenceRevision: { findFirst: async () => referenceRevision },
      caseIdentityRevision: { findFirst: async () => latest, findMany: async () => rows,
        create: async ({ data }) => { fail("REVISION"); calls.revisions.push(data); } },
      auditEvent: { create: async ({ data }) => { fail("AUDIT"); calls.audits.push(data); } },
    });
    if (transactionCode) throw Object.assign(new Error("Conflit fictif"), { code: transactionCode });
    return result;
  };
  const context = { db, cookieHeader: `${COOKIE_NAME}=${"a".repeat(64)}`, caseId, now };
  return { calls, read: overrides => readCaseIdentity({ ...context, ...overrides }),
    write: overrides => updateCaseIdentity({ ...context, input: { expectedVersion: version, identity, reason: "Saisie fictive vérifiée" }, ...overrides }) };
}

test("une identité absente reste inconnue sans nom ni âge inventé et sa lecture est auditée", async () => {
  const f = fixture();
  assert.deepEqual(await f.read(), { caseId, artagReference: "ARTAG-IDENTITE-FICTIVE", dossierVersion: 1,
    identityVersion: 0, identity: blank, history: [], nextBeforeVersion: null });
  assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.audits[0].eventType, "CASE_IDENTITY_READ");
});
test("la première saisie et sa correction conservent valeurs antérieures, auteur et version de dossier", async () => {
  const f = fixture();
  assert.deepEqual(await f.write({ actorId: randomUUID(), role: "DIRECTION" }), { caseId, dossierVersion: 2 });
  assert.deepEqual(f.calls.writes, [{ caseId, dossierVersion: 2, ...identity }]);
  assert.deepEqual(f.calls.revisions, [{ caseId, dossierVersion: 2, previousLastName: null, previousFirstName: null,
    previousInsertisNumber: null, previousAge: null, ...identity, actorId, reason: "Saisie fictive vérifiée" }]);
  const existing = { ...identity, dossierVersion: 2 };
  const second = fixture({ row: existing, version: 5 });
  await second.write({ input: { expectedVersion: 5, identity: { ...identity, age: null }, reason: "Correction fictive de l’âge" } });
  assert.equal(second.calls.revisions[0].previousAge, 40); assert.equal(second.calls.revisions[0].age, null);
  assert.equal(second.calls.revisions[0].dossierVersion, 6);
  assert.doesNotMatch(JSON.stringify([...f.calls.audits, ...second.calls.audits]), /FICTIF|Recette|INSERTIS|Saisie fictive|Correction fictive/);
});
test("une affectation de notes ne donne aucun droit nominal et les dossiers non identifiés restent fermés", async () => {
  for (const options of [...["APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"].map(role => ({ role })),
    { enabled: false }, { expired: true }, { referentId: randomUUID() }, { archivedAt: now }, { reference: null }]) {
    const f = fixture(options); await assert.rejects(f.read(), CaseAccessDenied); await assert.rejects(f.write(), CaseAccessDenied);
    assert.equal(f.calls.identityReads + f.calls.updates.length + f.calls.audits.length, 0);
  }
  await assert.rejects(fixture().read({ cookieHeader: "role=REFERENTE" }), CaseAccessDenied);
  await assert.rejects(fixture().read({ caseId: "invalide" }), CaseAccessDenied);
  await assert.rejects(fixture().read({ now: new Date("invalide") }), CaseAccessDenied);
  await assert.rejects(fixture().write({ db: {} }), SecurityProviderUnavailable);
});
test("le contrat refuse champs imprévus, valeurs malformées et mises à jour inchangées", async () => {
  const f = fixture(), base = { expectedVersion: 1, identity, reason: "Saisie fictive" };
  for (const input of [null, {}, { ...base, actorId }, { ...base, identity: { ...identity, artagReference: "FICTIF" } },
    { ...base, identity: { lastName: "FICTIF" } }, { ...base, expectedVersion: "1" },
    ...[-1, 2147483647].map(expectedVersion => ({ ...base, expectedVersion })),
    ...["", " FICTIF", "x".repeat(201), "FICTIF\n", "\ud800"].map(lastName => ({ ...base, identity: { ...identity, lastName } })),
    ...[-1, "40", 1.5, 2147483648].map(age => ({ ...base, identity: { ...identity, age } })),
    { ...base, reason: "" }, { ...base, reason: "x".repeat(201) }, { ...base, identity: { ...identity, insertisNumber: "x".repeat(256) } }]) {
    await assert.rejects(f.write({ input }), InvalidCaseIdentity);
  }
  assert.equal(f.calls.transactions, 0);
  await assert.rejects(fixture().write({ input: { ...base, identity: blank } }), InvalidCaseIdentity);
  await assert.rejects(fixture({ row: { ...identity, dossierVersion: 1 } }).write(), InvalidCaseIdentity);
  await fixture().write({ input: { ...base, identity: { ...blank, age: 0, firstName: "🧪".repeat(200) } } });
});
test("un état sans historique ou incohérent ne peut être réécrit ni livré", async () => {
  for (const options of [{ row: { ...identity, dossierVersion: 1 }, latest: null },
    { latest: { ...identity, dossierVersion: 1 } },
    { row: { ...identity, dossierVersion: 1 }, latest: { ...identity, age: 41, dossierVersion: 1 } },
    { row: { ...identity, dossierVersion: 2 }, version: 1 },
    { referenceRevision: { dossierVersion: 1, artagReference: "ARTAG-AUTRE-FICTIF" } },
    { referenceRevision: { dossierVersion: 2, artagReference: "ARTAG-IDENTITE-FICTIVE" } }]) {
    const f = fixture(options); await assert.rejects(f.read(), CaseIdentityHistoryUnavailable);
    await assert.rejects(f.write(), CaseIdentityHistoryUnavailable);
    assert.equal(f.calls.audits.length + f.calls.updates.length, 0);
  }
});
test("les conflits et pannes de transaction ne sont pas réessayés ni annoncés comme succès", async () => {
  const f = fixture(); await assert.rejects(f.write({ input: { expectedVersion: 0, identity, reason: "Fictif" } }), DossierVersionConflict);
  assert.equal(f.calls.updates.length, 0);
  const lost = fixture({ count: 0 }); await assert.rejects(lost.write(), DossierVersionConflict); assert.equal(lost.calls.revisions.length, 0);
  for (const transactionCode of ["P2002", "P2034"]) {
    const collision = fixture({ transactionCode }); await assert.rejects(collision.write(), DossierVersionConflict);
    assert.equal(collision.calls.transactions, 1);
  }
  for (const failureAt of ["IDENTITY", "REVISION", "AUDIT"]) await assert.rejects(fixture({ failureAt }).write(), /PANNE_FICTIVE/);
  await assert.rejects(fixture({ failureAt: "AUDIT" }).read(), /PANNE_FICTIVE/);
});
test("l'historique renvoie des couples avant/après bornés sans autres contenus du dossier", async () => {
  const rows = Array.from({ length: 51 }, (_, i) => ({ ...identity, dossierVersion: 100 - i,
    previousLastName: null, previousFirstName: null, previousInsertisNumber: null, previousAge: null,
    actorId, reason: "Fictif", createdAt: now }));
  const data = await fixture({ rows, row: { ...identity, dossierVersion: 100 }, version: 101 }).read();
  assert.equal(data.history.length, 50); assert.equal(data.nextBeforeVersion, 51);
  assert.deepEqual(data.history[0].previousIdentity, blank);
  assert.deepEqual(data.history[0].identity, identity);
  assert.doesNotMatch(JSON.stringify(data), /email|privateNotes|assignments|sharedNotes/);
  for (const beforeVersion of [null, 0, "2", 1.5, 2147483648]) await assert.rejects(fixture().read({ beforeVersion }), InvalidCaseIdentity);
});
