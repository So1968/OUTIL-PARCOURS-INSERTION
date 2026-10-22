// La maquette extrait uniquement les actions explicitement notées en « suite prévue ».
// Jamais de génération d'obligations ni de transfert de notes privées vers le calendrier.
const normalize = (text) => String(text ?? "").trim().replace(/\s+/g, " ");
const MARKER = /^(?:[-*•–]|\d+[.)]|☐)\s*/;

export function preparerTachesEntretien(suitePrevue, previous = []) {
  const lines = String(suitePrevue ?? "").split(/\r?\n|;/)
    .map(line => normalize(line.replace(MARKER, "")))
    .filter(Boolean);
  const seen = new Set(previous.map(task => normalize(task.title).toLocaleLowerCase("fr-FR")));
  const results = [];
  for (const title of lines) {
    const key = title.toLocaleLowerCase("fr-FR");
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      id: crypto.randomUUID(), title, status: "À faire",
      dueDate: "", reminderDaysBefore: 1,
      outlookStatus: "Non synchronisé",
    });
  }
  return results;
}

export function repartitionTaches(tasks = [], today = new Date().toISOString().slice(0, 10)) {
  const valid = tasks.filter(t => t && t.status !== "Fait");
  const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d : "";
  const ordered = [...valid].sort((a,b) =>
    (date(a.dueDate) || "9999-12-31").localeCompare(date(b.dueDate) || "9999-12-31"));
  return {
    overdue: ordered.filter(t => date(t.dueDate) && t.dueDate < today),
    today: ordered.filter(t => date(t.dueDate) === today),
    upcoming: ordered.filter(t => !date(t.dueDate) || t.dueDate > today),
    done: tasks.filter(t => t?.status === "Fait"),
  };
}

// Création ultérieure des objets Microsoft To Do / Outlook via Microsoft Graph,
// après validation du tenant, des permissions et des champs transférables.
// Aucune information nominative ou description d'entretien n'est exportée ici.
export function previsualiserRappelCalendrier(task) {
  if (!task || !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate || "")) return null;
  return Object.freeze({
    subject: "Action de suivi professionnel",
    dueDate: task.dueDate,
    reminderDaysBefore: Math.max(0, Math.min(30, Number(task.reminderDaysBefore) || 0)),
    requiresAuthorizedConnector: true,
  });
}

/**
 * Création après l'enregistrement d'un entretien, à partir des seules actions
 * explicitement notées. Les notes privées ne sont JAMAIS prises comme entrée.
 * Les identifiants par entretien rendent les relances/reprises idempotentes.
 */
export function genererTachesApresEntretien({
  journalId, suitePrevue = "", prochaineAction = "", traceInsertis = "À faire",
  previous = [],
} = {}) {
  if (typeof journalId !== "string" || !journalId.trim()) {
    return { tasks: previous, added: 0 };
  }
  const labels = [
    ...String(suitePrevue).split(/\r?\n|;/),
    ...String(prochaineAction).split(/\r?\n|;/),
  ].map(line => normalize(line.replace(MARKER, "")))
    .filter(Boolean);
  if (!["Faite", "Pas nécessaire"].includes(traceInsertis)) {
    labels.push("Tracer l’entretien dans Insertis");
  }
  const seen = new Set();
  const ids = new Set(previous.map(t => t.id));
  const next = [];
  for (const line of labels) {
    const title = line.slice(0, 240);
    const key = title.toLocaleLowerCase("fr-FR");
    if (seen.has(key)) continue;
    seen.add(key);
    const id = `${journalId}:${seen.size}`;
    if (ids.has(id)) continue;
    next.push({
      id, sourceJournalId: journalId, title,
      status: "À faire", dueDate: "", reminderDaysBefore: 1,
      estimatedMinutes: "", outlookStatus: "Non synchronisé",
    });
  }
  return { tasks: [...previous, ...next], added: next.length };
}

function isoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function jourDeRappel(dueDate, daysBefore = 1) {
  if (!isoDate(dueDate)) return "";
  const n = Number(daysBefore);
  if (!Number.isInteger(n) || n < 0 || n > 30) return "";
  const d = new Date(`${dueDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function rappelsProfessionnels(tasks = [], day) {
  if (!isoDate(day)) return [];
  return tasks.filter(t =>
    t && t.status !== "Fait" && isoDate(t.dueDate) &&
    (t.dueDate <= day || (jourDeRappel(t.dueDate, t.reminderDaysBefore ?? 1) || "9999-12-31") <= day),
  ).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
}
