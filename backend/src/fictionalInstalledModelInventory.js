import { checkFictionalOfflineGate } from "./fictionalOfflineCostGate.js";

/**
 * Inventaire facultatif des modèles déclarés par Ollama sur localhost.
 * Le seul échange réseau possible est GET http://127.0.0.1:11434/api/tags.
 * Aucun prompt, aucune génération, aucun téléchargement, aucune URL configurable.
 *
 * L'inventaire ne prouve NI que les poids sont exécutés exclusivement sur le
 * poste, NI qu'un modèle est gratuit/licencié pour un usage professionnel.
 * Le service Ollama doit être vérifié hors cloud indépendamment.
 */
const LOCAL_TAGS = "http://127.0.0.1:11434/api/tags";
const MAX_RESPONSE_CHARS = 120_000;
const MAX_MODELS = 100;
const NAME = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,78}$/;
const GIB = 1024 ** 3;

export class FictionalLocalInventoryError extends Error {
  constructor(code = "INVENTAIRE_MODELES_INVALIDE") {
    super(code);
    this.name = "FictionalLocalInventoryError";
  }
}

function modelInfo(entry) {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return null;
  const name = entry.name;
  // Aliases / domains are not an invitation to use another host.
  if (typeof name !== "string" || !NAME.test(name) || /cloud/i.test(name)
    || name.includes("//") || name.startsWith("/") || name.includes("..")) return null;
  if (entry.model !== undefined && entry.model !== name) return null;
  if (!Number.isSafeInteger(entry.size) || entry.size <= 0) return null;

  return Object.freeze({
    name,
    weightFileSizeGiB: Math.round(entry.size / GIB * 10) / 10,
    weightFileSizeBytes: entry.size,
    licenseChecked: false,
    ramCompatibilityChecked: false,
    entirelyLocalExecutionVerified: false,
    availableForDemonstrationOnly: true,
  });
}

/**
 * Aucun appel tant que trois autorisations explicites ne sont pas fournies.
 * En mode autorisé, une seule requête de lecture sur localhost est possible.
 */
export async function inspectFictionalInstalledModels({
  enabled = false,
  fictionalOnlyAcknowledged = false,
  offlineOnlyAcknowledged = false,
  fetchImpl = globalThis.fetch,
} = {}) {
  const gate = checkFictionalOfflineGate({
    enabled, fictionalOnlyAcknowledged, offlineOnlyAcknowledged,
  });
  if (!gate.permitted) {
    return Object.freeze({
      status: "INVENTAIRE_DESACTIVE",
      inspected: false,
      networkRequestsMade: 0,
    });
  }
  if (typeof fetchImpl !== "function") {
    throw new FictionalLocalInventoryError("TRANSPORT_LOCAL_INVALIDE");
  }
  let result;
  try {
    result = await fetchImpl(LOCAL_TAGS, {
      method: "GET",
      redirect: "error",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new FictionalLocalInventoryError("SERVICE_OLLAMA_INDISPONIBLE");
  }
  if (!result || result.status !== 200 || result.ok !== true
    || typeof result.text !== "function") {
    throw new FictionalLocalInventoryError("SERVICE_OLLAMA_INDISPONIBLE");
  }

  let entries;
  try {
    const response = await result.text();
    if (typeof response !== "string" || response.length > MAX_RESPONSE_CHARS) {
      throw new Error("REPONSE_TROP_GRANDE");
    }
    const body = JSON.parse(response);
    if (!body || typeof body !== "object" || Array.isArray(body)
      || !Array.isArray(body.models) || body.models.length > MAX_MODELS) {
      throw new Error("REPONSE_STRUCTURE_INVALIDE");
    }
    entries = body.models;
  } catch {
    throw new FictionalLocalInventoryError("CATALOGUE_MODELES_INVALIDE");
  }

  const models = [];
  const seen = new Set();
  let excluded = 0;
  for (const item of entries) {
    const candidate = modelInfo(item);
    if (!candidate || seen.has(candidate.name)) {
      excluded += 1;
      continue;
    }
    seen.add(candidate.name);
    models.push(candidate);
  }
  models.sort((a, b) => a.name.localeCompare(b.name));
  return Object.freeze({
    status: models.length
      ? "MODELES_DECLARÉS_PAR_OLLAMA" : "AUCUN_MODELE_LOCAL_COMPATIBLE_DECLARÉ",
    inspected: true,
    onlyLocalCatalogRead: true,
    networkRequestsMade: 1,
    generatedTokens: 0,
    modelCallsMade: 0,
    modelsDownloaded: 0,
    excludedEntries: excluded,
    models: Object.freeze(models),
    cloudServerConfigurationVerified: false,
    noExternalBillingProven: false,
    modelLicensesVerified: false,
    machineCompatibilityVerified: false,
    safeToUseRealCaseData: false,
    providerApiChargesConfigured: false,
  });
}
