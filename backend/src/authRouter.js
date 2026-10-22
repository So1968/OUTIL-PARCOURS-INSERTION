import { Router } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { issueSession, revokeSession, sessionCookie, CLEAR_COOKIE } from "./sessions.js";

const FLOW_COOKIE = "__Host-artag-oidc";
const FLOW_TIME_MS = 10 * 60 * 1000;
const RANDOM = /^[a-f0-9]{64}$/;
const digest = v => createHash("sha256").update(v).digest("hex");
const cookie = state => `${FLOW_COOKIE}=${state}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`;
const clear = `${FLOW_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;

function fromCookie(header) {
  if (typeof header !== "string" || header.length > 4096) return null;
  const candidates = header.split(";").map(s => s.trim())
    .filter(s => s.startsWith(`${FLOW_COOKIE}=`));
  if (candidates.length !== 1) return null;
  const value = candidates[0].slice(FLOW_COOKIE.length + 1);
  return RANDOM.test(value) ? value : null;
}

export function createAuthRouter({ db, provider, origin, redirectUri } = {}) {
  if (!db?.oidcLoginAttempt || !db?.identityLink || !provider
    || typeof provider.authorizationUrl !== "function"
    || typeof provider.verifyCallback !== "function") {
    throw new Error("AUTHENTIFICATION_NON_CONFIGUREE");
  }
  const base = new URL(origin);
  if (base.protocol !== "https:" || base.pathname !== "/"
    || base.search || base.hash
    || new URL(redirectUri).origin !== base.origin
    || new URL(redirectUri).pathname !== "/auth/callback") {
    throw new Error("AUTHENTIFICATION_NON_CONFIGUREE");
  }

  const router = Router();

  router.get("/login", async (_req, res) => {
    try {
      const state = randomBytes(32).toString("hex");
      const nonce = randomBytes(32).toString("hex");
      const verifier = provider.generateVerifier();
      const destination = await provider.authorizationUrl({ state, nonce, verifier });
      // Stocker le retour d'état uniquement en empreinte et expire rapidement.
      await db.oidcLoginAttempt.create({
        data: { stateDigest: digest(state), verifier, nonce, expiresAt: new Date(Date.now() + FLOW_TIME_MS) },
      });
      res.setHeader("Set-Cookie", cookie(state));
      res.redirect(302, destination);
    } catch {
      res.status(503).json({ error: "AUTHENTIFICATION_INDISPONIBLE" });
    }
  });

  router.get("/callback", async (req, res) => {
    // Ne pas refléter le code, le state ou le jeton dans les logs / réponses.
    res.setHeader("Set-Cookie", clear);
    const state = req.query.state;
    const fromBrowser = fromCookie(req.headers.cookie);
    if (typeof state !== "string" || !RANDOM.test(state) || !fromBrowser
      || !timingSafeEqual(Buffer.from(state), Buffer.from(fromBrowser))) {
      return res.status(401).json({ error: "AUTHENTIFICATION_REFUSEE" });
    }
    try {
      const stateDigest = digest(state);
      const attempt = await db.oidcLoginAttempt.findUnique({ where: { stateDigest } });
      if (!attempt || attempt.expiresAt <= new Date()) {
        return res.status(401).json({ error: "AUTHENTIFICATION_REFUSEE" });
      }
      // Usage unique : consommer l'état AVANT l'échange de code.
      const consumed = await db.oidcLoginAttempt.deleteMany({ where: { stateDigest } });
      if (consumed.count !== 1) return res.status(401).json({ error: "AUTHENTIFICATION_REFUSEE" });

      const callbackUrl = new URL(redirectUri);
      callbackUrl.search = new URL(req.originalUrl, base).search;
      const verified = await provider.verifyCallback({
        callbackUrl: callbackUrl.href, verifier: attempt.verifier,
        nonce: attempt.nonce, state,
      });
      if (verified.issuer !== provider.issuer || !verified.subject || verified.subject.length > 255) {
        return res.status(401).json({ error: "AUTHENTIFICATION_REFUSEE" });
      }
      const link = await db.identityLink.findUnique({
        where: { issuer_subject: { issuer: verified.issuer, subject: verified.subject } },
        select: { userId: true, user: { select: { enabled: true } } },
      });
      if (!link?.user?.enabled) return res.status(403).json({ error: "COMPTE_NON_HABILITE" });
      const { token } = await issueSession({ db, userId: link.userId });
      res.setHeader("Set-Cookie", [clear, sessionCookie(token)]);
      return res.redirect(303, "/");
    } catch {
      return res.status(503).json({ error: "AUTHENTIFICATION_INDISPONIBLE" });
    }
  });

  router.post("/logout", async (req, res) => {
    // Défense CSRF pour une opération modifiant l'état de session.
    if (req.headers.origin !== base.origin) {
      return res.status(403).json({ error: "ORIGINE_REFUSEE" });
    }
    try {
      await revokeSession({ db, cookieHeader: req.headers.cookie });
      res.setHeader("Set-Cookie", CLEAR_COOKIE);
      return res.status(204).end();
    } catch {
      return res.status(503).json({ error: "SERVICE_INDISPONIBLE" });
    }
  });

  return router;
}
