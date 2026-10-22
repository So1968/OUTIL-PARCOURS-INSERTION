// Simulation de charge du prototype : aucune durée inconnue n'est inventée.
// Les calculs utilisent des durées estimées, renseignées explicitement et modifiables.
export const TYPES_EVENEMENTS = Object.freeze({
  "Rendez-vous": 30,
  "Entretien": 45,
  "Imprévu": 15,
  "Appel": 10,
  "Relance": 10,
  "Administratif": 20,
  "Autre": 15,
});

export const isDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function minutesValides(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isSafeInteger(num) && num >= 1 && num <= 600 ? num : null;
}

export function dureeLisible(minutes) {
  const n = Math.max(0, Math.floor(Number(minutes) || 0));
  return n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? ` ${String(n % 60).padStart(2, "0")}` : ""}` : `${n} min`;
}

/**
 * Les tâches échues restent dans la charge du jour (report sans effacement).
 * Les tâches sans date sont visibles mais non comptabilisées dans le total.
 * Les rendez-vous annulés/reportés sont ignorés ; ceux de durée inconnue
 * ne contribuent pas aux minutes calculées.
 */
export function calculerChargeJour({
  day, tasks = [], events = [], appointments = [], capacityMinutes = 360,
} = {}) {
  if (!isDate(day)) throw new TypeError("Jour invalide");
  const capacity = minutesValides(capacityMinutes) ?? 360;
  const awaiting = tasks.filter(t => t && t.status !== "Fait" && isDate(t.dueDate) && t.dueDate <= day);
  const unplanned = tasks.filter(t => t && t.status !== "Fait" && !isDate(t.dueDate));
  const taskMinutes = awaiting.reduce((sum, t) => sum + (minutesValides(t.estimatedMinutes) ?? 0), 0);
  const taskMissingMinutes = awaiting.filter(t => minutesValides(t.estimatedMinutes) === null).length;
  const eventsOfDay = events.filter(e => e && e.day === day);
  const doneEvents = eventsOfDay.filter(e => e.status === "Fait");
  const plannedEvents = eventsOfDay.filter(e => e.status !== "Fait");
  const doneMinutes = doneEvents.reduce((sum, e) => sum + (minutesValides(e.minutes) ?? 0), 0);
  const plannedMinutes = plannedEvents.reduce((sum, e) => sum + (minutesValides(e.minutes) ?? 0), 0);
  const missingEventMinutes = eventsOfDay.filter(e => minutesValides(e.minutes) === null).length;

  const appointmentsOfDay = appointments.filter(a => a && a.date === day
    && !["Annulé", "Reporté", "Absent excusé", "Absent non prévenu"].includes(a.statut));
  const meetingMinutes = appointmentsOfDay.reduce((sum, a) =>
    sum + (minutesValides(a.durationMinutes) ?? 0), 0);
  const unknownMeetingMinutes = appointmentsOfDay.filter(a =>
    minutesValides(a.durationMinutes) === null).length;

  const totalKnown = taskMinutes + doneMinutes + plannedMinutes + meetingMinutes;
  const margin = capacity - totalKnown;
  return {
    day, capacity, totalKnown, margin, overload: margin < 0,
    taskMinutes, plannedMinutes, doneMinutes, meetingMinutes,
    eventsCount: eventsOfDay.length, appointmentsCount: appointmentsOfDay.length,
    overdueCount: awaiting.filter(t => t.dueDate < day).length,
    dueCount: awaiting.filter(t => t.dueDate === day).length,
    pendingWithoutDate: unplanned.length,
    missingEstimates: taskMissingMinutes + missingEventMinutes + unknownMeetingMinutes,
  };
}
