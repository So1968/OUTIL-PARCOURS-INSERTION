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
