import { ApiAccessError } from "./secureApi";

export const AUTONOMY_IDS = Object.freeze([
  "demarches", "organisation", "budget", "sante", "mobilite",
  "ecritNumerique", "vieFamiliale", "projet",
]);
export const AUTONOMY_CHOICES = Object.freeze([
  "À choisir", "Ça va", "Avec un peu d’aide", "C’est difficile", "Je n’y arrive pas en ce moment",
]);
export const EMPTY_AUTONOMY_RESPONSE = Object.freeze({ reponse: "À choisir", note: "", valide: false });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2147483647;
const validVersion = version => Number.isInteger(version) && version >= 0 && version <= MAX;
const validText = value => typeof value === "string" && value.isWellFormed();
const validDate = value => validText(value) && Number.isFinite(Date.parse(value));

export function checkedAutonomyAnswers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).some(id => !AUTONOMY_IDS.includes(id))) return null;
  const result = {};
  for (const id of AUTONOMY_IDS) {
    if (!Object.hasOwn(value, id)) continue;
    const answer = value[id];
    if (!answer || typeof answer !== "object" || Array.isArray(answer)
      || Object.keys(answer).length !== 3
      || !["reponse", "note", "valide"].every(key => Object.hasOwn(answer, key))
      || !AUTONOMY_CHOICES.includes(answer.reponse) || !validText(answer.note)
      || Array.from(answer.note).length > 1500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(answer.note)
      || typeof answer.valide !== "boolean") return null;
    result[id] = { reponse: answer.reponse, note: answer.note, valide: answer.valide };
  }
  return result;
}

export function sameAutonomyAnswers(a, b) {
  const left = checkedAutonomyAnswers(a), right = checkedAutonomyAnswers(b);
  return left !== null && right !== null && JSON.stringify(left) === JSON.stringify(right);
}

export function checkedAutonomyPage(page, caseId, beforeVersion) {
  const invalid = () => { throw new ApiAccessError(503, "REPONSE_AUTONOMIE_INVALIDE"); };
  if (!page || typeof page !== "object" || Array.isArray(page)
    || Object.keys(page).sort().join("|") !== [
      "caseId", "dossierVersion", "autonomyVersion", "questions", "choix", "reponses", "history", "nextBeforeVersion",
    ].sort().join("|")
    || page.caseId !== caseId || !UUID.test(caseId)
    || !validVersion(page.dossierVersion) || !validVersion(page.autonomyVersion)
    || page.autonomyVersion > page.dossierVersion
    || !Array.isArray(page.questions) || page.questions.length !== AUTONOMY_IDS.length
    || !page.questions.every((question, index) => question && typeof question === "object"
      && !Array.isArray(question) && Object.keys(question).sort().join("|") === "axe|id|question"
      && question.id === AUTONOMY_IDS[index] && validText(question.axe) && question.axe.length > 0
      && validText(question.question) && question.question.length > 0 && question.question.length <= 400)
    || !Array.isArray(page.choix) || JSON.stringify(page.choix) !== JSON.stringify(AUTONOMY_CHOICES)
    || !Array.isArray(page.history) || page.history.length > 25
    || (page.nextBeforeVersion !== null && (!validVersion(page.nextBeforeVersion)
      || page.nextBeforeVersion < 1 || page.history.length !== 25))
    || (beforeVersion !== undefined && (page.history.some(row => row.dossierVersion >= beforeVersion)
      || page.autonomyVersion >= beforeVersion && page.nextBeforeVersion === beforeVersion))) invalid();
  const answers = checkedAutonomyAnswers(page.reponses);
  if (answers === null || (page.autonomyVersion === 0 && Object.keys(answers).length !== 0)) invalid();
  let previousVersion = MAX + 1;
  for (const item of page.history) {
    if (!item || typeof item !== "object" || Array.isArray(item)
      || Object.keys(item).sort().join("|") !== [
        "dossierVersion", "previousReponses", "reponses", "actorId", "reason", "createdAt",
      ].sort().join("|")
      || !validVersion(item.dossierVersion) || item.dossierVersion < 1
      || item.dossierVersion >= previousVersion || item.dossierVersion > page.autonomyVersion
      || typeof item.actorId !== "string" || !UUID.test(item.actorId)
      || !validText(item.reason) || !item.reason.trim() || item.reason.length > 200
      || !validDate(item.createdAt)
      || checkedAutonomyAnswers(item.reponses) === null
      || checkedAutonomyAnswers(item.previousReponses) === null) invalid();
    previousVersion = item.dossierVersion;
  }
  if (page.nextBeforeVersion !== null && page.nextBeforeVersion !== page.history.at(-1).dossierVersion) invalid();
  if (beforeVersion === undefined && page.history.length
    && page.history[0].dossierVersion !== page.autonomyVersion) invalid();
  return { ...page, reponses: answers };
}
