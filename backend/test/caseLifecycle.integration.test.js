import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createCase } from "../src/caseCreationService.js";
import { updateCaseIdentity, readCaseIdentity } from "../src/caseIdentityService.js";
import { updateCaseReference, readCaseReference } from "../src/caseReferenceService.js";
import { createSharedNote, readSharedNotes, DossierVersionConflict } from "../src/sharedNoteService.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";
import { CaseAccessDenied } from "../src/caseAccessService.js";

// Recette transversale des lots empilés : aucune identité ni référence réelle.
test("PostgreSQL : création -> identité -> note partagée -> correction de référence, sans perte de version", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const referentId = randomUUID();
  const tnsId = randomUUID();
  const requestId = randomUUID();
  const initialReference = "ARTAG-RECETTE-" + randomUUID();
  let caseId;
  const users = [referentId, tnsId];
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: referentId, email: "transverse-ref-" + referentId + "@example.org", role: "REFERENTE", enabled: true },
      { id: tnsId, email: "transverse-tns-" + tnsId + "@example.org", role: "APPUI_TNS", enabled: true },
    ] });
    const [{ token: refToken }, { token: tnsToken }] = await Promise.all([
      issueSession({ db, userId: referentId }),
      issueSession({ db, userId: tnsId }),
    ]);
    const refCookie = COOKIE_NAME + "=" + refToken;
    const tnsCookie = COOKIE_NAME + "=" + tnsToken;
    const created = await createCase({
      db, cookieHeader: refCookie, input: { requestId, artagReference: initialReference },
    });
    assert.equal(created.created, true);
    assert.equal(created.dossierVersion, 1);
    caseId = created.caseId;

    const identity = {
      lastName: "NOM FICTIF", firstName: "Exemple",
      insertisNumber: "INSERTIS-RECETTE", age: 30,
    };
    const recorded = await updateCaseIdentity({
      db, cookieHeader: refCookie, caseId,
      input: { expectedVersion: 1, identity, reason: "Saisie de recette fictive" },
    });
    assert.equal(recorded.dossierVersion, 2);

    const note = await createSharedNote({
      db, cookieHeader: refCookie, caseId,
      expectedVersion: 2, text: "Note de continuité fictive",
    });
    assert.equal(note.dossierVersion, 3);
    const notes = await readSharedNotes({ db, cookieHeader: refCookie, caseId });
    assert.equal(notes.notes.length, 1);
    assert.equal(notes.notes[0].id, note.noteId);
    assert.equal(notes.dossierVersion, 3);
    assert.ok(!JSON.stringify(notes).includes("NOM FICTIF"));

    const identityRead = await readCaseIdentity({ db, cookieHeader: refCookie, caseId });
    assert.equal(identityRead.dossierVersion, 3);
    assert.equal(identityRead.identityVersion, 2);
    assert.deepEqual(identityRead.identity, identity);
    assert.equal(identityRead.history.length, 1);
    assert.deepEqual(identityRead.history[0].previousIdentity, {
      lastName: null, firstName: null, insertisNumber: null, age: null,
    });
    await assert.rejects(readCaseIdentity({ db, cookieHeader: tnsCookie, caseId }), CaseAccessDenied);

    // Une note écrite entre-temps invalide le compteur utilisé par une ancienne
    // fenêtre d'identité. Aucun écrasement de l'information en concurrence.
    await assert.rejects(updateCaseIdentity({
      db, cookieHeader: refCookie, caseId,
      input: { expectedVersion: 2, identity: { ...identity, age: 31 }, reason: "Valeur périmée fictive" },
    }), DossierVersionConflict);

    const revised = await updateCaseReference({
      db, cookieHeader: refCookie, caseId, expectedVersion: 3,
      artagReference: initialReference + "-REV",
      reason: "Correction du numéro de recette",
    });
    assert.equal(revised.dossierVersion, 4);
    const reference = await readCaseReference({ db, cookieHeader: refCookie, caseId });
    assert.equal(reference.history.length, 2);
    assert.equal(reference.history[0].previousReference, initialReference);
    assert.equal(reference.artagReference, initialReference + "-REV");

    const finalIdentity = await readCaseIdentity({ db, cookieHeader: refCookie, caseId });
    assert.equal(finalIdentity.dossierVersion, 4);
    assert.deepEqual(finalIdentity.identity, identity);

    const audits = await db.auditEvent.findMany({ where: { caseId } });
    assert.ok(audits.some(entry => entry.eventType === "CASE_CREATED"));
    assert.ok(audits.some(entry => entry.eventType === "CASE_IDENTITY_UPDATED"));
    assert.ok(audits.some(entry => entry.eventType === "SHARED_NOTE_CREATED"));
    assert.ok(audits.some(entry => entry.eventType === "CASE_REFERENCE_UPDATED"));
    assert.ok(audits.every(entry => !JSON.stringify(entry).includes("NOM FICTIF")));
  } finally {
    await db.auditEvent.deleteMany({ where: { actorId: { in: users } } });
    if (caseId) {
      await db.sharedNoteRevision.deleteMany({ where: { caseId } });
      await db.sharedNote.deleteMany({ where: { caseId } });
      await db.caseIdentityRevision.deleteMany({ where: { caseId } });
      await db.caseIdentity.deleteMany({ where: { caseId } });
      await db.caseReferenceRevision.deleteMany({ where: { caseId } });
      await db.caseCreationRequest.deleteMany({ where: { caseId } });
      await db.caseFile.deleteMany({ where: { id: caseId } });
    }
    await db.webSession.deleteMany({ where: { userId: { in: users } } });
    await db.userAccount.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
