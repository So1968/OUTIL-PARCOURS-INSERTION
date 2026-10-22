// Adaptateur explicitement opt-in vers le backend ARTAG privé.
// Aucune migration implicite depuis localStorage ni communication externe.
export function secureTaskApiEnabled() {
  return import.meta.env.VITE_ARTAG_SECURE_TASKS === "1"
    && typeof window !== "undefined"
    && window.location.protocol === "https:";
}

export class SecureTasksUnavailable extends Error {
  constructor(message = "Tâches sécurisées non disponibles.") {
    super(message);
    this.name = "SecureTasksUnavailable";
  }
}

async function doRequest(path, options = {}) {
  if (!secureTaskApiEnabled()) throw new SecureTasksUnavailable();
  const res = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const labels = {
      401: "Session professionnelle requise.",
      403: "Autorisation refusée.",
      404: "Tâche ou accès indisponible.",
      409: "Cette tâche a été modifiée ailleurs. Recharge la liste.",
      422: "Vérifie les informations de la tâche.",
      503: "Le serveur professionnel n'est pas activé.",
    };
    throw new SecureTasksUnavailable(labels[res.status] || "Connexion sécurisée indisponible.");
  }
  return res.json();
}

async function token() {
  const answer = await doRequest("/auth/csrf");
  if (!/^[a-f0-9]{64}$/.test(answer.token ?? "")) throw new SecureTasksUnavailable();
  return answer.token;
}

export async function loadSecureTasks() {
  let offset = 0;
  const tasks = [];
  // Plafond de protection : afficher une erreur plutôt qu'une liste tronquée.
  for (let page = 0; page < 100; page++) {
    const result = await doRequest(`/api/mes-taches?offset=${offset}`);
    if (!Array.isArray(result.tasks)) throw new SecureTasksUnavailable();
    tasks.push(...result.tasks);
    if (result.nextOffset === null) return tasks;
    if (!Number.isSafeInteger(result.nextOffset) || result.nextOffset <= offset) {
      throw new SecureTasksUnavailable();
    }
    offset = result.nextOffset;
  }
  throw new SecureTasksUnavailable("Liste trop volumineuse : pagination à examiner.");
}

export async function createSecureTask(title) {
  const csrf = await token();
  return doRequest("/api/mes-taches", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ title }),
  });
}

export async function editSecureTask(task, changes) {
  if (!task || typeof task.id !== "string" || !Number.isSafeInteger(task.version)) {
    throw new SecureTasksUnavailable();
  }
  const csrf = await token();
  return doRequest(`/api/mes-taches/${encodeURIComponent(task.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ expectedVersion: task.version, changes }),
  });
}
