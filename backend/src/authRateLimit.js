// Protection mémoire bornée pour la recette mono-processus, non distribuée.
// Ne jamais se fier à X-Forwarded-For. En production, imposer un limiteur
// partagé au niveau du proxy / WAF approuvé par l'organisation.
export function createRequestLimiter({
  maxAttempts = 20,
  windowMs = 10 * 60_000,
  maxKeys = 2048,
  now = () => Date.now(),
} = {}) {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1
    || !Number.isSafeInteger(windowMs) || windowMs < 1000
    || !Number.isSafeInteger(maxKeys) || maxKeys < 1) {
    throw new TypeError("LIMITER_CONFIGURATION_INVALIDE");
  }
  const entries = new Map();
  const check = (key) => {
    const current = now();
    if (!Number.isFinite(current)) return { allowed: false, retryAfter: 60 };
    // Évacue les clés expirées pour empêcher la croissance sans borne.
    for (const [id, value] of entries) {
      if (value.until <= current) entries.delete(id);
    }
    const existing = entries.get(key);
    if (existing) {
      if (existing.count >= maxAttempts) {
        return {
          allowed: false,
          retryAfter: Math.max(1, Math.ceil((existing.until - current) / 1000)),
        };
      }
      existing.count += 1;
      return { allowed: true };
    }
    // Quand la mémoire est saturée, on REFUSE au lieu de créer plus de clés.
    if (entries.size >= maxKeys) return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
    entries.set(key, { count: 1, until: current + windowMs });
    return { allowed: true };
  };
  const middleware = (req, res, next) => {
    // Express ne doit pas activer trust proxy : adresse TCP et non un
    // en-tête réseau qui peut être forgé par le client.
    const address = req.socket?.remoteAddress;
    const path = req.path === "/callback" ? "callback" : "login";
    const identifier = typeof address === "string" && address.length <= 128
      ? address : "unknown";
    const outcome = check(`${path}:${identifier}`);
    if (outcome.allowed) return next();
    res.setHeader("Retry-After", String(outcome.retryAfter));
    return res.status(429).json({ error: "TROP_DE_TENTATIVES" });
  };
  return { middleware, check };
}
