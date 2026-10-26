import { ApiAccessError } from "./secureApi";
import { hasUsableArtagReference } from "./secureCaseDirectoryApi";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const validDossierVersion = value => Number.isInteger(value) && value >= 0 && value <= 2147483647;
const nullableReference = value => value === null || hasUsableArtagReference(value);
const historicalReference = value => value === null || (typeof value === "string" && value.isWellFormed() && Array.from(value).length <= 80);
export const validReferenceReason = value => typeof value === "string" && Boolean(value.trim())
  && value.isWellFormed() && value.length <= 200 && Array.from(value).every(char => char.codePointAt(0) > 31 && char.codePointAt(0) !== 127);

export function checkedReferencePage(data, caseId, beforeVersion) {
  if (!data || data.caseId !== caseId || !validDossierVersion(data.dossierVersion)
    || !nullableReference(data.artagReference) || !Array.isArray(data.history) || data.history.length > 50
    || !data.history.every((revision, i) => revision && validDossierVersion(revision.dossierVersion)
      && revision.dossierVersion > 0 && revision.dossierVersion <= data.dossierVersion
      && historicalReference(revision.previousReference) && hasUsableArtagReference(revision.artagReference)
      && revision.artagReference !== revision.previousReference && validReferenceReason(revision.reason)
      && typeof revision.actorId === "string" && UUID.test(revision.actorId)
      && typeof revision.createdAt === "string" && Number.isFinite(Date.parse(revision.createdAt))
      && (beforeVersion === undefined || revision.dossierVersion < beforeVersion)
      && (i === 0 || (revision.dossierVersion < data.history[i - 1].dossierVersion
        && revision.artagReference === data.history[i - 1].previousReference)))
    || (beforeVersion === undefined && data.history.length > 0 && data.history[0].artagReference !== data.artagReference)
    || (data.nextBeforeVersion !== null && (data.history.length !== 50
      || data.nextBeforeVersion !== data.history.at(-1).dossierVersion))) throw new ApiAccessError(503);
  return data;
}
