import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createSecureTask, editSecureTask, loadSecureTasks, loadSecureReminders, nextProfessionalDay,
} from "../lib/secureTasksApi";
import { SUGGESTIONS_SUITE_ENTRETIEN } from "../lib/taskSuggestions";
import "./secureDailyFocus.css";

const dateView = date => date ? date.split("-").reverse().join("/") : "à définir";

export function SecureCaseFollowUpPanel({ caseId }) {
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [day, setDay] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminder, setReminder] = useState(1);
  const [minutes, setMinutes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(null);
  const locked = useRef(false);

  const clearAccess = () => {
    setReady(false);
    setTasks([]);
    setReminders([]);
    setDay("");
    setRetry(null);
    setTitle("");
    setDueDate("");
    setMinutes("");
    setMessage("");
    setError("Accès au dossier indisponible. Reconnectez-vous avant de poursuivre.");
  };
  const failed = err => {
    if ([401, 403, 404].includes(err?.status)) { clearAccess(); return; }
    setError(err?.status === 409
      ? "Le dossier ou la tâche a changé. Rechargez avant de poursuivre."
      : "Connexion incertaine : vérifiez la liste avant une nouvelle saisie.");
  };
  const read = async () => {
    const [all, due] = await Promise.all([loadSecureTasks(), loadSecureReminders()]);
    return {
      tasks: all.filter(task => task.caseId === caseId),
      reminders: due.reminders.filter(task => task.caseId === caseId),
      day: due.day,
    };
  };
  const apply = data => {
    setTasks(data.tasks);
    setReminders(data.reminders);
    setDay(data.day);
    setReady(true);
  };
  const reload = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      apply(await read());
      setMessage("Actions de suivi chargées depuis le serveur.");
    } catch (err) { failed(err); }
    finally { locked.current = false; setBusy(false); }
  };
  const save = async payload => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await createSecureTask(payload.title, payload.requestId, payload.options);
      setRetry(null);
      setTitle(""); setDueDate(""); setReminder(1); setMinutes("");
      setMessage("Action de suivi enregistrée avec le rattachement au dossier.");
      try { apply(await read()); }
      catch (err) {
        if ([401, 403, 404].includes(err?.status)) clearAccess();
        else setMessage("Action enregistrée. Rechargez pour vérifier la liste, sans la créer à nouveau.");
      }
    } catch (err) {
      if ([401, 403, 404].includes(err?.status)) clearAccess();
      else {
        setRetry(payload);
        setError("Enregistrement non confirmé. Réessayez avec la même demande ou vérifiez la liste ; ne créez pas de doublon.");
      }
    } finally { locked.current = false; setBusy(false); }
  };
  const submit = event => {
    event.preventDefault();
    if (locked.current || busy || retry || !title.trim() || !ready) return;
    const options = { caseId };
    if (dueDate) { options.dueDate = dueDate; options.reminderDaysBefore = reminder; }
    if (minutes !== "") options.estimatedMinutes = Number(minutes);
    void save({ title: title.trim(), requestId: crypto.randomUUID(), options });
  };
  const update = async (task, changes) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const updated = await editSecureTask(task, changes);
      setTasks(current => current.map(item => item.id === task.id ? updated : item));
      try {
        apply(await read());
        setMessage("Action de suivi modifiée sur le serveur.");
      } catch (err) {
        if ([401, 403, 404].includes(err?.status)) clearAccess();
        else setMessage("Modification enregistrée. Rechargez la liste des rappels.");
      }
    } catch (err) { failed(err); }
    finally { locked.current = false; setBusy(false); }
  };
  const open = tasks.filter(task => task.status !== "FAIT");
  const sorted = [...open].sort((a, b) =>
    (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")
      || a.id.localeCompare(b.id));
  const firstThree = sorted.slice(0, 3);
  const completed = tasks.filter(task => task.status === "FAIT");

  return <section className="secure-notes secure-case-followup" aria-label="Actions de suivi du dossier" aria-busy={busy}>
    <h2>Actions de suivi du dossier</h2>
    <p>Une action courte, son échéance et son rappel. Pas de compte rendu d’entretien ni d’informations sensibles dans le titre. Ces actions restent personnelles et liées à ce dossier, sans envoi dans Insertis ou Outlook.</p>
    <p><Link to="/bureau-quotidien">Voir mon bureau et mes rappels</Link></p>
    <button type="button" disabled={busy} onClick={() => void reload()}>
      {ready ? "Actualiser mes actions du dossier" : "Charger mes actions du dossier"}
    </button>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {ready && <>
      <div className="secure-daily-priorities">
        <h3>Les prochaines actions</h3>
        <p>{open.length} action(s) en cours ou à faire, dont {reminders.length} rappel(s) à traiter le {dateView(day)}.</p>
        {firstThree.length === 0 && <p>Aucune action en attente pour ce dossier.</p>}
        <ol className="secure-daily-priorities__list">
          {firstThree.map(task => <li key={task.id} className="secure-daily-priorities__item">
            <strong>{task.title}</strong>
            <span>Échéance : {dateView(task.dueDate)} · {task.status === "EN_COURS" ? "En cours" : task.status === "EN_ATTENTE" ? "En attente" : "À faire"}</span>
            <div className="secure-daily-priorities__actions">
              <button type="button" disabled={busy} onClick={() => void update(task, {status:"FAIT"})}>Terminer</button>
              {task.dueDate && day && <button type="button" disabled={busy}
                onClick={() => void update(task, {snoozedUntil:nextProfessionalDay(day)})}>
                Reporter le rappel
              </button>}
            </div>
          </li>)}
        </ol>
        {sorted.length > 3 && <details><summary>Voir les autres actions en attente ({sorted.length - 3})</summary>
          <ul>{sorted.slice(3).map(task => <li key={task.id}>
            {task.title} — {dateView(task.dueDate)}
            <button type="button" disabled={busy} onClick={() => void update(task, {status:"FAIT"})}>Terminer</button>
          </li>)}</ul>
        </details>}
      </div>
      <h3>Ajouter une suite à donner</h3>
      <details className="secure-task-suggestions">
        <summary>Actions fréquentes après un entretien (facultatif)</summary>
        <div className="secure-task-suggestions__buttons">{SUGGESTIONS_SUITE_ENTRETIEN.map(option =>
          <button type="button" key={option} disabled={busy || !!retry}
            onClick={() => setTitle(option)}>{option}</button>)}
        </div>
      </details>
      <form autoComplete="off" className="daily-controls" onSubmit={submit}>
        <label>Action à réaliser
          <input maxLength={200} required value={title} disabled={busy || !!retry}
            placeholder="Ex. Relancer la CAF" onChange={event => setTitle(event.target.value)} />
        </label>
        <details className="secure-task-details">
          <summary>Préciser l’échéance et le rappel (facultatif)</summary>
          <div className="secure-task-details__fields">
            <label>Échéance de cette action
              <input type="date" value={dueDate} disabled={busy || !!retry}
                onChange={event => setDueDate(event.target.value)} />
            </label>
            <label>Rappel dans mon bureau
              <select value={reminder} disabled={busy || !!retry || !dueDate}
                onChange={event => setReminder(Number(event.target.value))}>
                <option value={0}>Le jour même</option>
                <option value={1}>1 jour avant</option>
                <option value={2}>2 jours avant</option>
                <option value={7}>7 jours avant</option>
              </select>
            </label>
            <label>Durée estimée de cette action
              <select value={minutes} disabled={busy || !!retry}
                onChange={event => setMinutes(event.target.value)}>
                <option value="">Non estimée</option>
                {[5,10,15,20,30,45,60,90,120,180].map(value =>
                  <option key={value} value={value}>{value} minutes</option>)}
              </select>
            </label>
          </div>
        </details>
        <button type="submit" disabled={busy || !!retry || !title.trim()}>Enregistrer cette action</button>
      </form>
      {retry && <div role="alert">
        <p>Le résultat de la dernière création est incertain. Ne recréez pas l’action avec une autre demande.</p>
        <button type="button" disabled={busy} onClick={() => void save(retry)}>Réessayer sans doublon</button>
        <button type="button" disabled={busy} onClick={() => {
          setRetry(null); void reload();
        }}>Vérifier la liste sans recréer</button>
      </div>}
      <details><summary>Actions terminées ({completed.length})</summary>
        <ul>{completed.map(task => <li key={task.id}>{task.title}</li>)}</ul>
      </details>
      <p>Cette première étape relie les actions au dossier. Les comptes rendus d’entretien et leur historique restent à intégrer séparément, avec droits et validation métier.</p>
    </>}
  </section>;
}
