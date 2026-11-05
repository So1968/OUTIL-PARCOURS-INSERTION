import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { validArtagReference } from "./caseReferenceService.js";
import { DossierVersionConflict } from "./sharedNoteService.js";
import { AUTONOMY_QUESTIONS, AUTONOMY_CHOICES } from "./autonomyQuestions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VERSION = 2147483647;
const PAGE_SIZE = 25;
const QUESTION_IDS = new Set(AUTONOMY_QUESTIONS.map(item => item.id));
const CHOICES = new Set(AUTONOMY_CHOICES);

export class InvalidCaseAutonomy extends Error {
  constructor() { super("SOCLE_AUTONOMIE_INVALIDE"); this.name = "InvalidCaseAutonomy"; }
}
export class CaseAutonomyHistoryUnavailable extends Error {
  constructor() { super("HISTORIQUE_AUTONOMIE_INDISPONIBLE"); this.name = "CaseAutonomyHistoryUnavailable"; }
}

function validReason(value) {
  return typeof value === "string" && value.isWellFormed() && value.trim().length > 0
    && value.length <= 200 && !/[\u0000-\u001f\u007f]/u.test(value);
}

// Le format correspond à la saisie du prototype ; aucun score ni analyse n'est calculé.
// Un repère non abordé n'est pas inventé et reste absent de l'objet.
export function canonicalAutonomyAnswers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).some(id => !QUESTION_IDS.has(id))) return null;
  const clean = {};
  for (const question of AUTONOMY_QUESTIONS) {
    if (!Object.hasOwn(value, question.id)) continue;
    const item = value[question.id];
    if (!item || typeof item !== "object" || Array.isArray(item)
      || Object.keys(item).length !== 3 || !["reponse", "note", "valide"].every(key => Object.hasOwn(item, key))
      || !CHOICES.has(item.reponse) || typeof item.note !== "string" || !item.note.isWellFormed()
      || Array.from(item.note).length > 1500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(item.note)
      || typeof item.valide !== "boolean") return null;
    clean[question.id] = { reponse: item.reponse, note: item.note, valide: item.valide };
  }
  return clean;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function context(db, caseId, now) {
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (typeof caseId !== "string" || !UUID.test(caseId)
    || !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
}
async function transaction(db, operation) {
  try { return await db.$transaction(operation, { isolationLevel: "Serializable" }); }
  catch (error) {
    if (["P2034", "P2002"].includes(error?.code)) throw new DossierVersionConflict();
    throw error;
  }
}

async function authorizedAutonomy(tx, cookieHeader, caseId, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({
    where: { id: userId }, select: { id: true, role: true, enabled: true },
  });
  // En attente de la grille de partage institutionnelle : référente titulaire uniquement.
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  const dossier = await tx.caseFile.findUnique({
    where: { id: caseId },
    select: { id: true, referentId: true, artagReference: true, archivedAt: true, version: true },
  });
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id
    || !validArtagReference(dossier.artagReference)) throw new CaseAccessDenied();

  const reference = await tx.caseReferenceRevision.findFirst({
    where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { artagReference: true, dossierVersion: true },
  });
  if (reference && (reference.artagReference !== dossier.artagReference
    || reference.dossierVersion > dossier.version)) throw new CaseAutonomyHistoryUnavailable();

  const row = await tx.caseAutonomy.findUnique({
    where: { caseId }, select: { dossierVersion: true, reponses: true },
  });
  const latest = await tx.caseAutonomyRevision.findFirst({
    where: { caseId }, orderBy: { dossierVersion: "desc" },
    select: { dossierVersion: true, reponses: true },
  });
  const answers = row ? canonicalAutonomyAnswers(row.reponses) : {};
  const latestAnswers = latest ? canonicalAutonomyAnswers(latest.reponses) : {};
  if (Boolean(row) !== Boolean(latest) || answers === null || latestAnswers === null
    || (row && (row.dossierVersion !== latest.dossierVersion || row.dossierVersion < 1
      || row.dossierVersion > dossier.version || !same(answers, latestAnswers)))) {
    throw new CaseAutonomyHistoryUnavailable();
  }
  return { actor, dossier, row, answers };
}

