export class InvalidTaskDraft extends Error {
  constructor(message) { super(message); this.name = "InvalidTaskDraft"; }
}

// Un seul POST par action validée, sans échéance ni durée déduite.
// Le service serveur vérifie à nouveau chaque champ.
export function prepareSecureTaskCreate(title, options = {}) {
  if (typeof title !== "string" || !title.trim() || title.length > 200) {
    throw new InvalidTaskDraft("Indique une action courte (200 caractères maximum).");
  }
  if (!options || typeof options !== "object" || Array.isArray(options)
    || Object.keys(options).some(key => !["dueDate", "reminderDaysBefore", "estimatedMinutes", "caseId"].includes(key))) {
    throw new InvalidTaskDraft("Options de suivi invalides.");
  }
  const task = { title: title.trim() };
  if (options.caseId !== undefined) {
    if (typeof options.caseId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.caseId)) {
      throw new InvalidTaskDraft("Identifiant du dossier invalide.");
    }
    task.caseId = options.caseId;
  }
  const day = options.dueDate;
  if (day !== undefined && day !== null && day !== "") {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new InvalidTaskDraft("Échéance invalide.");
    }
    const parsed = new Date(day + "T12:00:00.000Z");
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
      throw new InvalidTaskDraft("Échéance invalide.");
    }
    task.dueDate = day;
    const n = options.reminderDaysBefore ?? 1;
    if (![0, 1, 2, 7].includes(n)) {
      throw new InvalidTaskDraft("Choisis un rappel autorisé.");
    }
    task.reminderDaysBefore = n;
  } else if (options.reminderDaysBefore !== undefined
    && options.reminderDaysBefore !== null
    && ![0, 1, 2, 7].includes(options.reminderDaysBefore)) {
    throw new InvalidTaskDraft("Choisis un rappel autorisé.");
  }
  const minutes = options.estimatedMinutes;
  if (minutes !== undefined && minutes !== null && minutes !== "") {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      throw new InvalidTaskDraft("Durée estimée invalide.");
    }
    task.estimatedMinutes = minutes;
  }
  return task;
}
