import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { validArtagReference } from "./caseReferenceService.js";
import { DossierVersionConflict } from "./sharedNoteService.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2147483647;
const PAGE_SIZE = 25;

export const BRIEF_FIELDS = Object.freeze({
  "synthese-courte": Object.freeze([
    "situationGlobale", "difficultesPrincipales", "pointsAppui",
    "sujetsTravailles", "etapeActuelle", "vigilanceUtile",
  ]),
  "note-continuite": Object.freeze([
    "situationEnCours", "prioriteImmediate", "dejaFait",
    "relaisAbsence", "vigilanceUtile",
  ]),
});
const KIND = Object.freeze({
  "synthese-courte": "SYNTHESE_COURTE",
  "note-continuite": "NOTE_CONTINUITE",
});
const MAX_TOTAL = Object.freeze({ "synthese-courte": 1400, "note-continuite": 1000 });

export class InvalidCaseBrief extends Error {
  constructor() { super("BLOC_COURT_INVALIDE"); this.name = "InvalidCaseBrief"; }
}
export class CaseBriefHistoryUnavailable extends Error {
  constructor() { super("HISTORIQUE_BLOC_COURT_INDISPONIBLE"); this.name = "CaseBriefHistoryUnavailable"; }
}

export function canonicalBrief(type, content) {
  const fields = BRIEF_FIELDS[type];
  if (!fields || !content || typeof content !== "object" || Array.isArray(content)
    || Object.keys(content).length !== fields.length
    || !fields.every(key => Object.hasOwn(content, key))) return null;
  let total = 0;
  const clean = {};
  for (const field of fields) {
    const value = content[field];
    if (typeof value !== "string" || !value.isWellFormed()
      || value !== value.trim() && value.length !== 0
      || Array.from(value).some(char => {
        const code = char.codePointAt(0);
        return (code < 32 && code !== 10) || code === 127;
      })) return null;
    const length = Array.from(value).length;
    if (length > 350) return null;
    total += length;
    clean[field] = value;
  }
  if (total > MAX_TOTAL[type]) return null;
  return clean;
}
const blank = type => Object.fromEntries(BRIEF_FIELDS[type].map(field => [field, ""]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const validReason = reason => typeof reason === "string" && reason.isWellFormed()
  && reason.length <= 200 && reason.trim().length > 0
  && !Array.from(reason).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127);

function checkContext(db, caseId, now) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)
    || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
}
async function transaction(db, operation) {
  try { return await db.$transaction(operation, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (["P2002", "P2034"].includes(error?.code)) throw new DossierVersionConflict();
    throw error;
  }
}

async function authorize(tx, cookieHeader, caseId, kind, type, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({
    where: { id: userId }, select: { id: true, role: true, enabled: true },
  });
  // La politique d'accès à la continuité élargie reste à valider avec ARTAG.
  // Une délégation de notes ne suffit pas pour lire la synthèse.
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  const dossier = await tx.caseFile.findUnique({ where: { id: caseId },
    select: { id: true, version: true, referentId: true, archivedAt: true, artagReference: true },
  });
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id
    || !validArtagReference(dossier.artagReference)) throw new CaseAccessDenied();
  const reference = await tx.caseReferenceRevision.findFirst({
    where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { artagReference: true, dossierVersion: true },
  });
  if (reference && (reference.artagReference !== dossier.artagReference
    || reference.dossierVersion > dossier.version)) throw new CaseBriefHistoryUnavailable();
  const row = await tx.caseBrief.findUnique({
    where: { caseId_kind: { caseId, kind } },
    select: { dossierVersion: true, content: true },
  });
  const latest = await tx.caseBriefRevision.findFirst({
    where: { caseId, kind }, orderBy: { dossierVersion: "desc" },
    select: { dossierVersion: true, content: true },
  });
  const current = row ? canonicalBrief(type, row.content) : blank(type);
  const recorded = latest ? canonicalBrief(type, latest.content) : blank(type);
  if (Boolean(row) !== Boolean(latest) || current === null || recorded === null
    || row && (row.dossierVersion !== latest.dossierVersion
      || row.dossierVersion < 1 || row.dossierVersion > dossier.version
      || !same(current, recorded))) throw new CaseBriefHistoryUnavailable();
  return { actor, dossier, row, current };
}

