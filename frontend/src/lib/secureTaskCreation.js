import { SecureTasksUnavailable } from "./secureTasksApi";

// Un seul POST par action validée, sans échéance ni durée déduite.
// Le service serveur vérifie à nouveau chaque champ.
export function prepareSecureTaskCreate(title, options = {}) {
  if (typeof title !== "string" || !title.trim() || title.length > 200) {
    throw new SecureTasksUnavailable("Indique une action courte (200 caractères maximum).");
  }
  if (!options || typeof options !== "object" || Array.isArray(options)
    || Object.keys(options).some(key => !["dueDate", "reminderDaysBefore", "estimatedMinutes"].includes(key))) {
    throw new SecureTasksUnavailable("Options de suivi invalides.");
  }
  const task = { title: title.trim() };
  const day = options.dueDate;
  if (day !== undefined && day !== null && day !== "") {
    if (typeof day !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) {
      throw new SecureTasksUnavailable("Échéance invalide.");
    }
    const parsed = new Date(day + "T12:00:00.000Z");
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
      throw new SecureTasksUnavailable("Échéance invalide.");
    }
    task.dueDate = day;
    const n = options.reminderDaysBefore ?? 1;
    if (![0, 1, 2, 7].includes(n)) {
      throw new SecureTasksUnavailable("Choisis un rappel autorisé.");
    }
    task.reminderDaysBefore = n;
  } else if (options.reminderDaysBefore !== undefined
    && options.reminderDaysBefore !== null
    && ![0, 1, 2, 7].includes(options.reminderDaysBefore)) {
    throw new SecureTasksUnavailable("Choisis un rappel autorisé.");
  }
  const minutes = options.estimatedMinutes;
  if (minutes !== undefined && minutes !== null && minutes !== "") {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      throw new SecureTasksUnavailable("Durée estimée invalide.");
    }
    task.estimatedMinutes = minutes;
  }
  return task;
}
