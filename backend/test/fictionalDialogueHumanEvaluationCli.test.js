import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../scripts/evaluateFictionalLocalDialogue.mjs", import.meta.url),
);
function run(environment, flags = [
  "--model", "qwen3:8b", "--confirm-fiction", "--review-human",
]) {
  return spawnSync(process.execPath, [script, ...flags], {
    timeout: 5_000,
    encoding: "utf8",
    env: {
      ...process.env,
      LOCAL_AI_FICTIONAL_ONLY: "0",
      LOCAL_AI_NO_CLOUD_CONFIRMED: "0",
      ...environment,
    },
  });
}

test("le lancement est refusé sans les deux attestations et ne contacte rien", () => {
  for (const env of [
    {},
    { LOCAL_AI_FICTIONAL_ONLY: "1" },
    { LOCAL_AI_NO_CLOUD_CONFIRMED: "1" },
    { LOCAL_AI_FICTIONAL_ONLY: "true", LOCAL_AI_NO_CLOUD_CONFIRMED: "1" },
  ]) {
    const result = run(env);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /EVALUATION_DESACTIVEE/);
    assert.equal(result.stdout, "");
  }
});

test("aucune option supplémentaire ne peut substituer la confirmation stricte", () => {
  const flags = [
    "--model", "qwen3:8b", "--confirm-fiction", "--review-human", "--pay",
  ];
  const result = run({
    LOCAL_AI_FICTIONAL_ONLY: "1",
    LOCAL_AI_NO_CLOUD_CONFIRMED: "1",
  }, flags);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /EVALUATION_DESACTIVEE/);
});

test("un nom de modèle sans attestation serveur ne lance jamais une évaluation", () => {
  const result = run({
    LOCAL_AI_FICTIONAL_ONLY: "1",
    LOCAL_AI_NO_CLOUD_CONFIRMED: "0",
  }, ["--model", "gpt-oss:cloud", "--confirm-fiction", "--review-human"]);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /EVALUATION_DESACTIVEE/);
});
