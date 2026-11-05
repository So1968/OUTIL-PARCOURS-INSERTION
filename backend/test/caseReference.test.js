import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  readCaseReference, updateCaseReference, InvalidCaseReference,
  CaseReferenceUnavailable, CaseReferenceHistoryUnavailable,
} from "../src/caseReferenceService.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "../src/caseAccessService.js";
import { DossierVersionConflict } from "../src/sharedNoteService.js";
import { COOKIE_NAME } from "../src/sessions.js";

const actorId = randomUUID(), caseId = randomUUID(), otherId = randomUUID();
const now = new Date("2026-10-26T10:00:00Z");
function fixture({ role = "REFERENTE", enabled = true, referentId = actorId, archivedAt = null,
  expired = false, latest = null, artagReference = null, version = 0, rows = [],
  transactionCode, changedCount = 1, failureAt } = {}) {
  const calls = { updates: [], revisions: [], audits: [], reads: 0, transactions: 0 };
  const db = { webSession: {} };
  const fail = step => { if (failureAt === step) throw new Error("PANNE_FICTIVE_" + step); };
  db.$transaction = async (operation, options) => {
    calls.transactions++;
    assert.equal(options.isolationLevel, "Serializable");
    const result = await operation({
      webSession: { findUnique: async () => ({ userId: actorId, revokedAt: null,
        expiresAt: new Date(now.getTime() + (expired ? -1 : 60000)), user: { enabled } }) },
      userAccount: { findUnique: async () => ({ id: actorId, role, enabled }) },
      caseFile: {
        findUnique: async () => ({ id: caseId, referentId, archivedAt, artagReference, version,
          // Même une affectation active ne suffit pas pour identifier le dossier.
          assignments: [{ userId: actorId, capability: "SHARED_WRITE", active: true }] }),
        updateMany: async input => { calls.updates.push(input); return { count: changedCount }; },
      },
      caseReferenceRevision: {
        findFirst: async () => latest,
        findMany: async () => { calls.reads++; return rows; },
        create: async ({ data }) => { fail("REVISION"); calls.revisions.push(data); },
      },
      auditEvent: { create: async ({ data }) => { fail("AUDIT"); calls.audits.push(data); } },
    });
    if (transactionCode) throw Object.assign(new Error("Erreur fictive"), { code: transactionCode });
    return result;
  };
  const context = { db, caseId, now, cookieHeader: `${COOKIE_NAME}=${"a".repeat(64)}` };
  return { calls, read: input => readCaseReference({ ...context, ...input }),
    write: input => updateCaseReference({ ...context, expectedVersion: version,
      artagReference: "ARTAG-FICTIF", reason: "Vérification fictive de la référence", ...input }) };
}

test("la première attribution conserve la valeur nulle sans inventer d'historique antérieur", async () => {
  const f = fixture();
  assert.deepEqual(await f.write({ actorId: otherId, role: "DIRECTION" }), {
    caseId, artagReference: "ARTAG-FICTIF", dossierVersion: 1,
  });
  assert.deepEqual(f.calls.updates[0], {
    where: { id: caseId, referentId: actorId, archivedAt: null, version: 0 },
    data: { artagReference: "ARTAG-FICTIF", version: { increment: 1 } },
  });
  assert.deepEqual(f.calls.revisions, [{ caseId, dossierVersion: 1, previousReference: null,
    artagReference: "ARTAG-FICTIF", actorId, reason: "Vérification fictive de la référence" }]);
  assert.doesNotMatch(JSON.stringify(f.calls.audits), /ARTAG-FICTIF|Vérification fictive/);
  assert.equal(f.calls.audits[0].actorId, actorId);
});

test("la correction conserve la référence antérieure et incrémente la version commune aux notes", async () => {
  const f = fixture({ artagReference: "ARTAG-AVANT-FICTIF", version: 8,
    latest: { dossierVersion: 3, artagReference: "ARTAG-AVANT-FICTIF" } });
  assert.equal((await f.write()).dossierVersion, 9);
  assert.equal(f.calls.revisions[0].previousReference, "ARTAG-AVANT-FICTIF");
  assert.equal(f.calls.revisions[0].dossierVersion, 9);
});