export async function updateCaseBrief({ db, cookieHeader, caseId, type, input, now = new Date() } = {}) {
  if (!KIND[type] || !input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).length !== 3
    || !["expectedVersion", "content", "reason"].every(key => Object.hasOwn(input, key))
    || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0
    || input.expectedVersion >= MAX || !validReason(input.reason)) throw new InvalidCaseBrief();
  const next = canonicalBrief(type, input.content);
  if (next === null) throw new InvalidCaseBrief();
  checkContext(db, caseId, now);
  return transaction(db, async tx => {
    const kind = KIND[type], { actor, dossier, row, current } = await authorize(tx, cookieHeader, caseId, KIND[type], type, now);
    if (dossier.version !== input.expectedVersion) throw new DossierVersionConflict();
    if (same(next, current)) throw new InvalidCaseBrief();
    const updated = await tx.caseFile.updateMany({
      where: { id: caseId, referentId: actor.id, archivedAt: null, version: input.expectedVersion },
      data: { version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new DossierVersionConflict();
    const dossierVersion = input.expectedVersion + 1;
    if (!row) {
      await tx.caseBrief.create({ data: { caseId, kind, dossierVersion, content: next } });
    } else {
      const changed = await tx.caseBrief.updateMany({
        where: { caseId, kind, dossierVersion: row.dossierVersion },
        data: { dossierVersion, content: next },
      });
      if (changed.count !== 1) throw new DossierVersionConflict();
    }
    await tx.caseBriefRevision.create({ data: {
      caseId, kind, dossierVersion, previousContent: current, content: next,
      actorId: actor.id, reason: input.reason.trim(),
    } });
    // Les contenus et raisons ne sont jamais recopiés dans le journal technique.
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_BRIEF_UPDATED",
      purpose: "Modification versionnée d'un bloc court du dossier",
    } });
    return { caseId, type, dossierVersion };
  });
}

export async function readCaseBrief({ db, cookieHeader, caseId, type, beforeVersion, now = new Date() } = {}) {
  if (!KIND[type] || beforeVersion !== undefined && (!Number.isInteger(beforeVersion)
    || beforeVersion < 1 || beforeVersion > MAX)) throw new InvalidCaseBrief();
  checkContext(db, caseId, now);
  return transaction(db, async tx => {
    const { actor, dossier, row, current } = await authorize(tx, cookieHeader, caseId, KIND[type], type, now);
    const revisions = await tx.caseBriefRevision.findMany({
      where: { caseId, kind: KIND[type],
        ...(beforeVersion === undefined ? {} : { dossierVersion: { lt: beforeVersion } }) },
      orderBy: { dossierVersion: "desc" }, take: PAGE_SIZE + 1,
      select: { dossierVersion: true, previousContent: true, content: true,
        actorId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, PAGE_SIZE).map(revision => {
      const before = canonicalBrief(type, revision.previousContent);
      const after = canonicalBrief(type, revision.content);
      if (!before || !after || revision.dossierVersion < 1
        || revision.dossierVersion > dossier.version) throw new CaseBriefHistoryUnavailable();
      return { dossierVersion: revision.dossierVersion, previousContent: before,
        content: after, actorId: revision.actorId, reason: revision.reason,
        createdAt: revision.createdAt };
    });
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_BRIEF_READ",
      purpose: "Consultation d'un bloc court et de son historique",
    } });
    return { caseId, type, dossierVersion: dossier.version, briefVersion: row?.dossierVersion ?? 0,
      content: current, history,
      nextBeforeVersion: revisions.length > PAGE_SIZE ? history.at(-1).dossierVersion : null };
  });
}
