import { ApiAccessError } from "./secureApi";
import { hasUsableArtagReference } from "./secureCaseDirectoryApi";
import { validDossierVersion, validReferenceReason } from "./secureCaseReferenceData";

export const IDENTITY_FIELDS = ["lastName", "firstName", "insertisNumber", "age"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value, max) => value === null || (typeof value === "string" && value.isWellFormed() && value === value.trim()
  && value.length > 0 && Array.from(value).length <= max && Array.from(value).every(char => char.codePointAt(0) > 31 && char.codePointAt(0) !== 127));
export const sameIdentity = (a, b) => IDENTITY_FIELDS.every(field => a[field] === b[field]);
export const validIdentity = value => value && !Array.isArray(value) && Object.keys(value).length === 4
  && IDENTITY_FIELDS.every(field => Object.hasOwn(value, field)) && text(value.lastName, 200) && text(value.firstName, 200)
  && text(value.insertisNumber, 255) && (value.age === null || validDossierVersion(value.age));

export function checkedIdentityPage(data, caseId, beforeVersion) {
  if (!data || data.caseId !== caseId || !hasUsableArtagReference(data.artagReference) || !validDossierVersion(data.dossierVersion)
    || !validDossierVersion(data.identityVersion) || data.identityVersion > data.dossierVersion || !validIdentity(data.identity)
    || !Array.isArray(data.history) || data.history.length > 50
    || (data.identityVersion === 0 && (data.history.length > 0 || IDENTITY_FIELDS.some(field => data.identity[field] !== null)))
    || !data.history.every((revision, i) => revision && validDossierVersion(revision.dossierVersion) && revision.dossierVersion > 0
      && revision.dossierVersion <= data.identityVersion && validIdentity(revision.identity) && validIdentity(revision.previousIdentity)
      && !sameIdentity(revision.identity, revision.previousIdentity) && validReferenceReason(revision.reason)
      && typeof revision.actorId === "string" && UUID.test(revision.actorId) && typeof revision.createdAt === "string" && Number.isFinite(Date.parse(revision.createdAt))
      && (beforeVersion === undefined || revision.dossierVersion < beforeVersion)
      && (i === 0 || (revision.dossierVersion < data.history[i - 1].dossierVersion && sameIdentity(revision.identity, data.history[i - 1].previousIdentity))))
    || (beforeVersion === undefined && data.identityVersion > 0 && (data.history[0]?.dossierVersion !== data.identityVersion
      || !sameIdentity(data.history[0].identity, data.identity)))
    || (data.nextBeforeVersion !== null && (data.history.length !== 50 || data.nextBeforeVersion !== data.history.at(-1).dossierVersion))) throw new ApiAccessError(503);
  return data;
}
