import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, revokeSession, COOKIE_NAME } from "../src/sessions.js";

const integration = { skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1" };
const origin = "https://artag.example.org";
const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
  issuer: "https://idp.example.org", generateVerifier: () => "fictif",
  authorizationUrl: async () => "https://idp.example.org/authorize",
  verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
} };

async function withFixture(check) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient(), servers = [];
  const roles = ["REFERENTE", "REFERENTE", "REFERENTE", "APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"];
  const users = roles.map(() => randomUUID());
  const [ref, other, delegate] = users;
  const [own, foreign, archived, second] = Array.from({ length: 4 }, () => randomUUID());
  const ids = [own, foreign, archived, second], tag = randomUUID();
  const reference = `ARTAG-FICTIF-${tag}`, taken = `ARTAG-AUTRE-FICTIF-${tag}`;
  const start = async privateDb => {
    const server = createApp({ privateDb, oidc, enableSharedWrites: true,
      csrfSecret: "secret-de-recette-reference-fictive-plus-de-32-caracteres" }).listen(0, "127.0.0.1");
    servers.push(server); await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: users.map((id, i) => ({
      id, email: `reference-fictive-${id}@example.org`, role: roles[i], enabled: true,
    })) });
    await db.caseFile.createMany({ data: [
      { id: own, referentId: ref }, { id: second, referentId: ref },
      { id: foreign, referentId: other, artagReference: taken },
      { id: archived, referentId: ref, archivedAt: new Date() },
    ] });
    await db.caseAssignment.createMany({ data: users.slice(2).map(userId => ({
      caseId: own, userId, capability: "SHARED_WRITE", active: true,
    })) });
    const tokens = await Promise.all(users.map(async userId => (await issueSession({ db, userId })).token));
    const headers = i => ({ Cookie: `${COOKIE_NAME}=${tokens[i]}` });
    const base = await start(db);
    const path = caseId => `/api/dossiers/${caseId}/reference-artag`;
    const read = (caseId = own, user = 0, query = "", server = base) => fetch(server + path(caseId) + query, { headers: headers(user) });
    const csrf = async (user = 0, server = base) => (await (await fetch(server + "/auth/csrf", { headers: headers(user) })).json()).token;
    const write = async ({ caseId = own, user = 0, body = {}, server = base, extraHeaders = {}, query = "" } = {}) => {
      const token = await csrf(user, server);
      return fetch(server + path(caseId) + query, { method: "PATCH",
        headers: { ...headers(user), Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": token, ...extraHeaders },
        body: JSON.stringify({ expectedVersion: 0, artagReference: reference, reason: "Vérification fictive de l'identification", ...body }),
      });
    };
    const fingerprint = async () => ({
      cases: await db.caseFile.findMany({ where: { id: { in: ids } }, orderBy: { id: "asc" } }),
      revisions: await db.caseReferenceRevision.findMany({ where: { caseId: { in: ids } }, orderBy: { id: "asc" } }),
      audits: await db.auditEvent.findMany({ where: { caseId: { in: ids } }, orderBy: { id: "asc" } }),
    });
    await check({ db, start, base, users, headers, ids, own, foreign, archived, second,
      ref, other, delegate, reference, taken, read, write, csrf, fingerprint, path });
  } finally {
    for (const server of servers) await new Promise(resolve => server.close(resolve));
    await db.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    await db.caseFile.deleteMany({ where: { id: { in: ids } } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}

test("PostgreSQL/HTTP : attribution et correction ARTAG historisées, sans réécriture ni perte des notes", integration, async () => {
  await withFixture(async ({ db, own, ref, reference, read, write, base, headers, csrf, path }) => {
    const initial = await read();
    assert.equal(initial.status, 200); assert.equal(initial.headers.get("cache-control"), "no-store");
    assert.deepEqual(await initial.json(), { caseId: own, artagReference: null, dossierVersion: 0, history: [], nextBeforeVersion: null });
    const first = await write();
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { caseId: own, artagReference: reference, dossierVersion: 1 });
    const notesUrl = base + `/api/dossiers/${own}/notes-partagees`;
    const note = await fetch(notesUrl, { method: "POST", headers: { ...headers(0), Origin: origin,
      "Content-Type": "application/json", "X-CSRF-Token": await csrf() },
      body: JSON.stringify({ expectedVersion: 1, text: "Note partagée strictement fictive" }) });
    assert.equal(note.status, 201);
    const noteBody = await note.json();
    const stale = await write({ body: { expectedVersion: 1, artagReference: reference + "-C" } });
    assert.equal(stale.status, 409);
    const correction = await write({ body: { expectedVersion: 2, artagReference: reference + "-C", reason: "Correction fictive après vérification" } });
    assert.equal(correction.status, 200);
    assert.equal((await correction.json()).dossierVersion, 3);
    const data = await (await read()).json();
    assert.equal(data.history.length, 2); assert.equal(data.nextBeforeVersion, null);
    assert.deepEqual(data.history.map(row => [row.dossierVersion, row.previousReference, row.artagReference, row.actorId]),
      [[3, reference, reference + "-C", ref], [1, null, reference, ref]]);
    assert.ok(data.history.every(row => Number.isFinite(Date.parse(row.createdAt))));
    assert.doesNotMatch(JSON.stringify(data), /Note partagée|sharedNotes|privateNotes|email|referentId/);
    const previous = await (await read(own, 0, "?beforeVersion=3")).json();
    assert.deepEqual(previous.history.map(row => row.dossierVersion), [1]);
    const persisted = await db.sharedNote.findUnique({ where: { id: noteBody.noteId } });
    assert.equal(persisted.text, "Note partagée strictement fictive"); assert.equal(persisted.version, 1);
    assert.equal((await (await fetch(notesUrl, { headers: headers(0) })).json()).artagReference, reference + "-C");
    const repeated = await write({ body: { expectedVersion: 2, artagReference: reference + "-C" } });
    assert.equal(repeated.status, 409); // Réponse perdue : relire, aucun doublon de révision.
    assert.equal(await db.caseReferenceRevision.count({ where: { caseId: own } }), 2);
    const audits = await db.auditEvent.findMany({ where: { caseId: own, eventType: "CASE_REFERENCE_UPDATED" } });
    assert.equal(audits.length, 2);
    assert.doesNotMatch(JSON.stringify(audits), /ARTAG-FICTIF|Correction fictive/);
    assert.equal((await fetch(base + path(own))).status, 404);
  });
});

test("PostgreSQL/HTTP : référence refusée hors titularité, CSRF et schéma stricts, aucun renseignement sur un doublon", integration, async () => {
  await withFixture(async ({ db, own, foreign, archived, users, read, write, taken, fingerprint }) => {
    const before = await fingerprint();
    // La collègue référente est pourtant affectée activement en SHARED_WRITE.
    for (let user = 1; user < users.length; user++) {
      assert.equal((await read(own, user)).status, 404);
      assert.equal((await write({ user })).status, 404);
    }
    for (const caseId of [foreign, archived, randomUUID(), "invalide"]) {
      assert.equal((await read(caseId)).status, 404);
      assert.equal((await write({ caseId })).status, 404);
    }
    for (const extraHeaders of [{ Origin: "https://autre.example.org" }, { "X-CSRF-Token": "incorrect" }]) {
      assert.equal((await write({ extraHeaders })).status, 403);
    }
    for (const body of [{ actorId: users[1] }, { role: "DIRECTION" }, { referentId: users[1] },
      { previousReference: "FICTIF" }, { artagReference: null }, { artagReference: " ", reason: "" },
      { expectedVersion: 2147483647 }, { reason: "x".repeat(201) }, { artagReference: "x".repeat(81) }]) {
      assert.equal((await write({ body })).status, 422);
    }
    for (const query of ["?role=REFERENTE", "?beforeVersion=0", "?beforeVersion=1&beforeVersion=2", "?beforeVersion=2147483648"]) {
      assert.equal((await read(own, 0, query)).status, 422);
    }
    assert.equal((await write({ query: "?userId=fictif" })).status, 422);
    const duplicate = await write({ body: { artagReference: taken } });
    assert.equal(duplicate.status, 409);
    assert.deepEqual(await duplicate.json(), { error: "REFERENCE_INDISPONIBLE" });
    assert.deepEqual(await fingerprint(), before);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: false } });
    assert.equal((await read()).status, 404);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: true } });
    await db.webSession.updateMany({ where: { userId: users[0] }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await read()).status, 404);
  });
});