/** Une modification remplace l'état courant mais conserve la version précédente. */
export async function updateCaseAutonomy({ db, cookieHeader, caseId, input, now = new Date() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).length !== 3
    || !["expectedVersion", "reponses", "reason"].every(key => Object.hasOwn(input, key))
    || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0
    || input.expectedVersion >= MAX_VERSION || !validReason(input.reason)) throw new InvalidCaseAutonomy();
  const next = canonicalAutonomyAnswers(input.reponses);
  if (next === null) throw new InvalidCaseAutonomy();
  context(db, caseId, now);
  const expectedVersion = input.expectedVersion;
  return transaction(db, async tx => {
    const { actor, dossier, row, answers } = await authorizedAutonomy(tx, cookieHeader, caseId, now);
    if (dossier.version !== expectedVersion) throw new DossierVersionConflict();
    if (same(answers, next)) throw new InvalidCaseAutonomy();
    const changed = await tx.caseFile.updateMany({
      where: { id: caseId, referentId: actor.id, archivedAt: null, version: expectedVersion },
      data: { version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new DossierVersionConflict();
    const dossierVersion = expectedVersion + 1;
    if (!row) await tx.caseAutonomy.create({ data: { caseId, dossierVersion, reponses: next } });
    else {
      const updated = await tx.caseAutonomy.updateMany({
        where: { caseId, dossierVersion: row.dossierVersion },
        data: { dossierVersion, reponses: next },
      });
      if (updated.count !== 1) throw new DossierVersionConflict();
    }
    await tx.caseAutonomyRevision.create({ data: {
      caseId, dossierVersion, previousReponses: answers, reponses: next,
      actorId: actor.id, reason: input.reason.trim(),
    } });
    // Jamais de réponse, score, note libre ou raison dans les logs techniques.
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_AUTONOMY_UPDATED",
      purpose: "Modification versionnée des repères d'autonomie",
    } });
    return { caseId, dossierVersion };
  });
}

export async function readCaseAutonomy({ db, cookieHeader, caseId, beforeVersion, now = new Date() } = {}) {
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion)
    || beforeVersion < 1 || beforeVersion > MAX_VERSION)) throw new InvalidCaseAutonomy();
  context(db, caseId, now);
  return transaction(db, async tx => {
    const { actor, dossier, row, answers } = await authorizedAutonomy(tx, cookieHeader, caseId, now);
    const revisions = await tx.caseAutonomyRevision.findMany({
      where: { caseId, ...(beforeVersion === undefined ? {} : { dossierVersion: { lt: beforeVersion } }) },
      orderBy: { dossierVersion: "desc" }, take: PAGE_SIZE + 1,
      select: { dossierVersion: true, previousReponses: true, reponses: true,
        actorId: true, reason: true, createdAt: true },
    });
    const history = revisions.slice(0, PAGE_SIZE).map(revision => {
      const previous = canonicalAutonomyAnswers(revision.previousReponses);
      const next = canonicalAutonomyAnswers(revision.reponses);
      if (previous === null || next === null) throw new CaseAutonomyHistoryUnavailable();
      return {
        dossierVersion: revision.dossierVersion, previousReponses: previous,
        reponses: next, actorId: revision.actorId, reason: revision.reason,
        createdAt: revision.createdAt,
      };
    });
    await tx.auditEvent.create({ data: {
      caseId, actorId: actor.id, eventType: "CASE_AUTONOMY_READ",
      purpose: "Consultation des repères d'autonomie et de leurs versions",
    } });
    return {
      caseId, dossierVersion: dossier.version, autonomyVersion: row?.dossierVersion ?? 0,
      questions: AUTONOMY_QUESTIONS, choix: AUTONOMY_CHOICES, reponses: answers, history,
      nextBeforeVersion: revisions.length > PAGE_SIZE ? history.at(-1).dossierVersion : null,
    };
  });
}
