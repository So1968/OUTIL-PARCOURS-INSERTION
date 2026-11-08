/**
 * Diagnostic PREALABLE, sans réseau et sans modèle, du poste qui pourrait
 * héberger Ollama. Pure function : les données restent dans l'appelant.
 *
 * Très important : lire ~/.ollama/server.json ne prouve PAS qu'un service
 * Ollama actif lit ce fichier, ni qu'il est privé de connexion Internet.
 * Ce rapport n'autorise JAMAIS une inférence ou une donnée professionnelle.
 */
const MAX_CONFIG_LENGTH = 4096;
const GIB = 1024 ** 3;

export class FictionalOfflineReadinessError extends Error {
  constructor() {
    super("DIAGNOSTIC_LOCAL_FICTIF_INVALIDE");
    this.name = "FictionalOfflineReadinessError";
  }
}

function configStatus(raw) {
  if (raw === null) return "CONFIG_FICHIER_ABSENT";
  if (typeof raw !== "string" || raw.length > MAX_CONFIG_LENGTH) {
    return "CONFIG_FICHIER_NON_LISIBLE";
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "CONFIG_JSON_INVALIDE";
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "CONFIG_JSON_INVALIDE";
  }
  if (parsed.disable_ollama_cloud === true) return "DESACTIVATION_DECLAREE_DANS_FICHIER";
  if (parsed.disable_ollama_cloud === false) return "CLOUD_AUTORISE_DANS_FICHIER";
  return "DESACTIVATION_ABSENTE_DU_FICHIER";
}

function safeGiB(bytes) {
  return Math.round(bytes / GIB * 10) / 10;
}

export function inspectFictionalLocalAiReadiness({
  configFileContent = null,
  totalMemoryBytes,
  freeMemoryBytes,
  ollamaNoCloudInThisProcess = false,
} = {}) {
  if (!Number.isSafeInteger(totalMemoryBytes)
    || !Number.isSafeInteger(freeMemoryBytes)
    || totalMemoryBytes < 0 || freeMemoryBytes < 0
    || freeMemoryBytes > totalMemoryBytes
    || typeof ollamaNoCloudInThisProcess !== "boolean") {
    throw new FictionalOfflineReadinessError();
  }
  const status = configStatus(configFileContent);
  const evidenceFromConfig = status === "DESACTIVATION_DECLAREE_DANS_FICHIER";
  const blockingChecks = Object.freeze([
    ...(evidenceFromConfig ? [] : ["DESACTIVATION_CLOUD_DU_SERVICE_NON_ETABLIE"]),
    "SERVICE_OLLAMA_ACTIF_NON_VERIFIE",
    "SERVICE_OLLAMA_CLOUD_DESACTIVE_NON_VERIFIE",
    "MODELE_LOCAL_NON_VERIFIE",
    "LICENCE_MODELE_NON_VERIFIEE",
  ]);
  return Object.freeze({
    status: "DIAGNOSTIC_LOCAL_SANS_INFERENCE",
    fileCloudSetting: status,
    localConfigurationFileSuggestsNoCloud: evidenceFromConfig,
    clientProcessNoCloudFlagSeen: ollamaNoCloudInThisProcess,
    serviceNoCloudFlagVerified: false,
    serviceCloudModeVerified: false,
    paidProviderConfiguredByDiagnostic: false,
    networkRequestsMade: 0,
    modelCallsMade: 0,
    modelsDownloaded: 0,
    noRemoteBillingProven: false,
    readyForRealCaseData: false,
    readyForRealInference: false,
    hostMemoryGiB: safeGiB(totalMemoryBytes),
    freeMemoryGiB: safeGiB(freeMemoryBytes),
    modelResourceAdequacyVerified: false,
    blockers: blockingChecks,
    manualVerificationNeeded: true,
  });
}
