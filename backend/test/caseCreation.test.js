import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createCase, InvalidCaseCreation, CaseCreationConflict } from "../src/caseCreationService.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "../src/caseAccessService.js";
import { COOKIE_NAME } from "../src/sessions.js";

const actorId = randomUUID(), caseId = randomUUID(), requestId = randomUUID(), now = new Date("2026-10-26T15:00:00Z");
const artagReference = "ARTAG-CREATION-FICTIVE";
const digest = createHash("sha256").update(artagReference).digest("hex");
const stored = (overrides = {}) => ({ referenceDigest: digest,
  caseFile: { id: caseId, referentId: actorId, archivedAt: null, artagReference, version: 1,
    referenceRevisions: [{ dossierVersion: 1, artagReference }], ...overrides } });
function fixture({ role = "REFERENTE", enabled = true, expired = false, existing = null, recovered = null,
  transactionCode, failureAt } = {}) {
  const calls = { creates: [], requests: [], revisions: [], audits: [], lookups: [], transactions: 0 };
  const db = { webSession: {} };
  const fail = step => { if (failureAt === step) throw new Error("PANNE_FICTIVE_" + step); };
  db.$transaction = async (operation, options) => {
    calls.transactions++; assert.equal(options.isolationLevel, "Serializable");
    const second = calls.transactions > 1;
    const result = await operation({
      webSession: { findUnique: async () => ({ userId: actorId, revokedAt: null,
        expiresAt: new Date(now.getTime() + (expired ? -1 : 60000)), user: { enabled } }) },
      userAccount: { findUnique: async () => ({ id: actorId, role, enabled }) },
      caseFile: { create: async ({ data }) => { calls.creates.push(data); return { id: caseId, ...data }; } },
      caseCreationRequest: {
        findUnique: async ({ where }) => { calls.lookups.push(where); return second ? recovered : existing; },
        create: async ({ data }) => { fail("REQUEST"); calls.requests.push(data); },
      },
      caseReferenceRevision: { create: async ({ data }) => { fail("REVISION"); calls.revisions.push(data); } },
      auditEvent: { create: async ({ data }) => { fail("AUDIT"); calls.audits.push(data); } },
    });
    if (!second && transactionCode) throw Object.assign(new Error("Collision fictive"), { code: transactionCode });
    return result;
  };
  return { calls, run: overrides => createCase({ db, cookieHeader: `${COOKIE_NAME}=${"a".repeat(64)}`,
    input: { requestId, artagReference }, now, ...overrides }) };
}

test("la création attribue le dossier au compte serveur et conserve référence initiale et auteur", async () => {
  const f = fixture();
  assert.deepEqual(await f.run({ actorId: randomUUID(), role: "DIRECTION" }), {
    requestId, created: true, caseId, artagReference, dossierVersion: 1,
  });
  assert.deepEqual(f.calls.creates, [{ referentId: actorId, artagReference, version: 1 }]);
  assert.deepEqual(f.calls.requests, [{ actorId, requestId, caseId, referenceDigest: digest }]);
  assert.deepEqual(f.calls.revisions, [{ caseId, dossierVersion: 1, previousReference: null,
    artagReference, actorId, reason: "Création du dossier" }]);
  assert.equal(f.calls.audits[0].eventType, "CASE_CREATED");
  assert.doesNotMatch(JSON.stringify(f.calls.audits), /ARTAG-CREATION|referenceDigest|requestId/);
});

test("la même clé retrouve le dossier courant même après correction de référence", async () => {
  const corrected = "ARTAG-FICTIF-CORRIGE";
  const f = fixture({ existing: stored({ artagReference: corrected, version: 5,
    referenceRevisions: [{ dossierVersion: 4, artagReference: corrected }] }) });
  const result = await f.run({ input: { requestId: requestId.toUpperCase(), artagReference } });
  assert.deepEqual(result, { requestId, created: false, caseId, artagReference: corrected, dossierVersion: 5 });
  assert.equal(f.calls.creates.length + f.calls.requests.length + f.calls.revisions.length, 0);
  assert.deepEqual(f.calls.lookups, [{ actorId_requestId: { actorId, requestId } }]);
  assert.equal(f.calls.audits[0].eventType, "CASE_CREATION_REPLAYED");
});

