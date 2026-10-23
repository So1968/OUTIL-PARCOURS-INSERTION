// Hiérarchisation locale uniquement. Aucun classement de personnes.
// Les tâches marquées par le professionnel sont priorisées, puis celles
// arrivées à échéance. Les actions sans date restent candidates en dernier.
export function troisPriorites(tasks = [], today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today || "")) return [];
  return tasks.filter(t => t && t.status !== "Fait" && typeof t.id === "string")
    .sort((a, b) => {
      const ranked = t => {
        if (t.priority === "haute") return 0;
        if (t.dueDate && t.dueDate < today) return 1;
        if (t.dueDate === today) return 2;
        if (t.dueDate) return 3;
        return 4;
      };
      const diff = ranked(a) - ranked(b);
      if (diff) return diff;
      const due = (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      if (due) return due;
      // Critère stable qui n'utilise aucune donnée personnelle.
      return String(a.id).localeCompare(String(b.id));
    }).slice(0, 3);
}

export function progressionTaches(tasks = []) {
  const valid = tasks.filter(t => t && typeof t.id === "string");
  return {
    done: valid.filter(t => t.status === "Fait").length,
    remaining: valid.filter(t => t.status !== "Fait").length,
  };
}


/**
 * Une file unique sans recopier plusieurs fois les tâches urgentes.
 * Les reports de rappels sont respectés, aucune échéance n'est inventée.
 */
export function actionsMaintenant(tasks = [], day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return [];
  const today = String(day);
  const active = tasks.filter(t => t && t.status !== "Fait"
    && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate || ""));
  const reached = active.filter(task => {
    const shift = task.reminderDaysBefore ?? 1;
    const date = new Date(task.dueDate + "T12:00:00.000Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== task.dueDate) return false;
    if (![0, 1, 2, 7].includes(Number(shift))) return task.dueDate <= today;
    date.setUTCDate(date.getUTCDate() - Number(shift));
    const reminderDay = date.toISOString().slice(0, 10);
    return (task.dueDate <= today || reminderDay <= today)
      && (!task.snoozedUntil || task.snoozedUntil <= today);
  });
  const unique = new Map();
  for (const task of reached) {
    const key = (task.dossierId || "__mes_taches") + ":" + task.id;
    if (!unique.has(key)) unique.set(key, task);
  }
  return [...unique.values()].sort((a, b) => {
    const classify = t => t.dueDate < today ? 0 : t.dueDate === today ? 1 : 2;
    const urgency = classify(a) - classify(b);
    if (urgency) return urgency;
    if ((a.priority === "haute") !== (b.priority === "haute")) return a.priority === "haute" ? -1 : 1;
    const due = a.dueDate.localeCompare(b.dueDate);
    if (due) return due;
    const estimated = t => Number.isInteger(t.estimatedMinutes) && t.estimatedMinutes > 0
      ? t.estimatedMinutes : 9999;
    const duration = estimated(a) - estimated(b);
    if (duration) return duration;
    return String(a.id).localeCompare(String(b.id));
  });
}

/** Identifiants techniques seulement, jamais nom ni notes enregistrés. */
export function retrouverTacheEnCours(tasks = [], pointer) {
  if (!pointer || typeof pointer.dossierId !== "string" || typeof pointer.taskId !== "string") return null;
  return tasks.find(t => t && t.dossierId === pointer.dossierId && t.id === pointer.taskId
    && t.status !== "Fait") || null;
}
