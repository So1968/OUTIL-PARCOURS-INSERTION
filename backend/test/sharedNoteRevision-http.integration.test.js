import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME, issueSession } from "../src/sessions.js";

test("HTTP : révision protégée par session, CSRF, droits et versions", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ref = randomUUID(), dir = randomUUID(), caseId = randomUUID();
  const origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org",
    generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: ref, email: "http-rev-ref-" + ref + "@example.org", role: "REFERENTE", enabled: true },
      { id: dir, email: "http-rev-dir-" + dir + "@example.org", role: "DIRECTION", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId: ref } });
    const [sRef, sDir] = await Promise.all([
      issueSession({ db, userId: ref }), issueSession({ db, userId: dir }),
    ]);
    const cookie = s => COOKIE_NAME + "=" + s.token;
    server = createApp({
      privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-pour-verifier-le-serveur-32",
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = "http://127.0.0.1:" + server.address().port;
    const csrf = async s => (await (await fetch(base + "/auth/csrf", {
      headers: { Cookie: cookie(s) },
    })).json()).token;
    const refCsrf = await csrf(sRef), dirCsrf = await csrf(sDir);
    const post = await fetch(base + "/api/dossiers/" + caseId + "/notes-partagees", {
      method: "POST", headers: {
        Cookie: cookie(sRef), Origin: origin, "X-CSRF-Token": refCsrf,
        "Content-Type": "application/json",
      }, body: JSON.stringify({ text: "Brouillon fictif", expectedVersion: 0 }),
    });
    assert.equal(post.status, 201);
    const created = await post.json();
    const path = base + "/api/dossiers/" + caseId + "/notes-partagees/" + created.noteId;
    const body = {
      expectedDossierVersion: 1, expectedNoteVersion: 1,
      text: "Correction fictive", validated: false, reason: "Correction de recette",
    };
    const patch = (s, c, data = body, requestOrigin = origin) => fetch(path, {
      method: "PATCH", headers: {
        Cookie: cookie(s), Origin: requestOrigin, "X-CSRF-Token": c,
        "Content-Type": "application/json",
      }, body: JSON.stringify(data),
    });
    assert.equal((await patch(sRef, "0".repeat(64))).status, 403);
    assert.equal((await patch(sRef, refCsrf, body, "https://attack.example.org")).status, 403);
    assert.equal((await patch(sDir, dirCsrf)).status, 404);
    assert.equal((await patch(sRef, refCsrf, { ...body, actorId: dir })).status, 422);
    assert.equal((await patch(sRef, refCsrf, { ...body, text: "" })).status, 422);
    const response = await patch(sRef, refCsrf);
    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(await response.json()).sort(),
      ["dossierVersion", "noteId", "noteVersion", "validated"]);
    assert.equal((await patch(sRef, refCsrf)).status, 409);
    assert.equal((await db.sharedNoteRevision.count({ where: { caseId } })), 2);
    assert.equal((await db.auditEvent.count({ where: { caseId } })), 2);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.sharedNoteRevision.deleteMany({ where: { caseId } });
    await db.sharedNote.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [ref, dir] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [ref, dir] } } });
    await db.$disconnect();
  }
});
