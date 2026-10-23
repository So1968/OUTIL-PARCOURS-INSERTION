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

/**
 * Liste privée de rappels échus. La date provient de l'API (Europe/Paris),
 * jamais de l'horloge locale du navigateur. Aucun appel à Microsoft Graph.
 */
export async function loadSecureReminders() {
  let offset = 0;
  let day = null;
  const reminders = [];
  for (let page = 0; page < 100; page++) {
    const result = await doRequest(`/api/mes-rappels?offset=${offset}`);
    if (!Array.isArray(result.reminders) || !/^\d{4}-\d{2}-\d{2}$/.test(result.day ?? "")) {
      throw new SecureTasksUnavailable();
    }
    if (day !== null && result.day !== day) {
      throw new SecureTasksUnavailable("La journée a changé pendant le chargement. Recharge les rappels.");
    }
    day = result.day;
    reminders.push(...result.reminders);
    if (result.nextOffset === null) return { day, reminders };
    if (!Number.isSafeInteger(result.nextOffset) || result.nextOffset <= offset) {
      throw new SecureTasksUnavailable();
    }
    offset = result.nextOffset;
  }
  throw new SecureTasksUnavailable("Liste de rappels trop volumineuse : pagination à examiner.");
}

export function nextProfessionalDay(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new SecureTasksUnavailable();
  }
  const value = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== day) {
    throw new SecureTasksUnavailable();
  }
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}


// Repères de charge professionnels : aucun titre ou commentaire libre transmis.
export async function loadSecureWorkEvents(day = null) {
  let offset = 0;
  let serverDay = null;
  const events = [];
  if (day !== null && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new SecureTasksUnavailable("Date de charge invalide.");
  }
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({ offset: String(offset) });
    if (day) query.set("day", day);
    const result = await doRequest("/api/mes-evenements?" + query.toString());
    if (!Array.isArray(result.events) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(result.day ?? "") ||
      (serverDay !== null && serverDay !== result.day)) {
      throw new SecureTasksUnavailable("Réponse de charge invalide.");
    }
    serverDay = result.day;
    events.push(...result.events);
    if (result.nextOffset === null) return { day: serverDay, events };
    if (!Number.isSafeInteger(result.nextOffset) || result.nextOffset <= offset) {
      throw new SecureTasksUnavailable("Pagination des activités invalide.");
    }
    offset = result.nextOffset;
  }
  throw new SecureTasksUnavailable("Trop d'activités : liste à examiner.");
}

export async function createSecureWorkEvent(input) {
  const csrf = await token();
  return doRequest("/api/mes-evenements", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify(input),
  });
}

export async function editSecureWorkEvent(event, changes) {
  if (!event || typeof event.id !== "string" || !Number.isSafeInteger(event.version)) {
    throw new SecureTasksUnavailable("Activité à recharger.");
  }
  const csrf = await token();
  return doRequest("/api/mes-evenements/" + encodeURIComponent(event.id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: JSON.stringify({ expectedVersion: event.version, changes }),
  });
}
