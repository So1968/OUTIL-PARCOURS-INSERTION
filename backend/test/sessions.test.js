import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { issueSession, resolveSessionUserId, revokeSession, COOKIE_NAME, digestToken, cookieToken, sessionCookie } from "../src/sessions.js";

const userId = randomUUID();
const now = new Date("2026-10-22T12:00:00Z");
function fixture(enabled = true) {
  const entries = new Map();
  const db = {
    $transaction: async fn => fn({
      userAccount: { findUnique: async () => ({ enabled }) },
      webSession: { create: async ({ data }) => entries.set(data.tokenDigest, { ...data, revokedAt: null }) },
    }),
    webSession: {
      findUnique: async ({ where }) => {
        const value = entries.get(where.tokenDigest);
        return value ? { ...value, user: { enabled } } : null;
      },
      updateMany: async ({ where, data }) => {
        const record = entries.get(where.tokenDigest);
        if (!record || record.revokedAt) return { count: 0 };
        Object.assign(record, data);
        return { count: 1 };
      },
    },
  };
  return { db, entries };
}

test("opaque, haché, httpOnly, expiration et révocation", async () => {
  const { db, entries } = fixture();
  const { token, expiresAt } = await issueSession({ db, userId, now });
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(entries.has(token), false);
  assert.equal(entries.has(digestToken(token)), true);
  assert.match(sessionCookie(token), /Path=\/; Secure; HttpOnly; SameSite=Lax/);
  const cookie = `${COOKIE_NAME}=${token}`;
  assert.equal(cookieToken(cookie), token);
  assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie, now }), userId);
  assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie, now: expiresAt }), null);
  assert.equal(await revokeSession({ db, cookieHeader: cookie, now }), true);
  assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie, now }), null);
});

test("les cookies dupliqués, faux rôles et comptes inactifs sont refusés", async () => {
  const token = "a".repeat(64);
  assert.equal(cookieToken(`${COOKIE_NAME}=${token}; ${COOKIE_NAME}=${token}`), null);
  assert.equal(cookieToken("role=REFERENTE"), null);
  assert.equal(digestToken("admin=true"), null);
  assert.equal(await resolveSessionUserId({ db: fixture().db, cookieHeader: "" }), null);
  await assert.rejects(issueSession({ db: fixture(false).db, userId }), /SESSION_REFUSEE/);
});
