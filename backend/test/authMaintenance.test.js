import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { authPruneCriteria, inspectAuthState, pruneAuthState } from "../src/authMaintenance.js";

test("politique de purge : rétention contrôlée et refus d'une date invalide", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  const filter = authPruneCriteria(now);
  assert.deepEqual(filter.attempts, { expiresAt: { lt: new Date("2026-10-16T12:00:00Z") } });
  assert.equal(filter.sessions.OR.length, 2);
  assert.throws(() => authPruneCriteria(new Date("invalid")));
  assert.throws(() => authPruneCriteria(now, 1000));
});

test("PostgreSQL : purge explicite des sessions et OIDC expirés, sans toucher aux sessions actives", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const userId = randomUUID();
  const now = new Date("2026-10-23T12:00:00Z");
  const old = new Date("2026-10-01T00:00:00Z");
  const live = new Date("2026-10-24T00:00:00Z");
  const oldDigest = randomBytes(32).toString("hex");
  const liveDigest = randomBytes(32).toString("hex");
  const attemptOld = randomBytes(32).toString("hex");
  const attemptLive = randomBytes(32).toString("hex");
  try {
    await db.userAccount.create({
      data: { id: userId, email: `prune-${userId}@example.org`, role: "APPUI_TNS", enabled: true },
    });
    await db.webSession.createMany({ data: [
      { userId, tokenDigest: oldDigest, expiresAt: old },
      { userId, tokenDigest: liveDigest, expiresAt: live },
    ] });
    await db.oidcLoginAttempt.createMany({ data: [
      { stateDigest: attemptOld, verifier:"fictif", nonce:"fictif", expiresAt: old },
      { stateDigest: attemptLive, verifier:"fictif", nonce:"fictif", expiresAt: live },
    ] });
    // Ce test s'appuie sur la base éphémère de CI : les compteurs peuvent
    // inclure des états d'autres tests ; comparer l'existence par clé.
    const report = await inspectAuthState({ db, now });
    assert.equal(report.dryRun, true);
    assert.ok(report.oldSessions >= 1);
    assert.ok(report.expiredAttempts >= 1);
    assert.ok(await db.webSession.findUnique({ where: { tokenDigest: oldDigest } }));

    const applied = await pruneAuthState({ db, now });
    assert.equal(applied.dryRun, false);
    assert.ok(applied.oldSessions >= 1);
    assert.ok(applied.expiredAttempts >= 1);
    assert.equal(await db.webSession.findUnique({ where: { tokenDigest: oldDigest } }), null);
    assert.equal(await db.oidcLoginAttempt.findUnique({ where: { stateDigest: attemptOld } }), null);
    assert.ok(await db.webSession.findUnique({ where: { tokenDigest: liveDigest } }));
    assert.ok(await db.oidcLoginAttempt.findUnique({ where: { stateDigest: attemptLive } }));
  } finally {
    await db.oidcLoginAttempt.deleteMany({ where: { stateDigest: { in: [attemptOld, attemptLive] } } });
    await db.webSession.deleteMany({ where: { tokenDigest: { in: [oldDigest, liveDigest] } } });
    await db.userAccount.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
});
