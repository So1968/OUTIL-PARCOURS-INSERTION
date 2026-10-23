import { PrismaClient } from "@prisma/client";
import { inspectAuthState, pruneAuthState } from "../src/authMaintenance.js";

// Toujours lecture seule par défaut ; aucun secret, identifiant ni dossier
// n'est affiché. Exécution explicite en environnement de recette privé.
if (process.env.NODE_ENV === "production") {
  throw new Error("Purge non autorisée en mode production sans procédure ARTAG validée.");
}
if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_URL requise.");
const apply = process.argv.includes("--apply");
if (apply && process.env.ARTAG_CONFIRM_AUTH_PRUNE !== "1") {
  throw new Error("Pour appliquer la purge, confirmation ARTAG_CONFIRM_AUTH_PRUNE=1 requise.");
}
if (process.argv.some(arg => !["--apply", "--dry-run"].includes(arg))) {
  throw new Error("Option invalide : --dry-run (défaut) ou --apply.");
}

const db = new PrismaClient();
try {
  const result = apply ? await pruneAuthState({ db }) : await inspectAuthState({ db });
  process.stdout.write(JSON.stringify(result) + "\n");
} finally {
  await db.$disconnect();
}
