import { troisPriorites, progressionTaches } from "../lib/dailyFocus";

export function DailyFocusPanel({ tasks, today, focus, onToggle, onUpdate }) {
  const priorities = troisPriorites(tasks, today);
  const progress = progressionTaches(tasks);
  return (
    <section className="daily-section" aria-label="Mes trois priorités">
      <div className="daily-controls" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Mes 3 priorités du jour</h2>
        <button type="button" style={{ minHeight: 48 }} aria-pressed={focus} onClick={onToggle}>
          {focus ? "Quitter le mode Focus" : "Activer le mode Focus"}
        </button>
      </div>
      <p>{progress.remaining} action(s) restante(s) · {progress.done} terminée(s). Avancer une action à la fois.</p>
      {priorities.length === 0 ? <p>Aucune priorité enregistrée.</p> : (
        <ol style={{ display: "grid", gap: 10, paddingLeft: 26 }}>
          {priorities.map(task => (
            <li key={task.dossierId + ":" + task.id} style={{ padding: 6 }}>
              <label>
                <input type="checkbox" aria-label={`Terminer la priorité : ${task.title}`}
                  checked={false} onChange={() => onUpdate(task, { status: "Fait" })} />
                <strong style={{ marginLeft: 8 }}>{task.title}</strong>
              </label>
              <button type="button" style={{ marginLeft: 12 }}
                onClick={() => onUpdate(task, {
                  priority: task.priority === "haute" ? "normale" : "haute",
                })}>
                {task.priority === "haute" ? "Retirer la priorité" : "Marquer prioritaire"}
              </button>
            </li>
          ))}
        </ol>
      )}
      <p>Ce repère organise les tâches professionnelles, sans évaluer les personnes accompagnées.</p>
    </section>
  );
}
