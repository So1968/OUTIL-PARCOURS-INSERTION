// Source métier : docs/07_SOCLE_AUTONOMIE.md et prototype SocleAutonomiePage.
// Le libellé validé des questions ne doit jamais être modifié automatiquement.
export const AUTONOMY_QUESTIONS = Object.freeze([
  { id: "demarches", axe: "Démarches / accès aux droits", question: "Pour vos papiers et vos démarches, vous vous y retrouvez comment en ce moment ?" },
  { id: "organisation", axe: "Organisation du quotidien", question: "Pour vous organiser dans ce que vous avez à faire, vous vous en sortez comment ?" },
  { id: "budget", axe: "Budget / argent", question: "Pour gérer l’argent au quotidien, vous vous en sortez comment ?" },
  { id: "sante", axe: "Santé / accès aux soins", question: "Pour votre santé, les rendez-vous ou les soins, vous vous en sortez comment ?" },
  { id: "mobilite", axe: "Mobilité / déplacements", question: "Pour vous déplacer là où vous avez besoin d’aller, ça se passe comment pour vous ?" },
  { id: "ecritNumerique", axe: "Écrit / numérique", question: "Pour les courriers, les papiers ou les démarches sur téléphone, vous vous en sortez comment ?" },
  { id: "vieFamiliale", axe: "Vie familiale / disponibilité", question: "Avec tout ce que vous avez à gérer dans la famille, pour vos démarches, vous vous en sortez comment ?" },
  { id: "projet", axe: "Projet / mise en mouvement", question: "Quand vous voulez faire avancer quelque chose pour vous, vous y arrivez comment ?" },
].map(item => Object.freeze(item)));

export const AUTONOMY_CHOICES = Object.freeze([
  "À choisir", "Ça va", "Avec un peu d’aide", "C’est difficile", "Je n’y arrive pas en ce moment",
]);
