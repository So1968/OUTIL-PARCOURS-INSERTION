import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL/HTTP : socle autonomie versionné, accès restreint et audit sans réponses", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const referentId = randomUUID(), tnsId = randomUUID(), caseId = randomUUID();
  const reference = "ARTAG-AUTONOMIE-FICTIVE-" + randomUUID();
  const origin = "https://artag.example.org";
  const oidc = {
    origin, redirectUri: origin + "/auth/callback",
    provider: { issuer: "https://idp.example.org",
      generateVerifier: () => "fictif",
      authorizationUrl: async () => "https://idp.example.org/authorize",
      verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }) },
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: referentId, email: "autonomie-ref-" + referentId + "@example.org", role: "REFERENTE", enabled: true },
      { id: tnsId, email: "autonomie-tns-" + tnsId + "@example.org", role: "APPUI_TNS", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId, artagReference: reference, version: 1 } });
    await db.caseReferenceRevision.create({ data: {
      caseId, dossierVersion: 1, previousReference: null,
      artagReference: reference, actorId: referentId, reason: "Recette initiale",
    } });
    await db.caseAssignment.create({ data: { caseId, userId: tnsId, capability: "SHARED_WRITE", active: true } });
    const [refSession, tnsSession] = await Promise.all([
      issueSession({ db, userId: referentId }), issueSession({ db, userId: tnsId }),
    ]);
    server = createApp({ privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-socle-autonomie-plus-de-32-caracteres" }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = "http://127.0.0.1:" + server.address().port;
    const cookie = token => ({ Cookie: COOKIE_NAME + "=" + token });
    const path = "/api/dossiers/" + caseId + "/socle-autonomie";
    const csrfResponse = await fetch(base + "/auth/csrf", { headers: cookie(refSession.token) });
    assert.equal(csrfResponse.status, 200);
    const csrf = (await csrfResponse.json()).token;
    const read = (token = refSession.token, suffix = "") => fetch(base + path + suffix, { headers: cookie(token) });
    const write = (body, token = refSession.token, extraHeaders = {}) => fetch(base + path, {
      method: "PATCH", headers: {
        ...cookie(token), Origin: origin, "Content-Type": "application/json",
        "X-CSRF-Token": csrf, ...extraHeaders,
      }, body: JSON.stringify(body),
    });

    const emptyResponse = await read();
    assert.equal(emptyResponse.status, 200);
    assert.equal(emptyResponse.headers.get("cache-control"), "no-store");
    const empty = await emptyResponse.json();
    assert.deepEqual(empty.reponses, {});
    assert.equal(empty.questions.length, 8);
    assert.equal(empty.dossierVersion, 1);
    assert.deepEqual(empty.history, []);

    const first = { demarches: { reponse: "Avec un peu d’aide", note: "Fait fictif : besoin d’appui", valide: true } };
    const save = await write({ expectedVersion: 1, reponses: first, reason: "Première saisie fictive" });
    assert.equal(save.status, 200);
    assert.deepEqual(await save.json(), { caseId, dossierVersion: 2 });

    const changed = { ...first, budget: { reponse: "Ça va", note: "", valide: true } };
    assert.equal((await write({ expectedVersion: 1, reponses: changed, reason: "Ancienne version fictive" })).status, 409);
    assert.equal((await write({ expectedVersion: 2, reponses: changed, reason: "Deuxième saisie fictive" })).status, 200);
    const current = await (await read()).json();
    assert.deepEqual(current.reponses, changed);
    assert.equal(current.dossierVersion, 3);
    assert.equal(current.autonomyVersion, 3);
    assert.equal(current.history.length, 2);
    assert.deepEqual(current.history[0].previousReponses, first);
    assert.deepEqual(current.history[0].reponses, changed);
    assert.equal(current.history[0].actorId, referentId);
    assert.equal((await read(tnsSession.token)).status, 404);
    assert.equal((await write({ expectedVersion: 3, reponses: first, reason: "TNS fictif" }, tnsSession.token)).status, 404);
    assert.equal((await read("sans-session")).status, 404);
    assert.equal((await write({ expectedVersion: 3, reponses: first, reason: "CSRF refusé" },
      refSession.token, { "X-CSRF-Token": "faux" })).status, 403);
    assert.equal((await write({ expectedVersion: 3, reponses: { demarches: { reponse: "5/5", note: "", valide: true } },
      reason: "Score interdit" })).status, 422);
    assert.equal((await read(refSession.token, "?beforeVersion=0")).status, 422);
    const old = await (await read(refSession.token, "?beforeVersion=3")).json();
    assert.deepEqual(old.history.map(row => row.dossierVersion), [2]);

    const revisions = await db.caseAutonomyRevision.findMany({ where: { caseId } });
    assert.equal(revisions.length, 2);
    const audits = await db.auditEvent.findMany({ where: { caseId } });
    assert.ok(audits.some(entry => entry.eventType === "CASE_AUTONOMY_UPDATED"));
    assert.ok(audits.some(entry => entry.eventType === "CASE_AUTONOMY_READ"));
    assert.doesNotMatch(JSON.stringify(audits), /Fait fictif|besoin d’appui|Première saisie fictive/);
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 3);

    await db.caseAutonomy.update({ where: { caseId }, data: { reponses: {} } });
    const drift = await read();
    assert.equal(drift.status, 409);
    assert.deepEqual(await drift.json(), { error: "HISTORIQUE_AUTONOMIE_INDISPONIBLE" });
    assert.equal((await write({ expectedVersion: 3, reponses: first, reason: "État invalide" })).status, 409);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.caseAutonomyRevision.deleteMany({ where: { caseId } });
    await db.caseAutonomy.deleteMany({ where: { caseId } });
    await db.caseAssignment.deleteMany({ where: { caseId } });
    await db.caseReferenceRevision.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [referentId, tnsId] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [referentId, tnsId] } } });
    await db.$disconnect();
  }
});
