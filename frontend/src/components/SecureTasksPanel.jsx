import { useEffect, useState } from "react";
import { secureDailyPriorities, secureTaskCounts } from "../lib/secureDailyPriorities";
import { SUGGESTIONS_SUITE_ENTRETIEN } from "../lib/taskSuggestions";
import "./secureDailyFocus.css";
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
export function SecureTasksPanel({ focus = false, onToggleFocus }) {
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [professionalDay, setProfessionalDay] = useState("");
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newReminder, setNewReminder] = useState(1);
  const [newMinutes, setNewMinutes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(() => secureTaskApiEnabled());
  const [retryTask, setRetryTask] = useState(null);
  const [startedId, setStartedId] = useState(null);
  const [lastUndo, setLastUndo] = useState(null);

  useEffect(() => {
    if (!secureTaskApiEnabled()) return;
    let cancelled = false;
    Promise.all([loadSecureTasks(), loadSecureReminders()]).then(([data, remindersData]) => {
      if (cancelled) return;
      setTasks(data);
      setReminders(remindersData.reminders);
      setProfessionalDay(remindersData.day);
      setReady(true);
      setMessage("Mes tâches et rappels sont chargés depuis le serveur.");
    }).catch(error => {
      if (cancelled) return;
      // Aucun retour aux données locales de démonstration en cas d'erreur d'accès.
      setReady(false);
      setTasks([]);
      setReminders([]);
      setMessage([401, 403, 404].includes(error?.status)
        ? "Accès professionnel indisponible. Reconnectez-vous avant de poursuivre."
        : error.message);
    }).finally(() => {
      if (!cancelled) setBusy(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (!secureTaskApiEnabled()) return null;

  const priorities = secureDailyPriorities(tasks, professionalDay);
  const counts = secureTaskCounts(tasks, reminders);
  const activeTask = tasks.find(task => task.id === startedId && task.status === "EN_COURS")
    || tasks.find(task => task.status === "EN_COURS");

  const handleAccessLost = error => {
    if (![401, 403, 404].includes(error?.status)) return false;
    setReady(false);
    setTasks([]);
    setReminders([]);
    setStartedId(null);
    setLastUndo(null);
    setRetryTask(null);
    setMessage("Accès professionnel indisponible. Reconnectez-vous avant de poursuivre.");
    return true;
  };

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
      if (!handleAccessLost(error)) setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const saveTask = async payload => {
    setBusy(true);
    try {
      // Même clé après une réponse réseau incertaine : pas de doublon serveur.
      // Même identifiant ET mêmes paramètres en cas de renvoi réseau incertain.
      if (payload.options && Object.keys(payload.options).length) {
        await createSecureTask(payload.title, payload.requestId, payload.options);
      } else {
        await createSecureTask(payload.title, payload.requestId);
      }
      setRetryTask(null);
      setTitle("");
      setNewDueDate("");
      setNewReminder(1);
      setNewMinutes("");
      setMessage("Tâche sauvegardée sur le serveur professionnel, avec les repères de suivi confirmés.");
      try {
        const [data, reminderData] = await Promise.all([loadSecureTasks(), loadSecureReminders()]);
        setTasks(data);
        setReminders(reminderData.reminders);
        setProfessionalDay(reminderData.day);
        setReady(true);
      } catch {
        setMessage("Tâche enregistrée. Recharge la liste pour vérifier son affichage.");
      }
    } catch (error) {
      if (!handleAccessLost(error)) {
        setRetryTask(payload);
        setMessage(error.message + " Réessaie avec la même demande pour éviter tout doublon.");
      }
    } finally {
      setBusy(false);
    }
  };

  const add = event => {
    event.preventDefault();
    if (!title.trim() || retryTask || busy) return;
    const options = {};
    if (newDueDate) {
      options.dueDate = newDueDate;
      options.reminderDaysBefore = newReminder;
    }
    if (newMinutes !== "") options.estimatedMinutes = Number(newMinutes);
    void saveTask({ title: title.trim(), requestId: crypto.randomUUID(), options });
  };

  const edit = async (task, changes, isUndo = false) => {
    setBusy(true);
    try {
      const updated = await editSecureTask(task, changes);
      setTasks(current => current.map(item => item.id === updated.id ? updated : item));
      if (isUndo) setLastUndo(null);
      else setLastUndo({ taskId:task.id, version:updated.version,
        previous:task, fields:Object.keys(changes) });
      try {
        const { reminders: refreshed, day } = await loadSecureReminders();
        setReminders(refreshed);
        setProfessionalDay(day);
        setMessage("Tâche mise à jour sur le serveur.");
      } catch {
        setMessage("Modification enregistrée. Recharge les rappels pour actualiser la liste.");
      }
      return updated;
    } catch (error) {
      if (isUndo) setLastUndo(null);
      if (!handleAccessLost(error)) setMessage(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const undoTask = async () => {
    if (!lastUndo || busy) return;
    const current = tasks.find(task => task.id === lastUndo.taskId);
    if (!current || current.version !== lastUndo.version) {
      setLastUndo(null);
      setMessage("Annulation indisponible : la tâche a changé. Recharge la liste.");
      return;
    }
    const changes = Object.fromEntries(lastUndo.fields.map(key => [
      key, lastUndo.previous[key] ?? null,
    ]));
    const restored = await edit(current, changes, true);
    if (restored) setMessage("Dernière modification annulée sur le serveur.");
  };

  const beginTask = async task => {
    if (busy) return;
    if (task.status !== "EN_COURS" && !(await edit(task, { status: "EN_COURS" }))) return;
    setStartedId(task.id);
    if (!focus) onToggleFocus?.();
    setMessage("Tâche mise en avant. Avance une action à la fois.");
  };

  return (
    <section aria-label="Mes tâches serveur" className="daily-section">
      <h2>Mes tâches protégées — espace professionnel</h2>
      <p>Ces tâches sont accessibles uniquement avec une session institutionnelle vérifiée. Elles sont séparées de la liste de démonstration ; aucune donnée n'est importée automatiquement.</p>
      <button type="button" disabled={busy} onClick={reload}>Charger mes tâches protégées</button>
      {ready && <>
        <div className="secure-daily-priorities" aria-label="Mes trois priorités protégées">
          <div className="secure-daily-priorities__header">
            <h3>Mes 3 priorités du jour</h3>
            <button type="button" disabled={busy} aria-pressed={focus} onClick={onToggleFocus}>
              {focus ? "Quitter le mode Focus" : "Activer le mode Focus"}
            </button>
          </div>
          <p>{counts.reminders} rappel(s) à traiter · {counts.open} tâche(s) ouvertes. Ce n’est pas un score de performance.</p>
          {priorities.length === 0 ? <p>Aucune action prioritaire enregistrée pour cette journée.</p> :
            <ol className="secure-daily-priorities__list">{priorities.map(task =>
              <li key={task.id} className="secure-daily-priorities__item">
                <strong>{task.title}</strong>
                <span>Échéance : {task.dueDate || "non définie"}</span>
                <div className="secure-daily-priorities__actions">
                  <button type="button" disabled={busy} onClick={() => edit(task, { status: "FAIT" })}>Terminer</button>
                  <button type="button" disabled={busy || !professionalDay || !task.dueDate}
                    onClick={() => edit(task, { snoozedUntil: nextProfessionalDay(professionalDay) })}>
                    Reporter le rappel
                  </button>
                  <button type="button" disabled={busy} onClick={() => void beginTask(task)}>
                    {task.status === "EN_COURS" ? "Reprendre cette tâche" : "Commencer"}
                  </button>
                </div>
              </li>)}</ol>}
          {activeTask && <p>À reprendre : <strong>{activeTask.title}</strong>. Cette tâche reste « En cours » sur le serveur.</p>}
          <p>Ordre : tâche en cours, retards, échéances du jour, autres. Le marquage manuel n’est pas encore activé dans le mode sécurisé.</p>
        </div>
        {message && <p role="status" className="secure-daily-feedback">{message}</p>}
        {lastUndo && <button type="button" disabled={busy} onClick={() => void undoTask()}>Annuler la dernière modification de tâche</button>}
        <details className="secure-task-suggestions">
          <summary>Actions fréquentes après un entretien (facultatif)</summary>
          <div className="secure-task-suggestions__buttons" role="group" aria-label="Suggestions après entretien">
            {SUGGESTIONS_SUITE_ENTRETIEN.map(option => (
              <button type="button" key={option} disabled={busy || !!retryTask} onClick={() => setTitle(option)}>
                {option}
              </button>
            ))}
          </div>
          <p>Une suggestion prépare seulement le libellé. Vérifie-le, puis décide de créer ou non la tâche sur le serveur. Pas de date inventée.</p>
        </details>
        <form onSubmit={add} className="daily-controls">
          <label>Nouvelle tâche personnelle
            <input value={title} maxLength={200} onChange={e => setTitle(e.target.value)}
              placeholder="Action brève à réaliser" required />
          </label>
          <details className="secure-task-details">
            <summary>Ajouter une échéance, un rappel ou une durée (facultatif)</summary>
            <div className="secure-task-details__fields">
              <label>Échéance de la tâche
                <input type="date" value={newDueDate} disabled={busy || !!retryTask}
                  onChange={event => setNewDueDate(event.target.value)} />
              </label>
              <label>Rappel à afficher dans mon bureau
                <select value={newReminder} disabled={busy || !!retryTask || !newDueDate}
                  onChange={event => setNewReminder(Number(event.target.value))}>
                  <option value={0}>Le jour même</option>
                  <option value={1}>1 jour avant</option>
                  <option value={2}>2 jours avant</option>
                  <option value={7}>7 jours avant</option>
                </select>
              </label>
              <label>Durée estimée
                <select value={newMinutes} disabled={busy || !!retryTask}
                  onChange={event => setNewMinutes(event.target.value)}>
                  <option value="">Non estimée</option>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120, 180].map(value =>
                    <option key={value} value={value}>{value} min</option>)}
                </select>
              </label>
            </div>
            <p>Aucune date n’est ajoutée par défaut. Ces éléments seront enregistrés avec la tâche, en une seule fois.</p>
          </details>
          <button type="submit" disabled={busy || !!retryTask || !title.trim()}>Créer sur le serveur</button>
        </form>
        {retryTask && <div role="alert">
          <p>Une tentative précédente n’a pas été confirmée. Ne recrée pas cette tâche avec une nouvelle demande.</p>
          <button type="button" disabled={busy} onClick={() => void saveTask(retryTask)}>
            Réessayer sans doublon
          </button>
          <button type="button" disabled={busy} onClick={() => { setRetryTask(null); void reload(); }}>
            Abandonner la tentative et vérifier la liste
          </button>
        </div>}
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
        {!focus && <ul className="daily-tasks">
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
        </ul>}
        {tasks.length === 0 && <p>Aucune tâche personnelle dans cet espace.</p>}
      </>}
      {!ready && message && <p role="status">{message}</p>}
    </section>
  );
}