test("PostgreSQL/HTTP : concurrence et panne de révision/audit annulent toute la transaction", integration, async () => {
  await withFixture(async ({ db, own, ref, reference, read, write, start, fingerprint, base, headers }) => {
    const before = await fingerprint();
    for (const [model, methods] of [["auditEvent", ["create"]], ["caseReferenceRevision", ["create"]]]) {
      const brokenDb = new Proxy(db, { get(target, key) {
        if (key !== "$transaction") return target[key];
        return (operation, options) => target.$transaction(tx => operation(new Proxy(tx, { get(transaction, field) {
          if (field !== model) return transaction[field];
          return new Proxy(transaction[field], { get(delegate, method) {
            return methods.includes(method) ? async () => { throw new Error("PANNE_FICTIVE"); } : delegate[method];
          } });
        } })), options);
      } });
      const server = await start(brokenDb);
      const response = await write({ server });
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "SERVICE_INDISPONIBLE" });
      if (model === "auditEvent") assert.equal((await read(own, 0, "", server)).status, 503);
      assert.deepEqual(await fingerprint(), before);
    }
    const concurrent = await Promise.all([write(), write({ body: { artagReference: reference + "-B" } })]);
    assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 409]);
    const revisions = await db.caseReferenceRevision.findMany({ where: { caseId: own } });
    assert.equal(revisions.length, 1); assert.equal(revisions[0].actorId, ref);
    assert.equal(await db.auditEvent.count({ where: { caseId: own, eventType: "CASE_REFERENCE_UPDATED" } }), 1);
    assert.equal((await db.caseFile.findUnique({ where: { id: own } })).version, 1);
    await revokeSession({ db, cookieHeader: headers(0).Cookie });
    assert.equal((await fetch(base + `/api/dossiers/${own}/reference-artag`, { headers: headers(0) })).status, 404);
  });
});

