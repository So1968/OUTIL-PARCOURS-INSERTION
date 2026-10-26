import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID, createHash } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, revokeSession, COOKIE_NAME } from "../src/sessions.js";

const integration = { skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1" };
const origin = "https://artag.example.org";
const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
  issuer: "https://idp.example.org", generateVerifier: () => "fictif",
  authorizationUrl: async () => "https://idp.example.org/authorize",
  verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
} };
async function withFixture(check) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient(), servers = [];
  const roles = ["REFERENTE", "REFERENTE", "APPUI_TNS", "ACCUEIL", "RELAIS_LOGEMENT", "DIRECTION", "GOUVERNANCE", "ADMIN_TECHNIQUE"];
  const users = roles.map(() => randomUUID()), tag = randomUUID();
  const reference = `ARTAG-CREATION-FICTIVE-${tag}`;
  const start = async (privateDb, overrides = {}) => {
    const server = createApp({ privateDb, oidc, enableSharedWrites: true,
      csrfSecret: "secret-de-recette-creation-fictive-plus-de-32-caracteres", ...overrides }).listen(0, "127.0.0.1");
    servers.push(server); await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  };
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: users.map((id, i) => ({
      id, email: `creation-fictive-${id}@example.org`, role: roles[i], enabled: true,
    })) });
    const tokens = await Promise.all(users.map(async userId => (await issueSession({ db, userId })).token));
    const headers = user => ({ Cookie: `${COOKIE_NAME}=${tokens[user]}` });
    const base = await start(db);
    const csrf = await Promise.all(users.map(async (_, i) => (await (await fetch(base + "/auth/csrf", { headers: headers(i) })).json()).token));
    const post = ({ user = 0, body = { requestId: randomUUID(), artagReference: reference }, server = base, extraHeaders = {}, query = "" } = {}) => fetch(server + "/api/dossiers" + query, {
      method: "POST", headers: { ...headers(user), Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf[user], ...extraHeaders },
      body: JSON.stringify(body),
    });
    const get = (path, user = 0) => fetch(base + path, { headers: headers(user) });
    const counts = async () => ({
      cases: await db.caseFile.count({ where: { referentId: { in: users } } }),
      requests: await db.caseCreationRequest.count({ where: { actorId: { in: users } } }),
      revisions: await db.caseReferenceRevision.count({ where: { actorId: { in: users } } }),
      audits: await db.auditEvent.count({ where: { actorId: { in: users } } }),
    });
    await check({ db, users, reference, start, base, headers, csrf, post, get, counts });
  } finally {
    for (const server of servers) await new Promise(resolve => server.close(resolve));
    const requests = await db.caseCreationRequest.findMany({ where: { actorId: { in: users } }, select: { caseId: true } });
    await db.caseCreationRequest.deleteMany({ where: { actorId: { in: users } } });
    await db.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    await db.caseFile.deleteMany({ where: { OR: [{ referentId: { in: users } }, { id: { in: requests.map(row => row.caseId) } }] } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}

test("PostgreSQL/HTTP : création atomique, historique initial et réessai après correction du numéro", integration, async () => {
  await withFixture(async ({ db, users, reference, post, get, base, headers, csrf }) => {
    const body = { requestId: randomUUID(), artagReference: reference };
    const response = await post({ body });
    assert.equal(response.status, 201); assert.equal(response.headers.get("cache-control"), "no-store");
    const result = await response.json();
    assert.deepEqual(Object.keys(result).sort(), ["artagReference", "caseId", "created", "dossierVersion", "requestId"]);
    assert.equal(result.requestId, body.requestId); assert.equal(result.artagReference, reference);
    assert.equal(result.created, true); assert.equal(result.dossierVersion, 1);
    const dossier = await db.caseFile.findUnique({ where: { id: result.caseId } });
    assert.equal(dossier.referentId, users[0]);
    const request = await db.caseCreationRequest.findUnique({ where: { caseId: result.caseId } });
    assert.equal(request.actorId, users[0]);
    assert.equal(request.referenceDigest, createHash("sha256").update(reference).digest("hex"));
    const history = await (await get(`/api/dossiers/${result.caseId}/reference-artag`)).json();
    assert.equal(history.history.length, 1); assert.equal(history.history[0].reason, "Création du dossier");
    assert.equal(history.history[0].previousReference, null); assert.equal(history.history[0].actorId, users[0]);
    const list = await (await get("/api/mes-dossiers")).json();
    assert.equal(list.cases[0].id, result.caseId); assert.equal(list.cases[0].canManageReference, true);
    assert.deepEqual((await (await get(`/api/dossiers/${result.caseId}/notes-partagees`)).json()).notes, []);
    const repeated = await post({ body });
    assert.equal(repeated.status, 200); assert.deepEqual(await repeated.json(), { ...result, created: false });
    const correction = await fetch(base + `/api/dossiers/${result.caseId}/reference-artag`, {
      method: "PATCH", headers: { ...headers(0), Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrf[0] },
      body: JSON.stringify({ expectedVersion: 1, artagReference: reference + "-C", reason: "Correction fictive après création" }),
    });
    assert.equal(correction.status, 200);
    const recovered = await post({ body: { ...body, requestId: body.requestId.toUpperCase() } });
    assert.equal(recovered.status, 200);
    assert.deepEqual(await recovered.json(), { ...result, created: false, artagReference: reference + "-C", dossierVersion: 2 });
    assert.equal(await db.caseCreationRequest.count({ where: { actorId: users[0] } }), 1);
    assert.equal(await db.caseReferenceRevision.count({ where: { caseId: result.caseId } }), 2);
    const audits = await db.auditEvent.findMany({ where: { caseId: result.caseId, eventType: "CASE_CREATED" } });
    assert.equal(audits.length, 1); assert.doesNotMatch(JSON.stringify(audits), /ARTAG-CREATION|referenceDigest|requestId/);
    // La demande immuable empêche une suppression silencieuse suivie d'une recréation.
    await assert.rejects(db.caseFile.delete({ where: { id: result.caseId } }), { code: "P2003" });
  });
});

test("PostgreSQL/HTTP : création réservée à la référente, CSRF, compte actif et corps strict", integration, async () => {
  await withFixture(async ({ db, users, reference, post, start, counts, headers, base, csrf }) => {
    const before = await counts();
    for (let user = 2; user < users.length; user++) assert.equal((await post({ user })).status, 404);
    for (const extraHeaders of [{ Origin: "https://autre.example.org" }, { "X-CSRF-Token": "invalide" }, { Cookie: "role=REFERENTE" }]) {
      assert.equal((await post({ extraHeaders })).status, 403);
    }
    for (const body of [{}, [], null, { requestId: randomUUID(), artagReference: reference, referentId: users[1] },
      { requestId: randomUUID(), artagReference: reference, role: "REFERENTE" },
      { requestId: "../autre", artagReference: reference }, { requestId: randomUUID(), artagReference: null }]) {
      assert.equal((await post({ body })).status, 422);
    }
    assert.equal((await post({ query: "?actorId=fictif" })).status, 422);
    const disabled = await start(db, { enableSharedWrites: false });
    assert.equal((await post({ server: disabled })).status, 503);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: false } });
    assert.equal((await post()).status, 404);
    await db.userAccount.update({ where: { id: users[0] }, data: { enabled: true } });
    await db.webSession.updateMany({ where: { userId: users[0] }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await post()).status, 404);
    assert.equal((await fetch(base + "/auth/csrf", { headers: headers(0) })).status, 401);
    assert.equal(typeof csrf[0], "string");
    assert.deepEqual(await counts(), before);
  });
});

