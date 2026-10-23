// Nettoyage explicite des jetons OIDC consommables et sessions expirées.
// La purge n'est pas lancée au démarrage : elle nécessite une action opérateur.
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function authPruneCriteria(now = new Date(), retentionMs = RETENTION_MS) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())
    || !Number.isSafeInteger(retentionMs) || retentionMs < 60_000) {
    throw new TypeError("MAINTENANCE_DATE_INVALIDE");
  }
  const cutoff = new Date(now.getTime() - retentionMs);
  return {
    attempts: { expiresAt: { lt: cutoff } },
    sessions: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { revokedAt: { lt: cutoff } },
      ],
    },
  };
}

export async function inspectAuthState({ db, now = new Date(), retentionMs = RETENTION_MS } = {}) {
  if (!db?.oidcLoginAttempt?.count || !db?.webSession?.count) {
    throw new TypeError("MAINTENANCE_DB_INDISPONIBLE");
  }
  const criteria = authPruneCriteria(now, retentionMs);
  const [expiredAttempts, oldSessions] = await Promise.all([
    db.oidcLoginAttempt.count({ where: criteria.attempts }),
    db.webSession.count({ where: criteria.sessions }),
  ]);
  return { dryRun: true, expiredAttempts, oldSessions };
}

export async function pruneAuthState({ db, now = new Date(), retentionMs = RETENTION_MS } = {}) {
  if (!db?.$transaction) throw new TypeError("MAINTENANCE_DB_INDISPONIBLE");
  const criteria = authPruneCriteria(now, retentionMs);
  const result = await db.$transaction(async tx => {
    const attempts = await tx.oidcLoginAttempt.deleteMany({ where: criteria.attempts });
    const sessions = await tx.webSession.deleteMany({ where: criteria.sessions });
    return { expiredAttempts: attempts.count, oldSessions: sessions.count };
  });
  return { dryRun: false, ...result };
}
