import { ApiAccessError } from "./secureApi";

export const BRIEF_TYPES = Object.freeze({
  "synthese-courte": Object.freeze({
    title: "Synthèse courte",
    purpose: "Vue d’ensemble rapide, sans jugement ni analyse sensible.",
    maxTotal: 1400,
    fields: Object.freeze([
      ["situationGlobale", "Situation globale"],
      ["difficultesPrincipales", "Difficultés principales"],
      ["pointsAppui", "Points d’appui"],
      ["sujetsTravailles", "Modules / sujets travaillés"],
      ["etapeActuelle", "Étape actuelle"],
      ["vigilanceUtile", "Vigilance utile"],
    ]),
  }),
  "note-continuite": Object.freeze({
    title: "Note de continuité",
    purpose: "Repères très courts pour reprendre rapidement la situation.",
    maxTotal: 1000,
    fields: Object.freeze([
      ["situationEnCours", "Situation en cours"],
      ["prioriteImmediate", "Priorité immédiate"],
      ["dejaFait", "Déjà fait"],
      ["relaisAbsence", "Si relais / absence"],
      ["vigilanceUtile", "Vigilance utile"],
    ]),
  }),
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 2147483647;
const SAME_KEYS = (item, keys) => Object.keys(item).sort().join("|") === keys.slice().sort().join("|");
const validDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));

export function checkedBriefContent(type, source) {
  const config = BRIEF_TYPES[type];
  if (!config || !source || typeof source !== "object" || Array.isArray(source)
    || !SAME_KEYS(source, config.fields.map(([field]) => field))) return null;
  let total = 0;
  const content = {};
  for (const [field] of config.fields) {
    const value = source[field];
    if (typeof value !== "string" || !value.isWellFormed() || value !== value.trim()
      || Array.from(value).some(char => {
        const code = char.codePointAt(0);
        return (code < 32 && code !== 10) || code === 127;
      })) return null;
    const length = Array.from(value).length;
    if (length > 350) return null;
    total += length;
    content[field] = value;
  }
  return total <= config.maxTotal ? content : null;
}
export function sameBriefContent(type, a, b) {
  const left = checkedBriefContent(type, a), right = checkedBriefContent(type, b);
  return left !== null && right !== null && JSON.stringify(left) === JSON.stringify(right);
}
const validVersion = value => Number.isInteger(value) && value >= 0 && value <= MAX;

export function checkedBriefPage(page, caseId, type, beforeVersion) {
  const invalid = () => { throw new ApiAccessError(503, "REPONSE_BLOC_COURT_INVALIDE"); };
  if (!BRIEF_TYPES[type] || !page || typeof page !== "object" || Array.isArray(page)
    || !SAME_KEYS(page, ["caseId", "type", "dossierVersion", "briefVersion",
      "content", "history", "nextBeforeVersion"])
    || page.caseId !== caseId || !UUID.test(caseId) || page.type !== type
    || !validVersion(page.dossierVersion) || !validVersion(page.briefVersion)
    || page.briefVersion > page.dossierVersion
    || !Array.isArray(page.history) || page.history.length > 25
    || checkedBriefContent(type, page.content) === null
    || page.nextBeforeVersion !== null && (!validVersion(page.nextBeforeVersion)
      || page.nextBeforeVersion < 1 || page.history.length !== 25)) invalid();
  let previousVersion = MAX + 1;
  let previousContent = null;
  for (const entry of page.history) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
      || !SAME_KEYS(entry, ["dossierVersion", "previousContent", "content",
        "actorId", "reason", "createdAt"])
      || !validVersion(entry.dossierVersion) || entry.dossierVersion < 1
      || entry.dossierVersion >= previousVersion || entry.dossierVersion > page.briefVersion
      || typeof entry.actorId !== "string" || !UUID.test(entry.actorId)
      || typeof entry.reason !== "string" || !entry.reason.trim()
      || entry.reason.length > 200 || !entry.reason.isWellFormed()
      || !validDate(entry.createdAt)
      || checkedBriefContent(type, entry.content) === null
      || checkedBriefContent(type, entry.previousContent) === null) invalid();
    if (previousContent !== null && !sameBriefContent(type, previousContent, entry.content)) invalid();
    previousVersion = entry.dossierVersion;
    previousContent = entry.previousContent;
  }
  if (page.nextBeforeVersion !== null
    && page.nextBeforeVersion !== page.history.at(-1).dossierVersion) invalid();
  if (beforeVersion === undefined) {
    if (page.briefVersion !== 0
      && (!page.history.length || page.history[0].dossierVersion !== page.briefVersion
        || !sameBriefContent(type, page.history[0].content, page.content))) invalid();
    if (page.briefVersion === 0 && page.history.length !== 0) invalid();
  } else if (page.history.some(entry => entry.dossierVersion >= beforeVersion)) invalid();
  return page;
}
