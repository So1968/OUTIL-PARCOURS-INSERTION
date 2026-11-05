import { actionsMaintenant, troisPriorites, progressionTaches } from "../lib/dailyFocus";

/**
 * Repère de travail, pas une mesure de performance.
 * Les boutons restent utilisables au clavier et avec une cible tactile ample.
 */
export function DailyFocusPanel({ tasks, today, focus, onToggle, onUpdate, onStart, onSnooze }) {
  const priorities = troisPriorites(tasks, today);
  const progress = progressionTaches(tasks);
  const reminders = actionsMaintenant(tasks, today).length;

  return (
    <section className="daily-section daily-priorities" aria-label="Mes trois priorités">
      <div className="daily-priorities-header">
        <h2>Mes 3 priorités du jour</h2>
        <button type="button" className="daily-focus-toggle" aria-pressed={focus} onClick={onToggle}>
          {focus ? "Quitter le mode Focus" : "Activer le mode Focus"}
        </button>
      </div>
      <p className="daily-progress">
        {reminders} rappel(s) à traiter · {progress.remaining} tâche(s) encore ouvertes dans la liste.
      </p>
      {priorities.length === 0 ? (
        <p>Aucune priorité affichée pour cette date. Tu peux ajouter une action en quelques secondes ci-dessous.</p>
      ) : (
        <ol className="daily-priority-list">
          {priorities.map((task, index) => (
            <li key={task.dossierId + ":" + task.id} className="daily-priority-item">
              <div className="daily-priority-title">
                <span className="daily-priority-rank" aria-hidden="true">{index + 1}.</span>
                <strong>{task.title}</strong>
              </div>
              <div className="daily-priority-actions">
                <label className="daily-priority-complete">
                  <input type="checkbox" aria-label={`Terminer la priorité : ${task.title}`}
                    checked={false} onChange={() => onUpdate(task, { status: "Fait" })} />
                  Terminer
                </label>
                <button type="button" aria-label={`Reporter la priorité : ${task.title}`}
                  onClick={() => onSnooze(task)}>Reporter</button>
                <button type="button" onClick={() => onStart(task)}>Commencer cette tâche</button>
                <button type="button" aria-pressed={task.priority === "haute"}
                  onClick={() => onUpdate(task, { priority: task.priority === "haute" ? "normale" : "haute" })}>
                  {task.priority === "haute" ? "Retirer la priorité" : "Marquer prioritaire"}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="daily-priorities-note">
        Tu peux traiter une seule chose à la fois. Ce repère organise le travail, sans évaluer les personnes accompagnées.
      </p>
    </section>
  );
}
