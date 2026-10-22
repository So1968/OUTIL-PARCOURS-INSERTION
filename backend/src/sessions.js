import { createHash, randomBytes } from "node:crypto";

export const COOKIE_NAME = "__Host-artag-session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const TOKEN = /^[a-f0-9]{64}$/;

export function digestToken(raw) {
  return typeof raw === "string" && TOKEN.test(raw)
    ? createHash("sha256").update(raw).digest("hex") : null;
}

export function cookieToken(header) {
  if (typeof header !== "string" || header.length > 4096) return null;
  const entries = header.split(";").map(x => x.trim()).filter(x => x.startsWith(`${COOKIE_NAME}=`));
  if (entries.length !== 1) return null;
  const token = entries[0].slice(COOKIE_NAME.length + 1);
  return TOKEN.test(token) ? token : null;
}

export function sessionCookie(token) {
  if (!digestToken(token)) throw new Error("SESSION_REFUSEE");
  return `${COOKIE_NAME}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}`;
}
export const CLEAR_COOKIE = `${COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;

// Cette méthode est exclusivement réservée au callback d'authentification
// après validation cryptographique et attribution du compte par l'organisation.
export async function issueSession({ db, userId, now = new Date() }) {
  if (!db?.$transaction || typeof userId !== "string") throw new Error("SESSION_REFUSEE");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  await db.$transaction(async tx => {
    const user = await tx.userAccount.findUnique({ where: { id: userId }, select: { enabled: true } });
    if (!user?.enabled) throw new Error("SESSION_REFUSEE");
    await tx.webSession.create({ data: { userId, tokenDigest: digestToken(token), expiresAt } });
  });
  return { token, expiresAt };
}

export async function resolveSessionUserId({ db, cookieHeader, now = new Date() }) {
  const digest = digestToken(cookieToken(cookieHeader));
  if (!digest || !db?.webSession) return null;
  const s = await db.webSession.findUnique({
    where: { tokenDigest: digest },
    select: { userId: true, expiresAt: true, revokedAt: true, user: { select: { enabled: true } } },
  });
  return s && !s.revokedAt && s.user?.enabled && s.expiresAt instanceof Date && s.expiresAt > now
    ? s.userId : null;
}

export async function revokeSession({ db, cookieHeader, now = new Date() }) {
  const digest = digestToken(cookieToken(cookieHeader));
  if (!digest) return false;
  const result = await db.webSession.updateMany({
    where: { tokenDigest: digest, revokedAt: null }, data: { revokedAt: now },
  });
  return result.count > 0;
}
