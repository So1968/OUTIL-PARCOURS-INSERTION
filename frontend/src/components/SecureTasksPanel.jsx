import { useState } from "react";
import {
  secureTaskApiEnabled, loadSecureTasks, createSecureTask, editSecureTask,
} from "../lib/secureTasksApi";

const statusLabels = {
  A_FAIRE: "À faire", EN_COURS: "En cours", EN_ATTENTE: "En attente", FAIT: "Terminée",
};

/**
 * Affiché UNIQUEMENT si un hébergement HTTPS professionnel active explicitement
 * l'intégration. La liste du prototype local reste séparée, sans import implicite.
 */
export function SecureTasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!secureTaskApiEnabled()) return null;

  const reload = async () => {
    setBusy(true);
    try {
      const data = await loadSecureTasks();
      setTasks(data);
      setReady(true);
      setMessage(`${data.length} tâche(s) chargée(s) depuis le serveur privé.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async event => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createSecureTask(title.trim());
      setTitle("");
      const data = await loadSecureTasks();
      setTasks(data);
      setReady(true);
      setMessage("Tâche sauvegardée sur le serveur professionnel.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const edit = async (task, changes) => {
    setBusy(true);
    try {
      const updated = await editSecureTask(task, changes);
      setTasks(current => current.map(item => item.id === updated.id ? updated : item));
      setMessage("Tâche mise à jour.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Mes tâches serveur" className="daily-section">
      <h2>Mes tâches protégées — espace professionnel</h2>
      <p>Ces tâches sont accessibles uniquement avec une session institutionnelle vérifiée. Elles sont séparées de la liste de démonstration ; aucune donnée n'est importée automatiquement.</p>
      <button type="button" disabled={busy} onClick={reload}>Charger mes tâches protégées</button>
      {ready && <>
        <form onSubmit={add} className="daily-controls">
          <label>Nouvelle tâche personnelle
            <input value={title} maxLength={200} onChange={e => setTitle(e.target.value)}
              placeholder="Action brève à réaliser" required />
          </label>
          <button type="submit" disabled={busy || !title.trim()}>Créer sur le serveur</button>
        </form>
        <ul className="daily-tasks">
          {tasks.map(task => (
            <li className="daily-task" key={task.id}>
              <strong className="daily-task-title">{task.title}</strong>
              <label>Échéance
                <input type="date" disabled={busy} value={task.dueDate || ""}
                  aria-label={`Échéance protégée : ${task.title}`}
                  onChange={e => edit(task, { dueDate: e.target.value || null })} />
              </label>
              <label>Statut
                <select disabled={busy} value={task.status} aria-label={`Statut protégé : ${task.title}`}
                  onChange={e => edit(task, { status: e.target.value })}>
                  {Object.entries(statusLabels).map(([value, label]) =>
                    <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>Rappel
                <select disabled={busy} value={task.reminderDaysBefore}
                  aria-label={`Rappel protégé : ${task.title}`}
                  onChange={e => edit(task, { reminderDaysBefore: Number(e.target.value) })}>
                  {[0, 1, 2, 7].map(value =>
                    <option key={value} value={value}>{value === 0 ? "Le jour" : `${value} jour(s) avant`}</option>)}
                </select>
              </label>
            </li>
          ))}
        </ul>
        {tasks.length === 0 && <p>Aucune tâche personnelle dans cet espace.</p>}
      </>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
