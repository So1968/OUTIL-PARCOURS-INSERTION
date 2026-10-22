import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME, revokeSession } from "../src/sessions.js";

test("HTTP fictif : session, CSRF, version de dossier et journal pour une note partagée", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ref = randomUUID(), dir = randomUUID(), caseId = randomUUID();
  const origin = "https://artag.example.org";
  const oidc = {
    origin, redirectUri: origin + "/auth/callback",
    provider: {
      issuer: "https://idp.example.org",
      generateVerifier: () => "fictif",
      authorizationUrl: async () => "https://idp.example.org/authorize",
      verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
    },
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: ref, email: `csrf-ref-${ref}@example.org`, role: "REFERENTE", enabled: true },
      { id: dir, email: `csrf-dir-${dir}@example.org`, role: "DIRECTION", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId: ref } });
    const [{ token: refToken }, { token: dirToken }] = await Promise.all([
      issueSession({ db, userId: ref }),
      issueSession({ db, userId: dir }),
    ]);
    server = createApp({
      privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "secret-pour-tests-de-recette-uniquement-32-caracteres",
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const endpoint = `${base}/api/dossiers/${caseId}/notes-partagees`;
    const cookie = t => `${COOKIE_NAME}=${t}`;
    const getCsrf = async token => {
      const r = await fetch(base + "/auth/csrf", { headers: { Cookie: cookie(token) } });
      return { status: r.status, body: await r.json() };
    };
    const post = async (token, csrf, version, text, requestedOrigin = origin) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          Cookie: cookie(token), Origin: requestedOrigin, "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedVersion: version, text }),
      });

    assert.equal((await getCsrf("f".repeat(64))).status, 401);
    const { body: { token: csrfRef } } = await getCsrf(refToken);
    const { body: { token: csrfDir } } = await getCsrf(dirToken);
    assert.match(csrfRef, /^[a-f0-9]{64}$/);
    assert.equal((await post(refToken, "f".repeat(64), 0, "Fictif")).status, 403);
    assert.equal((await post(refToken, csrfRef, 0, "Fictif", "https://attack.example.org")).status, 403);
    assert.equal((await post(dirToken, csrfDir, 0, "Fictif")).status, 404);
    assert.equal((await post(refToken, csrfRef, 0, " ")).status, 422);

    const created = await post(refToken, csrfRef, 0, "Intervention factuelle fictive");
    assert.equal(created.status, 201);
    assert.deepEqual(Object.keys(await created.json()).sort(), ["dossierVersion", "noteId", "validated"]);
    assert.equal((await post(refToken, csrfRef, 0, "Modif concurrente")).status, 409);
    assert.equal((await db.sharedNote.count({ where: { caseId } })), 1);
    assert.equal((await db.auditEvent.count({ where: { caseId } })), 1);

    await revokeSession({ db, cookieHeader: cookie(refToken) });
    assert.equal((await post(refToken, csrfRef, 1, "Après déconnexion")).status, 404);
    assert.equal((await db.sharedNote.count({ where: { caseId } })), 1);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.sharedNote.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [ref, dir] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [ref, dir] } } });
    await db.$disconnect();
  }
});
