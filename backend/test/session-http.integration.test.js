import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME, revokeSession } from "../src/sessions.js";

test("PostgreSQL HTTP : aucune lecture sans session, droits serveur et journal", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const userId = randomUUID(), otherId = randomUUID(), caseId = randomUUID();
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({
      data: [
        { id: userId, email: `session-${userId}@example.org`, role: "REFERENTE", enabled: true },
        { id: otherId, email: `session-${otherId}@example.org`, role: "DIRECTION", enabled: true },
      ],
    });
    await db.caseFile.create({ data: { id: caseId, referentId: userId } });
    await db.privateNote.create({
      data: { caseId, authorId: userId, text: "NOTE_FICTIVE_NON_TRANSFEREE" },
    });
    const { token } = await issueSession({ db, userId });
    const { token: otherToken } = await issueSession({ db, userId: otherId });
    server = createApp({ privateDb: db }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const url = `http://127.0.0.1:${server.address().port}/api/dossiers/${caseId}/overview`;
    const unauthorized = await fetch(url, { headers: { "X-Role": "REFERENTE" } });
    assert.equal(unauthorized.status, 404);
    const other = await fetch(url, { headers: { Cookie: `${COOKIE_NAME}=${otherToken}` } });
    assert.equal(other.status, 404);
    const allowed = await fetch(url, { headers: { Cookie: `${COOKIE_NAME}=${token}` } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get("cache-control"), "no-store");
    const payload = await allowed.json();
    assert.deepEqual(Object.keys(payload).sort(), ["id", "updatedAt", "version"]);
    assert.equal(JSON.stringify(payload).includes("NOTE_FICTIVE"), false);
    assert.equal(payload.id, caseId);
    const audit = await db.auditEvent.findMany({ where: { caseId } });
    assert.equal(audit.length, 1);
    assert.equal(audit[0].actorId, userId);
    await revokeSession({ db, cookieHeader: `${COOKIE_NAME}=${token}` });
    const afterRevocation = await fetch(url, { headers: { Cookie: `${COOKIE_NAME}=${token}` } });
    assert.equal(afterRevocation.status, 404);
    assert.equal((await db.auditEvent.count({ where: { caseId } })), 1);
    const forbiddenWrite = await fetch(url, { method: "POST" });
    assert.equal(forbiddenWrite.status, 503);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [userId, otherId] } } });
    await db.privateNote.deleteMany({ where: { caseId } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [userId, otherId] } } });
    await db.$disconnect();
  }
});
