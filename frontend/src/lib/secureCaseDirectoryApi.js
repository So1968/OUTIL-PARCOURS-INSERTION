import { ApiAccessError } from "./secureApi";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));

export function hasUsableArtagReference(value) {
  if (typeof value !== "string") return false;
  const characters = Array.from(value);
  return characters.length > 0 && characters.length <= 80 && value.isWellFormed() && value === value.trim()
    && characters.every(char => char.codePointAt(0) > 31 && char.codePointAt(0) !== 127);
}

export async function loadWritableCases(before) {
  if (before !== undefined && (typeof before !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(before))) {
    throw new ApiAccessError(422, "REQUETE_DOSSIERS_INVALIDE");
  }
  const response = await fetch("/api/mes-dossiers" + (before === undefined ? "" : `?before=${encodeURIComponent(before)}`), {
    credentials: "same-origin", cache: "no-store", redirect: "error",
  });
  if (!response.ok) throw new ApiAccessError(response.status);
  const data = await response.json().catch(() => null);
  if (!data || !Array.isArray(data.cases) || data.cases.length > 25
    || new Set(data.cases.map(row => row?.id)).size !== data.cases.length
    || !data.cases.every(row => row && typeof row.id === "string" && UUID.test(row.id)
      && (row.artagReference === null || hasUsableArtagReference(row.artagReference))
      && typeof row.canManageReference === "boolean"
      && Number.isInteger(row.version) && row.version >= 0 && row.version <= 2147483647
      && validDate(row.createdAt) && validDate(row.updatedAt))
    || (data.nextCursor !== null && (typeof data.nextCursor !== "string"
      || !/^[A-Za-z0-9_-]{1,200}$/.test(data.nextCursor) || data.nextCursor === before || data.cases.length !== 25))) {
    throw new ApiAccessError(503);
  }
  return data;
}
