/**
 * Lecture du catalogue Ollama local seulement. Aucun prompt, téléchargement,
 * API facturée ni dossier réel n'est traité par cette commande.
 *
 * Activation depuis backend/ (après désactivation vérifiée des fonctions
 * cloud sur LE SERVICE OLLAMA, et non simplement dans ce terminal) :
 * LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 \
 * node scripts/listFictionalLocalModels.mjs --confirm-local-list
 */
import { inspectFictionalInstalledModels } from "../src/fictionalInstalledModelInventory.js";

const approved = process.env.LOCAL_AI_FICTIONAL_ONLY === "1"
  && process.env.LOCAL_AI_NO_CLOUD_CONFIRMED === "1"
  && process.argv.length === 3
  && process.argv[2] === "--confirm-local-list";

if (!approved) {
  console.error("INVENTAIRE_DESACTIVE : confirmer d'abord le mode fictif et l'arrêt des fonctions cloud sur le serveur Ollama.");
  console.error("Commande : LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/listFictionalLocalModels.mjs --confirm-local-list");
  process.exitCode = 2;
} else {
  try {
    const result = await inspectFictionalInstalledModels({
      enabled: true,
      fictionalOnlyAcknowledged: true,
      offlineOnlyAcknowledged: true,
    });
    console.log("Catalogue local Ollama seulement : aucun modèle exécuté ni téléchargé.");
    if (result.models.length) {
      for (const model of result.models) {
        console.log("• " + model.name + " — poids déclarés : "
          + model.weightFileSizeGiB + " Gio sur disque");
      }
    } else {
      console.log("Aucun modèle local compatible n'a été déclaré par Ollama.");
    }
    if (result.excludedEntries) {
      console.log("Entrées écartées (alias cloud, doublons ou invalides) : "
        + result.excludedEntries);
    }
    console.log("La taille des poids sur disque ne mesure PAS la mémoire RAM requise.");
    console.log("Service réellement hors cloud, licence et compatibilité machine : NON VERIFIES.");
    console.log("Aucun abonnement ni appel à un service de génération n'a été créé par ce diagnostic.");
    console.log("AUCUN dossier réel n'est autorisé.");
    process.exitCode = 2; // Le catalogue ne vaut jamais homologation.
  } catch (error) {
    const approvedCodes = new Set([
      "SERVICE_OLLAMA_INDISPONIBLE",
      "CATALOGUE_MODELES_INVALIDE",
      "TRANSPORT_LOCAL_INVALIDE",
    ]);
    console.error("Inventaire non réalisé : ",
      approvedCodes.has(error?.message) ? error.message : "ERREUR_NON_DETAILLEE");
    process.exitCode = 2;
  }
}
