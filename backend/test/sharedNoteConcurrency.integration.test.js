import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSharedNote, DossierVersionConflict } from "../src/sharedNoteService.js";
import { issueSession, COOKIE_NAME } from "../src/sessions.js";

test("PostgreSQL : deux écritures concurrentes gardent une seule note et un conflit explicite", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
  timeout: 15000,
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const actorId = randomUUID(), caseId = randomUUID();
  try {
    await db.userAccount.create({ data: {
      id: actorId, email: `concurrence-${actorId}@example.org`, role: "REFERENTE", enabled: true,
    } });
    await db.caseFile.create({ data: { id: caseId, referentId: actorId } });
    const { token } = await issueSession({ db, userId: actorId });
    // Barrière de test : les deux transactions lisent réellement la version 0
    // avant d'essayer d'écrire. Aucune transaction ou réponse PostgreSQL simulée.
    let readers = 0, release;
    const bothRead = new Promise(resolve => { release = resolve; });
    const concurrentDb = {
      webSession: db.webSession,
      $transaction: (operation, options) => db.$transaction(tx => operation({
        userAccount: tx.userAccount,
        sharedNote: tx.sharedNote,
        sharedNoteRevision: tx.sharedNoteRevision,
        auditEvent: tx.auditEvent,
        caseFile: {
          updateMany: args => tx.caseFile.updateMany(args),
          findUnique: async args => {
            const record = await tx.caseFile.findUnique(args);
            if (++readers === 2) release();
            await bothRead;
            return record;
          },
        },
      }), options),
    };
    const outcomes = await Promise.allSettled(["A", "B"].map(letter => createSharedNote({
      db: concurrentDb, caseId, expectedVersion: 0,
      cookieHeader: `${COOKIE_NAME}=${token}`, text: `Brouillon concurrent fictif ${letter}`,
    })));
    assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
    const failure = outcomes.find(result => result.status === "rejected");
    assert.ok(failure.reason instanceof DossierVersionConflict,
      `Conflit attendu, erreur reçue : ${failure.reason.name}`);
    assert.equal(await db.sharedNote.count({ where: { caseId } }), 1);
    assert.equal(await db.sharedNoteRevision.count({ where: { caseId } }), 1);
    assert.equal(await db.auditEvent.count({ where: { caseId } }), 1);
    assert.equal((await db.caseFile.findUnique({ where: { id: caseId } })).version, 1);
  } finally {
    await db.auditEvent.deleteMany({ where: { caseId } });
    await db.sharedNoteRevision.deleteMany({ where: { caseId } });
    await db.sharedNote.deleteMany({ where: { caseId } });
    await db.webSession.deleteMany({ where: { userId: actorId } });
    await db.caseFile.deleteMany({ where: { id: caseId } });
    await db.userAccount.deleteMany({ where: { id: actorId } });
    await db.$disconnect();
  }
});
