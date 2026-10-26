import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, revokeSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL/HTTP : file active cloisonnée, références uniques et pagination stable", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const roles = ["REFERENTE", "REFERENTE", "REFERENTE", "APPUI_TNS", "DIRECTION", "ACCUEIL", "RELAIS_LOGEMENT", "ADMIN_TECHNIQUE", "GOUVERNANCE"];
  const users = roles.map(() => randomUUID());
  const [ref, other, delegate, tns, direction] = users;
  const tag = randomUUID(), stamp = new Date("2026-10-26T08:00:00Z");
  const own = Array.from({ length: 26 }, (_, i) => ({ id: randomUUID(), referentId: ref,
    createdAt: stamp, artagReference: i < 2 ? null : `ARTAG-FICTIF-${tag}-${i}` }));
  const assigned = { id: randomUUID(), referentId: other, createdAt: stamp, artagReference: `ARTAG-RELAIS-FICTIF-${tag}` };
  const foreign = { id: randomUUID(), referentId: other, createdAt: stamp, artagReference: `ARTAG-AUTRE-FICTIF-${tag}` };
  const archived = { id: randomUUID(), referentId: ref, createdAt: stamp, archivedAt: stamp };
  const readOnly = { id: randomUUID(), referentId: other, createdAt: stamp };
  const inactive = { id: randomUUID(), referentId: other, createdAt: stamp };
  const inserted = { id: randomUUID(), referentId: ref, createdAt: new Date(stamp.getTime() + 86400000),
    artagReference: `ARTAG-NOUVEAU-FICTIF-${tag}` };
  const caseIds = [...own, assigned, foreign, archived, readOnly, inactive, inserted].map(row => row.id);
  const servers = [];
  const origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org", generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  const start = async privateDb => {
    const server = createApp({ privateDb, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-de-recette-plus-de-32-caracteres" }).listen(0, "127.0.0.1");
    servers.push(server); await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: users.map((id, i) => ({ id,
      email: `file-fictive-${id}@example.org`, role: roles[i], enabled: true })) });
    await db.caseFile.createMany({ data: [...own, assigned, foreign, archived, readOnly, inactive] });
    await db.caseAssignment.createMany({ data: [
      { caseId: assigned.id, userId: ref, capability: "SHARED_WRITE", active: true },
      { caseId: own[0].id, userId: delegate, capability: "SHARED_WRITE", active: true },
      { caseId: readOnly.id, userId: ref, capability: "SHARED_READ", active: true },
      { caseId: inactive.id, userId: ref, capability: "SHARED_WRITE", active: false },
      { caseId: foreign.id, userId: tns, capability: "SHARED_WRITE", active: true },
      { caseId: foreign.id, userId: direction, capability: "SHARED_WRITE", active: true },
    ] });
    await db.temporaryGrant.create({ data: { caseId: foreign.id, userId: direction, approvedById: other,
      capability: "SHARED_READ", reason: "Relais fictif", startsAt: new Date(Date.now() - 60000), expiresAt: new Date(Date.now() + 60000) } });
    await db.privateNote.create({ data: { caseId: own[2].id, authorId: ref, text: "Analyse réservée fictive" } });
    await db.sharedNote.create({ data: { caseId: own[2].id, text: "Texte partagé fictif non listé" } });
    await assert.rejects(db.caseFile.create({ data: { artagReference: own[2].artagReference } }), { code: "P2002" });
    const tokens = await Promise.all(users.map(async userId => (await issueSession({ db, userId })).token));
    const headers = i => ({ Cookie: `${COOKIE_NAME}=${tokens[i]}` });
    const base = await start(db);
    const directory = (i = 0, query = "") => fetch(base + "/api/mes-dossiers" + query, { headers: headers(i) });
    assert.equal((await fetch(base + "/api/mes-dossiers")).status, 404);
    for (let i = 3; i < users.length; i++) assert.equal((await directory(i)).status, 404);
    const firstResponse = await directory();
    assert.equal(firstResponse.status, 200);
    assert.equal(firstResponse.headers.get("cache-control"), "no-store");
    const first = await firstResponse.json();
    assert.equal(first.cases.length, 25);
    assert.match(first.nextCursor, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(Object.keys(first.cases[0]).sort(), ["artagReference", "createdAt", "id", "updatedAt", "version"]);
    await db.caseFile.create({ data: inserted });
    const second = await (await directory(0, `?before=${first.nextCursor}`)).json();
    assert.equal(second.cases.length, 2); assert.equal(second.nextCursor, null);
    const combined = [...first.cases, ...second.cases];
    assert.deepEqual(combined.map(row => row.id), [...own, assigned].map(row => row.id).sort().reverse());
    assert.equal(combined.filter(row => row.artagReference === null).length, 2);
    assert.doesNotMatch(JSON.stringify(combined), /Analyse réservée|Texte partagé|assignments|referentId|email/);
    const latest = await (await directory()).json();
    assert.equal(latest.cases[0].id, inserted.id);
    const linked = combined.find(row => row.id === own[2].id);
    const notesResponse = await fetch(base + `/api/dossiers/${linked.id}/notes-partagees`, { headers: headers(0) });
    assert.equal(notesResponse.status, 200);
    assert.equal((await notesResponse.json()).artagReference, linked.artagReference);
    assert.deepEqual((await (await directory(2)).json()).cases.map(row => row.id), [own[0].id]);
    await db.caseAssignment.updateMany({ where: { caseId: own[0].id, userId: delegate }, data: { active: false } });
    assert.deepEqual(await (await directory(2)).json(), { cases: [], nextCursor: null });
    assert.equal((await fetch(base + `/api/dossiers/${own[0].id}/notes-partagees`, { headers: headers(2) })).status, 404);
    const auditBefore = await db.auditEvent.count({ where: { actorId: ref, eventType: "CASE_DIRECTORY_READ" } });
    for (const query of ["?role=DIRECTION", `?userId=${other}`, "?before=incorrect", "?before=a&before=b", "?offset=0"]) {
      assert.equal((await directory(0, query)).status, 422);
    }
    assert.equal(await db.auditEvent.count({ where: { actorId: ref, eventType: "CASE_DIRECTORY_READ" } }), auditBefore);
    const broken = new Proxy(db, { get(target, key) {
      if (key !== "$transaction") return target[key];
      return (operation, options) => target.$transaction(tx => operation(new Proxy(tx, {
        get(transaction, model) {
          if (model !== "auditEvent") return transaction[model];
          return new Proxy(transaction[model], { get(delegateModel, method) {
            return method === "createMany" ? async () => { throw new Error("PANNE_AUDIT_FICTIVE"); } : delegateModel[method];
          } });
        },
      })), options);
    } });
    const failedRead = await fetch(await start(broken) + "/api/mes-dossiers", { headers: headers(0) });
    assert.equal(failedRead.status, 503);
    assert.deepEqual(await failedRead.json(), { error: "SERVICE_INDISPONIBLE" });
    assert.equal(await db.auditEvent.count({ where: { actorId: ref, eventType: "CASE_DIRECTORY_READ" } }), auditBefore);
    const ownAudit = await db.auditEvent.findMany({ where: { actorId: ref, eventType: "CASE_DIRECTORY_READ" } });
    assert.ok(ownAudit.every(event => [...own, assigned, inserted].some(row => row.id === event.caseId)));
    await revokeSession({ db, cookieHeader: headers(0).Cookie });
    assert.equal((await directory()).status, 404);
    await db.userAccount.update({ where: { id: other }, data: { enabled: false } });
    assert.equal((await directory(1)).status, 404);
  } finally {
    for (const server of servers) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    await db.caseFile.deleteMany({ where: { id: { in: caseIds } } });
    await db.webSession.deleteMany({ where: { userId: { in: users } } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
