import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = new URL("../scripts/recoveryFixture.mjs", import.meta.url);
const base = {
  NODE_ENV: "test",
  ARTAG_DB_INTEGRATION_TEST: "1",
  ARTAG_RECOVERY_REHEARSAL: "1",
  DATABASE_URL: "postgresql://fake:fake@127.0.0.1:5432/artag_ci_demo?schema=public",
};

function tryCommand(env, action = "checksum") {
  return spawnSync(process.execPath, [script.pathname, action], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 5000,
  });
}

test("la maintenance refuse la production et l'absence de double verrou", () => {
  for (const env of [
    { ...base, NODE_ENV: "production" },
    { ...base, ARTAG_DB_INTEGRATION_TEST: "0" },
    { ...base, ARTAG_RECOVERY_REHEARSAL: "0" },
  ]) {
    const result = tryCommand(env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Échec de la recette/);
    assert.equal(result.stdout, "");
  }
});

test("la cible n'accepte ni base privée distante ni autre nom de base", () => {
  for (const uri of [
    "postgresql://fictif:fictif" + String.fromCharCode(64) + "database.exemple.invalid:5432/artag_ci_demo?schema=public",
    "postgresql://fictif:fictif@127.0.0.1:5432/base_metier?schema=public",
    "postgresql://fictif:fictif@127.0.0.1:5433/artag_ci_demo?schema=public",
    "postgresql://fictif:fictif@127.0.0.1:5432/artag_ci_demo?schema=sensible",
  ]) {
    const result = tryCommand({ ...base, DATABASE_URL: uri });
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, /postgresql:\/\//);
    assert.equal(result.stdout, "");
  }
});

test("le programme ne peut pas injecter de données sur la base de restauration", () => {
  const result = tryCommand({
    ...base,
    DATABASE_URL: "postgresql://fake:fake@127.0.0.1:5432/artag_ci_restore?schema=public",
  }, "seed");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /postgresql:\/\//);
});

test("aucune sortie technique ne divulgue l'URL si la connexion échoue", () => {
  const result = tryCommand({
    ...base,
    DATABASE_URL: "postgresql://fake:fake@127.0.0.1:5432/artag_ci_demo?schema=public",
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /fake:fake|postgresql:\/\//);
});
