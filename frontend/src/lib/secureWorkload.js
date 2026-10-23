
// Calcul purement indicatif, sans évaluer la performance ni les personnes.
// Calendrier Outlook absent : ne pas afficher ces résultats comme charge totale.
export function syntheseChargePrivee({ tasks = [], events = [], day } = {}) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new TypeError("JOUR_CHARGE_INVALIDE");
  }
  const isMinutes = n => Number.isInteger(n) && n > 0 && n <= 600;
  const due = tasks.filter(t => t && t.status !== "FAIT" && t.dueDate && t.dueDate <= day);
  const current = events.filter(e => e && e.day === day && e.state !== "ANNULE");
  const completed = current.filter(e => e.state === "EFFECTUE");
  const planned = current.filter(e => e.state === "PREVU");
  const sum = list => list.reduce((acc, e) => acc + (isMinutes(e.minutes) ? e.minutes : 0), 0);
  const taskMinutes = due.reduce((acc, t) =>
    acc + (isMinutes(t.estimatedMinutes) ? t.estimatedMinutes : 0), 0);
  return {
    day,
    taskMinutes,
    doneMinutes: sum(completed),
    plannedMinutes: sum(planned),
    totalKnown: taskMinutes + sum(completed) + sum(planned),
    overdue: due.filter(t => t.dueDate < day).length,
    due: due.length,
    unestimatedTasks: due.filter(t => !isMinutes(t.estimatedMinutes)).length,
    plannedEvents: planned.length,
    completedEvents: completed.length,
  };
}
export function chargeToText(minutes) {
  const n = Math.max(0, Math.floor(Number(minutes) || 0));
  return n >= 60 ? String(Math.floor(n / 60)) + " h " + String(n % 60).padStart(2, "0") : n + " min";
}
