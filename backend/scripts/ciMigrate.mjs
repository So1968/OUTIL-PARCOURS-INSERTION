import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Outil réservé EXCLUSIVEMENT aux bases éphémères des jobs GitHub CI.
 * Il ne sert pas à migrer une future base institutionnelle ARTAG.
 */
export function validateCiMigrationTarget(env = process.env) {
  if (env.GITHUB_ACTIONS !== "true" ||
    env.GITHUB_REPOSITORY !== "So1968/OUTIL-PARCOURS-INSERTION" ||
    env.ARTAG_DB_INTEGRATION_TEST !== "1" ||
    env.ARTAG_SCHEMA_MIGRATION_REHEARSAL !== "1" ||
    env.NODE_ENV === "production") {
    throw new Error("MIGRATION_CI_NON_AUTORISEE");
  }
  let db;
  try {
    db = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("MIGRATION_CI_BASE_INVALIDE");
  }
  const allowedDatabases = ["/artag_ci_demo", "/artag_ci_restore"];
  if (db.protocol !== "postgresql:" || !["127.0.0.1", "localhost"].includes(db.hostname) ||
    db.port !== "5432" || !allowedDatabases.includes(db.pathname) ||
    db.username !== "artag_ci_demo" || db.password !== "fictif_ci_local" ||
    db.searchParams.size !== 1 || db.searchParams.get("schema") !== "public" ||
    db.hash || !db.host) {
    throw new Error("MIGRATION_CI_BASE_INVALIDE");
  }
  return db.pathname.slice(1);
}

export function prismaArgsFor(action) {
  if (action === "deploy") {
    return ["migrate", "deploy", "--schema", "prisma/schema.prisma"];
  }
  if (action === "status") {
    return ["migrate", "status", "--schema", "prisma/schema.prisma"];
  }
  if (action === "drift") {
    return ["migrate", "diff", "--from-url", process.env.DATABASE_URL,
      "--to-schema-datamodel", "prisma/schema.prisma", "--exit-code"];
  }
  throw new Error("MIGRATION_CI_ACTION_INVALIDE");
}

function main() {
  validateCiMigrationTarget();
  if (process.argv.length !== 3) throw new Error("MIGRATION_CI_ACTION_INVALIDE");
  const action = process.argv[2];
  const args = prismaArgsFor(action);
  const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
  const backendPath = fileURLToPath(new URL("../", import.meta.url));
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: backendPath,
    env: process.env,
    stdio: "inherit",
    timeout: 120_000,
  });
  if (result.error || result.status !== 0) throw new Error("MIGRATION_CI_ECHEC");
  process.stdout.write("Contrôle Prisma en base CI fictive réussi.\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    main();
  } catch {
    // Jamais d'affichage de l'URL de base ni de secret institutionnel.
    process.stderr.write("Migration CI refusée ou contrôle Prisma échoué.\n");
    process.exitCode = 1;
  }
}
