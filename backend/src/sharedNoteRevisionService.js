import { CAPABILITIES, canAccessCase } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable, toPolicyDossier } from "./caseAccessService.js";
import { DossierVersionConflict, InvalidSharedNote } from "./sharedNoteService.js";
import { resolveSessionUserId } from "./sessions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Correction et validation d'un brouillon partagé, sans écraser son historique.
 * Aucun accès aux notes réservées et aucun rôle transmis par le navigateur.
 */
export async function reviseSharedNote({
  db, cookieHeader, caseId, noteId, expectedDossierVersion,
  expectedNoteVersion, text, validated, reason, now = new Date(),
} = {}) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)
    || typeof noteId !== "string" || !UUID.test(noteId)) throw new CaseAccessDenied();

  const cleanedText = typeof text === "string" ? text.trim() : "";
  const cleanedReason = typeof reason === "string" ? reason.trim() : "";
  if (!Number.isSafeInteger(expectedDossierVersion) || expectedDossierVersion < 0
    || !Number.isSafeInteger(expectedNoteVersion) || expectedNoteVersion < 1
    || !cleanedText || cleanedText.length > 4000
    || !cleanedReason || cleanedReason.length > 200
    || typeof validated !== "boolean"
    || !(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new InvalidSharedNote();
  }

  const userId = await resolveSessionUserId({ db, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();

  try {
    return await db.$transaction(async tx => {
      const actor = await tx.userAccount.findUnique({
        where: { id: userId }, select: { id: true, role: true, enabled: true },
      });
      if (!actor?.enabled) throw new CaseAccessDenied();

      const dossier = await tx.caseFile.findUnique({
        where: { id: caseId },
        select: {
          id: true, referentId: true, version: true, archivedAt: true,
          assignments: {
            where: { active: true },
            select: { userId: true, capability: true, active: true },
          },
          grants: {
            where: { revokedAt: null, startsAt: { lte: now }, expiresAt: { gt: now } },
            select: {
              userId: true, capability: true, reason: true, approvedById: true,
              startsAt: true, expiresAt: true, revokedAt: true,
            },
          },
        },
      });
      if (!dossier || dossier.archivedAt || !canAccessCase({
        actor, dossier: toPolicyDossier(dossier),
        capability: CAPABILITIES.SHARED_WRITE, now,
      })) throw new CaseAccessDenied();

      const note = await tx.sharedNote.findFirst({
        where: { id: noteId, caseId },
        select: { id: true, version: true, validated: true, text: true },
      });
      if (!note) throw new CaseAccessDenied();
      if (note.validated || note.version !== expectedNoteVersion
        || dossier.version !== expectedDossierVersion) {
        throw new DossierVersionConflict();
      }
      if (note.text === cleanedText && validated === false) throw new InvalidSharedNote();

      const caseUpdate = await tx.caseFile.updateMany({
        where: { id: caseId, archivedAt: null, version: expectedDossierVersion },
        data: { version: { increment: 1 } },
      });
      if (caseUpdate.count !== 1) throw new DossierVersionConflict();
      const noteUpdate = await tx.sharedNote.updateMany({
        where: { id: noteId, caseId, validated: false, version: expectedNoteVersion },
        data: { text: cleanedText, validated, version: { increment: 1 } },
      });
      if (noteUpdate.count !== 1) throw new DossierVersionConflict();

      await tx.sharedNoteRevision.create({
        data: {
          noteId, caseId, version: expectedNoteVersion + 1,
          text: cleanedText, validated, actorId: actor.id, reason: cleanedReason,
        },
      });
      await tx.auditEvent.create({
        data: {
          caseId, actorId: actor.id,
          eventType: validated ? "SHARED_NOTE_VALIDATED" : "SHARED_NOTE_CORRECTED",
          purpose: "Versionnement d'une note de continuité partagée",
        },
      });
      return Object.freeze({
        noteId, noteVersion: expectedNoteVersion + 1,
        dossierVersion: expectedDossierVersion + 1, validated,
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    // Le conflit PostgreSQL est remonté comme version périmée, sans réessai aveugle.
    if (error?.code === "P2034" || error?.code === "P2002") {
      throw new DossierVersionConflict();
    }
    throw error;
  }
}
