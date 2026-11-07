/**
 * Banc d'essai local explicitement lancé par un développeur.
 * N'accepte ni nom, ni dossier, ni note, ni prompt arbitraire.
 *
 * À lancer depuis backend/ seulement :
 * LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/tryFictionalLocalAi.mjs \
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
  && process.env.LOCAL_AI_FICTIONAL_ONLY === "1"
  && process.env.LOCAL_AI_NO_CLOUD_CONFIRMED === "1";

if (!properlyConfirmed) {
  console.error("ESSAI_LOCAL_DESACTIVE : scénario fictif fixe uniquement.");
  console.error("Activer explicitement : LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/tryFictionalLocalAi.mjs --model <nom-local> --confirm-fiction");
  process.exitCode = 2;
} else {
  const preview = previewFixedFictionalLocalAiDemo();
  console.log("Scénario fixe fictif :", preview.caseId);
  console.log("Événements fictifs :", preview.sourceEventIds.join(", "));
  console.log("Ne pas utiliser avec des informations réelles, même pseudonymisées.");
  console.log("Mode hors cloud confirmé manuellement : la configuration du serveur Ollama n'est PAS vérifiée par ce script.");

  try {
    const result = await runFixedFictionalLocalAiDemo({
      enabled: true,
      fictionalOnlyAcknowledged: true,
      offlineOnlyAcknowledged: true,
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
    console.log("Couverture des références fictives :", result.coverageReview.referencesPresentCount,
      "/", result.coverageReview.totalIndicators);
    if (result.coverageReview.targetedReviewNeeded) {
      console.log("Relecture prioritaire :", result.coverageReview.reviewPriorities
        .map(item => item.actionForHumanReview).join(" | "));
    }
    console.log("Cette vérification ne mesure PAS la justesse de l'analyse.");
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
