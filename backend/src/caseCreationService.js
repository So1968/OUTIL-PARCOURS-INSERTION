import { createHash } from "node:crypto";
import { ROLES } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";
import { validArtagReference } from "./caseReferenceService.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class InvalidCaseCreation extends Error {
  constructor() { super("CREATION_DOSSIER_INVALIDE"); this.name = "InvalidCaseCreation"; }
}
export class CaseCreationConflict extends Error {
  constructor() { super("CREATION_DOSSIER_EN_CONFLIT"); this.name = "CaseCreationConflict"; }
}

async function creationActor(tx, cookieHeader, now) {
  const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
  if (!userId) throw new CaseAccessDenied();
  const actor = await tx.userAccount.findUnique({
    where: { id: userId }, select: { id: true, role: true, enabled: true },
  });
  if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
  return actor;
}

async function recoverCreation(tx, actor, requestId, referenceDigest) {
  const request = await tx.caseCreationRequest.findUnique({
    where: { actorId_requestId: { actorId: actor.id, requestId } },
    select: { referenceDigest: true, caseFile: {
      select: { id: true, referentId: true, archivedAt: true, artagReference: true, version: true,
        referenceRevisions: { orderBy: { dossierVersion: "desc" }, take: 1,
          select: { dossierVersion: true, artagReference: true } } },
    } },
  });
  if (!request) return null;
  if (request.referenceDigest !== referenceDigest) throw new CaseCreationConflict();
  const dossier = request.caseFile;
  // Une ancienne clé n'accorde aucun droit sur un dossier réaffecté ou archivé.
  if (!dossier || dossier.archivedAt || dossier.referentId !== actor.id) throw new CaseAccessDenied();
  const latest = dossier.referenceRevisions[0];
  if (!validArtagReference(dossier.artagReference) || !latest || latest.artagReference !== dossier.artagReference
    || latest.dossierVersion > dossier.version) throw new CaseCreationConflict();
  await tx.auditEvent.create({ data: {
    caseId: dossier.id, actorId: actor.id, eventType: "CASE_CREATION_REPLAYED",
    purpose: "Vérification d'une création de dossier déjà enregistrée",
  } });
  return { requestId, created: false, caseId: dossier.id,
    artagReference: dossier.artagReference, dossierVersion: dossier.version };
}

/** Création de recette limitée au propre dossier de la référente connectée. */
export async function createCase({ db, cookieHeader, input, now = new Date() } = {}) {
  if (!input || Array.isArray(input) || Object.keys(input).length !== 2
    || !Object.hasOwn(input, "requestId") || !Object.hasOwn(input, "artagReference")
    || typeof input.requestId !== "string" || !UUID.test(input.requestId)
    || !validArtagReference(input.artagReference)) throw new InvalidCaseCreation();
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
  // PostgreSQL UUID est insensible à la casse ; la réponse utilise sa forme canonique.
  const requestId = input.requestId.toLowerCase();
  const artagReference = input.artagReference;
  const referenceDigest = createHash("sha256").update(artagReference, "utf8").digest("hex");
  const transaction = operation => db.$transaction(operation, { isolationLevel: "Serializable" });
  try {
    return await transaction(async tx => {
      const actor = await creationActor(tx, cookieHeader, now);
      const existing = await recoverCreation(tx, actor, requestId, referenceDigest);
      if (existing) return existing;
      const dossier = await tx.caseFile.create({
        data: { referentId: actor.id, artagReference, version: 1 },
        select: { id: true, artagReference: true, version: true },
      });
      await tx.caseCreationRequest.create({ data: {
        actorId: actor.id, requestId, caseId: dossier.id, referenceDigest,
      } });
      await tx.caseReferenceRevision.create({ data: {
        caseId: dossier.id, dossierVersion: 1, previousReference: null,
        artagReference: dossier.artagReference, actorId: actor.id, reason: "Création du dossier",
      } });
      await tx.auditEvent.create({ data: {
        caseId: dossier.id, actorId: actor.id, eventType: "CASE_CREATED",
        purpose: "Création d'un dossier identifié par sa référente titulaire",
      } });
      return { requestId, created: true, caseId: dossier.id,
        artagReference: dossier.artagReference, dossierVersion: dossier.version };
    });
  } catch (error) {
    if (!["P2002", "P2034"].includes(error?.code)) throw error;
    // Rapprochement par la seule clé personnelle après collision : cette seconde
    // transaction ne tente JAMAIS une nouvelle création ni une recherche globale.
    try {
      const existing = await transaction(async tx => recoverCreation(tx,
        await creationActor(tx, cookieHeader, now), requestId, referenceDigest));
      if (existing) return existing;
    } catch (recoveryError) {
      if (!["P2002", "P2034"].includes(recoveryError?.code)) throw recoveryError;
    }
    throw new CaseCreationConflict();
  }
}
