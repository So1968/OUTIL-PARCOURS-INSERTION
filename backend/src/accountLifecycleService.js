import { resolveSessionUserId } from "./sessions.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AccountLifecycleDenied extends Error {
  constructor() { super("GESTION_COMPTE_REFUSEE"); this.name = "AccountLifecycleDenied"; }
}

/**
 * Opération interne uniquement. AUCUNE route HTTP.
 * Le rôle ADMIN_TECHNIQUE autorise la maintenance des comptes, jamais l'accès
 * aux notes ou aux dossiers. L'approbation institutionnelle est nécessaire,
 * mais doit être vérifiée par un futur processus administratif approuvé.
 */
export async function disableAccountAndRevokeSessions({
  db, administratorCookie, targetUserId, approvalReference, now = new Date(),
} = {}) {
  if (!db?.$transaction || typeof targetUserId !== "string" || !UUID.test(targetUserId)
    || typeof approvalReference !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(approvalReference)
    || !(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new AccountLifecycleDenied();
  }
  const actorId = await resolveSessionUserId({ db, cookieHeader: administratorCookie, now });
  if (!actorId || actorId === targetUserId) throw new AccountLifecycleDenied();

  return db.$transaction(async tx => {
    const actor = await tx.userAccount.findUnique({
      where: { id: actorId }, select: { id: true, role: true, enabled: true },
    });
    if (!actor?.enabled || actor.role !== "ADMIN_TECHNIQUE") {
      throw new AccountLifecycleDenied();
    }
    const target = await tx.userAccount.findUnique({
      where: { id: targetUserId }, select: { id: true, enabled: true },
    });
    if (!target?.enabled) throw new AccountLifecycleDenied();

    const updated = await tx.userAccount.updateMany({
      where: { id: targetUserId, enabled: true },
      data: { enabled: false },
    });
    if (updated.count !== 1) throw new AccountLifecycleDenied();
    const revoked = await tx.webSession.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        eventType: "ACCOUNT_DISABLED_SESSIONS_REVOKED",
        // Pas de nom, email ou jeton dans les traces ; la justification
        // institutionnelle est à vérifier hors de ce prototype.
        purpose: "Compte désactivé et sessions révoquées après autorisation",
      },
    });
    return { disabled: true, revokedSessions: revoked.count };
  }, { isolationLevel: "Serializable" });
}
