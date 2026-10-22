import { CAPABILITIES, canAccessCase } from "./policy.js";
import { toPolicyDossier, CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DossierVersionConflict extends Error {
  constructor() {
    super("DOSSIER_MODIFIE_ENTRE_TEMPS");
    this.name = "DossierVersionConflict";
  }
}
export class InvalidSharedNote extends Error {
  constructor() {
    super("NOTE_INVALIDE");
    this.name = "InvalidSharedNote";
  }
}

/**
 * Service INTERNE, non exposé en HTTP : jusqu'à validation de l'authentification,
 * des règles de partage, de l'hébergement et des protections CSRF.
 * Les champs texte sont des brouillons non validés, jamais expédiés aux partenaires.
 */
export async function createSharedNote({
  db, cookieHeader, caseId, expectedVersion, text, now = new Date(),
} = {}) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)) throw new CaseAccessDenied();
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0
    || typeof text !== "string" || !text.trim() || text.length > 4000) {
    throw new InvalidSharedNote();
  }

  const userId = await resolveSessionUserId({ db, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();

  return db.$transaction(async tx => {
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
      actor, dossier: toPolicyDossier(dossier), capability: CAPABILITIES.SHARED_WRITE, now,
    })) {
      throw new CaseAccessDenied();
    }

    // Optimistic locking : deux modifications concurrentes ne peuvent pas
    // toutes deux remplacer silencieusement la même version.
    if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
    const changed = await tx.caseFile.updateMany({
      where: { id: caseId, archivedAt: null, version: expectedVersion },
      data: { version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new DossierVersionConflict();

    const note = await tx.sharedNote.create({
      data: { caseId, text: text.trim(), validated: false },
      select: { id: true, version: true, validated: true },
    });
    await tx.auditEvent.create({
      data: {
        caseId, actorId: actor.id, eventType: "SHARED_NOTE_CREATED",
        purpose: "Ajout d'un brouillon de continuité au dossier partagé",
      },
    });
    // Ne jamais retourner les contenus du dossier entier ni les notes réservées.
    return Object.freeze({
      noteId: note.id, validated: note.validated,
      dossierVersion: expectedVersion + 1,
    });
  }, { isolationLevel: "Serializable" });
}
