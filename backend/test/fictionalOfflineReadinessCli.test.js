import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/checkFictionalOfflineReadiness.mjs", import.meta.url));

function run(configText = null, extraEnv = {}, args = ["--json"]) {
  const home = mkdtempSync(join(tmpdir(), "fiction-offline-ready-"));
  try {
    if (configText !== null) {
      mkdirSync(join(home, ".ollama"));
      writeFileSync(join(home, ".ollama", "server.json"), configText, "utf8");
    }
    const result = spawnSync(process.execPath, [script, ...args], {
      timeout: 5_000, encoding: "utf8",
      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
        OLLAMA_NO_CLOUD: "0",
        ...extraEnv,
      },
    });
    assert.equal(result.error, undefined);
    return result;
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

test("la commande JSON donne un état strictement consultatif et aucun modèle ne démarre", () => {
  const output = run('{"disable_ollama_cloud":true}');
  assert.equal(output.status, 2);
  const report = JSON.parse(output.stdout);
  assert.equal(report.localConfigurationFileSuggestsNoCloud, true);
  assert.equal(report.readyForRealInference, false);
  assert.equal(report.readyForRealCaseData, false);
  assert.equal(report.networkRequestsMade, 0);
  assert.equal(report.modelCallsMade, 0);
  assert.equal(report.modelsDownloaded, 0);
  assert.equal(report.serviceCloudModeVerified, false);
  assert.equal(report.noRemoteBillingProven, false);
  assert.equal(output.stderr, "");
});

test("le client OLLAMA_NO_CLOUD=1 sans fichier n'est pas considéré comme le service vérifié", () => {
  const output = run(null, { OLLAMA_NO_CLOUD: "1" });
  assert.equal(output.status, 2);
  const report = JSON.parse(output.stdout);
  assert.equal(report.clientProcessNoCloudFlagSeen, true);
  assert.equal(report.localConfigurationFileSuggestsNoCloud, false);
  assert.equal(report.fileCloudSetting, "CONFIG_FICHIER_ABSENT");
  assert.equal(report.serviceCloudModeVerified, false);
});

test("le rapport en français ne restitue jamais le contenu secret du fichier", () => {
  const secret = "FAUX_SECRET_ILLISIBLE_TEST";
  const output = run(JSON.stringify({
    disable_ollama_cloud: true, dummyPrivateSetting: secret,
  }), {}, []);
  assert.equal(output.status, 2);
  assert.match(output.stdout, /aucune requête réseau, aucun modèle lancé/);
  assert.match(output.stdout, /NON VERIFIE/);
  assert.equal(output.stdout.includes(secret), false);
  assert.equal(output.stderr.includes(secret), false);
});

test("les arguments arbitraires sont refusés", () => {
  const output = run(null, {}, ["--model", "a-model"]);
  assert.equal(output.status, 2);
  assert.match(output.stderr, /Usage/);
  assert.equal(output.stdout, "");
});
