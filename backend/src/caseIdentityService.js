import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { validArtagReference } from "./caseReferenceService.js";
import { DossierVersionConflict } from "./sharedNoteService.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2147483647, PAGE_SIZE = 50;
const FIELDS = ["lastName", "firstName", "insertisNumber", "age"];
const SELECT = { lastName: true, firstName: true, insertisNumber: true, age: true };
const EMPTY = Object.freeze({ lastName: null, firstName: null, insertisNumber: null, age: null });
export class InvalidCaseIdentity extends Error {
  constructor() { super("IDENTITE_INVALIDE"); this.name = "InvalidCaseIdentity"; }
}
export class CaseIdentityHistoryUnavailable extends Error {
  constructor() { super("HISTORIQUE_IDENTITE_INDISPONIBLE"); this.name = "CaseIdentityHistoryUnavailable"; }
}
const text = (value, max) => value === null || (typeof value === "string" && value.isWellFormed()
  && value.length > 0 && value === value.trim() && Array.from(value).length <= max && !/[\u0000-\u001f\u007f]/u.test(value));
const validIdentity = value => value && !Array.isArray(value) && Object.keys(value).length === 4
  && FIELDS.every(field => Object.hasOwn(value, field)) && text(value.lastName, 200) && text(value.firstName, 200)
  && text(value.insertisNumber, 255) && (value.age === null || (Number.isInteger(value.age) && value.age >= 0 && value.age <= MAX));
const identityOf = row => Object.fromEntries(FIELDS.map(field => [field, row[field]]));
const equal = (a, b) => FIELDS.every(field => a[field] === b[field]);
async function transaction(db, operation) {
  try { return await db.$transaction(operation, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (["P2002", "P2034"].includes(error?.code)) throw new DossierVersionConflict();
    throw error;
  }
}
function context(db, caseId, now) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId) || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
}
async function authorizedIdentity(tx, cookieHeader, caseId, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({ where: { id: userId }, select: { id: true, role: true, enabled: true } });
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  const dossier = await tx.caseFile.findUnique({ where: { id: caseId },
    select: { id: true, referentId: true, archivedAt: true, version: true, artagReference: true } });
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id || !validArtagReference(dossier.artagReference)) throw new CaseAccessDenied();
  const referenceRevision = await tx.caseReferenceRevision.findFirst({ where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { artagReference: true, dossierVersion: true } });
  if (referenceRevision && (referenceRevision.artagReference !== dossier.artagReference || referenceRevision.dossierVersion > dossier.version)) throw new CaseIdentityHistoryUnavailable();
  const row = await tx.caseIdentity.findUnique({ where: { caseId }, select: { ...SELECT, dossierVersion: true } });
  const latest = await tx.caseIdentityRevision.findFirst({ where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { ...SELECT, dossierVersion: true } });
  if (Boolean(row) !== Boolean(latest) || (row && (!validIdentity(identityOf(row)) || !equal(row, latest)
    || row.dossierVersion !== latest.dossierVersion || row.dossierVersion < 1 || row.dossierVersion > dossier.version))) {
    throw new CaseIdentityHistoryUnavailable();
  }
  return { actor, dossier, row, identity: row ? identityOf(row) : EMPTY };
}

/** Ne complète jamais l'identité depuis une référence, un import ou un nom voisin. */
export async function updateCaseIdentity({ db, cookieHeader, caseId, input, now = new Date() } = {}) {
  if (!input || Array.isArray(input) || Object.keys(input).length !== 3
    || !["expectedVersion", "identity", "reason"].every(key => Object.hasOwn(input, key))
    || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0 || input.expectedVersion >= MAX
    || !validIdentity(input.identity) || typeof input.reason !== "string" || !input.reason.trim()
    || !input.reason.isWellFormed() || input.reason.length > 200 || /[\u0000-\u001f\u007f]/u.test(input.reason)) throw new InvalidCaseIdentity();
  context(db, caseId, now);
  const next = identityOf(input.identity), expectedVersion = input.expectedVersion, reason = input.reason.trim();
  return transaction(db, async tx => {
    const { actor, dossier, row, identity } = await authorizedIdentity(tx, cookieHeader, caseId, now);
    if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
    if (equal(identity, next)) throw new InvalidCaseIdentity();
    const changed = await tx.caseFile.updateMany({ where: { id: caseId, referentId: actor.id, archivedAt: null, version: expectedVersion },
      data: { version: { increment: 1 } } });
    if (changed.count !== 1) throw new DossierVersionConflict();
    const dossierVersion = expectedVersion + 1;
    if (!row) await tx.caseIdentity.create({ data: { caseId, dossierVersion, ...next } });
    else {
      const written = await tx.caseIdentity.updateMany({ where: { caseId, dossierVersion: row.dossierVersion }, data: { dossierVersion, ...next } });
      if (written.count !== 1) throw new DossierVersionConflict();
    }
    await tx.caseIdentityRevision.create({ data: {
      caseId, dossierVersion, previousLastName: identity.lastName, previousFirstName: identity.firstName,
      previousInsertisNumber: identity.insertisNumber, previousAge: identity.age, ...next, actorId: actor.id, reason,
    } });
    await tx.auditEvent.create({ data: { caseId, actorId: actor.id, eventType: "CASE_IDENTITY_UPDATED",
      purpose: "Modification versionnée du bloc identité du dossier" } });
    return { caseId, dossierVersion };
  });
}

export async function readCaseIdentity({ db, cookieHeader, caseId, beforeVersion, now = new Date() } = {}) {
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion) || beforeVersion < 1 || beforeVersion > MAX)) throw new InvalidCaseIdentity();
  context(db, caseId, now);
  return transaction(db, async tx => {
    const { actor, dossier, row, identity } = await authorizedIdentity(tx, cookieHeader, caseId, now);
    const revisions = await tx.caseIdentityRevision.findMany({
      where: { caseId, ...(beforeVersion === undefined ? {} : { dossierVersion: { lt: beforeVersion } }) },
      orderBy: { dossierVersion: "desc" }, take: PAGE_SIZE + 1,
      select: { ...SELECT, dossierVersion: true, previousLastName: true, previousFirstName: true,
        previousInsertisNumber: true, previousAge: true, actorId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, PAGE_SIZE).map(revision => ({ dossierVersion: revision.dossierVersion,
      previousIdentity: { lastName: revision.previousLastName, firstName: revision.previousFirstName,
        insertisNumber: revision.previousInsertisNumber, age: revision.previousAge },
      identity: identityOf(revision), actorId: revision.actorId, reason: revision.reason, createdAt: revision.createdAt }));
    await tx.auditEvent.create({ data: { caseId, actorId: actor.id, eventType: "CASE_IDENTITY_READ",
      purpose: "Consultation du bloc identité et de son historique" } });
    return { caseId, artagReference: dossier.artagReference, dossierVersion: dossier.version,
      identityVersion: row?.dossierVersion ?? 0, identity, history,
      nextBeforeVersion: revisions.length > PAGE_SIZE ? history.at(-1).dossierVersion : null };
  });
}