test("une clé connue ne peut pas changer de contenu, réouvrir une archive ou réattribuer un dossier", async () => {
  await assert.rejects(fixture({ existing: { ...stored(), referenceDigest: "b".repeat(64) } }).run(), CaseCreationConflict);
  for (const changes of [{ archivedAt: now }, { referentId: randomUUID() }, { referentId: null }]) {
    const f = fixture({ existing: stored(changes) });
    await assert.rejects(f.run(), CaseAccessDenied);
    assert.equal(f.calls.creates.length + f.calls.audits.length, 0);
  }
  for (const changes of [{ artagReference: null }, { referenceRevisions: [] },
    { referenceRevisions: [{ dossierVersion: 2, artagReference }] }]) {
    await assert.rejects(fixture({ existing: stored(changes) }).run(), CaseCreationConflict);
  }
});

test("les rôles hors référente, comptes désactivés et sessions expirées ne créent et ne recherchent rien", async () => {
  for (const options of [...["APPUI_TNS", "ACCUEIL", "DIRECTION", "GOUVERNANCE", "RELAIS_LOGEMENT", "ADMIN_TECHNIQUE"].map(role => ({ role })),
    { enabled: false }, { expired: true }]) {
    const f = fixture(options); await assert.rejects(f.run(), CaseAccessDenied);
    assert.equal(f.calls.creates.length + f.calls.lookups.length, 0);
  }
  await assert.rejects(fixture().run({ cookieHeader: "role=REFERENTE" }), CaseAccessDenied);
  await assert.rejects(fixture().run({ db: {} }), SecurityProviderUnavailable);
  await assert.rejects(fixture().run({ now: new Date("invalide") }), CaseAccessDenied);
});

test("le contrat de création refuse tout champ supplémentaire et toute référence malformée", async () => {
  const f = fixture();
  for (const input of [null, [], {}, { requestId }, { requestId, artagReference, referentId: actorId },
    ...[null, "", "../autre"].map(value => ({ requestId: value, artagReference })),
    ...[null, "", " A", "a".repeat(81), "a\n", "\ud800"].map(value => ({ requestId, artagReference: value }))]) {
    await assert.rejects(f.run({ input }), InvalidCaseCreation);
  }
  assert.equal(f.calls.transactions, 0);
});

test("une collision ne déclenche qu'un rapprochement personnel, jamais une deuxième création automatique", async () => {
  for (const transactionCode of ["P2002", "P2034"]) {
    const recovered = fixture({ transactionCode, recovered: stored() });
    assert.equal((await recovered.run()).created, false);
    assert.equal(recovered.calls.creates.length, 1); assert.equal(recovered.calls.transactions, 2);
    const missing = fixture({ transactionCode });
    await assert.rejects(missing.run(), CaseCreationConflict);
    assert.equal(missing.calls.creates.length, 1); assert.equal(missing.calls.transactions, 2);
    assert.ok(missing.calls.lookups.every(where => Object.keys(where).join() === "actorId_requestId"));
  }
});

test("une panne de demande, révision ou audit n'est jamais présentée comme une création réussie", async () => {
  for (const failureAt of ["REQUEST", "REVISION", "AUDIT"]) {
    const f = fixture({ failureAt }); await assert.rejects(f.run(), /PANNE_FICTIVE/);
    assert.equal(f.calls.transactions, 1);
  }
  await assert.rejects(fixture({ existing: stored(), failureAt: "AUDIT" }).run(), /PANNE_FICTIVE/);
});
