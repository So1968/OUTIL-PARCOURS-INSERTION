import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { issueSession, COOKIE_NAME, resolveSessionUserId } from "../src/sessions.js";
import { disableAccountAndRevokeSessions, AccountLifecycleDenied } from "../src/accountLifecycleService.js";

test("PostgreSQL : désactivation et révocation atomiques, acteur serveur vérifié", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const adminId = randomUUID(), targetId = randomUUID(), refId = randomUUID();
  const idSet = [adminId, targetId, refId];
  try {
    await db.userAccount.createMany({ data: [
      { id: adminId, email: `admin-${adminId}@example.org`, role: "ADMIN_TECHNIQUE", enabled: true },
      { id: targetId, email: `target-${targetId}@example.org`, role: "APPUI_TNS", enabled: true },
      { id: refId, email: `ref-${refId}@example.org`, role: "REFERENTE", enabled: true },
    ] });
    const { token: adminToken } = await issueSession({ db, userId: adminId });
    const { token: targetToken } = await issueSession({ db, userId: targetId });
    const { token: anotherToken } = await issueSession({ db, userId: targetId });
    const { token: refToken } = await issueSession({ db, userId: refId });
    const cookie = token => `${COOKIE_NAME}=${token}`;
    assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie(targetToken) }), targetId);

    await assert.rejects(disableAccountAndRevokeSessions({
      db, administratorCookie: cookie(refToken), targetUserId: targetId,
      approvalReference: "APPROVAL-TEST-1",
    }), AccountLifecycleDenied);
    await assert.rejects(disableAccountAndRevokeSessions({
      db, administratorCookie: cookie(adminToken), targetUserId: targetId,
      approvalReference: "",
    }), AccountLifecycleDenied);
    assert.equal((await db.userAccount.findUnique({ where: { id: targetId } })).enabled, true);

    const result = await disableAccountAndRevokeSessions({
      db, administratorCookie: cookie(adminToken), targetUserId: targetId,
      approvalReference: "APPROVAL-TEST-1",
    });
    assert.deepEqual(result, { disabled: true, revokedSessions: 2 });
    assert.equal((await db.userAccount.findUnique({ where: { id: targetId } })).enabled, false);
    assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie(targetToken) }), null);
    assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie(anotherToken) }), null);
    assert.equal((await db.webSession.count({ where: { userId: targetId, revokedAt: null } })), 0);
    assert.equal((await db.webSession.count({ where: { userId: adminId, revokedAt: null } })), 1);
    const events = await db.auditEvent.findMany({
      where: { actorId: adminId, eventType: "ACCOUNT_DISABLED_SESSIONS_REVOKED" },
    });
    assert.equal(events.length, 1);
    assert.ok(!JSON.stringify(events).includes(targetId));
    await assert.rejects(disableAccountAndRevokeSessions({
      db, administratorCookie: cookie(adminToken), targetUserId: targetId,
      approvalReference: "APPROVAL-TEST-1",
    }), AccountLifecycleDenied);
  } finally {
    await db.auditEvent.deleteMany({ where: { actorId: { in: idSet } } });
    await db.webSession.deleteMany({ where: { userId: { in: idSet } } });
    await db.userAccount.deleteMany({ where: { id: { in: idSet } } });
    await db.$disconnect();
  }
});
