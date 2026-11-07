import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = [
  fileURLToPath(new URL("../scripts/tryFictionalLocalAi.mjs", import.meta.url)),
  fileURLToPath(new URL("../scripts/tryFictionalLocalDialogue.mjs", import.meta.url)),
];

test("les deux lanceurs CLI refusent un essai si la gratuité hors cloud n'a pas été confirmée", () => {
  for (const file of scripts) {
    const result = spawnSync(process.execPath,
      [file, "--model", "qwen3:8b", "--confirm-fiction"],
      {
        encoding: "utf8",
        timeout: 5_000,
        env: {
          ...process.env,
          LOCAL_AI_FICTIONAL_ONLY: "1",
          LOCAL_AI_NO_CLOUD_CONFIRMED: "0",
        },
      });
    assert.equal(result.status, 2, file);
    assert.equal(result.error, undefined, file);
    assert.equal(result.stdout.includes("BROUILLON NON VALIDÉ"), false);
    assert.equal(result.stdout.includes("Scénario fixe fictif"), false);
    assert.match(result.stderr, /DESACTIVE/);
  }
});

test("les deux lanceurs CLI refusent même l'accord hors cloud si le scénario fictif n'est pas confirmé", () => {
  for (const file of scripts) {
    const result = spawnSync(process.execPath,
      [file, "--model", "qwen3:8b", "--confirm-fiction"],
      {
        encoding: "utf8",
        timeout: 5_000,
        env: {
          ...process.env,
          LOCAL_AI_FICTIONAL_ONLY: "0",
          LOCAL_AI_NO_CLOUD_CONFIRMED: "1",
        },
      });
    assert.equal(result.status, 2, file);
    assert.match(result.stderr, /DESACTIVE/);
  }
});

test("aucune option de ligne de commande ne remplace la confirmation hors cloud", () => {
  for (const file of scripts) {
    const result = spawnSync(process.execPath,
      [file, "--model", "qwen3:8b", "--confirm-fiction", "--free", "--no-cloud"],
      {
        encoding: "utf8",
        timeout: 5_000,
        env: {
          ...process.env,
          LOCAL_AI_FICTIONAL_ONLY: "1",
          LOCAL_AI_NO_CLOUD_CONFIRMED: "0",
        },
      });
    assert.equal(result.status, 2, file);
    assert.match(result.stderr, /DESACTIVE/);
  }
});
