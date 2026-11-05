import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { validArtagReference } from "./caseReferenceService.js";
import { DossierVersionConflict } from "./sharedNoteService.js";

// Six axes, strictement ceux du cahier des charges « relation d'aide ».
export const PROFESSIONAL_REFLECTION_FIELDS = Object.freeze([
  "entreeRelation", "expressionDemande", "receptionAideProposee",
  "possibiliteCoConstruction", "rapportCadre", "postureProfessionnelleAPrivilegier",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VERSION = 2147483647;
const PAGE_SIZE = 25;

export class InvalidProfessionalReflection extends Error {
  constructor() { super("REFLEXION_PROFESSIONNELLE_INVALIDE"); this.name = "InvalidProfessionalReflection"; }
}
export class ProfessionalReflectionHistoryUnavailable extends Error {
  constructor() { super("HISTORIQUE_REFLEXION_INDISPONIBLE"); this.name = "ProfessionalReflectionHistoryUnavailable"; }
}
const blank = () => Object.fromEntries(PROFESSIONAL_REFLECTION_FIELDS.map(key => [key, ""]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function canonicalProfessionalReflection(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)
    || Object.keys(content).length !== PROFESSIONAL_REFLECTION_FIELDS.length
    || !PROFESSIONAL_REFLECTION_FIELDS.every(field => Object.hasOwn(content, field))) return null;
  let total = 0;
  const clean = {};
  for (const field of PROFESSIONAL_REFLECTION_FIELDS) {
    const value = content[field];
    if (typeof value !== "string" || !value.isWellFormed()
      || value !== value.trim()
      || Array.from(value).some(char => {
        const code = char.codePointAt(0);
        return (code < 32 && code !== 10) || code === 127;
      })) return null;
    const length = Array.from(value).length;
    if (length > 1200) return null;
    total += length;
    clean[field] = value;
  }
  return total <= 6000 ? clean : null;
}
const validReason = reason => typeof reason === "string" && reason.isWellFormed()
  && reason.trim().length > 0 && reason.length <= 200
  && !Array.from(reason).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127);

function context(db, caseId, now) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)
    || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
}

async function transaction(db, work) {
  try { return await db.$transaction(work, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (["P2002", "P2034"].includes(error?.code)) throw new DossierVersionConflict();
    throw error;
  }
}

async function access(tx, cookieHeader, caseId, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({
    where: { id: userId }, select: { id: true, role: true, enabled: true },
  });
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  const dossier = await tx.caseFile.findUnique({ where: { id: caseId },
    select: { id: true, version: true, referentId: true, archivedAt: true, artagReference: true },
  });
  // Une ancienne référente n'accède plus au dossier ; une nouvelle ne lit
  // jamais la réflexion d'une autre autrice, même par accès « relais ».
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id
    || !validArtagReference(dossier.artagReference)) throw new CaseAccessDenied();
  const reference = await tx.caseReferenceRevision.findFirst({
    where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { artagReference: true, dossierVersion: true },
  });
  if (reference && (reference.artagReference !== dossier.artagReference
    || reference.dossierVersion > dossier.version)) throw new ProfessionalReflectionHistoryUnavailable();
  const key = { caseId_ownerId: { caseId, ownerId: actor.id } };
  const row = await tx.caseProfessionalReflection.findUnique({
    where: key, select: { dossierVersion: true, content: true },
  });
  const latest = await tx.caseProfessionalReflectionRevision.findFirst({
    where: { caseId, ownerId: actor.id }, orderBy: { dossierVersion: "desc" },
    select: { dossierVersion: true, content: true },
  });
  const current = row ? canonicalProfessionalReflection(row.content) : blank();
  const last = latest ? canonicalProfessionalReflection(latest.content) : blank();
  if (Boolean(row) !== Boolean(latest) || !current || !last
    || row && (row.dossierVersion !== latest.dossierVersion
      || row.dossierVersion < 1 || row.dossierVersion > dossier.version
      || !same(current, last))) throw new ProfessionalReflectionHistoryUnavailable();
  return { actor, dossier, row, current };
}

export async function updateProfessionalReflection({ db, cookieHeader, caseId, input, now = new Date() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).length !== 3
    || !["expectedVersion", "content", "reason"].every(key => Object.hasOwn(input, key))
    || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0
    || input.expectedVersion >= MAX_VERSION || !validReason(input.reason)) throw new InvalidProfessionalReflection();
  const next = canonicalProfessionalReflection(input.content);
  if (!next) throw new InvalidProfessionalReflection();
  context(db, caseId, now);
  return transaction(db, async tx => {
    const { actor, dossier, row, current } = await access(tx, cookieHeader, caseId, now);
    if (dossier.version !== input.expectedVersion) throw new DossierVersionConflict();
    if (same(next, current)) throw new InvalidProfessionalReflection();
    const updated = await tx.caseFile.updateMany({
      where: { id: caseId, version: input.expectedVersion, referentId: actor.id, archivedAt: null },
      data: { version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new DossierVersionConflict();
    const dossierVersion = input.expectedVersion + 1;
    if (!row) await tx.caseProfessionalReflection.create({
      data: { caseId, ownerId: actor.id, dossierVersion, content: next },
    });
    else {
      const changed = await tx.caseProfessionalReflection.updateMany({
        where: { caseId, ownerId: actor.id, dossierVersion: row.dossierVersion },
        data: { dossierVersion, content: next },
      });
      if (changed.count !== 1) throw new DossierVersionConflict();
    }
    await tx.caseProfessionalReflectionRevision.create({
      data: { caseId, ownerId: actor.id, dossierVersion, previousContent: current,
        content: next, reason: input.reason.trim() },
    });
    // L'audit ne contient ni réflexion ni motif de correction.
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_PROF_REFLECTION_UPDATED",
      purpose: "Modification de la réflexion professionnelle réservée",
    } });
    return { caseId, dossierVersion };
  });
}

export async function readProfessionalReflection({ db, cookieHeader, caseId, beforeVersion, now = new Date() } = {}) {
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion)
    || beforeVersion < 1 || beforeVersion > MAX_VERSION)) throw new InvalidProfessionalReflection();
  context(db, caseId, now);
  return transaction(db, async tx => {
    const { actor, dossier, row, current } = await access(tx, cookieHeader, caseId, now);
    const revisions = await tx.caseProfessionalReflectionRevision.findMany({
      where: { caseId, ownerId: actor.id,
        ...(beforeVersion === undefined ? {} : { dossierVersion: { lt: beforeVersion } }) },
      orderBy: { dossierVersion: "desc" }, take: PAGE_SIZE + 1,
      select: { dossierVersion: true, previousContent: true, content: true,
        ownerId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, PAGE_SIZE).map(revision => {
      const previous = canonicalProfessionalReflection(revision.previousContent);
      const after = canonicalProfessionalReflection(revision.content);
      if (!previous || !after || revision.ownerId !== actor.id
        || revision.dossierVersion < 1 || revision.dossierVersion > dossier.version) {
        throw new ProfessionalReflectionHistoryUnavailable();
      }
      return { dossierVersion: revision.dossierVersion, previousContent: previous,
        content: after, actorId: revision.ownerId, reason: revision.reason,
        createdAt: revision.createdAt };
    });
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_PROF_REFLECTION_READ",
      purpose: "Lecture de la réflexion professionnelle réservée",
    } });
    return { caseId, dossierVersion: dossier.version, reflectionVersion: row?.dossierVersion ?? 0,
      content: current, history,
      nextBeforeVersion: revisions.length > PAGE_SIZE ? history.at(-1).dossierVersion : null };
  });
}
