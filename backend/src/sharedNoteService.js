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

export class SharedNoteHistoryUnavailable extends Error {
  constructor() {
    super("HISTORIQUE_NOTE_INDISPONIBLE");
    this.name = "SharedNoteHistoryUnavailable";
  }
}

const MAX_VERSION = 2147483647;
const HISTORY_PAGE_SIZE = 50;

function validVersion(version) {
  return Number.isInteger(version) && version >= 0 && version < MAX_VERSION;
}

function validText(text) {
  return typeof text === "string" && Boolean(text.trim()) && text.length <= 4000;
}

function validNow(now) {
  return now instanceof Date && Number.isFinite(now.getTime());
}

async function noteTransaction(db, operation) {
  try {
    return await db.$transaction(operation, { isolationLevel: "Serializable" });
  } catch (error) {
    // PostgreSQL peut refuser une transaction avant le contrôle updateMany.
    // Il s'agit du même conflit métier, jamais d'un écrasement ou retry aveugle.
    if (error?.code === "P2034") throw new DossierVersionConflict();
    throw error;
  }
}

async function authorizedWriter(tx, cookieHeader, caseId, now) {
  // Session, compte, droits et écriture utilisent le même instantané PostgreSQL.
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
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
    },
  });
  if (!dossier || dossier.archivedAt || !canAccessCase({
    actor, dossier: toPolicyDossier(dossier), capability: CAPABILITIES.SHARED_WRITE, now,
  })) throw new CaseAccessDenied();
  return { actor, dossier };
}

async function advanceDossier(tx, dossier, expectedVersion) {
  if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
  const changed = await tx.caseFile.updateMany({
    where: { id: dossier.id, archivedAt: null, version: expectedVersion },
    data: { version: { increment: 1 } },
  });
  if (changed.count !== 1) throw new DossierVersionConflict();
}

function checkNoteContext(db, caseId, now, noteId) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId) || !validNow(now)
    || (noteId !== undefined && (typeof noteId !== "string" || !UUID.test(noteId)))) {
    throw new CaseAccessDenied();
  }
}

async function findCaseNote(tx, caseId, noteId) {
  const note = await tx.sharedNote.findFirst({
    where: { id: noteId, caseId },
    select: { id: true, version: true, text: true, validated: true },
  });
  if (!note) throw new CaseAccessDenied();
  return note;
}

async function requireCurrentRevision(tx, note) {
  const revision = await tx.sharedNoteRevision.findUnique({
    where: { noteId_version: { noteId: note.id, version: note.version } },
    select: { text: true, validated: true },
  });
  // Ne pas inventer l'auteur ni la date des notes antérieures au versionnement.
  if (!revision || revision.text !== note.text || revision.validated !== note.validated) {
    throw new SharedNoteHistoryUnavailable();
  }
}

/**
 * Écritures réservées aux routes de recette explicitement activées avec SSO/CSRF.
 * Les champs texte sont des brouillons non validés, jamais expédiés aux partenaires.
 */
