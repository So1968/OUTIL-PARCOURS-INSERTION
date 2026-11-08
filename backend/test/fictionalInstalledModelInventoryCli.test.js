import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../scripts/listFictionalLocalModels.mjs", import.meta.url),
);
function run(env, args = ["--confirm-local-list"]) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8", timeout: 5_000,
    env: { ...process.env, ...env },
  });
}

test("la commande d'inventaire reste bloquée sans confirmation de serveur hors cloud", () => {
  const result = run({
    LOCAL_AI_FICTIONAL_ONLY: "1",
    LOCAL_AI_NO_CLOUD_CONFIRMED: "0",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /INVENTAIRE_DESACTIVE/);
  assert.equal(result.stdout, "");
});

test("l'inventaire reste bloqué sans confirmation du seul scénario fictif", () => {
  const result = run({
    LOCAL_AI_FICTIONAL_ONLY: "0",
    LOCAL_AI_NO_CLOUD_CONFIRMED: "1",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /INVENTAIRE_DESACTIVE/);
  assert.equal(result.stdout, "");
});

test("un argument arbitraire ne lance aucun catalogue", () => {
  const result = run({
    LOCAL_AI_FICTIONAL_ONLY: "1",
    LOCAL_AI_NO_CLOUD_CONFIRMED: "1",
  }, ["--url", "http://example.invalid"]);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /INVENTAIRE_DESACTIVE/);
  assert.equal(result.stdout, "");
});
