import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL/HTTP : synthèse courte et continuité distinctes, historisées et réservées", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const referentId = randomUUID(), tnsId = randomUUID(), caseId = randomUUID();
  const reference = "ARTAG-BLOCS-FICTIFS-" + randomUUID(), origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org", generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  const synthese = {
    situationGlobale: "Situation fictive à vérifier", difficultesPrincipales: "",
    pointsAppui: "Contact prévu", sujetsTravailles: "Démarches de démonstration",
    etapeActuelle: "Entretien initial", vigilanceUtile: "",
  };
  const continuite = {
    situationEnCours: "Suivi fictif", prioriteImmediate: "Rappeler le partenaire fictif",
    dejaFait: "Échange initial", relaisAbsence: "", vigilanceUtile: "",
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: referentId, email: "brief-ref-" + referentId + "@example.org", role: "REFERENTE", enabled: true },
      { id: tnsId, email: "brief-tns-" + tnsId + "@example.org", role: "APPUI_TNS", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId, artagReference: reference, version: 1 } });
    await db.caseReferenceRevision.create({ data: {
      caseId, dossierVersion: 1, previousReference: null, artagReference: reference,
      actorId: referentId, reason: "Création fictive",
    } });
    // Une autorisation SHARED_WRITE pour les notes n'ouvre pas ces deux blocs.
    await db.caseAssignment.create({ data: { caseId, userId: tnsId, capability: "SHARED_WRITE", active: true } });
    const [refSession, tnsSession] = await Promise.all([
      issueSession({ db, userId: referentId }), issueSession({ db, userId: tnsId }),
    ]);
    server = createApp({ privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-historique-des-blocs-courts-plus-de-32" }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = "http://127.0.0.1:" + server.address().port;
    const headers = token => ({ Cookie: COOKIE_NAME + "=" + token });
    const getCsrf = async token => {
      const response = await fetch(base + "/auth/csrf", { headers: headers(token) });
      assert.equal(response.status, 200);
      return (await response.json()).token;
    };
    const [refCsrf, tnsCsrf] = await Promise.all([getCsrf(refSession.token), getCsrf(tnsSession.token)]);
    const path = type => "/api/dossiers/" + caseId + "/blocs-courts/" + type;
    const read = (type, token = refSession.token, query = "") =>
      fetch(base + path(type) + query, { headers: headers(token) });
    const write = (type, body, token = refSession.token, overrideHeaders = {}) =>
      fetch(base + path(type), {
        method: "PATCH", headers: {
          ...headers(token), Origin: origin, "Content-Type": "application/json",
          "X-CSRF-Token": token === tnsSession.token ? tnsCsrf : refCsrf, ...overrideHeaders,
        }, body: JSON.stringify(body),
      });

    const emptySynthese = await read("synthese-courte");
    assert.equal(emptySynthese.status, 200);
    assert.equal(emptySynthese.headers.get("cache-control"), "no-store");
    assert.equal((await emptySynthese.json()).briefVersion, 0);
    assert.equal((await (await read("note-continuite")).json()).briefVersion, 0);

    const first = await write("synthese-courte", {
      expectedVersion: 1, content: synthese, reason: "Première synthèse fictive",
    });
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { caseId, type: "synthese-courte", dossierVersion: 2 });
    assert.equal((await write("note-continuite", {
      expectedVersion: 1, content: continuite, reason: "Ancienne version",
    })).status, 409);
    assert.equal((await write("note-continuite", {
      expectedVersion: 2, content: continuite, reason: "Relais initial fictif",
    })).status, 200);

    const currentSynthese = await (await read("synthese-courte")).json();
    assert.equal(currentSynthese.dossierVersion, 3);
    assert.equal(currentSynthese.briefVersion, 2);
    assert.deepEqual(currentSynthese.content, synthese);
    assert.equal(currentSynthese.history.length, 1);
    assert.deepEqual(currentSynthese.history[0].previousContent, {
      situationGlobale: "", difficultesPrincipales: "", pointsAppui: "",
      sujetsTravailles: "", etapeActuelle: "", vigilanceUtile: "",
    });
    assert.equal(currentSynthese.history[0].actorId, referentId);
    const currentNote = await (await read("note-continuite")).json();
    assert.deepEqual(currentNote.content, continuite);
    assert.equal(currentNote.briefVersion, 3);
    assert.equal(currentNote.history.length, 1);
    assert.equal((await write("synthese-courte", {
      expectedVersion: 3, content: synthese, reason: "Sans changement",
    })).status, 422);

    const corrected = { ...continuite, dejaFait: "Échange et relance fictive" };
    const result = await Promise.all([
      write("note-continuite", { expectedVersion: 3, content: corrected, reason: "Correction A fictive" }),
      write("note-continuite", { expectedVersion: 3,
        content: { ...continuite, prioriteImmediate: "Autre action fictive" },
        reason: "Correction B fictive" }),
    ]);
    assert.deepEqual(result.map(response => response.status).sort(), [200, 409]);
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 4);
    assert.equal(await db.caseBriefRevision.count({ where: { caseId, kind: "NOTE_CONTINUITE" } }), 2);
    const history = await (await read("note-continuite")).json();
    assert.equal(history.briefVersion, 4);
    assert.equal(history.history.length, 2);
    assert.equal(history.history[0].dossierVersion, 4);
    assert.equal(history.history[0].previousContent.dejaFait, continuite.dejaFait);
    assert.equal((await (await read("note-continuite", refSession.token, "?beforeVersion=4")).json()).history.length, 1);

    assert.equal((await read("synthese-courte", tnsSession.token)).status, 404);
    assert.equal((await read("note-continuite", tnsSession.token)).status, 404);
    assert.equal((await write("note-continuite", {
      expectedVersion: 4, content: continuite, reason: "Interdit au TNS",
    }, tnsSession.token)).status, 404);
    assert.equal((await read("synthese-courte", "absent")).status, 404);
    assert.equal((await read("note-continuite", refSession.token, "?beforeVersion=0")).status, 422);
    assert.equal((await read("inconnu")).status, 422);
    assert.equal((await write("inconnu", {
      expectedVersion: 4, content: synthese, reason: "Test",
    })).status, 422);
    assert.equal((await write("synthese-courte", {
      expectedVersion: 4, content: { ...synthese, diagnostic: "interdit" }, reason: "Champ inattendu",
    })).status, 422);
    assert.equal((await write("synthese-courte", {
      expectedVersion: 4, content: synthese, reason: "Mauvais jeton",
    }, refSession.token, { "X-CSRF-Token": "invalide" })).status, 403);

    const audits = await db.auditEvent.findMany({ where: { caseId } });
    assert.ok(audits.some(row => row.eventType === "CASE_BRIEF_UPDATED"));
    assert.ok(audits.some(row => row.eventType === "CASE_BRIEF_READ"));
    assert.doesNotMatch(JSON.stringify(audits),
      /Situation fictive à vérifier|Rappeler le partenaire fictif|Correction A fictive/);

    await db.caseBrief.update({
      where: { caseId_kind: { caseId, kind: "SYNTHESE_COURTE" } },
      data: { content: { ...synthese, pointsAppui: "État fictivement corrompu" } },
    });
    const drift = await read("synthese-courte");
    assert.equal(drift.status, 409);
    assert.deepEqual(await drift.json(), { error: "HISTORIQUE_BLOC_COURT_INDISPONIBLE" });
    assert.equal((await write("synthese-courte", {
      expectedVersion: 4, content: synthese, reason: "État corrompu",
    })).status, 409);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.caseBriefRevision.deleteMany({ where: { caseId } });
    await db.caseBrief.deleteMany({ where: { caseId } });
    await db.caseAssignment.deleteMany({ where: { caseId } });
    await db.caseReferenceRevision.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [referentId, tnsId] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [referentId, tnsId] } } });
    await db.$disconnect();
  }
});
