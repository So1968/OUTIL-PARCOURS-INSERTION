import { CAPABILITIES, canAccessCase } from "./policy.js";

// La session est résolue exclusivement par un fournisseur serveur vérifié.
// Aucun rôle, identifiant de compte ou droit fourni dans une requête HTTP ne doit être accepté.
export class CaseAccessDenied extends Error {
  constructor() {
    super("DOSSIER_INDISPONIBLE");
    this.name = "CaseAccessDenied";
    this.code = "DOSSIER_INDISPONIBLE";
  }
}

export class SecurityProviderUnavailable extends Error {
  constructor() {
    super("AUTHENTIFICATION_SERVEUR_NON_CONFIGUREE");
    this.name = "SecurityProviderUnavailable";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DB_CAPABILITIES = Object.freeze({
  SHARED_READ: CAPABILITIES.SHARED_READ,
  SHARED_WRITE: CAPABILITIES.SHARED_WRITE,
  TNS_READ: CAPABILITIES.TNS_READ,
  TNS_WRITE: CAPABILITIES.TNS_WRITE,
  RESERVED_READ: CAPABILITIES.RESERVED_READ,
  RESERVED_WRITE: CAPABILITIES.RESERVED_WRITE,
});

function toPolicyDossier(record) {
  return {
    id: record.id,
    referentId: record.referentId,
    assignments: (record.assignments || []).map((a) => ({
      userId: a.userId,
      active: a.active,
      capability: DB_CAPABILITIES[a.capability],
    })),
    grants: (record.grants || []).map((grant) => ({
      userId: grant.userId,
      capability: DB_CAPABILITIES[grant.capability],
      reason: grant.reason,
      approvedBy: grant.approvedById,
      startsAt: grant.startsAt,
      expiresAt: grant.expiresAt,
      revokedAt: grant.revokedAt,
    })),
  };
}

/**
 * Prototype de couche de service, volontairement non branché aux routes HTTP.
 *
 * - resolveVerifiedSubject doit être fourni par un futur adaptateur SSO / session
 *   interne vérifié ; il retourne seulement l'identifiant technique utilisateur.
 * - Le rôle et l'état actif proviennent de PostgreSQL, jamais du navigateur.
 * - Aucun texte de note ou champ nominatif n'est retourné.
 * - Une écriture du journal est obligatoire avant de retourner le résultat.
 * - Aucun connecteur externe n'est appelé.
 */
export async function readCaseOverview({
  db,
  session,
  resolveVerifiedSubject,
  caseId,
  now = new Date(),
} = {}) {
  if (typeof resolveVerifiedSubject !== "function") {
    throw new SecurityProviderUnavailable();
  }
  if (!db || typeof db.$transaction !== "function") {
    throw new SecurityProviderUnavailable();
  }
  const subject = await resolveVerifiedSubject(session);
  if (typeof subject !== "string" || !UUID.test(subject) ||
    typeof caseId !== "string" || !UUID.test(caseId) ||
    !(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new CaseAccessDenied();
  }

  return db.$transaction(async (tx) => {
    const actor = await tx.userAccount.findUnique({
      where: { id: subject },
      select: { id: true, role: true, enabled: true },
    });
    if (!actor?.enabled) throw new CaseAccessDenied();

    const dossier = await tx.caseFile.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        referentId: true,
        archivedAt: true,
        version: true,
        updatedAt: true,
        assignments: {
          where: { active: true },
          select: { userId: true, capability: true, active: true },
        },
        grants: {
          where: {
            revokedAt: null,
            startsAt: { lte: now },
            expiresAt: { gt: now },
          },
          select: {
            userId: true, capability: true, reason: true, approvedById: true,
            startsAt: true, expiresAt: true, revokedAt: true,
          },
        },
      },
    });
    if (!dossier || dossier.archivedAt ||
      !canAccessCase({
        actor,
        dossier: toPolicyDossier(dossier),
        capability: CAPABILITIES.SHARED_READ,
        now,
      })) {
      // Ne pas distinguer dossier inexistant et dossier non autorisé.
      throw new CaseAccessDenied();
    }

    // Une consultation sans journal ne doit jamais être considérée comme réussie.
    // La transaction annule son écriture si elle échoue.
    await tx.auditEvent.create({
      data: {
        caseId: dossier.id,
        actorId: actor.id,
        eventType: "CASE_OVERVIEW_READ",
        purpose: "Consultation de métadonnées de continuité",
      },
    });

    return Object.freeze({
      id: dossier.id,
      version: dossier.version,
      updatedAt: dossier.updatedAt,
      // Intentionnellement aucune note, identité, donnée sensible ou lien externe.
    });
  }, { isolationLevel: "Serializable" });
}
