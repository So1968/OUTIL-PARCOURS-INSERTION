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

export async function creerNotePartageeSecurisee({ caseId, text, expectedVersion }) {
  const path = dossierPath(caseId);
  const csrfResponse = await fetch("/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  const csrf = await expectJson(csrfResponse);
  if (!/^[a-f0-9]{64}$/.test(csrf.token ?? "")) {
    throw new ApiAccessError(503, "CSRF_INDISPONIBLE");
  }
  const response = await fetch(path + "/notes-partagees", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf.token },
    body: JSON.stringify({ text, expectedVersion }),
  });
  return expectJson(response);
}