test("PostgreSQL/HTTP : créations concurrentes sans doublon de dossier, de demande ou d'historique", integration, async () => {
  await withFixture(async ({ db, users, reference, post }) => {
    const input = { requestId: randomUUID(), artagReference: reference };
    const same = await Promise.all([post({ body: input }), post({ body: input })]);
    assert.equal(same.filter(response => response.status === 201).length, 1);
    assert.ok(same.every(response => [200, 201, 409].includes(response.status)));
    // Un conflit sérialisable peut aussi toucher la lecture de rapprochement.
    // Le réessai explicite garde la clé, sans nouvelle création.
    const confirmed = [];
    for (const response of same) {
      if (response.status === 409) {
        const retry = await post({ body: input }); assert.equal(retry.status, 200); confirmed.push(retry);
      } else confirmed.push(response);
    }
    const sameBodies = await Promise.all(confirmed.map(response => response.json()));
    assert.equal(sameBodies[0].caseId, sameBodies[1].caseId);
    const changedKey = randomUUID();
    const differentPayloads = await Promise.all([0, 1].map(i => post({ body: {
      requestId: changedKey, artagReference: `${reference}-D${i}`,
    } })));
    assert.deepEqual(differentPayloads.map(response => response.status).sort(), [201, 409]);
    const collision = await Promise.all([0, 1].map(user => post({ user, body: {
      requestId: randomUUID(), artagReference: reference + "-UNIQUE",
    } })));
    assert.deepEqual(collision.map(response => response.status).sort(), [201, 409]);
    const conflict = collision.find(response => response.status === 409);
    assert.deepEqual(await conflict.json(), { error: "CREATION_DOSSIER_EN_CONFLIT" });
    // Une même clé peut être utilisée par deux comptes sans partager leurs résultats.
    const scopedKey = randomUUID();
    const scoped = [];
    for (const user of [0, 1]) scoped.push(await post({ user, body: {
      requestId: scopedKey, artagReference: `${reference}-COMPTE${user}`,
    } }));
    assert.ok(scoped.every(response => response.status === 201));
    const scopedBodies = await Promise.all(scoped.map(response => response.json()));
    assert.notEqual(scopedBodies[0].caseId, scopedBodies[1].caseId);
    assert.equal(await db.caseCreationRequest.count({ where: { actorId: { in: users } } }), 5);
    assert.equal(await db.caseFile.count({ where: { referentId: { in: users } } }), 5);
    assert.equal(await db.caseReferenceRevision.count({ where: { actorId: { in: users } } }), 5);
    assert.equal(await db.auditEvent.count({ where: { actorId: { in: users }, eventType: "CASE_CREATED" } }), 5);
  });
});

