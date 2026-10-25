import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { issueSession, COOKIE_NAME, revokeSession } from "../src/sessions.js";
import { correctSharedNote } from "../src/sharedNoteService.js";

test("PostgreSQL/HTTP : corrections, relecture, historique et transactions des notes partagées", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const roles = ["REFERENTE", "REFERENTE", "APPUI_TNS", "ACCUEIL", "DIRECTION", "ADMIN_TECHNIQUE", "GOUVERNANCE"];
  const users = roles.map(() => randomUUID());
  const [ref, other, tns, accueil, direction] = users;
  const caseId = randomUUID(), otherCaseId = randomUUID();
  const origin = "https://artag.example.org";
  const oidc = { origin, redirectUri: origin + "/auth/callback", provider: {
    issuer: "https://idp.example.org",
    generateVerifier: () => "fictif",
    authorizationUrl: async () => "https://idp.example.org/authorize",
    verifyCallback: async () => ({ issuer: "https://idp.example.org", subject: "fictif" }),
  } };
  let server;
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: users.map((id, i) => ({
      id, email: `revision-fictive-${id}@example.org`, role: roles[i], enabled: true,
    })) });
    await db.caseFile.createMany({ data: [
      { id: caseId, referentId: ref }, { id: otherCaseId, referentId: other },
    ] });
    await db.caseAssignment.createMany({ data: [tns, accueil, direction].map(userId => ({
      caseId, userId, capability: "SHARED_READ", active: true,
    })) });
    await db.temporaryGrant.create({ data: {
      caseId, userId: direction, approvedById: ref, capability: "SHARED_READ",
      reason: "Relais de recette fictif", startsAt: new Date(Date.now() - 60000),
      expiresAt: new Date(Date.now() + 60000),
    } });
    await db.privateNote.create({ data: { caseId, authorId: ref, text: "Note réservée fictive à ne jamais exposer" } });
    const tokens = await Promise.all(users.map(async userId => (await issueSession({ db, userId })).token));
    const cookie = token => `${COOKIE_NAME}=${token}`;
    server = createApp({ privateDb: db, oidc, enableSharedWrites: true,
      csrfSecret: "cle-fictive-de-recette-uniquement-32-caracteres" }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const csrfs = await Promise.all(tokens.map(async token => {
      const response = await fetch(base + "/auth/csrf", { headers: { Cookie: cookie(token) } });
      assert.equal(response.status, 200);
      return (await response.json()).token;
    }));
    const path = `/api/dossiers/${caseId}/notes-partagees`;
    const send = (route, body, { index = 0, method = "POST", csrf = csrfs[index], from = origin } = {}) =>
      fetch(base + route, { method, headers: {
        Cookie: cookie(tokens[index]), Origin: from, "X-CSRF-Token": csrf, "Content-Type": "application/json",
      }, body: JSON.stringify(body) });
    const history = (noteId, index = 0, query = "") => fetch(base + path + `/${noteId}/historique` + query,
      { headers: { Cookie: cookie(tokens[index]) } });
    const created = await send(path, { expectedVersion: 0, text: "Première suite fictive" });
    assert.equal(created.status, 201);
    const { noteId } = await created.json();
    const foreign = await send(`/api/dossiers/${otherCaseId}/notes-partagees`,
      { expectedVersion: 0, text: "Autre dossier fictif" }, { index: 1 });
    assert.equal(foreign.status, 201);
    const foreignNoteId = (await foreign.json()).noteId;

    // Lire le même identifiant technique ne donne aucun droit sur son contenu.
    for (let index = 1; index < users.length; index++) {
      const denied = await history(noteId, index);
      assert.equal(denied.status, 404);
      assert.deepEqual(await denied.json(), { error: "DOSSIER_INDISPONIBLE" });
      assert.equal((await send(path + `/${noteId}/validation`, { expectedVersion: 1 }, { index })).status, 404);
      assert.equal((await send(path + `/${noteId}`, { expectedVersion: 1, text: "Usurpation fictive",
        reason: "Refus attendu" }, { index, method: "PATCH" })).status, 404);
    }
    assert.equal((await history(foreignNoteId)).status, 404);
    assert.equal((await history(randomUUID())).status, 404);
    assert.equal((await fetch(base + path + `/${noteId}/historique`)).status, 404);

    const correction = { expectedVersion: 1, text: "Suite fictive précisée", reason: "Après entretien fictif" };
    assert.equal((await send(path + `/${noteId}`, correction, { method: "PATCH", csrf: "f".repeat(64) })).status, 403);
    assert.equal((await send(path + `/${noteId}`, correction,
      { method: "PATCH", from: "https://autre.example.org" })).status, 403);
    for (const body of [
      { ...correction, reason: " " }, { ...correction, text: " " },
      { ...correction, expectedVersion: "1" }, { ...correction, validated: true },
      { ...correction, actorId: other },
    ]) assert.equal((await send(path + `/${noteId}`, body, { method: "PATCH" })).status, 422);
    assert.equal((await send(path + `/${noteId}/validation`, { expectedVersion: 1, text: "Texte non relu fictif" })).status, 422);
    assert.equal((await history(noteId, 0, "?beforeVersion=0")).status, 422);
    assert.equal((await history(noteId, 0, "?beforeVersion=1&beforeVersion=2")).status, 422);

    const corrected = await send(path + `/${noteId}`, correction, { method: "PATCH" });
    assert.equal(corrected.status, 200);
    assert.deepEqual(await corrected.json(), { noteId, noteVersion: 2, dossierVersion: 2, validated: false });
    const validated = await send(path + `/${noteId}/validation`, { expectedVersion: 2 });
    assert.equal(validated.status, 200);
    assert.deepEqual(await validated.json(), { noteId, noteVersion: 3, dossierVersion: 3, validated: true });
    assert.equal((await send(path + `/${noteId}/validation`, { expectedVersion: 3 })).status, 422);
    // Un texte Unicode valide et volumineux reste accepté dans la limite métier.
    const longText = "Exemple fictif " + "例".repeat(3980);
    assert.equal((await send(path + `/${noteId}`, { expectedVersion: 3,
      text: longText, reason: "Actualisation fictive" }, { method: "PATCH" })).status, 200);
    const read = await history(noteId);
    assert.equal(read.status, 200);
    assert.equal(read.headers.get("cache-control"), "no-store");
    const contents = await read.json();
    assert.equal(contents.validated, false);
    assert.deepEqual(contents.history.map(r => [r.version, r.validated]), [[4, false], [3, true], [2, false], [1, false]]);
    assert.equal(contents.history.at(-1).text, "Première suite fictive");
    assert.ok(contents.history.every(r => r.actorId === ref && Number.isFinite(Date.parse(r.createdAt))));
    assert.doesNotMatch(JSON.stringify(contents), /Note réservée|email|assignments|tokenDigest/);
    const stale = await send(path + `/${noteId}`, correction, { method: "PATCH" });
    assert.equal(stale.status, 409);
    assert.deepEqual(await stale.json(), { error: "DOSSIER_MODIFIE_ENTRE_TEMPS" });

    const concurrent = await Promise.all(["A", "B"].map(suffix => send(path + `/${noteId}`, {
      expectedVersion: 4, text: `Correction concurrente fictive ${suffix}`, reason: "Concurrence fictive",
    }, { method: "PATCH" })));
    assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
    assert.equal(await db.sharedNoteRevision.count({ where: { noteId } }), 5);
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 5);

    // Défaillances dans les vraies transactions PostgreSQL : ni version,
    // ni contenu, ni révision ne doivent être partiellement enregistrés.
    const beforeFailure = await db.sharedNote.findUnique({ where: { id: noteId } });
    for (const failingModel of ["auditEvent", "sharedNoteRevision"]) {
      const brokenDb = {
        webSession: db.webSession,
        $transaction: (operation, options) => db.$transaction(tx => operation(new Proxy(tx, {
          get(target, key) {
            if (key === failingModel) return new Proxy(target[key], {
              get(model, method) {
                return method === "create" ? async () => { throw new Error("PANNE_FICTIVE"); } : model[method];
              },
            });
            return target[key];
          },
        })), options),
      };
      await assert.rejects(correctSharedNote({ db: brokenDb, cookieHeader: cookie(tokens[0]),
        caseId, noteId, expectedVersion: 5, text: "Ne doit pas persister", reason: "Panne fictive" }), /PANNE_FICTIVE/);
      assert.deepEqual(await db.sharedNote.findUnique({ where: { id: noteId } }), beforeFailure);
      assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 5);
      assert.equal(await db.sharedNoteRevision.count({ where: { noteId } }), 5);
    }
    const audit = await db.auditEvent.findMany({ where: { caseId }, orderBy: { createdAt: "asc" } });
    assert.deepEqual(audit.map(a => a.eventType), ["SHARED_NOTE_CREATED", "SHARED_NOTE_CORRECTED",
      "SHARED_NOTE_VALIDATED", "SHARED_NOTE_CORRECTED", "SHARED_NOTE_HISTORY_READ", "SHARED_NOTE_CORRECTED"]);
    assert.ok(audit.every(a => a.actorId === ref));
    assert.doesNotMatch(JSON.stringify(audit), /Première suite|Suite fictive|Après entretien/);

    await db.caseFile.update({ where: { id: caseId }, data: { archivedAt: new Date() } });
    assert.equal((await history(noteId)).status, 404);
    await db.caseFile.update({ where: { id: caseId }, data: { archivedAt: null } });
    await db.userAccount.update({ where: { id: ref }, data: { enabled: false } });
    assert.equal((await history(noteId)).status, 404);
    await db.userAccount.update({ where: { id: ref }, data: { enabled: true } });
    await revokeSession({ db, cookieHeader: cookie(tokens[0]) });
    assert.equal((await history(noteId)).status, 404);
  } finally {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.auditEvent.deleteMany({ where: { caseId: { in: [caseId, otherCaseId] } } });
    await db.caseFile.deleteMany({ where: { id: { in: [caseId, otherCaseId] } } });
    await db.webSession.deleteMany({ where: { userId: { in: users } } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