export async function createSharedNote({
  db, cookieHeader, caseId, expectedVersion, text, now = new Date(),
} = {}) {
  if (!validVersion(expectedVersion) || !validText(text)) {
    throw new InvalidSharedNote();
  }
  checkNoteContext(db, caseId, now);

  return noteTransaction(db, async tx => {
    const { actor, dossier } = await authorizedWriter(tx, cookieHeader, caseId, now);

    // Optimistic locking : deux modifications concurrentes ne peuvent pas
    // toutes deux remplacer silencieusement la même version.
    await advanceDossier(tx, dossier, expectedVersion);

    const note = await tx.sharedNote.create({
      data: { caseId, text: text.trim(), validated: false },
      select: { id: true, version: true, validated: true },
    });
    // Première révision immutable conservée dans la même transaction
    // que la note et l'audit : aucun succès partiel en cas de panne.
    await tx.sharedNoteRevision.create({
      data: {
        noteId: note.id, caseId, version: note.version,
        text: text.trim(), validated: false, actorId: actor.id,
        reason: "CREATION_BROUILLON",
      },
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
  });
}

/** Une correction retire la validation ; la relecture reste une action explicite. */
export async function correctSharedNote({
  db, cookieHeader, caseId, noteId, expectedVersion, text, reason, now = new Date(),
} = {}) {
  if (!validVersion(expectedVersion) || !validText(text)
    || typeof reason !== "string" || !reason.trim() || reason.length > 200) {
    throw new InvalidSharedNote();
  }
  return reviseSharedNote({
    db, cookieHeader, caseId, noteId, expectedVersion, text: text.trim(),
    reason: reason.trim(), validate: false, now,
  });
}

/** La validation porte sur la version relue, sans accepter de nouveau texte. */
export async function validateSharedNote({
  db, cookieHeader, caseId, noteId, expectedVersion, now = new Date(),
} = {}) {
  if (!validVersion(expectedVersion)) throw new InvalidSharedNote();
  return reviseSharedNote({
    db, cookieHeader, caseId, noteId, expectedVersion,
    reason: "VALIDATION_APRES_RELECTURE", validate: true, now,
  });
}

async function reviseSharedNote({
  db, cookieHeader, caseId, noteId, expectedVersion, text, reason, validate, now,
}) {
  if (typeof noteId !== "string" || !UUID.test(noteId)) throw new CaseAccessDenied();
  checkNoteContext(db, caseId, now, noteId);
  return noteTransaction(db, async tx => {
    const { actor, dossier } = await authorizedWriter(tx, cookieHeader, caseId, now);
    const note = await findCaseNote(tx, caseId, noteId);
    if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
    await requireCurrentRevision(tx, note);
    if (note.version >= MAX_VERSION || (validate ? note.validated : text === note.text)) {
      throw new InvalidSharedNote();
    }
    await advanceDossier(tx, dossier, expectedVersion);
    const content = validate ? note.text : text;
    const changed = await tx.sharedNote.updateMany({
      where: { id: noteId, caseId, version: note.version },
      data: { text: content, validated: validate, version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new DossierVersionConflict();
    await tx.sharedNoteRevision.create({
      data: {
        noteId, caseId, version: note.version + 1, text: content,
        validated: validate, actorId: actor.id, reason,
      },
    });
    await tx.auditEvent.create({
      data: {
        caseId, actorId: actor.id,
        eventType: validate ? "SHARED_NOTE_VALIDATED" : "SHARED_NOTE_CORRECTED",
        // Aucun texte ni motif libre dans le journal technique.
        purpose: validate ? "Validation après relecture d'une note partagée"
          : "Correction versionnée d'une note partagée",
      },
    });
    return Object.freeze({
      noteId, noteVersion: note.version + 1, validated: validate,
      dossierVersion: expectedVersion + 1,
    });
  });
}

/**
 * Les brouillons et leur historique restent dans le périmètre SHARED_WRITE.
 * Un droit de lecture de continuité ou une dérogation ne les ouvre jamais.
 */
export async function readSharedNoteHistory({
  db, cookieHeader, caseId, noteId, beforeVersion, now = new Date(),
} = {}) {
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion)
    || beforeVersion < 1 || beforeVersion > MAX_VERSION)) throw new InvalidSharedNote();
  if (typeof noteId !== "string" || !UUID.test(noteId)) throw new CaseAccessDenied();
  checkNoteContext(db, caseId, now, noteId);
  return noteTransaction(db, async tx => {
    const { actor, dossier } = await authorizedWriter(tx, cookieHeader, caseId, now);
    const note = await findCaseNote(tx, caseId, noteId);
    await requireCurrentRevision(tx, note);
    const revisions = await tx.sharedNoteRevision.findMany({
      where: { noteId, caseId, ...(beforeVersion === undefined ? {} : { version: { lt: beforeVersion } }) },
      orderBy: { version: "desc" }, take: HISTORY_PAGE_SIZE + 1,
      select: { version: true, text: true, validated: true, actorId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, HISTORY_PAGE_SIZE);
    await tx.auditEvent.create({
      data: {
        caseId, actorId: actor.id, eventType: "SHARED_NOTE_HISTORY_READ",
        purpose: "Consultation de l'historique d'une note partagée",
      },
    });
    return Object.freeze({
      noteId, noteVersion: note.version, validated: note.validated,
      dossierVersion: dossier.version, history,
      nextBeforeVersion: revisions.length > HISTORY_PAGE_SIZE ? history.at(-1).version : null,
    });
  });
}
