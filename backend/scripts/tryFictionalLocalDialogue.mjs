/**
 * Dialogue expérimental : menu fixe de quatre questions, aucune saisie libre.
 * Aucun transfert de données réelles, aucune route ni base de production.
 *
 * Depuis backend/, après validation du service Ollama en mode cloud désactivé :
 * LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalDialogue.mjs \
 *   --model qwen3:8b --confirm-fiction
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { prepareFixedFictionalDialogueReview } from "../src/fictionalDialogueReviewPacket.js";
import {
  createFixedFictionalLocalDialogue,
  FICTIONAL_DIALOGUE_QUESTIONS,
} from "../src/fictionalLocalDialogue.js";

const args = process.argv.slice(2);
const ready = process.env.LOCAL_AI_FICTIONAL_ONLY === "1"
  && args.length === 3
  && args[0] === "--model"
  && args[2] === "--confirm-fiction";

if (!ready) {
  console.error("DIALOGUE_LOCAL_DESACTIVE : seules quatre questions prédéfinies sur un dossier fictif sont admises.");
  console.error("Activation : LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalDialogue.mjs --model <modele-installe> --confirm-fiction");
  process.exitCode = 2;
} else {
  let terminal;
  try {
    const session = createFixedFictionalLocalDialogue({
      enabled: true, fictionalOnlyAcknowledged: true,
      modelName: args[1],
    });
    const available = Object.entries(FICTIONAL_DIALOGUE_QUESTIONS);
    const asked = new Set();
    terminal = createInterface({ input: stdin, output: stdout });
    console.log("Démonstration locale. AUCUN dossier réel. Quatre questions fixes.");
    console.log("Toute réponse d'IA est un brouillon qui doit être relu.");
    console.log("Désactiver Ollama Cloud directement sur le serveur avant de lancer cet essai.");

    while (asked.size < available.length) {
      console.log("\nQuestions restantes :");
      for (let index = 0; index < available.length; index += 1) {
        const [code, item] = available[index];
        if (!asked.has(code)) console.log((index + 1) + ". " + item.label);
      }
      console.log("0. Terminer sans enregistrer");
      let input;
      try {
        input = await terminal.question("Choisir uniquement un numéro : ");
      } catch {
        break;
      }
      if (input === "0") break;
      if (!/^[1-4]$/.test(input)) {
        console.log("Seuls les numéros de ce menu sont acceptés ; aucune saisie libre.");
        continue;
      }
      const [intentCode] = available[Number(input) - 1];
      if (asked.has(intentCode)) {
        console.log("Cette question a déjà été examinée.");
        continue;
      }
      try {
        const result = await session.ask(intentCode);
        asked.add(intentCode);
        console.log("\nBROUILLON NON VALIDÉ — " + result.turn.question);
        console.log(result.turn.answer);
        console.log("Sources du dossier fictif (la pertinence des citations doit être vérifiée) :");
        for (const source of result.turn.sourceTrace) {
          console.log("• " + source.eventId + " — " + source.occurredAt +
            " — " + source.evidenceStatus + " : " + source.originalExcerptUntrusted);
        }
        if (result.turn.uncertainties.length) {
          console.log("À vérifier : " + result.turn.uncertainties.join(" | "));
        }
        if (result.turn.suggestedActions.length) {
          console.log("Actions proposées, NON confirmées :");
          for (const action of result.turn.suggestedActions) {
            console.log("• " + action.title + " [" + action.sourceEventIds.join(", ") + "]");
          }
        }
        const packet = prepareFixedFictionalDialogueReview({
          turns: session.getHistory(), authorized: true,
        });
        console.log("Échanges réalisés :", packet.completedTurns + "/" + packet.expectedTurns);
        console.log("Questions encore à examiner :", packet.pendingQuestions.length);
        if (packet.repeatedActionSuggestions.length) {
          console.log("Actions répétées à rapprocher MANUELLEMENT :");
          for (const action of packet.repeatedActionSuggestions) {
            console.log("• " + action.title + " (" + action.mentionedIn.join(", ") + ")");
          }
        }
        console.log("La relecture professionnelle des citations et de la posture reste obligatoire.");
        console.log("Aucun enregistrement, aucune décision et aucune transmission.");
      } catch (error) {
        const code = typeof error?.message === "string"
          && /^[A-Z_]{3,60}$/.test(error.message)
          ? error.message : "ERREUR_NON_DETAILLEE";
        console.error("Réponse indisponible : " + code);
      }
    }
  } finally {
    terminal?.close();
    console.log("Fin de la session fictive, sans sauvegarde.");
  }
}
