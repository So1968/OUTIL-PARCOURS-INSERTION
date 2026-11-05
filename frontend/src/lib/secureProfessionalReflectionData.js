import { ApiAccessError } from "./secureApi";

export const RELATION_AIDE_FIELDS = Object.freeze([
  ["entreeRelation", "Entrée en relation"],
  ["expressionDemande", "Expression de la demande"],
  ["receptionAideProposee", "Réception de l’aide proposée"],
  ["possibiliteCoConstruction", "Possibilité de co-construction"],
  ["rapportCadre", "Rapport au cadre"],
  ["postureProfessionnelleAPrivilegier", "Posture professionnelle à privilégier"],
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2147483647;
const SAME_KEYS = (item, keys) => Object.keys(item).sort().join("|") === keys.slice().sort().join("|");
export const emptyReflection = () => Object.fromEntries(RELATION_AIDE_FIELDS.map(([key]) => [key, ""]));

export function checkedReflectionContent(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)
    || !SAME_KEYS(source, RELATION_AIDE_FIELDS.map(([field]) => field))) return null;
  let total = 0;
  const clean = {};
  for (const [field] of RELATION_AIDE_FIELDS) {
    const value = source[field];
    if (typeof value !== "string" || !value.isWellFormed() || value !== value.trim()
      || Array.from(value).some(char => {
        const code = char.codePointAt(0);
        return (code < 32 && code !== 10) || code === 127;
      })) return null;
    const len = Array.from(value).length;
    if (len > 1200) return null;
    total += len;
    clean[field] = value;
  }
  return total <= 6000 ? clean : null;
}
export function sameReflectionContent(a, b) {
  const left = checkedReflectionContent(a), right = checkedReflectionContent(b);
  return left !== null && right !== null && JSON.stringify(left) === JSON.stringify(right);
}
const validVersion = v => Number.isInteger(v) && v >= 0 && v <= MAX;

export function checkedReflectionPage(page, caseId, beforeVersion) {
  const invalid = () => { throw new ApiAccessError(503, "REPONSE_REFLEXION_INVALIDE"); };
  if (!page || typeof page !== "object" || Array.isArray(page)
    || !SAME_KEYS(page, ["caseId", "dossierVersion", "reflectionVersion",
      "content", "history", "nextBeforeVersion"])
    || !UUID.test(caseId) || page.caseId !== caseId
    || !validVersion(page.dossierVersion) || !validVersion(page.reflectionVersion)
    || page.reflectionVersion > page.dossierVersion
    || checkedReflectionContent(page.content) === null
    || !Array.isArray(page.history) || page.history.length > 25
    || page.nextBeforeVersion !== null && (!validVersion(page.nextBeforeVersion)
      || page.nextBeforeVersion < 1 || page.history.length !== 25)) invalid();
  let olderThan = MAX + 1, preceding = null, sameAuthor = null;
  for (const version of page.history) {
    if (!version || typeof version !== "object" || Array.isArray(version)
      || !SAME_KEYS(version, ["dossierVersion", "previousContent", "content",
        "actorId", "reason", "createdAt"])
      || !validVersion(version.dossierVersion) || version.dossierVersion < 1
      || version.dossierVersion >= olderThan || version.dossierVersion > page.reflectionVersion
      || typeof version.actorId !== "string" || !UUID.test(version.actorId)
      || sameAuthor !== null && sameAuthor !== version.actorId
      || typeof version.reason !== "string" || !version.reason.trim()
      || version.reason.length > 200 || !version.reason.isWellFormed()
      || !Number.isFinite(Date.parse(version.createdAt))
      || checkedReflectionContent(version.content) === null
      || checkedReflectionContent(version.previousContent) === null) invalid();
    if (preceding !== null && !sameReflectionContent(preceding, version.content)) invalid();
    olderThan = version.dossierVersion;
    preceding = version.previousContent;
    sameAuthor = version.actorId;
  }
  if (page.nextBeforeVersion !== null
    && page.nextBeforeVersion !== page.history.at(-1).dossierVersion) invalid();
  if (beforeVersion === undefined) {
    if (page.reflectionVersion !== 0
      && (!page.history.length || page.history[0].dossierVersion !== page.reflectionVersion
        || !sameReflectionContent(page.history[0].content, page.content))) invalid();
    if (page.reflectionVersion === 0
      && (page.history.length !== 0 || !sameReflectionContent(page.content, emptyReflection()))) invalid();
  } else if (page.history.some(item => item.dossierVersion >= beforeVersion)) invalid();
  return page;
}
