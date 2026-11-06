/**
 * Recherche documentaire D'ESSAI sur textes exclusivement fictifs.
 * Aucun téléchargement, aucune source officielle indexée, aucune IA.
 *
 * Un résultat trouvé n'est pas une garantie de droit applicable :
 * il reste à vérifier la version et la portée de la source.
 */
const REF_ID = /^ref-fiction-[a-z0-9-]{1,40}$/;
const TYPES = new Set(["REGLE_JURIDIQUE", "RECOMMANDATION", "PROCEDURE"]);
const SCOPES = new Set(["NATIONAL", "TERRITORIAL", "INSTITUTIONNEL"]);
const REQUIRED = ["id", "title", "sourceType", "scope", "publishedAt",
  "effectiveFrom", "effectiveTo", "excerpt", "keywords"];
const STOP = new Set([
  "les", "des", "une", "dans", "pour", "avec", "sans", "sur", "aux",
  "est", "sont", "par", "qui", "que", "quel", "quelle", "comment", "entre",
  "depuis", "plus", "dans", "comme", "droits", "droit",
]);

export class FictionalReferenceError extends Error {
  constructor() {
    super("REFERENTIEL_FICTIF_INVALIDE");
    this.name = "FictionalReferenceError";
  }
}
function civilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const y = Number(value.slice(0, 4)), m = Number(value.slice(5, 7)), d = Number(value.slice(8, 10));
  if (y < 1900 || y > 2100 || m < 1 || m > 12) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return d >= 1 && d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
function safeText(value, max) {
  return typeof value === "string" && value.trim().length >= 1
    && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}
function validRef(ref) {
  return ref && typeof ref === "object" && !Array.isArray(ref)
    && Object.keys(ref).length === REQUIRED.length && REQUIRED.every(k => Object.hasOwn(ref, k))
    && REF_ID.test(ref.id)
    && safeText(ref.title, 160) && safeText(ref.excerpt, 1500)
    && TYPES.has(ref.sourceType) && SCOPES.has(ref.scope)
    && civilDate(ref.publishedAt) && civilDate(ref.effectiveFrom)
    && ref.publishedAt <= ref.effectiveFrom
    && (ref.effectiveTo === null || (civilDate(ref.effectiveTo) && ref.effectiveTo >= ref.effectiveFrom))
    && Array.isArray(ref.keywords) && ref.keywords.length >= 1 && ref.keywords.length <= 12
    && ref.keywords.every(k => safeText(k, 45));
}
function tokens(value) {
  return new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/g).filter(t => t.length >= 3 && !STOP.has(t)).slice(0, 40));
}
function score(queryTokens, ref) {
  const title = tokens(ref.title), keywords = tokens(ref.keywords.join(" ")), excerpt = tokens(ref.excerpt);
  let scoreValue = 0;
  for (const word of queryTokens) {
    if (keywords.has(word)) scoreValue += 3;
    else if (title.has(word)) scoreValue += 2;
    else if (excerpt.has(word)) scoreValue += 1;
  }
  return scoreValue;
}

/**
 * Les documents fournis sont des données non fiables ; aucun moteur
 * de recherche en ligne, recherche PostgreSQL ou lecture ARTAG.
 */
export function searchFictionalSocialReferences({
  query, asOf, references, limit = 5,
} = {}) {
  if (!safeText(query, 250) || !civilDate(asOf)
    || !Array.isArray(references) || references.length > 100
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 10
    || !references.every(validRef)) {
    throw new FictionalReferenceError();
  }
  const ids = new Set();
  for (const ref of references) {
    if (ids.has(ref.id)) throw new FictionalReferenceError();
    ids.add(ref.id);
  }
  const words = tokens(query);
  if (words.size === 0) return Object.freeze({
    status: "AUCUNE_REFERENCE", asOf, results: Object.freeze([]),
    legalConclusionPossible: false,
  });
  const results = references
    .filter(ref => ref.publishedAt <= asOf && ref.effectiveFrom <= asOf
      && (ref.effectiveTo === null || asOf <= ref.effectiveTo))
    .map(ref => ({ ref, relevance: score(words, ref) }))
    .filter(entry => entry.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.ref.id.localeCompare(b.ref.id))
    .slice(0, limit)
    .map(({ ref, relevance }) => Object.freeze({
      referenceId: ref.id,
      title: ref.title,
      sourceType: ref.sourceType,
      scope: ref.scope,
      publishedAt: ref.publishedAt,
      effectiveFrom: ref.effectiveFrom,
      effectiveTo: ref.effectiveTo,
      relevance,
      excerptUntrusted: ref.excerpt,
      applicabilityVerified: false,
      legalConclusionPossible: false,
    }));
  return Object.freeze({
    status: results.length ? "REFERENCES_FICTIVES_TROUVEES" : "AUCUNE_REFERENCE",
    asOf, results: Object.freeze(results),
    legalConclusionPossible: false,
  });
}

/**
 * Enrichit un contrat modèle fictif, sans promouvoir les extraits au rang
 * de consignes. Le contrat de sortie continue à exiger les sources du dossier
 * pour les faits individuels.
 */
export function attachFictionalReferences({ request, searchResult, authorized = false } = {}) {
  if (authorized !== true) return Object.freeze({ status: "ACCES_REFUSE", attached: false });
  if (!request || request.status !== "REQUETE_FICTIVE_PREPAREE"
    || request.fictionalOnly !== true || request.providerCalled !== false
    || request.providerConfigured !== false || request.saved !== false
    || !searchResult || !Array.isArray(searchResult.results)
    || searchResult.asOf !== request.asOf
    || !["REFERENCES_FICTIVES_TROUVEES", "AUCUNE_REFERENCE"].includes(searchResult.status)
    || searchResult.legalConclusionPossible !== false
    || searchResult.results.some(ref => !REF_ID.test(ref.referenceId ?? "")
      || ref.applicabilityVerified !== false
      || !safeText(ref.excerptUntrusted, 1500))) {
    throw new FictionalReferenceError();
  }
  return Object.freeze({
    ...request,
    referencesAttached: true,
    untrustedReferenceExcerpts: Object.freeze(searchResult.results.map(ref =>
      Object.freeze({ ...ref }))),
    legalSourcesValidated: false,
    externalLegalSourcesProvided: false,
  });
}
