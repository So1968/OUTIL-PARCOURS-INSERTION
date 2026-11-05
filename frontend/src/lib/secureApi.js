// Préparation de l'interface sécurisée ARTAG, NON branchée aux écrans
// historiques tant que la mise en service SSO et la reprise des dossiers
// n'ont pas été approuvées. Jamais de jeton OIDC dans localStorage.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ApiAccessError extends Error {
  constructor(status, code = "SERVICE_INDISPONIBLE") {
    super(code);
    this.name = "ApiAccessError";
    this.status = status;
    this.code = code;
  }
}

async function expectJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiAccessError(response.status, payload.error);
  return payload;
}

function dossierPath(caseId) {
  if (typeof caseId !== "string" || !UUID.test(caseId)) {
    throw new ApiAccessError(422, "IDENTIFIANT_INVALIDE");
  }
  return `/api/dossiers/${encodeURIComponent(caseId)}`;
}

export async function lireApercuSecurise(caseId) {
  const response = await fetch(dossierPath(caseId) + "/overview", {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  return expectJson(response);
}

function notePath(caseId, noteId) {
  const path = dossierPath(caseId);
  if (typeof noteId !== "string" || !UUID.test(noteId)) {
    throw new ApiAccessError(422, "IDENTIFIANT_INVALIDE");
  }
  return `${path}/notes-partagees/${encodeURIComponent(noteId)}`;
}

async function mutateDossier(path, method, body) {
  const csrfResponse = await fetch("/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  const csrf = await expectJson(csrfResponse);
  if (!/^[a-f0-9]{64}$/.test(csrf.token ?? "")) {
    throw new ApiAccessError(503, "CSRF_INDISPONIBLE");
  }
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf.token },
    body: JSON.stringify(body),
  });
  return expectJson(response);
}

export async function creerNotePartageeSecurisee({ caseId, text, expectedVersion }) {
  return mutateDossier(dossierPath(caseId) + "/notes-partagees", "POST", { text, expectedVersion });
}

export async function corrigerNotePartageeSecurisee({ caseId, noteId, text, reason, expectedVersion }) {
  return mutateDossier(notePath(caseId, noteId), "PATCH", { text, reason, expectedVersion });
}

export async function validerNotePartageeSecurisee({ caseId, noteId, expectedVersion }) {
  return mutateDossier(notePath(caseId, noteId) + "/validation", "POST", { expectedVersion });
}

export async function lireReferenceArtagSecurisee({ caseId, beforeVersion }) {
  const path = dossierPath(caseId) + "/reference-artag";
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion) || beforeVersion < 1 || beforeVersion > 2147483647)) {
    throw new ApiAccessError(422, "VERSION_INVALIDE");
  }
  const response = await fetch(path + (beforeVersion === undefined ? "" : `?beforeVersion=${beforeVersion}`), {
    credentials: "same-origin", cache: "no-store", redirect: "error",
  });
  return expectJson(response);
}

export async function corrigerReferenceArtagSecurisee({ caseId, artagReference, reason, expectedVersion }) {
  return mutateDossier(dossierPath(caseId) + "/reference-artag", "PATCH", { expectedVersion, artagReference, reason });
}

export async function creerDossierSecurise({ requestId, artagReference }) {
  if (typeof requestId !== "string" || !UUID.test(requestId)) throw new ApiAccessError(422, "CREATION_DOSSIER_INVALIDE");
  return mutateDossier("/api/dossiers", "POST", { requestId, artagReference });
}

export async function lireHistoriqueNotePartageeSecurise({ caseId, noteId, beforeVersion }) {
  const path = notePath(caseId, noteId);
  if (beforeVersion !== undefined && (!Number.isInteger(beforeVersion)
    || beforeVersion < 1 || beforeVersion > 2147483647)) {
    throw new ApiAccessError(422, "VERSION_INVALIDE");
  }
  const query = beforeVersion === undefined ? "" : `?beforeVersion=${beforeVersion}`;
  const response = await fetch(path + "/historique" + query, {
    credentials: "same-origin", cache: "no-store", redirect: "error",
  });
  return expectJson(response);
}

export async function lireNotesPartageesSecurisees({ caseId, offset = 0 }) {
  const path = dossierPath(caseId);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    throw new ApiAccessError(422, "PAGINATION_INVALIDE");
  }
  return expectJson(await fetch(`${path}/notes-partagees?offset=${offset}`, {
    credentials: "same-origin", cache: "no-store", redirect: "error",
  }));
}
