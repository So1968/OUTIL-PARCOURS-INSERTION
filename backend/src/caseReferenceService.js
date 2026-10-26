import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { DossierVersionConflict } from "./sharedNoteService.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VERSION = 2147483647;
const PAGE_SIZE = 50;

export class InvalidCaseReference extends Error {
  constructor() { super("REFERENCE_INVALIDE"); this.name = "InvalidCaseReference"; }
}
export class CaseReferenceUnavailable extends Error {
  constructor() { super("REFERENCE_INDISPONIBLE"); this.name = "CaseReferenceUnavailable"; }
}
export class CaseReferenceHistoryUnavailable extends Error {
  constructor() { super("HISTORIQUE_REFERENCE_INDISPONIBLE"); this.name = "CaseReferenceHistoryUnavailable"; }
}

function checkContext(db, caseId, now) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)
    || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
}

function validReference(value) {
  return typeof value === "string" && value.isWellFormed() && value === value.trim() && value.length > 0
    && Array.from(value).length <= 80 && !/[\u0000-\u001f\u007f]/u.test(value);
}

async function referenceTransaction(db, operation) {
  try { return await db.$transaction(operation, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (error?.code === "P2034") throw new DossierVersionConflict();
    // Ne pas rechercher ni révéler le dossier qui porte déjà la référence.
    if (error?.code === "P2002") throw new CaseReferenceUnavailable();
    throw error;
  }
}

async function authorizedReferent(tx, cookieHeader, caseId, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({
    where: { id: userId }, select: { id: true, role: true, enabled: true },
  });
  // Une affectation de rédaction de notes ne vaut pas délégation d'identité.
  // Ce lot conserve le périmètre de la référente titulaire du dossier.
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  const dossier = await tx.caseFile.findUnique({
    where: { id: caseId },
    select: { id: true, referentId: true, archivedAt: true, version: true, artagReference: true },
  });
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id) throw new CaseAccessDenied();
  const latest = await tx.caseReferenceRevision.findFirst({
    where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { dossierVersion: true, artagReference: true },
  });
  if (latest && (latest.artagReference !== dossier.artagReference || latest.dossierVersion > dossier.version)) {
    throw new CaseReferenceHistoryUnavailable();
  }
  return { actor, dossier };
}

/** Aucun numéro généré, rapprochement de personne, effacement ou réaffectation. */
export async function updateCaseReference({
  db, cookieHeader, caseId, expectedVersion, artagReference, reason, now = new Date(),
} = {}) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0 || expectedVersion >= MAX_VERSION
    || !validReference(artagReference) || typeof reason !== "string" || !reason.trim()
    || !reason.isWellFormed() || reason.length > 200 || /[\u0000-\u001f\u007f]/u.test(reason)) throw new InvalidCaseReference();
  checkContext(db, caseId, now);
  return referenceTransaction(db, async tx => {
    const { actor, dossier } = await authorizedReferent(tx, cookieHeader, caseId, now);
    if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
    if (dossier.artagReference === artagReference) throw new InvalidCaseReference();
    const changed = await tx.caseFile.updateMany({
      where: { id: caseId, referentId: actor.id, archivedAt: null, version: expectedVersion },
      data: { artagReference, version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new DossierVersionConflict();
    await tx.caseReferenceRevision.create({ data: {
      caseId, dossierVersion: expectedVersion + 1, previousReference: dossier.artagReference,
      artagReference, actorId: actor.id, reason: reason.trim(),
    } });
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_REFERENCE_UPDATED",
      purpose: "Attribution ou correction versionnée du numéro ARTAG",
    } });
    return { caseId, artagReference, dossierVersion: expectedVersion + 1 };
  });
}

/** Historique de référence uniquement ; ne livre ni notes, ni identité personnelle. */
export async function readCaseReference({
  db, cookieHeader, caseId, beforeVersion, now = new Date(),
} = {}) {
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion) || beforeVersion < 1
    || beforeVersion > MAX_VERSION)) throw new InvalidCaseReference();
  checkContext(db, caseId, now);
  return referenceTransaction(db, async tx => {
    const { actor, dossier } = await authorizedReferent(tx, cookieHeader, caseId, now);
    const revisions = await tx.caseReferenceRevision.findMany({
      where: { caseId, ...(beforeVersion === undefined ? {} : { dossierVersion: { lt: beforeVersion } }) },
      orderBy: { dossierVersion: "desc" }, take: PAGE_SIZE + 1,
      select: { dossierVersion: true, previousReference: true, artagReference: true,
        actorId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, PAGE_SIZE);
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_REFERENCE_READ",
      purpose: "Consultation du numéro ARTAG et de son historique",
    } });
    return { caseId, artagReference: dossier.artagReference, dossierVersion: dossier.version, history,
      nextBeforeVersion: revisions.length > PAGE_SIZE ? history.at(-1).dossierVersion : null };
  });
}
