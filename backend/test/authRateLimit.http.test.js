import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { createAuthRouter } from "../src/authRouter.js";

test("HTTP : protection des routes OIDC malgré des IP déclarées différentes dans les en-têtes", async () => {
  const attempts = [];
  const db = {
    oidcLoginAttempt: { create: async ({ data }) => { attempts.push(data); } },
    identityLink: { findUnique: async () => null },
  };
  const provider = {
    issuer: "https://idp.example.org",
    generateVerifier: () => "verificateur-test",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => { throw new Error("not called"); },
  };
  const app = express();
  app.use("/auth", createAuthRouter({
    db, provider,
    origin: "https://artag.example.org",
    redirectUri: "https://artag.example.org/auth/callback",
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/auth/login`;
  try {
    for (let i = 0; i < 20; i++) {
      const response = await fetch(url, {
        redirect: "manual",
        headers: { "X-Forwarded-For": `198.51.100.${i + 1}` },
      });
      assert.equal(response.status, 302);
    }
    const blocked = await fetch(url, {
      redirect: "manual", headers: { "X-Forwarded-For": "203.0.113.200" },
    });
    assert.equal(blocked.status, 429);
    assert.deepEqual(await blocked.json(), { error: "TROP_DE_TENTATIVES" });
    assert.ok(Number(blocked.headers.get("retry-after")) >= 1);
    assert.equal(attempts.length, 20);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
