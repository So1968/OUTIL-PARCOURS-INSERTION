import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL/HTTP : réflexion professionnelle réservée à l'autrice, historisée et non transférée", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const firstId = randomUUID(), nextId = randomUUID(), tnsId = randomUUID();
  const caseId = randomUUID(), reference = "ARTAG-REFLEXION-FICTIVE-" + randomUUID();
  const origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org", generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  const blank = {
    entreeRelation: "", expressionDemande: "", receptionAideProposee: "",
    possibiliteCoConstruction: "", rapportCadre: "", postureProfessionnelleAPrivilegier: "",
  };
  const contentA = {
    ...blank, entreeRelation: "Observation de relation fictive A",
    postureProfessionnelleAPrivilegier: "Clarifier le cadre de l'échange fictif",
  };
  const contentB = {
    ...blank, expressionDemande: "Autre formulation professionnelle fictive B",
  };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: firstId, email: "prof-a-" + firstId + "@example.org", role: "REFERENTE", enabled: true },
      { id: nextId, email: "prof-b-" + nextId + "@example.org", role: "REFERENTE", enabled: true },
      { id: tnsId, email: "prof-tns-" + tnsId + "@example.org", role: "APPUI_TNS", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId: firstId, artagReference: reference, version: 1 } });
    await db.caseReferenceRevision.create({ data: {
      caseId, dossierVersion: 1, previousReference: null, artagReference: reference,
      actorId: firstId, reason: "Référence de recette",
    } });
    // Une délégation de notes partagées ne doit rien révéler du bloc réservé.
    await db.caseAssignment.create({ data: {
      caseId, userId: tnsId, capability: "SHARED_WRITE", active: true,
    } });
    const sessionA = await issueSession({ db, userId: firstId });
    const sessionB = await issueSession({ db, userId: nextId });
    const sessionTns = await issueSession({ db, userId: tnsId });
    server = createApp({ privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "secret-fictif-reflexion-reservee-avec-protection-csrf" }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const root = "http://127.0.0.1:" + server.address().port;
    const path = "/api/dossiers/" + caseId + "/reflexion-professionnelle";
    const headers = token => ({ Cookie: COOKIE_NAME + "=" + token });
    const csrf = async token => {
      const response = await fetch(root + "/auth/csrf", { headers: headers(token) });
      assert.equal(response.status, 200);
      return (await response.json()).token;
    };
    const csrfA = await csrf(sessionA.token), csrfB = await csrf(sessionB.token);
    const csrfTns = await csrf(sessionTns.token);
    const read = (token, query = "") => fetch(root + path + query, { headers: headers(token) });
    const write = (token, csrfValue, data) => fetch(root + path, { method: "PATCH",
      headers: { ...headers(token), Origin: origin, "X-CSRF-Token": csrfValue, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const initial = await read(sessionA.token);
    assert.equal(initial.status, 200);
    assert.equal(initial.headers.get("cache-control"), "no-store");
    assert.deepEqual((await initial.json()).content, blank);
    assert.equal((await read(sessionB.token)).status, 404);
    assert.equal((await read(sessionTns.token)).status, 404);
    assert.equal((await read("absent")).status, 404);
    assert.equal((await write(sessionTns.token, csrfTns, {
      expectedVersion: 1, content: contentB, reason: "Interdit au TNS",
    })).status, 404);
    assert.equal((await write(sessionA.token, "invalide", {
      expectedVersion: 1, content: contentA, reason: "Refus CSRF",
    })).status, 403);
    assert.equal((await write(sessionA.token, csrfA, {
      expectedVersion: 1, content: { ...contentA, interpretation: "interdit" }, reason: "Champ en trop",
    })).status, 422);

    const created = await write(sessionA.token, csrfA, {
      expectedVersion: 1, content: contentA, reason: "Premier constat fictif",
    });
    assert.equal(created.status, 200);
    assert.deepEqual(await created.json(), { caseId, dossierVersion: 2 });
    const firstView = await (await read(sessionA.token)).json();
    assert.deepEqual(firstView.content, contentA);
    assert.equal(firstView.reflectionVersion, 2);
    assert.equal(firstView.history.length, 1);
    assert.deepEqual(firstView.history[0].previousContent, blank);
    assert.equal(firstView.history[0].actorId, firstId);

    assert.equal((await write(sessionA.token, csrfA, {
      expectedVersion: 2, content: contentA, reason: "Sans changement",
    })).status, 422);
    assert.equal((await write(sessionA.token, csrfA, {
      expectedVersion: 1, content: contentB, reason: "Ancienne version",
    })).status, 409);

    const updatedA = { ...contentA, rapportCadre: "Cadre professionnel clarifié, recette fictive" };
    const competing = await Promise.all([
      write(sessionA.token, csrfA, {
        expectedVersion: 2, content: updatedA, reason: "Correction A",
      }),
      write(sessionA.token, csrfA, {
        expectedVersion: 2, content: { ...contentA, rapportCadre: "Autre rédaction fictive" },
        reason: "Correction concurrente",
      }),
    ]);
    assert.deepEqual(competing.map(item => item.status).sort(), [200, 409]);
    assert.equal(await db.caseProfessionalReflectionRevision.count({
      where: { caseId, ownerId: firstId },
    }), 2);
    assert.equal((await (await read(sessionA.token, "?beforeVersion=3")).json()).history.length, 1);

    const audits = await db.auditEvent.findMany({ where: { caseId } });
    assert.ok(audits.some(row => row.eventType === "CASE_PROF_REFLECTION_UPDATED"));
    assert.ok(audits.some(row => row.eventType === "CASE_PROF_REFLECTION_READ"));
    assert.doesNotMatch(JSON.stringify(audits), /Observation de relation fictive A|Premier constat fictif/);

    // Après transmission du dossier, la nouvelle professionnelle ne lit
    // aucune ligne de l'ancienne. Elle peut conserver son propre bloc.
    await db.caseFile.update({ where: { id: caseId },
      data: { referentId: nextId, version: { increment: 1 } },
    });
    assert.equal((await read(sessionA.token)).status, 404);
    const newView = await (await read(sessionB.token)).json();
    assert.equal(newView.reflectionVersion, 0);
    assert.deepEqual(newView.content, blank);
    assert.equal(newView.history.length, 0);
    const savedB = await write(sessionB.token, csrfB, {
      expectedVersion: 4, content: contentB, reason: "Bloc distinct fictif",
    });
    assert.equal(savedB.status, 200);
    assert.equal(await db.caseProfessionalReflection.count({ where: { caseId } }), 2);
    const viewB = await (await read(sessionB.token)).json();
    assert.deepEqual(viewB.content, contentB);
    assert.equal(viewB.history.length, 1);
    assert.doesNotMatch(JSON.stringify(viewB), /Observation de relation fictive A/);

    await db.caseFile.update({ where: { id: caseId },
      data: { referentId: firstId, version: { increment: 1 } },
    });
    assert.equal((await read(sessionB.token)).status, 404);
    const againA = await (await read(sessionA.token)).json();
    assert.equal(againA.history.length, 2);
    assert.equal(againA.content.entreeRelation, contentA.entreeRelation);
    assert.doesNotMatch(JSON.stringify(againA), /Autre formulation professionnelle fictive B/);

    // Un état modifié hors du service est refusé au lieu de paraître fiable.
    await db.caseProfessionalReflection.update({
      where: { caseId_ownerId: { caseId, ownerId: firstId } },
      data: { content: { ...updatedA, entreeRelation: "État fictivement incohérent" } },
    });
    const drift = await read(sessionA.token);
    assert.equal(drift.status, 409);
    assert.deepEqual(await drift.json(), { error: "HISTORIQUE_REFLEXION_INDISPONIBLE" });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.caseProfessionalReflectionRevision.deleteMany({ where: { caseId } });
    await db.caseProfessionalReflection.deleteMany({ where: { caseId } });
    await db.caseAssignment.deleteMany({ where: { caseId } });
    await db.caseReferenceRevision.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [firstId, nextId, tnsId] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [firstId, nextId, tnsId] } } });
    await db.$disconnect();
  }
});
