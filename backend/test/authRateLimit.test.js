import test from "node:test";
import assert from "node:assert/strict";
import { createRequestLimiter } from "../src/authRateLimit.js";

test("le limiteur accepte N tentatives puis bloque avec Retry-After", () => {
  let current = 1_000_000;
  const limiter = createRequestLimiter({
    maxAttempts: 2, windowMs: 5000, maxKeys: 2, now: () => current,
  });
  assert.equal(limiter.check("login:ip").allowed, true);
  assert.equal(limiter.check("login:ip").allowed, true);
  assert.deepEqual(limiter.check("login:ip"), { allowed: false, retryAfter: 5 });
  current += 5001;
  assert.equal(limiter.check("login:ip").allowed, true);
});

test("le limiteur a une mémoire bornée, isole les routes et reste fermé sous saturation", () => {
  const limiter = createRequestLimiter({
    maxAttempts: 2, windowMs: 60000, maxKeys: 2, now: () => 100000,
  });
  assert.equal(limiter.check("login:1").allowed, true);
  assert.equal(limiter.check("callback:1").allowed, true);
  assert.equal(limiter.check("login:2").allowed, false);
  assert.equal(limiter.check("callback:1").allowed, true);
  assert.equal(limiter.check("callback:1").allowed, false);
});

test("l'adresse HTTP utilisée vient de la connexion, jamais de X-Forwarded-For", () => {
  let current = 100000;
  const limiter = createRequestLimiter({ maxAttempts: 1, now: () => current });
  const calls = [];
  const req = {
    socket: { remoteAddress: "127.0.0.1" },
    path: "/login",
    headers: { "x-forwarded-for": "1.2.3.4" },
  };
  const res = {
    status(code) { calls.push(code); return this; },
    setHeader(key, value) { calls.push([key, value]); },
    json(payload) { calls.push(payload); return this; },
  };
  limiter.middleware(req, res, () => calls.push("next"));
  req.headers["x-forwarded-for"] = "9.9.9.9";
  limiter.middleware(req, res, () => calls.push("next"));
  assert.equal(calls.filter(item => item === "next").length, 1);
  assert.ok(calls.includes(429));
  assert.ok(calls.some(item => item.error === "TROP_DE_TENTATIVES"));
  current += 601000;
  limiter.middleware(req, res, () => calls.push("next"));
  assert.equal(calls.filter(item => item === "next").length, 2);
});
