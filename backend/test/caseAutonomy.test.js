import test from "node:test";
import assert from "node:assert/strict";
import { AUTONOMY_QUESTIONS, AUTONOMY_CHOICES } from "../src/autonomyQuestions.js";
import { canonicalAutonomyAnswers } from "../src/caseAutonomyService.js";

test("les huit repères du cahier des charges conservent leurs identifiants et formulations", () => {
  assert.deepEqual(AUTONOMY_QUESTIONS.map(q => q.id), [
    "demarches", "organisation", "budget", "sante", "mobilite",
    "ecritNumerique", "vieFamiliale", "projet",
  ]);
  assert.equal(AUTONOMY_QUESTIONS.length, 8);
  assert.deepEqual(AUTONOMY_QUESTIONS.map(q => q.question), [
    "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?",
    "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?",
    "Pour gérer l’argent au quotidien, vous vous en sortez comment ?",
    "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?",
    "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?",
    "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?",
    "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?",
    "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?",
  ]);
  assert.deepEqual(AUTONOMY_CHOICES, [
    "À choisir", "Ça va", "Avec un peu d’aide", "C’est difficile", "Je n’y arrive pas en ce moment",
  ]);
});

test("le format reprend les réponses validées sans score ni champ inventé", () => {
  const answers = { budget: { reponse: "Avec un peu d’aide", note: "Échange fictif", valide: true },
    demarches: { reponse: "À choisir", note: "", valide: false } };
  assert.deepEqual(canonicalAutonomyAnswers(answers), {
    demarches: answers.demarches, budget: answers.budget,
  });
  assert.deepEqual(canonicalAutonomyAnswers({}), {});
  for (const malformed of [
    null, [], "texte", { autre: answers.budget },
    { budget: { ...answers.budget, score: 5 } },
    { budget: { ...answers.budget, valide: "oui" } },
    { budget: { ...answers.budget, reponse: "5/5" } },
    { budget: { ...answers.budget, note: "a".repeat(1501) } },
    { budget: { ...answers.budget, note: "\u0000" } },
    { budget: { reponse: "Ça va", note: "" } },
    { __protoX: { reponse: "Ça va", note: "", valide: true } },
  ]) assert.equal(canonicalAutonomyAnswers(malformed), null);
});
