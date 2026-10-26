import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { listWritableCases, InvalidCaseDirectoryQuery, CaseDirectoryChanged } from "../src/caseDirectoryService.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "../src/caseAccessService.js";
import { COOKIE_NAME } from "../src/sessions.js";

const actorId = randomUUID(), otherId = randomUUID(), now = new Date("2026-10-26T08:00:00Z");
const record = () => ({ id: randomUUID(), referentId: actorId, artagReference: "ARTAG-FICTIF",
  version: 0, createdAt: now, updatedAt: now, assignments: [] });
function fixture({ role = "REFERENTE", enabled = true, rows = [record()], auditError = false,
  transactionError = false, expired = false } = {}) {
  const calls = { reads: 0, audits: [] };
  const db = { webSession: {} };
  db.$transaction = async (operation, options) => {
    assert.equal(options.isolationLevel, "Serializable");
    const result = await operation({
      webSession: { findUnique: async () => ({ userId: actorId, revokedAt: null,
        expiresAt: new Date(now.getTime() + (expired ? -1 : 60000)), user: { enabled: true } }) },
      userAccount: { findUnique: async () => ({ id: actorId, role, enabled }) },
      caseFile: { findMany: async () => { calls.reads++; return rows; } },
      auditEvent: { createMany: async ({ data }) => {
        if (auditError) throw new Error("AUDIT_FICTIVEMENT_INDISPONIBLE");
        calls.audits.push(...data);
      } },
    });
    if (transactionError) throw Object.assign(new Error("Conflit fictif"), { code: "P2034" });
    return result;
  };
  const run = overrides => listWritableCases({ db, cookieHeader: `${COOKIE_NAME}=${"a".repeat(64)}`, now, ...overrides });
  return { run, calls };
}

test("la file renvoie uniquement les repères du dossier et trace chaque référence consultée", async () => {
  const row = { ...record(), sharedNotes: ["Texte fictif à ne pas lister"], privateNotes: ["Réservé fictif"] };
  const f = fixture({ rows: [row] });
  const data = await f.run({ actorId: otherId, role: "DIRECTION" });
  assert.deepEqual(data, { cases: [{ id: row.id, artagReference: "ARTAG-FICTIF", version: 0,
    createdAt: now, updatedAt: now, canManageReference: true }], nextCursor: null });
  assert.deepEqual(f.calls.audits.map(event => event.caseId), [row.id]);
  assert.ok(f.calls.audits.every(event => event.actorId === actorId && event.eventType === "CASE_DIRECTORY_READ"));
  assert.doesNotMatch(JSON.stringify(data), /Réservé|Texte fictif|referentId|assignments/);
});

test("la rédaction déléguée exige une affectation active et ne se déduit pas de la lecture", async () => {
  for (const assignment of [null, { userId: actorId, active: true, capability: "SHARED_READ" },
    { userId: actorId, active: false, capability: "SHARED_WRITE" }]) {
    const f = fixture({ rows: [{ ...record(), referentId: otherId, assignments: assignment ? [assignment] : [] }] });
    await assert.rejects(f.run(), CaseAccessDenied);
    assert.equal(f.calls.audits.length, 0);
  }
  const f = fixture({ rows: [{ ...record(), referentId: otherId,
    assignments: [{ userId: actorId, active: true, capability: "SHARED_WRITE" }] }] });
  const data = await f.run();
  assert.equal(data.cases.length, 1);
  assert.equal(data.cases[0].canManageReference, false);
});

test("les autres profils, comptes désactivés et sessions expirées ne déclenchent aucune lecture", async () => {
  for (const options of [
    ...["APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"].map(role => ({ role })),
    { enabled: false }, { expired: true },
  ]) {
    const f = fixture(options);
    await assert.rejects(f.run(), CaseAccessDenied);
    assert.equal(f.calls.reads, 0);
  }
  const f = fixture();
  await assert.rejects(f.run({ cookieHeader: "role=REFERENTE" }), CaseAccessDenied);
  await assert.rejects(f.run({ now: new Date("invalide") }), CaseAccessDenied);
  await assert.rejects(f.run({ db: {} }), SecurityProviderUnavailable);
});

test("les curseurs malformés sont refusés avant toute transaction", async () => {
  const f = fixture();
  for (const before of [null, [], "x".repeat(201), "../dossiers", "faux",
    Buffer.from(JSON.stringify({ id: actorId, createdAt: "2026-10-26" })).toString("base64url"),
    Buffer.from(JSON.stringify({ id: actorId, createdAt: now.toISOString(), role: "REFERENTE" })).toString("base64url")]) {
    await assert.rejects(f.run({ before }), InvalidCaseDirectoryQuery);
  }
  assert.equal(f.calls.reads, 0);
});

test("la pagination borne les réponses et ne donne pas de rang global sur tous les dossiers", async () => {
  const rows = Array.from({ length: 26 }, record);
  const f = fixture({ rows });
  const data = await f.run();
  assert.equal(data.cases.length, 25);
  assert.equal(f.calls.audits.length, 25);
  assert.deepEqual(JSON.parse(Buffer.from(data.nextCursor, "base64url").toString()), {
    id: rows[24].id, createdAt: now.toISOString(),
  });
  const empty = fixture({ rows: [] });
  assert.deepEqual(await empty.run({ before: data.nextCursor }), { cases: [], nextCursor: null });
  assert.deepEqual(empty.calls.audits.map(row => row.caseId), [null]);
});

test("une panne d'audit ou de sérialisation ne livre jamais la liste", async () => {
  await assert.rejects(fixture({ auditError: true }).run(), /AUDIT_FICTIVEMENT_INDISPONIBLE/);
  await assert.rejects(fixture({ transactionError: true }).run(), CaseDirectoryChanged);
});
