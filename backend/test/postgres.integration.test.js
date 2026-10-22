import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readCaseOverview, CaseAccessDenied } from "../src/caseAccessService.js";

// Les tests utilisent UNIQUEMENT la base éphémère PostgreSQL du runner CI.
// Ils restent désactivés hors environnement de test explicitement configuré.
test("PostgreSQL : affectations, refus et journal de consultation", {
  skip: process.env.ARTAG_DB_INTEGRATION_TEST !== "1",
}, async () => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const ids = {
    referent: randomUUID(), tns: randomUUID(),
    direction: randomUUID(), caseFile: randomUUID(),
  };

  try {
    await prisma.$connect();
    await prisma.userAccount.createMany({
      data: [
        { id: ids.referent, email: `ref-${ids.referent}@example.org`, role: "REFERENTE", enabled: true },
        { id: ids.tns, email: `tns-${ids.tns}@example.org`, role: "APPUI_TNS", enabled: true },
        { id: ids.direction, email: `dir-${ids.direction}@example.org`, role: "DIRECTION", enabled: true },
      ],
    });
    await prisma.caseFile.create({
      data: { id: ids.caseFile, referentId: ids.referent },
    });
    await prisma.privateNote.create({
      data: {
        caseId: ids.caseFile, authorId: ids.referent,
        text: "NOTE_FICTIVE_PRIVEE_NE_JAMAIS_EXPOSER",
      },
    });

    const readAs = (userId, date = new Date("2026-10-22T10:00:00.000Z")) =>
      readCaseOverview({
        db: prisma, caseId: ids.caseFile,
        session: { fictive: true },
        resolveVerifiedSubject: async () => userId,
        now: date,
      });

    const result = await readAs(ids.referent);
    assert.deepEqual(Object.keys(result).sort(), ["id", "updatedAt", "version"]);
    assert.equal(JSON.stringify(result).includes("NOTE_FICTIVE_PRIVEE"), false);
    assert.equal(result.id, ids.caseFile);

    await assert.rejects(readAs(ids.tns), CaseAccessDenied);
    await prisma.caseAssignment.create({
      data: {
        caseId: ids.caseFile, userId: ids.tns,
        capability: "SHARED_READ", active: true,
      },
    });
    assert.equal((await readAs(ids.tns)).id, ids.caseFile);

    await assert.rejects(readAs(ids.direction), CaseAccessDenied);
    await prisma.temporaryGrant.create({
      data: {
        caseId: ids.caseFile, userId: ids.direction,
        approvedById: ids.referent, capability: "SHARED_READ",
        reason: "Relais temporaire fictif",
        startsAt: new Date("2026-10-22T09:00:00.000Z"),
        expiresAt: new Date("2026-10-22T12:00:00.000Z"),
      },
    });
    assert.equal((await readAs(ids.direction)).id, ids.caseFile);
    await assert.rejects(readAs(ids.direction, new Date("2026-10-22T12:00:00.000Z")), CaseAccessDenied);

    const logs = await prisma.auditEvent.findMany({
      where: { caseId: ids.caseFile },
      select: { actorId: true, eventType: true, purpose: true },
    });
    assert.equal(logs.length, 3);
    assert.ok(logs.every((entry) => entry.eventType === "CASE_OVERVIEW_READ"));
    assert.deepEqual(new Set(logs.map((entry) => entry.actorId)),
      new Set([ids.referent, ids.tns, ids.direction]));
  } finally {
    // Base CI fictive : nettoyage explicite, sans accès à une base ARTAG.
    await prisma.auditEvent.deleteMany({ where: { caseId: ids.caseFile } });
    await prisma.privateNote.deleteMany({ where: { caseId: ids.caseFile } });
    await prisma.temporaryGrant.deleteMany({ where: { caseId: ids.caseFile } });
    await prisma.caseAssignment.deleteMany({ where: { caseId: ids.caseFile } });
    await prisma.caseFile.deleteMany({ where: { id: ids.caseFile } });
    await prisma.userAccount.deleteMany({
      where: { id: { in: [ids.referent, ids.tns, ids.direction] } },
    });
    await prisma.$disconnect();
  }
});
