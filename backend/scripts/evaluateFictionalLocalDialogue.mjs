/**
 * Recette guidée d'un modèle local sur QUATRE questions fictives fixes.
 * Uniquement après désactivation des fonctionnalités cloud sur le SERVICE
 * Ollama et confirmations dans la commande. Aucun service payant.
 *
 * Depuis backend/ :
 * LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 \
 *   node scripts/evaluateFictionalLocalDialogue.mjs \
 *   --model qwen3:8b --confirm-fiction --review-human
 *
 * Ce programme ne conserve aucun résultat dans le logiciel et n'exécute
 * aucune action professionnelle. Le terminal peut cependant conserver
 * un affichage dans son historique ou ses journaux.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  createFixedFictionalLocalDialogue, FICTIONAL_DIALOGUE_QUESTIONS,
} from "../src/fictionalLocalDialogue.js";
import {
  evaluateFixedFictionalLocalDialogue,
  FICTIONAL_DIALOGUE_HUMAN_RUBRIC,
} from "../src/fictionalDialogueHumanEvaluation.js";

const args = process.argv.slice(2);
const ready = process.env.LOCAL_AI_FICTIONAL_ONLY === "1"
  && process.env.LOCAL_AI_NO_CLOUD_CONFIRMED === "1"
  && args.length === 4
  && args[0] === "--model"
  && args[2] === "--confirm-fiction"
  && args[3] === "--review-human";

if (!ready) {
  console.error("EVALUATION_DESACTIVEE : test fictif et hors cloud à confirmer.");
  console.error("Usage : LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/evaluateFictionalLocalDialogue.mjs --model <modele-installe> --confirm-fiction --review-human");
  process.exitCode = 2;
} else {
  const terminal = createInterface({ input: stdin, output: stdout });
  async function ask(pattern, question) {
    while (true) {
      let answer;
      try {
        answer = (await terminal.question(question)).trim().toLowerCase();
      } catch {
        throw new Error("SAISIE_INTERROMPUE");
      }
      if (answer === "q") throw new Error("EVALUATION_ABANDONNEE");
      if (pattern.test(answer)) return answer;
      console.log("Saisie non reconnue. Entrer une valeur prévue ou q pour quitter.");
    }
  }
  try {
    const session = createFixedFictionalLocalDialogue({
      enabled: true,
      fictionalOnlyAcknowledged: true,
      offlineOnlyAcknowledged: true,
      modelName: args[1],
    });
    console.log("Recette métier — 4 questions fictives, aucune donnée réelle.");
    console.log("Seuls les modèles téléchargés et exécutés hors cloud sont autorisés.");
    console.log("Réponses non validées ; vérifier les sources avant toute notation.");
    for (const [intentCode, question] of Object.entries(FICTIONAL_DIALOGUE_QUESTIONS)) {
      const response = await session.ask(intentCode);
      console.log("\n" + response.turnNumber + "/4 : " + question.label);
      console.log("PROPOSITION IA NON VÉRIFIÉE : " + response.turn.answer);
      console.log("Extraits qui doivent étayer la réponse :");
      for (const source of response.turn.sourceTrace) {
        console.log(source.eventId + " (" + source.occurredAt + ", "
          + source.evidenceStatus + ") : " + source.originalExcerptUntrusted);
      }
      if (response.turn.uncertainties.length) {
        console.log("Incertitudes : " + response.turn.uncertainties.join(" | "));
      }
      for (const action of response.turn.suggestedActions) {
        console.log("Proposition NON CONFIRMÉE : " + action.title);
      }
    }

    console.log("\nÉVALUATION HUMAINE — la machine n'attribue jamais de note.");
    console.log("0 = insuffisant ; 1 = partiel ; 2 = satisfaisant.");
    FICTIONAL_DIALOGUE_HUMAN_RUBRIC.forEach((row, index) => {
      console.log((index + 1) + ". " + row.label);
    });
    const digits = await ask(/^[012]{10}$/,
      "Entrer 10 chiffres (0,1,2) dans cet ordre, sans espaces, ou q : ");
    const ratings = Object.fromEntries(
      FICTIONAL_DIALOGUE_HUMAN_RUBRIC.map((row, i) => [row.key, Number(digits[i])]),
    );
    const criticalInventionFound = await ask(/^[on]$/,
      "Invention factuelle grave ? o/n (q pour quitter) : ") === "o";
    const crossCaseLeakFound = await ask(/^[on]$/,
      "Information venant d'un autre dossier ? o/n (q pour quitter) : ") === "o";
    const unauthorizedActionFound = await ask(/^[on]$/,
      "Action exécutée ou présentée comme confirmée sans accord ? o/n (q pour quitter) : ") === "o";
    const correctionMinutes = Number(await ask(/^(?:0|[1-9][0-9]?|1[0-7][0-9]|180)$/,
      "Minutes estimées pour corriger les réponses (0 à 180 ; q pour quitter) : "));

    const evaluation = evaluateFixedFictionalLocalDialogue({
      turns: session.getHistory(),
      modelLabel: args[1],
      authorized: true,
      humanReview: {
        reviewerDeclared: true,
        ratings,
        criticalInventionFound,
        crossCaseLeakFound,
        unauthorizedActionFound,
        correctionMinutes,
      },
    });

    console.log("\nNOTATION DÉCLARÉE : " + evaluation.score + "/20");
    console.log("Temps de correction déclaré : " + evaluation.correctionMinutes + " min.");
    console.log("Points bloquants : " +
      (evaluation.criticalFlags.length ? evaluation.criticalFlags.join(" | ") : "aucun déclaré"));
    console.log("À étudier davantage : " +
      (evaluation.acceptedForFurtherStudy ? "oui, sous réserve de contrôles" : "non"));
    console.log("Cette notation n'est ni une preuve indépendante de qualité, ni une autorisation ARTAG.");
    console.log("Aucune sauvegarde ni transmission n'a été initiée par le programme.");
    console.log("Le terminal peut conserver l'affichage dans son historique local.");
  } catch (error) {
    const safeErrors = new Set([
      "MODELE_LOCAL_NON_DISPONIBLE",
      "REPONSE_DIALOGUE_INVALIDE",
      "REPONSE_DIALOGUE_NON_CONFORME",
      "CONFIGURATION_LOCALE_INVALIDE",
      "EVALUATION_ABANDONNEE",
      "SAISIE_INTERROMPUE",
    ]);
    console.error("Recette interrompue : " +
      (safeErrors.has(error?.message) ? error.message : "ERREUR_NON_DETAILLEE"));
    process.exitCode = 2;
  } finally {
    terminal.close();
  }
}
