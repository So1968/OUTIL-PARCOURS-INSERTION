import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateCiMigrationTarget, prismaArgsFor } from "../scripts/ciMigrate.mjs";

const fake = {
  GITHUB_ACTIONS: "true",
  GITHUB_REPOSITORY: "So1968/OUTIL-PARCOURS-INSERTION",
  ARTAG_DB_INTEGRATION_TEST: "1",
  ARTAG_SCHEMA_MIGRATION_REHEARSAL: "1",
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://artag_ci_demo:fictif_ci_local@127.0.0.1:5432/artag_ci_demo?schema=public",
};

test("migrations désactivées sans runner officiel et sans double verrou", () => {
  assert.equal(validateCiMigrationTarget(fake), "artag_ci_demo");
  for (const changes of [
    { GITHUB_ACTIONS: "false" }, { GITHUB_REPOSITORY: "autre/projet" },
    { ARTAG_DB_INTEGRATION_TEST: "0" }, { ARTAG_SCHEMA_MIGRATION_REHEARSAL: "0" },
    { NODE_ENV: "production" },
  ]) {
    assert.throws(() => validateCiMigrationTarget({ ...fake, ...changes }));
  }
});

test("refuse les noms, ports, serveurs et mots de passe autres que CI fictive", () => {
  for (const db of [
    "postgresql://demo:demo@127.0.0.1:5432/artag_ci_demo?schema=public",
    "postgresql://artag_ci_demo:fictif_ci_local@127.0.0.1:5432/base_reelle?schema=public",
    "postgresql://artag_ci_demo:fictif_ci_local@127.0.0.1:5433/artag_ci_demo?schema=public",
    "postgresql://artag_ci_demo:fictif_ci_local" + String.fromCharCode(64) + "base.exemple.invalid:5432/artag_ci_demo?schema=public",
    "postgresql://artag_ci_demo:fictif_ci_local@127.0.0.1:5432/artag_ci_demo?schema=autre",
  ]) {
    assert.throws(() => validateCiMigrationTarget({ ...fake, DATABASE_URL: db }));
  }
  assert.equal(validateCiMigrationTarget({
    ...fake, DATABASE_URL: fake.DATABASE_URL.replace("/artag_ci_demo?", "/artag_ci_restore?"),
  }), "artag_ci_restore");
});

test("actions Prisma limitées à déployer, contrôler la version et dérive schéma", () => {
  assert.deepEqual(prismaArgsFor("deploy").slice(0, 2), ["migrate", "deploy"]);
  assert.deepEqual(prismaArgsFor("status").slice(0, 2), ["migrate", "status"]);
  assert.throws(() => prismaArgsFor("reset"));
  assert.throws(() => prismaArgsFor("dev"));
  assert.throws(() => prismaArgsFor("db push"));
});

test("le programme refuse toute exécution non autorisée sans afficher la connexion", () => {
  const script = fileURLToPath(new URL("../scripts/ciMigrate.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "deploy"], {
    env: { ...process.env, ...fake, GITHUB_ACTIONS: "false" },
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /postgresql:\/\//);
});
