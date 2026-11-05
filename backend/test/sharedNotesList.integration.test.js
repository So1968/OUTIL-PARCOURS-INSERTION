import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME, issueSession } from "../src/sessions.js";

test("PostgreSQL/HTTP : liste des notes paginée, autorisée et auditée sans espace réservé", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const userId = randomUUID(), caseId = randomUUID(), otherCaseId = randomUUID();
  const servers = [];
  const origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org", generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  const start = async privateDb => {
    const server = createApp({ privateDb, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-reserve-aux-tests-32-caracteres" }).listen(0, "127.0.0.1");
    servers.push(server); await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await db.$connect();
    await db.userAccount.create({ data: { id: userId,
      email: `liste-fictive-${userId}@example.org`, role: "REFERENTE", enabled: true } });
    await db.caseFile.createMany({ data: [{ id: caseId, referentId: userId }, { id: otherCaseId }] });
    const stamp = new Date("2026-10-26T08:00:00Z");
    await db.sharedNote.createMany({ data: Array.from({ length: 30 }, (_, i) => ({
      caseId, text: `Note fictive ${i}`, createdAt: stamp,
    })) });
    await db.sharedNote.create({ data: { caseId: otherCaseId, text: "Autre dossier fictif" } });
    await db.privateNote.create({ data: { caseId, authorId: userId, text: "Note réservée fictive" } });
    const { token } = await issueSession({ db, userId });
    const headers = { Cookie: `${COOKIE_NAME}=${token}` };
    const base = await start(db);
    const path = `/api/dossiers/${caseId}/notes-partagees`;
    assert.equal((await fetch(base + path)).status, 404);
    assert.equal((await fetch(base + `/api/dossiers/${otherCaseId}/notes-partagees`, { headers })).status, 404);
    for (const role of ["APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"]) {
      await db.userAccount.update({ where: { id: userId }, data: { role } });
      assert.equal((await fetch(base + path, { headers })).status, 404);
    }
    await db.userAccount.update({ where: { id: userId }, data: { role: "REFERENTE" } });
    const firstResponse = await fetch(base + path, { headers });
    assert.equal(firstResponse.status, 200);
    assert.equal(firstResponse.headers.get("cache-control"), "no-store");
    const first = await firstResponse.json();
    assert.equal(first.dossierVersion, 0);
    assert.equal(first.notes.length, 25);
    assert.equal(first.nextOffset, 25);
    assert.deepEqual(Object.keys(first.notes[0]).sort(), ["createdAt", "id", "text", "updatedAt", "validated", "version"]);
    const next = await (await fetch(base + path + "?offset=25", { headers })).json();
    assert.equal(next.notes.length, 5); assert.equal(next.nextOffset, null);
    const all = [...first.notes, ...next.notes];
    const expected = await db.sharedNote.findMany({ where: { caseId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
    assert.deepEqual(all.map(note => note.id), expected.map(note => note.id));
    assert.doesNotMatch(JSON.stringify(all), /Note réservée|Autre dossier|email|tokenDigest/);
    for (const query of ["?offset=-1", "?offset=1.5", "?offset=100001", "?offset=0&offset=25", "?role=REFERENTE"]) {
      assert.equal((await fetch(base + path + query, { headers })).status, 422);
    }
    assert.equal(await db.auditEvent.count({ where: { caseId, eventType: "SHARED_NOTES_READ" } }), 2);
    const broken = {
      webSession: db.webSession,
      oidcLoginAttempt: db.oidcLoginAttempt,
      identityLink: db.identityLink,
      $transaction: (operation, options) => db.$transaction(tx => operation(new Proxy(tx, {
        get(target, key) {
          return key === "auditEvent" ? { create: async () => { throw new Error("PANNE_AUDIT_FICTIVE"); } } : target[key];
        },
      })), options),
    };
    const unavailable = await fetch(await start(broken) + path, { headers });
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { error: "SERVICE_INDISPONIBLE" });
    assert.equal(await db.auditEvent.count({ where: { caseId } }), 2);
    await db.caseFile.update({ where: { id: caseId }, data: { archivedAt: new Date() } });
    assert.equal((await fetch(base + path, { headers })).status, 404);
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 0);
  } finally {
    for (const server of servers) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId: { in: [caseId, otherCaseId] } } });
    await db.caseFile.deleteMany({ where: { id: { in: [caseId, otherCaseId] } } });
    await db.webSession.deleteMany({ where: { userId } });
    await db.userAccount.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
});
