import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSharedNote, DossierVersionConflict, InvalidSharedNote } from "../src/sharedNoteService.js";
import { reviseSharedNote } from "../src/sharedNoteRevisionService.js";
import { CaseAccessDenied } from "../src/caseAccessService.js";
import { issueSession, COOKIE_NAME, revokeSession } from "../src/sessions.js";

test("PostgreSQL : révision, validation, historique, ACL et double écriture", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ref = randomUUID(), tns = randomUUID(), dir = randomUUID();
  const caseId = randomUUID(), otherCase = randomUUID();
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: ref, email: "revision-ref-" + ref + "@example.org", role: "REFERENTE", enabled: true },
      { id: tns, email: "revision-tns-" + tns + "@example.org", role: "APPUI_TNS", enabled: true },
      { id: dir, email: "revision-dir-" + dir + "@example.org", role: "DIRECTION", enabled: true },
    ] });
    await db.caseFile.createMany({ data: [
      { id: caseId, referentId: ref }, { id: otherCase, referentId: tns },
    ] });
    await db.caseAssignment.create({ data: {
      caseId, userId: tns, active: true, capability: "SHARED_READ",
    } });
    await db.privateNote.create({ data: {
      caseId, authorId: ref, text: "NOTE_RESERVEE_FICTIVE_NE_JAMAIS_EXPOSER",
    } });
    const [sRef, sTns, sDir] = await Promise.all([
      issueSession({ db, userId: ref }), issueSession({ db, userId: tns }),
      issueSession({ db, userId: dir }),
    ]);
    const cookie = s => COOKIE_NAME + "=" + s.token;
    const created = await createSharedNote({
      db, cookieHeader: cookie(sRef), caseId, expectedVersion: 0, text: "Brouillon fictif",
    });
    const revise = (session, changes = {}) => reviseSharedNote({
      db, cookieHeader: cookie(session), caseId, noteId: created.noteId,
      expectedDossierVersion: 1, expectedNoteVersion: 1,
      text: "Brouillon corrigé fictif", reason: "Correction factuelle de recette",
      validated: false, ...changes,
    });

    await assert.rejects(revise(sTns), CaseAccessDenied);
    await assert.rejects(revise(sDir), CaseAccessDenied);
    await assert.rejects(revise(sRef, { cookieHeader: "absent" }), CaseAccessDenied);
    await assert.rejects(revise(sRef, { caseId: otherCase }), CaseAccessDenied);
    await assert.rejects(revise(sRef, { noteId: randomUUID() }), CaseAccessDenied);
    await assert.rejects(revise(sRef, { reason: " " }), InvalidSharedNote);
    await assert.rejects(revise(sRef, { text: " " }), InvalidSharedNote);
    await assert.rejects(revise(sRef, { validated: "oui" }), InvalidSharedNote);
    await assert.rejects(revise(sRef, { text: "Brouillon fictif" }), InvalidSharedNote);

    const contenders = await Promise.allSettled([revise(sRef), revise(sRef)]);
    assert.equal(contenders.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(contenders.filter(r => r.status === "rejected").length, 1);
    assert.ok(contenders.some(r =>
      r.status === "rejected" && r.reason instanceof DossierVersionConflict));
    const corrected = contenders.find(r => r.status === "fulfilled").value;
    assert.deepEqual(Object.keys(corrected).sort(),
      ["dossierVersion", "noteId", "noteVersion", "validated"]);
    assert.equal(corrected.noteVersion, 2);
    assert.equal(corrected.dossierVersion, 2);
    assert.equal(JSON.stringify(corrected).includes("NOTE_RESERVEE"), false);

    await assert.rejects(revise(sRef), DossierVersionConflict);
    const result = await revise(sRef, {
      expectedDossierVersion: 2, expectedNoteVersion: 2,
      text: "Version finale fictive", validated: true,
      reason: "Validation professionnelle de recette",
    });
    assert.equal(result.validated, true);
    assert.equal(result.noteVersion, 3);
    await assert.rejects(revise(sRef, {
      expectedDossierVersion: 3, expectedNoteVersion: 3,
      text: "Tentative de réouverture", validated: false,
    }), DossierVersionConflict);

    const note = await db.sharedNote.findUnique({ where: { id: created.noteId } });
    assert.equal(note.version, 3);
    assert.equal(note.validated, true);
    assert.equal(note.text, "Version finale fictive");
    const history = await db.sharedNoteRevision.findMany({
      where: { noteId: created.noteId }, orderBy: { version: "asc" },
    });
    assert.deepEqual(history.map(r => [r.version, r.validated]),
      [[1, false], [2, false], [3, true]]);
    assert.deepEqual(history.map(r => r.text),
      ["Brouillon fictif", "Brouillon corrigé fictif", "Version finale fictive"]);
    assert.ok(history.every(r => r.actorId === ref && r.reason));
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 3);
    const audit = await db.auditEvent.findMany({ where: { caseId } });
    assert.deepEqual(audit.map(a => a.eventType).sort(),
      ["SHARED_NOTE_CORRECTED", "SHARED_NOTE_CREATED", "SHARED_NOTE_VALIDATED"]);
    await revokeSession({ db, cookieHeader: cookie(sRef) });
    await assert.rejects(revise(sRef, {
      expectedDossierVersion: 3, expectedNoteVersion: 3,
    }), CaseAccessDenied);
  } finally {
    await db.auditEvent.deleteMany({ where: { caseId: { in: [caseId, otherCase] } } });
    await db.sharedNoteRevision.deleteMany({ where: { caseId: { in: [caseId, otherCase] } } });
    await db.sharedNote.deleteMany({ where: { caseId: { in: [caseId, otherCase] } } });
    await db.privateNote.deleteMany({ where: { caseId } });
    await db.caseAssignment.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [ref, tns, dir] } } });
    await db.caseFile.deleteMany({ where: { id: { in: [caseId, otherCase] } } });
    await db.userAccount.deleteMany({ where: { id: { in: [ref, tns, dir] } } });
    await db.$disconnect();
  }
});