test("PostgreSQL/HTTP : toute panne de demande, révision ou audit annule la création entière", integration, async () => {
  await withFixture(async ({ db, users, reference, start, post, counts }) => {
    const before = await counts();
    for (const model of ["caseCreationRequest", "caseReferenceRevision", "auditEvent"]) {
      const broken = new Proxy(db, { get(target, key) {
        if (key !== "$transaction") return target[key];
        return (operation, options) => target.$transaction(tx => operation(new Proxy(tx, { get(transaction, field) {
          if (field !== model) return transaction[field];
          return new Proxy(transaction[field], { get(delegate, method) {
            return method === "create" ? async () => { throw new Error("PANNE_CREATION_FICTIVE"); } : delegate[method];
          } });
        } })), options);
      } });
      const server = await start(broken);
      const failed = await post({ server });
      assert.equal(failed.status, 503); assert.deepEqual(await failed.json(), { error: "SERVICE_INDISPONIBLE" });
      assert.deepEqual(await counts(), before);
    }
    const body = { requestId: randomUUID(), artagReference: reference };
    assert.equal((await post({ body })).status, 201);
    const replay = await post({ body }); assert.equal(replay.status, 200);
    assert.equal(await db.caseFile.count({ where: { referentId: users[0] } }), 1);
  });
});

test("PostgreSQL/HTTP : une clé connue ne réouvre pas une archive, une réaffectation ou une session révoquée", integration, async () => {
  await withFixture(async ({ db, users, reference, post, headers }) => {
    const body = { requestId: randomUUID(), artagReference: reference };
    // Cette recette part d'une clé réellement connue. La création et ses conflits
    // sont testés plus haut ; ne pas confondre une réponse 409 avec un dossier créé.
    const first = { caseId: randomUUID() };
    await db.$transaction([
      db.caseFile.create({ data: { id: first.caseId, referentId: users[0], artagReference: reference, version: 1 } }),
      db.caseCreationRequest.create({ data: { actorId: users[0], requestId: body.requestId, caseId: first.caseId,
        referenceDigest: createHash("sha256").update(reference).digest("hex") } }),
      db.caseReferenceRevision.create({ data: { caseId: first.caseId, dossierVersion: 1, previousReference: null,
        artagReference: reference, actorId: users[0], reason: "Création du dossier" } }),
      db.auditEvent.create({ data: { caseId: first.caseId, actorId: users[0], eventType: "CASE_CREATED",
        purpose: "Création d'un dossier identifié par sa référente titulaire" } }),
    ]);
    const known = await post({ body });
    assert.equal(known.status, 200); assert.equal((await known.json()).caseId, first.caseId);
    assert.equal((await post({ body: { ...body, artagReference: reference + "-AUTRE" } })).status, 409);
    await db.caseFile.update({ where: { id: first.caseId }, data: { archivedAt: new Date() } });
    assert.equal((await post({ body })).status, 404);
    await db.caseFile.update({ where: { id: first.caseId }, data: { archivedAt: null, referentId: users[1] } });
    assert.equal((await post({ body })).status, 404);
    await db.caseFile.update({ where: { id: first.caseId }, data: { referentId: users[0], artagReference: reference + "-HORS-SERVICE" } });
    assert.equal((await post({ body })).status, 409);
    assert.equal(await db.caseCreationRequest.count({ where: { actorId: users[0] } }), 1);
    await revokeSession({ db, cookieHeader: headers(0).Cookie });
    assert.equal((await post({ body })).status, 404);
  });
});