test("PostgreSQL/HTTP : historique paginé stable et dérive hors service bloquée", integration, async () => {
  await withFixture(async ({ db, own, ref, reference, read, write }) => {
    // Historique fictif de 52 corrections, puis une modification de note (version 53).
    await db.caseReferenceRevision.createMany({ data: Array.from({ length: 52 }, (_, i) => ({
      caseId: own, dossierVersion: i + 1, previousReference: i === 0 ? null : `${reference}-${i}`,
      artagReference: `${reference}-${i + 1}`, actorId: ref, reason: "Correction de recette fictive",
    })) });
    await db.caseFile.update({ where: { id: own }, data: { artagReference: reference + "-52", version: 53 } });
    const first = await (await read()).json();
    assert.equal(first.history.length, 50); assert.equal(first.nextBeforeVersion, 3);
    assert.deepEqual(first.history.map(row => row.dossierVersion), Array.from({ length: 50 }, (_, i) => 52 - i));
    const update = await write({ body: { expectedVersion: 53, artagReference: reference + "-54" } });
    assert.equal(update.status, 200);
    const second = await (await read(own, 0, "?beforeVersion=3")).json();
    assert.deepEqual(second.history.map(row => row.dossierVersion), [2, 1]);
    assert.equal(second.nextBeforeVersion, null);
    assert.equal(second.artagReference, reference + "-54"); assert.equal(second.dossierVersion, 54);
    // Une modification manuelle incohérente ne devient jamais un historique inventé.
    await db.caseFile.update({ where: { id: own }, data: { artagReference: reference + "-HORS-SERVICE" } });
    const drift = await read();
    assert.equal(drift.status, 409);
    assert.deepEqual(await drift.json(), { error: "HISTORIQUE_REFERENCE_INDISPONIBLE" });
    assert.equal((await write({ body: { expectedVersion: 54 } })).status, 409);
    assert.equal(await db.caseReferenceRevision.count({ where: { caseId: own } }), 53);
  });
});

test("PostgreSQL/HTTP : deux dossiers ne peuvent pas adopter simultanément le même numéro", integration, async () => {
  await withFixture(async ({ db, own, second, reference, write }) => {
    const responses = await Promise.all([write(), write({ caseId: second })]);
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
    const cases = await db.caseFile.findMany({ where: { id: { in: [own, second] } } });
    assert.equal(cases.filter(row => row.artagReference === reference && row.version === 1).length, 1);
    assert.equal(cases.filter(row => row.artagReference === null && row.version === 0).length, 1);
    assert.equal(await db.caseReferenceRevision.count({ where: { caseId: { in: [own, second] } } }), 1);
    assert.equal(await db.auditEvent.count({ where: { caseId: { in: [own, second] }, eventType: "CASE_REFERENCE_UPDATED" } }), 1);
  });
});
