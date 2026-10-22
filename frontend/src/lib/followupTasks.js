// Gestion prototype uniquement : aucune donnée de bénéficiaire réelle dans le navigateur.
// La synchronisation Microsoft Graph nécessitera une session pro et une DB serveur.
export const TASKS_STORAGE_KEY = "artag-actions-post-entretien-v1";

export function todayLocal(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftLocalDate(day, count) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(year, month - 1, date + count, 12);
  return todayLocal(value);
}

export function normaliseText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function decomposeActions(value) {
  // Une ligne, une tâche ; accepter également les listes séparées par des points-virgules.
  const lines = String(value || "").replace(/\r/g, "").split(/[\n;]+/);
  const seen = new Set();
  return lines
    .map(line => normaliseText(line.replace(/^(?:[-*•]|\d+[.)])\s*/, "")))
    .filter(label => {
      if (!label) return false;
      const key = label.toLocaleLowerCase("fr");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(label => label.slice(0, 240));
}

export function creerTachesEntretien({
  dossierId, journalId, suitePrevue = "", prochaineAction = "",
  echeance = "", traceInsertis = "À faire", now = new Date(), existingTasks = [],
} = {}) {
  if (!dossierId || !journalId) return { tasks: existingTasks, added: 0 };
  const createdAt = now.toISOString();
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(echeance)
    ? echeance
    : shiftLocalDate(todayLocal(now), 1);
  const proposed = [
    ...decomposeActions(suitePrevue),
    ...decomposeActions(prochaineAction),
    ...(["Faite", "Pas nécessaire"].includes(traceInsertis)
      ? [] : ["Tracer l'entretien dans Insertis"]),
  ];
  const seen = new Set();
  const byId = new Set(existingTasks.map(task => task.id));
  const additions = [];
  for (const raw of proposed) {
    const label = normaliseText(raw);
    const k = label.toLocaleLowerCase("fr");
    if (seen.has(k)) continue;
    seen.add(k);
    const taskId = `${journalId}:${seen.size}`;
    if (byId.has(taskId)) continue;
    const isInsertis = label === "Tracer l'entretien dans Insertis";
    additions.push({
      id: taskId, dossierId: String(dossierId), sourceId: journalId,
      title: label, dueDate: isInsertis ? todayLocal(now) : dueDate,
      remindDate: isInsertis ? todayLocal(now) : shiftLocalDate(dueDate, -1),
      status: "a_faire", priority: isInsertis ? "haute" : "normale",
      createdAt, completedAt: null, outlookStatus: "non_connecte",
    });
  }
  return { tasks: [...existingTasks, ...additions], added: additions.length };
}

export function classeEcheance(task, today = todayLocal()) {
  if (task.status === "fait") return "fait";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate ?? "")) return "sans_date";
  if (task.dueDate < today) return "retard";
  if (task.dueDate === today) return "aujourdhui";
  if (task.dueDate <= shiftLocalDate(today, 7)) return "semaine";
  return "plus_tard";
}

export function rappelsDuJour(tasks, today = todayLocal()) {
  return tasks.filter(task => task.status !== "fait"
    && ((task.dueDate && task.dueDate <= today)
      || (task.remindDate && task.remindDate <= today)));
}

export const MODELES_ACTIONS_PRO = Object.freeze({
  "Après entretien": [
    "Tracer l'entretien dans Insertis",
    "Confirmer le prochain rendez-vous",
    "Vérifier les documents à demander",
    "Préparer un compte rendu court",
  ],
  "Appui TNS": [
    "Faire le point avec la CMA",
    "Vérifier une échéance liée à l'activité",
    "Préparer les pièces utiles au projet",
    "Relancer un partenaire de l'activité",
  ],
  "Parcours professionnel": [
    "Actualiser les étapes du parcours",
    "Relancer une candidature ou une formation",
    "Préparer le prochain entretien",
    "Vérifier la réponse de France Travail",
  ],
  "Droits et démarches": [
    "Vérifier une démarche administrative",
    "Relancer un justificatif attendu",
    "Vérifier une échéance de droits",
    "Transmettre un relais au professionnel habilité",
  ],
});


export function createManualTask({ title, dueDate, dossierId = "", now = new Date() }) {
  const clean = normaliseText(title);
  if (!clean || clean.length > 240 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  return {
    id: crypto.randomUUID(), dossierId, sourceId: null,
    title: clean, dueDate, remindDate: shiftLocalDate(dueDate, -1),
    status: "a_faire", priority: "normale", completedAt: null,
    createdAt: now.toISOString(), outlookStatus: "non_connecte",
  };
}

/** Deux points de repère professionnels créés à l'enregistrement d'un rendez-vous.
 * Le titre reste générique : aucune identité n'apparaît dans le bureau.
 */
export function creerTachesRendezVous(rdv, existingTasks = []) {
  if (!rdv?.id || !/^\d{4}-\d{2}-\d{2}$/.test(rdv.date ?? "")
    || ["Annulé", "Reporté"].includes(rdv.statut)) {
    return { tasks: existingTasks, added: 0 };
  }
  const now = new Date();
  const preparationDay = shiftLocalDate(rdv.date, -1);
  const entries = [
    { key: "preparation", title: "Préparer le rendez-vous et vérifier les documents utiles", day: preparationDay },
    { key: "suite", title: "Faire le point après rendez-vous : actions, relances et trace Insertis", day: shiftLocalDate(rdv.date, 1) },
  ];
  if (rdv.accordRappel === "Oui") {
    entries.push({
      key: "rappel",
      title: "Vérifier le rappel autorisé pour le rendez-vous",
      day: shiftLocalDate(rdv.date, -2),
    });
  }
  const existing = new Set(existingTasks.map(task => task.id));
  const proposed = entries.filter(entry => !existing.has(`${rdv.id}:${entry.key}`)).map(entry => ({
    id: `${rdv.id}:${entry.key}`, sourceId: rdv.id, dossierId: "",
    title: entry.title, dueDate: entry.day, remindDate: entry.day,
    status: "a_faire", priority: "normale",
    createdAt: now.toISOString(), completedAt: null, outlookStatus: "non_connecte",
  }));
  return { tasks: [...existingTasks, ...proposed], added: proposed.length };
}

export const QUICK_EVENT_TYPES = Object.freeze([
  ["imprevu", "Imprévu"],
  ["appel", "Appel / message"],
  ["rendez_vous", "Rendez-vous à organiser"],
  ["relance", "Relance"],
  ["action", "À faire"],
]);

export function creerCaptureRapide({
  type = "action", title, date = todayLocal(), time = "", now = new Date(),
} = {}) {
  const clean = normaliseText(title);
  if (!QUICK_EVENT_TYPES.some(([key]) => key === type) || !clean || clean.length > 240
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return null;

  const base = createManualTask({ title: clean, dueDate: date, now });
  if (!base) return null;
  return {
    ...base, eventType: type, eventTime: time,
    origin: "saisie_rapide", remindDate: date,
    priority: type === "imprevu" ? "haute" : "normale",
  };
}
