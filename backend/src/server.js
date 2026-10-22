import { createApp } from "./app.js";
import { createOidcProvider } from "./oidcProvider.js";

// La production reste interdite avant revue de sécurité et accord ARTAG.
// Le mode SSO est désactivé par défaut et exige une configuration explicite.
if (process.env.NODE_ENV === "production") {
  throw new Error("Déploiement de production bloqué : validation SSI/RGPD et exploitation non finalisées.");
}

const port = Number(process.env.PORT || "3101");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT invalide.");
}

async function start() {
  let db = null;
  let oidc = null;
  if (process.env.ARTAG_OIDC_ENABLED === "1") {
    const required = [
      "DATABASE_URL", "ARTAG_OIDC_ISSUER", "ARTAG_OIDC_CLIENT_ID",
      "ARTAG_OIDC_CLIENT_SECRET", "ARTAG_PUBLIC_ORIGIN",
      "ARTAG_OIDC_REDIRECT_URI",
    ];
    if (required.some(key => !process.env[key]?.trim())) {
      throw new Error("SSO désactivé : paramètres institutionnels incomplets.");
    }
    const provider = createOidcProvider({
      issuer: process.env.ARTAG_OIDC_ISSUER,
      clientId: process.env.ARTAG_OIDC_CLIENT_ID,
      clientSecret: process.env.ARTAG_OIDC_CLIENT_SECRET,
      redirectUri: process.env.ARTAG_OIDC_REDIRECT_URI,
    });
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
    await db.$connect();
    oidc = {
      provider,
      origin: process.env.ARTAG_PUBLIC_ORIGIN,
      redirectUri: process.env.ARTAG_OIDC_REDIRECT_URI,
    };
  }
  const app = createApp({ privateDb: db, oidc });
  const server = app.listen(port, "127.0.0.1", () => {
    console.info("ARTAG API développement : accès local, routes métier désactivées par défaut.");
  });
  const close = async () => {
    server.close();
    if (db) await db.$disconnect();
  };
  process.once("SIGTERM", () => { void close(); });
  process.once("SIGINT", () => { void close(); });
}

start().catch(() => {
  // Ne jamais imprimer URL de DB, client secret ni jetons.
  console.error("Impossible de démarrer l'API ARTAG avec la configuration actuelle.");
  process.exitCode = 1;
});
