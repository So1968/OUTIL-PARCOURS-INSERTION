import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, revokeSession, COOKIE_NAME } from "../src/sessions.js";
const integration = { skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1" };
const blank = { lastName: null, firstName: null, insertisNumber: null, age: null };
const identity = { lastName: "FICTIF D’EXEMPLE", firstName: "Recette", insertisNumber: "INSERTIS-FICTIF", age: 40 };
const origin = "https://artag.example.org", oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
  issuer: "https://idp.example.org", generateVerifier: () => "fictif", authorizationUrl: async () => "https://idp.example.org/authorize",
  verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
} };
async function withFixture(check) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient(), servers = [], roles = ["REFERENTE", "REFERENTE", "APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"];
  const users = roles.map(() => randomUUID()), cases = Array.from({ length: 5 }, () => randomUUID());
  const [own, foreign, archived, unidentified, otherOwn] = cases, reference = `ARTAG-IDENTITE-FICTIVE-${randomUUID()}`;
  const start = async privateDb => {
    const server = createApp({ privateDb, oidc, enableSharedWrites: true,
      csrfSecret: "secret-de-recette-identite-fictive-plus-de-32-caracteres" }).listen(0, "127.0.0.1");
    servers.push(server); await once(server, "listening"); return `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: users.map((id, i) => ({ id, email: `identite-fictive-${id}@example.org`, role: roles[i], enabled: true })) });
    await db.caseFile.createMany({ data: [
      { id: own, referentId: users[0], artagReference: reference, version: 1 },
      { id: otherOwn, referentId: users[0], artagReference: reference + "-B", version: 1 },
      { id: foreign, referentId: users[1], artagReference: reference + "-AUTRE" },
      { id: archived, referentId: users[0], artagReference: reference + "-ARCHIVE", archivedAt: new Date() },
      { id: unidentified, referentId: users[0] },
    ] });
    await db.caseAssignment.createMany({ data: users.slice(1).map(userId => ({ caseId: own, userId, capability: "SHARED_WRITE", active: true })) });
    const tokens = await Promise.all(users.map(async userId => (await issueSession({ db, userId })).token));
    const headers = user => ({ Cookie: `${COOKIE_NAME}=${tokens[user]}` }), base = await start(db);
    const csrf = await Promise.all(users.map(async (_, user) => (await (await fetch(base + "/auth/csrf", { headers: headers(user) })).json()).token));
    const path = caseId => `/api/dossiers/${caseId}/identite`;
    const read = ({ caseId = own, user = 0, query = "", server = base } = {}) => fetch(server + path(caseId) + query, { headers: headers(user) });
    const write = ({ caseId = own, user = 0, body = { expectedVersion: 1, identity, reason: "Première saisie fictive vérifiée" }, server = base, query = "", extraHeaders = {} } = {}) => fetch(server + path(caseId) + query, {
      method: "PATCH", headers: { ...headers(user), Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf[user], ...extraHeaders }, body: JSON.stringify(body),
    });
    const snapshot = async () => ({
      cases: await db.caseFile.findMany({ where: { id: { in: cases } }, orderBy: { id: "asc" } }),
      identities: await db.caseIdentity.findMany({ where: { caseId: { in: cases } }, orderBy: { caseId: "asc" } }),
      revisions: await db.caseIdentityRevision.findMany({ where: { caseId: { in: cases } }, orderBy: { id: "asc" } }),
      audits: await db.auditEvent.findMany({ where: { actorId: { in: users } }, orderBy: { id: "asc" } }),
    });
    await check({ db, users, cases, own, foreign, archived, unidentified, otherOwn, reference, base, start, headers, csrf, read, write, snapshot });
  } finally {
    for (const server of servers) await new Promise(resolve => server.close(resolve));
    await db.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    await db.caseFile.deleteMany({ where: { id: { in: cases } } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } }); await db.$disconnect();
  }
}

test("PostgreSQL/HTTP : identité inconnue, saisie/correction versionnées et absence de diffusion nominale aux autres API", integration, async () => {
  await withFixture(async ({ db, users, own, reference, base, headers, csrf, read, write }) => {
    const initial = await read(); assert.equal(initial.status, 200); assert.equal(initial.headers.get("cache-control"), "no-store");
    assert.deepEqual(await initial.json(), { caseId: own, artagReference: reference, dossierVersion: 1, identityVersion: 0, identity: blank, history: [], nextBeforeVersion: null });
    assert.equal(await db.caseIdentity.count({ where: { caseId: own } }), 0);
    assert.deepEqual(await (await write()).json(), { caseId: own, dossierVersion: 2 });
    const first = await (await read()).json();
    assert.equal(first.identityVersion, 2); assert.deepEqual(first.identity, identity);
    assert.deepEqual(first.history[0].previousIdentity, blank); assert.equal(first.history[0].actorId, users[0]);
    const note = await fetch(base + `/api/dossiers/${own}/notes-partagees`, { method: "POST",
      headers: { ...headers(0), Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf[0] },
      body: JSON.stringify({ expectedVersion: 2, text: "Note fictive séparée de l’identité" }) });
    assert.equal(note.status, 201);
    const next = { ...identity, firstName: "Recette corrigée", insertisNumber: null, age: null };
    assert.equal((await write({ body: { expectedVersion: 2, identity: next, reason: "Correction fictive" } })).status, 409);
    assert.equal((await write({ body: { expectedVersion: 3, identity: next, reason: "Correction fictive après vérification" } })).status, 200);
    const updated = await (await read()).json();
    assert.equal(updated.identityVersion, 4); assert.equal(updated.dossierVersion, 4);
    assert.deepEqual(updated.history.map(row => row.dossierVersion), [4, 2]);
    assert.deepEqual(updated.history[0].previousIdentity, identity); assert.deepEqual(updated.identity, next);
    for (const endpoint of ["/api/mes-dossiers", `/api/dossiers/${own}/notes-partagees`, `/api/dossiers/${own}/reference-artag`]) {
      const response = await fetch(base + endpoint, { headers: headers(0) }); assert.equal(response.status, 200);
      assert.doesNotMatch(JSON.stringify(await response.json()), /FICTIF D’EXEMPLE|Recette corrigée|INSERTIS-FICTIF|lastName|firstName|insertisNumber/);
    }
    const audits = await db.auditEvent.findMany({ where: { caseId: own } });
    assert.doesNotMatch(JSON.stringify(audits), /FICTIF D’EXEMPLE|Recette|INSERTIS-FICTIF|Correction fictive|Première saisie/);
    // Vider explicitement un champ laisse sa valeur antérieure dans la révision.
    assert.equal((await write({ body: { expectedVersion: 4, identity: blank, reason: "Rectification fictive de valeurs inconnues" } })).status, 200);
    assert.deepEqual((await (await read()).json()).identity, blank);
  });
});

test("PostgreSQL/HTTP : identité et historique refusés aux délégataires, autres profils et dossiers non identifiés", integration, async () => {
  await withFixture(async ({ db, own, foreign, archived, unidentified, users, read, write, snapshot, headers, base }) => {
    assert.equal((await write()).status, 200);
    const before = await snapshot();
    for (let user = 1; user < users.length; user++) {
      assert.equal((await read({ user })).status, 404); assert.equal((await write({ user })).status, 404);
    }
    for (const caseId of [foreign, archived, unidentified, randomUUID(), "invalide"]) {
      assert.equal((await read({ caseId })).status, 404); assert.equal((await write({ caseId })).status, 404);
    }
    for (const extraHeaders of [{ Origin: "https://autre.example.org" }, { "X-CSRF-Token": "invalide" }]) assert.equal((await write({ extraHeaders })).status, 403);
    const input = { expectedVersion: 1, identity, reason: "Saisie fictive" };
    for (const body of [null, [], { ...input, actorId: users[1] }, { ...input, identity: { ...identity, referentId: users[1] } },
      { ...input, identity: { ...identity, age: "40" } }, { ...input, identity: { ...identity, age: -1 } },
      { ...input, identity: { ...identity, lastName: "a".repeat(201) } }, { ...input, identity: { lastName: "FICTIF" } }]) assert.equal((await write({ body })).status, 422);
    for (const query of ["?role=REFERENTE", "?beforeVersion=0", "?beforeVersion=1&beforeVersion=2", "?beforeVersion=2147483648"]) assert.equal((await read({ query })).status, 422);
    assert.equal((await write({ query: "?caseId=autre" })).status, 422);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await fetch(base + `/api/dossiers/${own}/identite`)).status, 404);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: false } });
    assert.equal((await write()).status, 404); assert.equal((await read()).status, 404);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: true } });
    await revokeSession({ db, cookieHeader: headers(0).Cookie }); assert.equal((await read()).status, 404);
  });
});

test("PostgreSQL/HTTP : concurrence sans écrasement et annulation complète après panne d'identité, révision ou audit", integration, async () => {
  await withFixture(async ({ db, own, read, write, start, snapshot }) => {
    const before = await snapshot();
    for (const model of ["caseIdentity", "caseIdentityRevision", "auditEvent"]) {
      const broken = new Proxy(db, { get(target, key) {
        if (key !== "$transaction") return target[key];
        return (operation, options) => target.$transaction(tx => operation(new Proxy(tx, { get(transaction, field) {
          if (field !== model) return transaction[field];
          return new Proxy(transaction[field], { get(delegate, method) {
            return method === "create" ? async () => { throw new Error("PANNE_IDENTITE_FICTIVE"); } : delegate[method];
          } });
        } })), options);
      } });
      const server = await start(broken); const response = await write({ server });
      assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: "SERVICE_INDISPONIBLE" });
      if (model === "auditEvent") assert.equal((await read({ server })).status, 503);
      assert.deepEqual(await snapshot(), before);
    }
    const concurrent = await Promise.all([write(), write({ body: { expectedVersion: 1, identity: { ...identity, age: 41 }, reason: "Autre saisie fictive" } })]);
    assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 409]);
    assert.equal(await db.caseIdentity.count({ where: { caseId: own } }), 1);
    assert.equal(await db.caseIdentityRevision.count({ where: { caseId: own } }), 1);
    assert.equal((await db.caseFile.findUnique({ where: { id: own } })).version, 2);
  });
});

test("PostgreSQL/HTTP : pagination stable, âge zéro et historique incohérent bloqué", integration, async () => {
  await withFixture(async ({ db, own, users, read, write, reference }) => {
    const current = { ...identity, lastName: "FICTIF-52", age: 0 };
    await db.caseIdentity.create({ data: { caseId: own, dossierVersion: 52, ...current } });
    await db.caseIdentityRevision.createMany({ data: Array.from({ length: 52 }, (_, i) => ({
      caseId: own, dossierVersion: i + 1, ...identity, lastName: `FICTIF-${i + 1}`, age: 0,
      previousLastName: i ? `FICTIF-${i}` : null, previousFirstName: i ? identity.firstName : null,
      previousInsertisNumber: i ? identity.insertisNumber : null, previousAge: i ? 0 : null,
      actorId: users[0], reason: "Correction fictive pour pagination",
    })) });
    await db.caseFile.update({ where: { id: own }, data: { version: 53 } });
    const first = await (await read()).json(); assert.equal(first.history.length, 50); assert.equal(first.nextBeforeVersion, 3);
    assert.equal(first.identity.age, 0);
    assert.equal((await write({ body: { expectedVersion: 53, identity: { ...current, firstName: "Nouvelle recette fictive" }, reason: "Correction fictive intercalaire" } })).status, 200);
    const second = await (await read({ query: "?beforeVersion=3" })).json();
    assert.deepEqual(second.history.map(row => row.dossierVersion), [2, 1]); assert.equal(second.nextBeforeVersion, null);
    assert.equal(second.identityVersion, 54); assert.equal(second.dossierVersion, 54);
    await db.caseIdentity.update({ where: { caseId: own }, data: { age: 1 } });
    const drift = await read(); assert.equal(drift.status, 409);
    assert.deepEqual(await drift.json(), { error: "HISTORIQUE_IDENTITE_INDISPONIBLE" });
    assert.equal((await write({ body: { expectedVersion: 54, identity, reason: "Fictif" } })).status, 409);
    assert.equal(await db.caseIdentityRevision.count({ where: { caseId: own } }), 53);
    await db.caseIdentity.update({ where: { caseId: own }, data: { age: 0 } });
    await db.caseReferenceRevision.create({ data: { caseId: own, dossierVersion: 1, previousReference: null,
      artagReference: reference, actorId: users[0], reason: "Référence fictive initiale" } });
    await db.caseFile.update({ where: { id: own }, data: { artagReference: reference + "-HORS" } });
    assert.equal((await read()).status, 409);
  });
});
