import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSharedNote, DossierVersionConflict, InvalidSharedNote } from "../src/sharedNoteService.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";
import { CaseAccessDenied } from "../src/caseAccessService.js";

// Une vraie instance PostgreSQL de CI, détruite après le job. Aucun dossier réel.
test("PostgreSQL : notes partagées validées par ACL, version et transaction", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ref = randomUUID(), tns = randomUUID(), dir = randomUUID(), caseId = randomUUID();
  try {
    await db.$connect();
    await db.userAccount.createMany({ data: [
      { id: ref, email: `notes-ref-${ref}@example.org`, role: "REFERENTE", enabled: true },
      { id: tns, email: `notes-tns-${tns}@example.org`, role: "APPUI_TNS", enabled: true },
      { id: dir, email: `notes-dir-${dir}@example.org`, role: "DIRECTION", enabled: true },
    ] });
    await db.caseFile.create({ data: { id: caseId, referentId: ref } });
    await db.caseAssignment.create({ data: {
      caseId, userId: tns, capability: "SHARED_READ", active: true,
    } });
    const [{ token: refToken }, { token: tnsToken }, { token: dirToken }] = await Promise.all([
      issueSession({ db, userId: ref }),
      issueSession({ db, userId: tns }),
      issueSession({ db, userId: dir }),
    ]);
    const create = (token, text, expectedVersion) => createSharedNote({
      db, caseId, expectedVersion, text,
      cookieHeader: `${COOKIE_NAME}=${token}`,
    });

    await assert.rejects(create("no-session", "Texte fictif", 0), CaseAccessDenied);
    await assert.rejects(create(tnsToken, "Texte fictif", 0), CaseAccessDenied);
    await assert.rejects(create(dirToken, "Texte fictif", 0), CaseAccessDenied);
    await assert.rejects(create(refToken, "  ", 0), InvalidSharedNote);
    await assert.rejects(create(refToken, "x".repeat(4001), 0), InvalidSharedNote);

    const first = await create(refToken, "Brouillon factuel fictif A", 0);
    assert.equal(first.validated, false);
    assert.equal(first.dossierVersion, 1);
    await assert.rejects(create(refToken, "Écrasement interdit", 0), DossierVersionConflict);
    const next = await create(refToken, "Brouillon factuel fictif B", 1);
    assert.equal(next.dossierVersion, 2);

    const notes = await db.sharedNote.findMany({ where: { caseId }, orderBy: { createdAt: "asc" } });
    assert.equal(notes.length, 2);
    assert.ok(notes.every(note => note.validated === false));
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 2);
    const audit = await db.auditEvent.findMany({ where: { caseId } });
    assert.equal(audit.length, 2);
    assert.ok(audit.every(entry => entry.eventType === "SHARED_NOTE_CREATED"));
    assert.ok(audit.every(entry => entry.actorId === ref));
  } finally {
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.sharedNote.deleteMany({ where: { caseId } });
    await db.caseAssignment.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: { in: [ref, tns, dir] } } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: { in: [ref, tns, dir] } } });
    await db.$disconnect();
  }
});