test("lecture et correction refusent les délégations de notes, autres profils, archives et sessions expirées", async () => {
  for (const options of [
    ...["APPUI_TNS", "DIRECTION", "ACCUEIL", "RELAIS_LOGEMENT", "GOUVERNANCE", "ADMIN_TECHNIQUE"].map(role => ({ role })),
    { enabled: false }, { referentId: otherId }, { referentId: null }, { expired: true }, { archivedAt: now },
  ]) {
    const f = fixture(options);
    await assert.rejects(f.read(), CaseAccessDenied);
    await assert.rejects(f.write(), CaseAccessDenied);
    assert.equal(f.calls.updates.length + f.calls.revisions.length + f.calls.audits.length + f.calls.reads, 0);
  }
  const f = fixture();
  await assert.rejects(f.read({ cookieHeader: "role=REFERENTE" }), CaseAccessDenied);
  await assert.rejects(f.write({ caseId: "invalide" }), CaseAccessDenied);
  await assert.rejects(f.read({ now: new Date("invalide") }), CaseAccessDenied);
  await assert.rejects(f.write({ db: {} }), SecurityProviderUnavailable);
});

test("la référence exige un texte borné exact, un motif et une version sans permettre l'effacement", async () => {
  const f = fixture();
  for (const input of [
    ...[null, "", "  ", " ARTAG-FICTIF", "ARTAG-FICTIF ", "a".repeat(81), "ARTAG\nFICTIF", "a\u0000", "\ud800", 12].map(artagReference => ({ artagReference })),
    ...[null, "", "  ", "a".repeat(201), "motif\nlibre"].map(reason => ({ reason })),
    ...[-1, 2147483647, 1.2, "0", null].map(expectedVersion => ({ expectedVersion })),
  ]) await assert.rejects(f.write(input), InvalidCaseReference);
  for (const beforeVersion of [null, -1, 0, "1", 1.2, 2147483648]) {
    await assert.rejects(f.read({ beforeVersion }), InvalidCaseReference);
  }
  assert.equal(f.calls.transactions, 0);
  // PostgreSQL VARCHAR(80) compte les caractères Unicode, pas les unités UTF-16.
  assert.equal((await f.write({ artagReference: "🧪".repeat(80) })).artagReference.length, 160);
  await assert.rejects(fixture({ artagReference: "ARTAG-FICTIF" }).write(), InvalidCaseReference);
});

test("une version dépassée ou un conflit PostgreSQL n'est pas réessayé", async () => {
  const stale = fixture({ version: 4 });
  await assert.rejects(stale.write({ expectedVersion: 3 }), DossierVersionConflict);
  assert.equal(stale.calls.updates.length, 0);
  const lost = fixture({ changedCount: 0 });
  await assert.rejects(lost.write(), DossierVersionConflict);
  assert.equal(lost.calls.revisions.length, 0);
  for (const [transactionCode, error] of [["P2034", DossierVersionConflict], ["P2002", CaseReferenceUnavailable]]) {
    const f = fixture({ transactionCode });
    await assert.rejects(f.write(), error);
    assert.equal(f.calls.transactions, 1);
  }
});

test("un historique incohérent interdit lecture et nouvelle correction", async () => {
  for (const latest of [{ dossierVersion: 1, artagReference: "AUTRE-FICTIF" },
    { dossierVersion: 2, artagReference: "ARTAG-FICTIF" }]) {
    const f = fixture({ version: 1, artagReference: "ARTAG-FICTIF", latest });
    await assert.rejects(f.read(), CaseReferenceHistoryUnavailable);
    await assert.rejects(f.write({ artagReference: "CORRECTION-FICTIVE" }), CaseReferenceHistoryUnavailable);
    assert.equal(f.calls.updates.length + f.calls.audits.length, 0);
  }
});

test("l'historique est borné, attribué et audité ; une panne d'audit ou de révision échoue", async () => {
  const rows = Array.from({ length: 51 }, (_, i) => ({ dossierVersion: 100 - i,
    previousReference: null, artagReference: "ARTAG-FICTIF", actorId, reason: "Motif fictif", createdAt: now }));
  const f = fixture({ rows, version: 101, artagReference: "ARTAG-FICTIF" });
  const data = await f.read();
  assert.equal(data.history.length, 50); assert.equal(data.nextBeforeVersion, 51);
  assert.equal(data.dossierVersion, 101);
  assert.deepEqual(Object.keys(data).sort(), ["artagReference", "caseId", "dossierVersion", "history", "nextBeforeVersion"]);
  assert.equal(f.calls.audits[0].eventType, "CASE_REFERENCE_READ");
  assert.deepEqual((await fixture().read()).history, []);
  for (const failureAt of ["AUDIT", "REVISION"]) {
    await assert.rejects(fixture({ failureAt }).write(), /PANNE_FICTIVE/);
  }
  await assert.rejects(fixture({ failureAt: "AUDIT" }).read(), /PANNE_FICTIVE/);
});
