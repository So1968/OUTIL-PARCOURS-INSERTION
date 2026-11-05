// Repères de travail personnels : aucune note de dossier ni classement de personnes.
// Le jour vient du serveur (Europe/Paris) ; pas d'horloge du navigateur.
export function secureDailyPriorities(tasks = [], day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "") || !Array.isArray(tasks)) return [];
  const rank = task => {
    if (task.status === "EN_COURS") return 0;
    if (task.dueDate && task.dueDate < day) return 1;
    if (task.dueDate === day) return 2;
    if (task.dueDate && task.dueDate > day) return 3;
    return 4;
  };
  return tasks.filter(task => task && typeof task.id === "string"
      && ["A_FAIRE", "EN_COURS", "EN_ATTENTE"].includes(task.status))
    .sort((a,b) => rank(a) - rank(b)
      || String(a.dueDate || "9999-12-31").localeCompare(String(b.dueDate || "9999-12-31"))
      || String(a.id).localeCompare(String(b.id)))
    .slice(0,3);
}

export function secureTaskCounts(tasks = [], reminders = []) {
  const total = tasks.filter(task => task && task.status !== "FAIT").length;
  return { open: total, reminders: reminders.length };
}
