import { createHmac, timingSafeEqual } from "node:crypto";
import { cookieToken } from "./sessions.js";

const TOKEN = /^[a-f0-9]{64}$/;

export function issueCsrfToken(secret, cookieHeader) {
  const raw = cookieToken(cookieHeader);
  if (!raw || typeof secret !== "string" || secret.length < 32) return null;
  return createHmac("sha256", secret).update("artag-csrf-v1:" + raw).digest("hex");
}

// Le cookie de session reste HttpOnly. Le navigateur lit le CSRF à partir
// d'une réponse same-origin, mais n'accède jamais au secret serveur.
export function validCsrf({ secret, cookieHeader, csrfHeader, origin, allowedOrigin }) {
  if (typeof csrfHeader !== "string" || !TOKEN.test(csrfHeader)) return false;
  if (origin !== allowedOrigin || !origin || !origin.startsWith("https://")) return false;
  const expected = issueCsrfToken(secret, cookieHeader);
  if (!expected) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(csrfHeader, "hex"));
}
