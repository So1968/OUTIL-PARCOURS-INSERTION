import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, revokeSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL/HTTP : saisie express privée, clé anti-doublon, CSRF, correction et annulation", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const a = randomUUID(), b = randomUUID(), direction = randomUUID();
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
      { id: a, email: "evt-a-" + a + "@example.org", role: "APPUI_TNS", enabled: true },
      { id: b, email: "evt-b-" + b + "@example.org", role: "REFERENTE", enabled: true },
      { id: direction, email: "evt-d-" + direction + "@example.org", role: "DIRECTION", enabled: true },
    ] });
    const [tA, tB, tD] = await Promise.all([
      issueSession({ db, userId: a }),
      issueSession({ db, userId: b }),
      issueSession({ db, userId: direction }),
    ]);
    server = createApp({
      privateDb: db, oidc, enableWorkTasks: true,
      csrfSecret: "secret-fictif-uniquement-recette-32-caracteres",
      clock: () => new Date("2026-10-23T09:00:00Z"),
    }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const url = "http://127.0.0.1:" + server.address().port;
    const endpoint = url + "/api/mes-evenements";
    const cookie = token => COOKIE_NAME + "=" + token;
    const csrf = async token => {
      const response = await fetch(url + "/auth/csrf", {
        headers: { Cookie: cookie(token) },
      });
      assert.equal(response.status, 200);
      return (await response.json()).token;
    };
    const cA = await csrf(tA.token), cB = await csrf(tB.token), cD = await csrf(tD.token);
    const write = (target, token, csrfToken, method, payload, clientOrigin = origin) =>
      fetch(target, {
        method,
        headers: {
          Cookie: cookie(token), Origin: clientOrigin, "X-CSRF-Token": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    const input = {
      requestId: randomUUID(), day: "2026-10-23",
      kind: "IMPREVU", state: "EFFECTUE", minutes: 15,
    };

    assert.equal((await fetch(endpoint)).status, 404);
    assert.equal((await fetch(endpoint, { headers: { "X-Role": "APPUI_TNS" } })).status, 404);
    assert.equal((await write(endpoint, tA.token, "a".repeat(64), "POST", input)).status, 403);
    assert.equal((await write(endpoint, tA.token, cA, "POST", input,
      "https://attaquant.example.org")).status, 403);
    assert.equal((await write(endpoint, tD.token, cD, "POST", input)).status, 404);
    assert.equal((await write(endpoint, tA.token, cA, "POST", {
      ...input, beneficiaryName: "DONNEE_INTERDITE",
    })).status, 422);
    assert.equal((await write(endpoint, tA.token, cA, "POST", {
      ...input, minutes: 0,
    })).status, 422);
    assert.equal((await write(endpoint, tA.token, cA, "POST", {
      ...input, day: "2026-02-30",
    })).status, 422);

    const firstResponse = await write(endpoint, tA.token, cA, "POST", input);
    assert.equal(firstResponse.status, 201);
    const first = await firstResponse.json();
    assert.deepEqual(Object.keys(first).sort(),
      ["day", "id", "kind", "minutes", "state", "updatedAt", "version"]);
    assert.equal(first.day, "2026-10-23");
    assert.equal(first.version, 0);
    assert.equal(first.minutes, 15);

    const replay = await write(endpoint, tA.token, cA, "POST", input);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).id, first.id);
    assert.equal((await db.workEvent.count({ where: { ownerId: a } })), 1);
    assert.equal((await write(endpoint, tA.token, cA, "POST", {
      ...input, minutes: 120,
    })).status, 409);
    const otherOwn = await write(endpoint, tB.token, cB, "POST", input);
    assert.equal(otherOwn.status, 201);
    const second = await otherOwn.json();

    const aList = await fetch(endpoint + "?day=2026-10-23&offset=0", {
      headers: { Cookie: cookie(tA.token) },
    });
    assert.equal(aList.status, 200);
    assert.equal(aList.headers.get("cache-control"), "no-store");
    const dayEvents = await aList.json();
    assert.equal(dayEvents.day, "2026-10-23");
    assert.deepEqual(dayEvents.events.map(e => e.id), [first.id]);
    assert.equal(dayEvents.nextOffset, null);
    assert.equal((await fetch(endpoint + "?day=2026-10-23", {
      headers: { Cookie: cookie(tB.token) },
    }).then(r => r.json())).events[0].id, second.id);
    assert.equal((await fetch(endpoint, {
      headers: { Cookie: cookie(tD.token) },
    })).status, 404);
    assert.equal((await fetch(endpoint + "?day=2026-02-30", {
      headers: { Cookie: cookie(tA.token) },
    })).status, 422);

    const update = endpoint + "/" + first.id;
    assert.equal((await write(update, tB.token, cB, "PATCH", {
      expectedVersion: 0, changes: { minutes: 60 },
    })).status, 404);
    assert.equal((await write(update, tA.token, cA, "PATCH", {
      expectedVersion: 0, changes: { minutes: 25 },
    })).status, 200);
    assert.equal((await write(update, tA.token, cA, "PATCH", {
      expectedVersion: 0, changes: { state: "ANNULE" },
    })).status, 409);
    assert.equal((await write(update, tA.token, cA, "PATCH", {
      expectedVersion: 1, changes: { state: "ANNULE" },
    })).status, 200);
    assert.equal((await write(update, tA.token, cA, "PATCH", {
      expectedVersion: 2, changes: { state: "PREVU" },
    })).status, 409);
    assert.equal((await db.workEvent.findUnique({ where: { id: first.id } })).state, "ANNULE");

    const audits = await db.auditEvent.findMany({
      where: { actorId: a, eventType: { startsWith: "WORK_EVENT_" } },
    });
    assert.equal(audits.length, 5);
    assert.ok(audits.every(e => !JSON.stringify(e).includes("DONNEE_INTERDITE")));
    await revokeSession({ db, cookieHeader: cookie(tA.token) });
    assert.equal((await fetch(endpoint, { headers: { Cookie: cookie(tA.token) } })).status, 404);
    assert.equal((await write(endpoint, tA.token, cA, "POST", {
      ...input, requestId: randomUUID(),
    })).status, 404);
  } finally {
    if (server) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await db.workEvent.deleteMany({ where: { ownerId: { in: [a, b, direction] } } });
    await db.auditEvent.deleteMany({ where: { actorId: { in: [a, b, direction] } } });
    await db.webSession.deleteMany({ where: { userId: { in: [a, b, direction] } } });
    await db.userAccount.deleteMany({ where: { id: { in: [a, b, direction] } } });
    await db.$disconnect();
  }
});
