/**
 * Banc d'essai local explicitement lancé par un développeur.
 * N'accepte ni nom, ni dossier, ni note, ni prompt arbitraire.
 *
 * À lancer depuis backend/ seulement :
 * LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalAi.mjs \
 *   --model qwen3:8b --confirm-fiction
 *
 * Aucun modèle ni serveur n'est installé automatiquement.
 */
import {
  previewFixedFictionalLocalAiDemo, runFixedFictionalLocalAiDemo,
} from "../src/fictionalLocalAiDemo.js";

const args = process.argv.slice(2);
const properlyConfirmed = args.length === 3
  && args[0] === "--model"
  && args[2] === "--confirm-fiction"
  && process.env.LOCAL_AI_FICTIONAL_ONLY === "1";

if (!properlyConfirmed) {
  console.error("ESSAI_LOCAL_DESACTIVE : scénario fictif fixe uniquement.");
  console.error("Activer explicitement : LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalAi.mjs --model <nom-local> --confirm-fiction");
  process.exitCode = 2;
} else {
  const preview = previewFixedFictionalLocalAiDemo();
  console.log("Scénario fixe fictif :", preview.caseId);
  console.log("Événements fictifs :", preview.sourceEventIds.join(", "));
  console.log("Ne pas utiliser avec des informations réelles, même pseudonymisées.");

  try {
    const result = await runFixedFictionalLocalAiDemo({
      enabled: true,
      fictionalOnlyAcknowledged: true,
      modelName: args[1],
    });
    console.log("État :", result.status);
    console.log("Modèle local demandé :", result.modelName);
    console.log("Jetons évalués :", result.promptTokens ?? "non fournis");
    console.log("Jetons générés :", result.outputTokens ?? "non fournis");
    console.log("Brouillon fictif NON VALIDÉ :");
    console.log(result.draft.summaryPreview);
    console.log("Sources mentionnées :", result.draft.sections
      .flatMap(section => section.sourceEventIds).join(", "));
    console.log("Aucune sauvegarde ni transmission n'a été effectuée.");
  } catch (error) {
    console.error("Essai impossible :", error?.message?.startsWith("MODELE_")
      || error?.message?.startsWith("BROUILLON_")
      || error?.message?.startsWith("REPONSE_")
      || error?.message?.startsWith("CONFIGURATION_")
      ? error.message : "ERREUR_NON_DETAILLEE");
    process.exitCode = 1;
  }
}
