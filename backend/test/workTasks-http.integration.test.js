import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { COOKIE_NAME, issueSession, revokeSession, resolveSessionUserId } from "../src/sessions.js";
import { listOwnTasks } from "../src/workTaskService.js";

test("PostgreSQL + HTTP : tâches personnelles isolées, CSRF, versions et audit", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ref = randomUUID(), tns = randomUUID(), direction = randomUUID();
  const origin = "https://artag.example.org";
  const oidc = {
    origin, redirectUri: origin + "/auth/callback",
    provider: {
      issuer: "https://idp.example.org",
      generateVerifier: () => "demo",
      authorizationUrl: async () => "https://idp.example.org/authorize",
      verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "demo" }),
    },
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: ref, email: `work-ref-${ref}@example.org`, role: "REFERENTE", enabled: true },
      { id: tns, email: `work-tns-${tns}@example.org`, role: "APPUI_TNS", enabled: true },
      { id: direction, email: `work-dir-${direction}@example.org`, role: "DIRECTION", enabled: true },
    ] });
    const [{ token: refToken }, { token: tnsToken }, { token: dirToken }] = await Promise.all([
      issueSession({ db, userId: ref }),
      issueSession({ db, userId: tns }),
      issueSession({ db, userId: direction }),
    ]);
    server = createApp({
      privateDb: db, oidc, enableWorkTasks: true,
      csrfSecret: "secret-pour-tests-de-recette-uniquement-32-caracteres",
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const path = base + "/api/mes-taches";
    const cookie = token => `${COOKIE_NAME}=${token}`;
    const getToken = async token => {
      const response = await fetch(base + "/auth/csrf", {
        headers: { Cookie: cookie(token) },
      });
      assert.equal(response.status, 200);
      return (await response.json()).token;
    };
    const csrfRef = await getToken(refToken);
    const csrfTns = await getToken(tnsToken);
    const csrfDir = await getToken(dirToken);
    // Test diagnostique non nominatif : session, délégué Prisma et rôle serveur.
    assert.equal(await resolveSessionUserId({ db, cookieHeader: cookie(refToken) }), ref);
    assert.equal(typeof db.workTask.findMany, "function");
    assert.deepEqual(await db.userAccount.findUnique({
      where: { id: ref }, select: { role: true, enabled: true },
    }), { role: "REFERENTE", enabled: true });
    assert.deepEqual((await listOwnTasks({ db, cookieHeader: cookie(refToken) })).tasks, []);
    const body = { title: "Relancer un partenaire fictif", dueDate: "2026-11-13",
      reminderDaysBefore: 2, estimatedMinutes: 20, status: "A_FAIRE" };
    const write = (url, token, csrf, method, data, reqOrigin = origin) => fetch(url, {
      method, headers: {
        Cookie: cookie(token), Origin: reqOrigin, "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      }, body: JSON.stringify(data),
    });

    assert.equal((await fetch(path)).status, 404);
    assert.equal((await fetch(path, { headers: { "X-Role": "REFERENTE" } })).status, 404);
    assert.equal((await write(path, refToken, "a".repeat(64), "POST", body)).status, 403);
    assert.equal((await write(path, refToken, csrfRef, "POST", body,
      "https://attaque.example.org")).status, 403);
    assert.equal((await write(path, dirToken, csrfDir, "POST", body)).status, 404);
    assert.equal((await write(path, refToken, csrfRef, "POST", {
      ...body, ownerId: tns,
    })).status, 422);
    assert.equal((await write(path, refToken, csrfRef, "POST", {
      ...body, dueDate: "2026-02-30",
    })).status, 422);

    const response = await write(path, refToken, csrfRef, "POST", body);
    assert.equal(response.status, 201);
    const first = await response.json();
    assert.deepEqual(Object.keys(first).sort(),
      ["dueDate", "estimatedMinutes", "id", "reminderDaysBefore", "status", "title", "updatedAt", "version"]);
    assert.equal(first.version, 0);
    assert.equal(first.dueDate, "2026-11-13");
    assert.equal(first.title, body.title);
    assert.equal(Object.hasOwn(first, "ownerId"), false);

    const refList = await fetch(path, { headers: { Cookie: cookie(refToken) } });
    assert.equal(refList.status, 200);
    assert.equal(refList.headers.get("cache-control"), "no-store");
    assert.deepEqual((await refList.json()).tasks.map(t => t.id), [first.id]);
    assert.equal((await fetch(path, { headers: { Cookie: cookie(tnsToken) } }).then(r => r.json())).tasks.length, 0);
    assert.equal((await fetch(path, { headers: { Cookie: cookie(dirToken) } })).status, 404);
    assert.equal((await fetch(path + "?offset=notanumber", {
      headers: { Cookie: cookie(refToken) },
    })).status, 422);

    const updateUrl = path + "/" + first.id;
    assert.equal((await write(updateUrl, tnsToken, csrfTns, "PATCH", {
      expectedVersion: 0, changes: { status: "FAIT" },
    })).status, 404);
    assert.equal((await write(updateUrl, refToken, csrfRef, "PATCH", {
      expectedVersion: 0, changes: { status: "INCONNU" },
    })).status, 422);
    assert.equal((await write(updateUrl, refToken, csrfRef, "PATCH", {
      expectedVersion: 0, changes: { status: "FAIT" },
    })).status, 200);
    assert.equal((await write(updateUrl, refToken, csrfRef, "PATCH", {
      expectedVersion: 0, changes: { status: "A_FAIRE" },
    })).status, 409);
    const final = await db.workTask.findUnique({ where: { id: first.id } });
    assert.equal(final.status, "FAIT");
    assert.equal(final.version, 1);
    assert.equal(final.ownerId, ref);

    const events = await db.auditEvent.findMany({ where: {
      actorId: ref,
      eventType: { in: ["WORK_TASK_CREATED", "WORK_TASK_UPDATED", "WORK_TASK_LIST_READ"] },
    } });
    assert.equal(events.length, 3);
    assert.ok(events.every(e => e.caseId === null && !e.purpose.includes(body.title)));

    await revokeSession({ db, cookieHeader: cookie(refToken) });
    assert.equal((await fetch(path, { headers: { Cookie: cookie(refToken) } })).status, 404);
    assert.equal((await write(path, refToken, csrfRef, "POST", body)).status, 404);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.workTask.deleteMany({ where: { ownerId: { in: [ref, tns, direction] } } });
    await db.auditEvent.deleteMany({ where: { actorId: { in: [ref, tns, direction] } } });
    await db.webSession.deleteMany({ where: { userId: { in: [ref, tns, direction] } } });
    await db.userAccount.deleteMany({ where: { id: { in: [ref, tns, direction] } } });
    await db.$disconnect();
  }
});
