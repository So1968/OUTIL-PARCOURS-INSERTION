import { CAPABILITIES, ROLES, canAccessCase } from "./policy.js";
import { CaseAccessDenied, SecurityProviderUnavailable, toPolicyDossier } from "./caseAccessService.js";
import { resolveSessionUserId } from "./sessions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 25;

export class InvalidCaseDirectoryQuery extends Error {
  constructor() { super("REQUETE_DOSSIERS_INVALIDE"); this.name = "InvalidCaseDirectoryQuery"; }
}

export class CaseDirectoryChanged extends Error {
  constructor() { super("FILE_MODIFIEE_ENTRE_TEMPS"); this.name = "CaseDirectoryChanged"; }
}

function cursorPoint(cursor) {
  if (cursor === undefined) return null;
  if (typeof cursor !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(cursor)) throw new InvalidCaseDirectoryQuery();
  let point;
  try { point = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")); }
  catch { throw new InvalidCaseDirectoryQuery(); }
  if (!point || Object.keys(point).length !== 2 || typeof point.id !== "string" || !UUID.test(point.id)
    || typeof point.createdAt !== "string" || !Number.isFinite(Date.parse(point.createdAt))
    || new Date(point.createdAt).toISOString() !== point.createdAt) throw new InvalidCaseDirectoryQuery();
  return { id: point.id, createdAt: new Date(point.createdAt) };
}

/** Répertoire de rédaction ; ne donne aucun accès supplémentaire de continuité. */
export async function listWritableCases({ db, cookieHeader, before, now = new Date() } = {}) {
  const point = cursorPoint(before);
  if (!db?.$transaction || !db.webSession) throw new SecurityProviderUnavailable();
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new CaseAccessDenied();
  try {
    return await db.$transaction(async tx => {
      const userId = await resolveSessionUserId({ db: tx, cookieHeader, now });
      if (!userId) throw new CaseAccessDenied();
      const actor = await tx.userAccount.findUnique({
        where: { id: userId }, select: { id: true, role: true, enabled: true },
      });
      // SHARED_WRITE n'est actuellement autorisé qu'aux référentes habilitées.
      if (!actor?.enabled || actor.role !== ROLES.REFERENTE) throw new CaseAccessDenied();
      const rows = await tx.caseFile.findMany({
        where: {
          archivedAt: null,
          AND: [
            { OR: [{ referentId: actor.id }, { assignments: { some: {
              userId: actor.id, capability: "SHARED_WRITE", active: true,
            } } }] },
            ...(point ? [{ OR: [
              { createdAt: { lt: point.createdAt } },
              { createdAt: point.createdAt, id: { lt: point.id } },
            ] }] : []),
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: PAGE_SIZE + 1,
        select: {
          id: true, artagReference: true, version: true, createdAt: true, updatedAt: true, referentId: true,
          assignments: { where: { userId: actor.id, active: true, capability: "SHARED_WRITE" },
            select: { userId: true, capability: true, active: true } },
        },
      });
      if (rows.some(row => !canAccessCase({ actor, dossier: toPolicyDossier(row),
        capability: CAPABILITIES.SHARED_WRITE, now }))) throw new CaseAccessDenied();
      const cases = rows.slice(0, PAGE_SIZE).map(row => ({
        id: row.id, artagReference: row.artagReference, version: row.version,
        createdAt: row.createdAt, updatedAt: row.updatedAt,
        canManageReference: row.referentId === actor.id,
      }));
      await tx.auditEvent.createMany({
        data: (cases.length ? cases.map(row => row.id) : [null]).map(caseId => ({
          caseId, actorId: actor.id, eventType: "CASE_DIRECTORY_READ",
          purpose: "Consultation de la file active de rédaction",
        })),
      });
      const last = cases.at(-1);
      return {
        cases,
        nextCursor: rows.length > PAGE_SIZE ? Buffer.from(JSON.stringify({
          id: last.id, createdAt: last.createdAt.toISOString(),
        })).toString("base64url") : null,
      };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error?.code === "P2034") throw new CaseDirectoryChanged();
    throw error;
  }
}
