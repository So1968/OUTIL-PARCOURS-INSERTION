/**
 * Diagnostic passif, sans réseau, sans Ollama et sans accès aux données ARTAG.
 * Lancement depuis backend/ :
 *   node scripts/checkFictionalOfflineReadiness.mjs
 *
 * Il n'exécute AUCUN modèle et ne vérifie PAS le service Ollama actif.
 * Aucun fichier de configuration n'est imprimé ni enregistré.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { freemem, homedir, totalmem } from "node:os";
import { inspectFictionalLocalAiReadiness } from "../src/fictionalOfflineReadiness.js";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--json")) {
  console.error("Usage : node scripts/checkFictionalOfflineReadiness.mjs [--json]");
  process.exitCode = 2;
} else {
  let configFileContent;
  try {
    configFileContent = await readFile(join(homedir(), ".ollama", "server.json"),
      { encoding: "utf8" });
  } catch (error) {
    // On ne révèle pas le chemin du HOME ni le détail des erreurs.
    configFileContent = error?.code === "ENOENT" ? null : "";
  }
  const report = inspectFictionalLocalAiReadiness({
    configFileContent,
    totalMemoryBytes: totalmem(),
    freeMemoryBytes: freemem(),
    ollamaNoCloudInThisProcess: process.env.OLLAMA_NO_CLOUD === "1",
  });

  if (args[0] === "--json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Diagnostic gratuit et passif : aucune requête réseau, aucun modèle lancé.");
    console.log("Mémoire RAM totale :", report.hostMemoryGiB, "Gio ; libre :", report.freeMemoryGiB, "Gio.");
    console.log("Indication du fichier local Ollama :", report.fileCloudSetting);
    console.log("Variable OLLAMA_NO_CLOUD dans CE processus :",
      report.clientProcessNoCloudFlagSeen ? "présente" : "absente");
    console.log("Service Ollama réellement hors cloud : NON VERIFIE.");
    console.log("Modèle téléchargé et licence compatible : NON VERIFIES.");
    console.log("Aucun frais de requête engagé par ce diagnostic.");
    console.log("Aucun essai de dossier réel n'est autorisé.");
    console.log("À vérifier manuellement : configurer OLLAMA_NO_CLOUD=1 sur LE SERVICE Ollama,"
      + " le redémarrer, puis contrôler dans ses journaux « Ollama cloud disabled: true ».");
  }
  // Un contrôle passif ne peut jamais servir d'attestation d'homologation.
  process.exitCode = 2;
}
