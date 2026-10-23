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
