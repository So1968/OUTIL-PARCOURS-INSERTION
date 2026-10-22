import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME } from "../src/sessions.js";

test("SSO fictif : état lié au navigateur, provisionnement, session et révocation", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const userId = randomUUID(), caseId = randomUUID();
  const issuer = "https://idp.example.org";
  const subject = "user-demo-fictif";
  const origin = "https://artag.example.org";
  const redirectUri = `${origin}/auth/callback`;
  const provider = {
    issuer,
    generateVerifier: () => "fictif-verifier",
    authorizationUrl: async ({ state, nonce }) =>
      `https://idp.example.org/authorize?state=${state}&nonce=${nonce}`,
    // Faux fournisseur UNIQUEMENT pour les tests de routage. Aucune
    // signature OIDC n'est simulée comme si elle était certifiée.
    verifyCallback: async ({ state, nonce, callbackUrl, verifier }) => {
      assert.equal(verifier, "fictif-verifier");
      assert.ok(nonce);
      assert.equal(new URL(callbackUrl).searchParams.get("state"), state);
      return { issuer, subject };
    },
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.create({
      data: { id: userId, email: `oidc-${userId}@example.org`, role: "REFERENTE", enabled: true },
    });
    await db.caseFile.create({ data: { id: caseId, referentId: userId } });
    server = createApp({ privateDb: db, oidc: { provider, origin, redirectUri } })
      .listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;

    const begin = async () => {
      const response = await fetch(`${base}/auth/login`, { redirect: "manual" });
      assert.equal(response.status, 302);
      const providerUrl = new URL(response.headers.get("location"));
      const loginCookie = response.headers.get("set-cookie").split(";")[0];
      return { state: providerUrl.searchParams.get("state"), loginCookie };
    };

    // Aucune création automatique d'un compte en l'absence d'un lien
    // institutionnel explicitement enregistré en base.
    const first = await begin();
    const denied = await fetch(`${base}/auth/callback?state=${first.state}&code=fictif`, {
      headers: { Cookie: first.loginCookie }, redirect: "manual",
    });
    assert.equal(denied.status, 403);
    assert.equal(await db.webSession.count({ where: { userId } }), 0);

    await db.identityLink.create({ data: { userId, issuer, subject } });
    const second = await begin();
    const mismatch = await fetch(`${base}/auth/callback?state=${second.state}&code=fictif`, {
      headers: { Cookie: "__Host-artag-oidc=" + "a".repeat(64) }, redirect: "manual",
    });
    assert.equal(mismatch.status, 401);

    const callback = await fetch(`${base}/auth/callback?state=${second.state}&code=fictif`, {
      headers: { Cookie: second.loginCookie }, redirect: "manual",
    });
    assert.equal(callback.status, 303);
    const allCookies = callback.headers.getSetCookie();
    const sessionSetCookie = allCookies.find(header => header.startsWith(`${COOKIE_NAME}=`));
    assert.ok(sessionSetCookie);
    assert.match(sessionSetCookie, /Secure; HttpOnly; SameSite=Lax/);
    const session = sessionSetCookie.split(";")[0];

    const replay = await fetch(`${base}/auth/callback?state=${second.state}&code=fictif`, {
      headers: { Cookie: second.loginCookie }, redirect: "manual",
    });
    assert.equal(replay.status, 401);
    assert.equal((await fetch(`${base}/api/dossiers/${caseId}/overview`, {
      headers: { Cookie: session },
    })).status, 200);

    const crossOrigin = await fetch(`${base}/auth/logout`, {
      method: "POST", headers: { Cookie: session, Origin: "https://attacker.example.org" },
    });
    assert.equal(crossOrigin.status, 403);
    const logout = await fetch(`${base}/auth/logout`, {
      method: "POST", headers: { Cookie: session, Origin: origin },
    });
    assert.equal(logout.status, 204);
    assert.equal((await fetch(`${base}/api/dossiers/${caseId}/overview`, {
      headers: { Cookie: session },
    })).status, 404);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId } });
    await db.identityLink.deleteMany({ where: { userId } });
    await db.oidcLoginAttempt.deleteMany();
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
});
