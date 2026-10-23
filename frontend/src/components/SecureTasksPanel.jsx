import { useState } from "react";
import {
  secureTaskApiEnabled, loadSecureTasks, loadSecureReminders, nextProfessionalDay,
  createSecureTask, editSecureTask,
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
  const [reminders, setReminders] = useState([]);
  const [professionalDay, setProfessionalDay] = useState("");
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!secureTaskApiEnabled()) return null;

  const reload = async () => {
    setBusy(true);
    try {
      const [data, reminderData] = await Promise.all([loadSecureTasks(), loadSecureReminders()]);
      setTasks(data);
      setReminders(reminderData.reminders);
      setProfessionalDay(reminderData.day);
      setReady(true);
      setMessage(`${data.length} tâche(s), dont ${reminderData.reminders.length} rappel(s) à traiter.`);
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
      const [data, reminderData] = await Promise.all([loadSecureTasks(), loadSecureReminders()]);
      setTasks(data);
      setReminders(reminderData.reminders);
      setProfessionalDay(reminderData.day);
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
      try {
        const { reminders: refreshed, day } = await loadSecureReminders();
        setReminders(refreshed);
        setProfessionalDay(day);
        setMessage("Tâche mise à jour.");
      } catch {
        setMessage("Modification enregistrée. Recharge les rappels pour actualiser la liste.");
      }
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
        <div aria-label="Rappels professionnels privés" className="daily-section">
          <h3>Mes rappels sécurisés du {professionalDay || "jour"} ({reminders.length})</h3>
          {reminders.length === 0 && <p>Rien à relancer pour le moment.</p>}
          <ul className="daily-tasks">
            {reminders.map(task => (
              <li className="daily-task" key={task.id}>
                <strong>{task.title}</strong>
                <span>Échéance : {task.dueDate || "non définie"}</span>
                <button type="button" disabled={busy} onClick={() => edit(task, { status: "FAIT" })}>
                  Terminer
                </button>
                <button type="button" disabled={busy || !professionalDay}
                  onClick={() => edit(task, { snoozedUntil: nextProfessionalDay(professionalDay) })}>
                  Reporter le rappel à demain
                </button>
              </li>
            ))}
          </ul>
          <p>Ces rappels restent dans l’espace ARTAG. Aucun email ni rendez-vous Outlook n’est envoyé.</p>
        </div>
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
              <label>Durée estimée
                <select disabled={busy} value={task.estimatedMinutes ?? ""}
                  aria-label={`Durée estimée : ${task.title}`}
                  onChange={e => edit(task, { estimatedMinutes: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">À estimer</option>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120, 180].map(value =>
                    <option key={value} value={value}>{value} min</option>)}
                  {task.estimatedMinutes && ![5, 10, 15, 20, 30, 45, 60, 90, 120, 180].includes(task.estimatedMinutes) &&
                    <option value={task.estimatedMinutes}>{task.estimatedMinutes} min</option>}
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
