import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readStorageJson, writeStorageJson } from "../lib/storage";
import { repartitionTaches, rappelsProfessionnels, jourDeRappel } from "../lib/entretienTasks";
import { calculerChargeJour, dureeLisible, minutesValides, TYPES_EVENEMENTS, isDate } from "../lib/workload";

const TASKS_KEY = "artag-taches-entretien-demo-v1";
const PERSONAL_KEY = "__mes_taches";
const QUICK_KEY = "artag-evenements-express-demo-v1";
const CAPACITY_KEY = "artag-capacite-journaliere-demo-v1";
const RDV_KEY = "artag-rendez-vous-suivi";
const workDay = () => {
  const d = new Date();
  const part = value => String(value).padStart(2, "0");
  return `${d.getFullYear()}-${part(d.getMonth() + 1)}-${part(d.getDate())}`;
};
const dateLabel = date => isDate(date) ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR") : "À dater";
const quickDefaults = { "Imprévu": "Fait", "Appel": "Fait", "Entretien": "Fait" };

export function BureauQuotidienPage() {
  const [records, setRecords] = useState(() => readStorageJson(TASKS_KEY, {}));
  const [quick, setQuick] = useState(() => {
    const data = readStorageJson(QUICK_KEY, []);
    return Array.isArray(data) ? data : [];
  });
  const [capacities, setCapacities] = useState(() => readStorageJson(CAPACITY_KEY, {}));
  const [appointments] = useState(() => {
    const data = readStorageJson(RDV_KEY, []);
    return Array.isArray(data) ? data : [];
  });
  const [day, setDay] = useState(workDay);
  const [type, setType] = useState("Imprévu");
  const [minutes, setMinutes] = useState(15);
  const [label, setLabel] = useState("");
  const [captureStatus, setCaptureStatus] = useState("Fait");
  const [message, setMessage] = useState("");
  const [lastQuickId, setLastQuickId] = useState("");
  const [freeTask, setFreeTask] = useState("");

  const items = useMemo(() => Object.entries(records).flatMap(([dossierId, list]) =>
    (Array.isArray(list) ? list : []).map(task => ({ ...task, dossierId }))), [records]);
  const sorted = useMemo(() => repartitionTaches(items, day), [items, day]);
  const reminders = useMemo(() => rappelsProfessionnels(items, day), [items, day]);
  const capacity = capacities[day] ?? 360;
  const charge = useMemo(() => calculerChargeJour({
    day, tasks: items, events: quick, appointments, capacityMinutes: capacity,
  }), [day, items, quick, appointments, capacity]);
  const dailyQuick = useMemo(() => quick.filter(e => e.day === day), [quick, day]);
  const activeCount = sorted.overdue.length + sorted.today.length + sorted.upcoming.length;

  function saveRecords(next, successMessage) {
    if (!writeStorageJson(TASKS_KEY, next)) {
      setMessage("Tâches non enregistrées : stockage du navigateur indisponible.");
      return false;
    }
    setRecords(next);
    setMessage(successMessage);
    return true;
  }

  function updateTask(task, changes) {
    saveRecords({
      ...records,
      [task.dossierId]: (records[task.dossierId] || []).map(entry =>
        entry.id === task.id ? { ...entry, ...changes } : entry),
    }, "Tâche mise à jour.");
  }

  function ajouterTacheLibre(event) {
    event.preventDefault();
    const title = freeTask.trim();
    if (!title || title.length > 240) {
      setMessage("Écris une tâche courte pour l'ajouter.");
      return;
    }
    const current = Array.isArray(records[PERSONAL_KEY]) ? records[PERSONAL_KEY] : [];
    const next = {
      ...records, [PERSONAL_KEY]: [...current, {
        id: crypto.randomUUID(), title, status: "À faire",
        dueDate: "", reminderDaysBefore: 1, estimatedMinutes: "",
        outlookStatus: "Non synchronisé", source: "saisie_express",
      }],
    };
    if (saveRecords(next, "Tâche ajoutée. Choisis une date de reprise dans la liste ci-dessous.")) {
      setFreeTask("");
    }
  }

  function reporterTache(task) {
    // « Reporter » signifie proposer le lendemain du jour consulté.
    // Il ne masque pas l'existence d'un retard passé.
    const tomorrow = new Date(`${day}T12:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    updateTask(task, { dueDate: tomorrow.toISOString().slice(0, 10) });
  }

  function saveQuick(next, successMessage) {
    if (!writeStorageJson(QUICK_KEY, next)) {
      setMessage("Événement non enregistré : stockage du navigateur indisponible.");
      return false;
    }
    setQuick(next);
    setMessage(successMessage);
    return true;
  }

  function addQuick({ kind = type, duration = minutes, title = label, status = captureStatus } = {}) {
    const valid = minutesValides(duration);
    if (!valid || !isDate(day)) {
      setMessage("Indique une durée entre 1 et 600 minutes et une date valide.");
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      day,
      type: kind,
      title: String(title || "").trim().slice(0, 100) || kind,
      minutes: valid,
      status,
      createdAt: new Date().toISOString(),
    };
    if (saveQuick([entry, ...quick], `${kind} noté en une saisie : ${dureeLisible(valid)}.`)) {
      setLastQuickId(entry.id);
      setLabel("");
    }
  }

  function undoLastQuick() {
    if (!lastQuickId) return;
    if (saveQuick(quick.filter(e => e.id !== lastQuickId), "Dernière saisie annulée.")) {
      setLastQuickId("");
    }
  }

  function updateQuick(id, changes) {
    saveQuick(quick.map(e => e.id === id ? { ...e, ...changes } : e), "Événement mis à jour.");
  }

  function saveCapacity(nextMinutes) {
    const value = minutesValides(nextMinutes);
    if (!value) {
      setMessage("La disponibilité doit être comprise entre 1 et 600 minutes.");
      return;
    }
    const next = { ...capacities, [day]: value };
    if (!writeStorageJson(CAPACITY_KEY, next)) {
      setMessage("Disponibilité non enregistrée.");
      return;
    }
    setCapacities(next);
    setMessage("Disponibilité du jour actualisée.");
  }

  async function copierBilanAnonyme() {
    const bilan = [
      `Plan de charge ARTAG — ${dateLabel(day)}`,
      `Charge chiffrée : ${dureeLisible(charge.totalKnown)} / ${dureeLisible(charge.capacity)} disponibles (estimations)`,
      `Tâches en retard : ${charge.overdueCount} ; échéance aujourd'hui : ${charge.dueCount}`,
      `Imprévus et événements effectués : ${dureeLisible(charge.doneMinutes)}`,
      `Événements à venir : ${dureeLisible(charge.plannedMinutes)}`,
      `Rendez-vous enregistrés : ${charge.appointmentsCount}`,
      `Éléments sans durée : ${charge.missingEstimates}`,
      `Rappels de tâches à traiter : ${reminders.length}`,
      "Récapitulatif sans nom, numéro de dossier ni note d'entretien.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(bilan);
      setMessage("Bilan anonyme copié. Tu peux le coller dans ton point de charge ChatGPT.");
    } catch {
      setMessage("Copie impossible : autorise le presse-papiers ou utilise le tableau à l'écran.");
    }
  }

  const taskSection = (title, tasks, id) => (
    <section aria-labelledby={id} className="daily-section" key={id}>
      <h2 id={id}>{title} ({tasks.length})</h2>
      {tasks.length === 0 ? <p>Aucune tâche dans cette catégorie.</p> :
        <ul className="daily-tasks">
          {tasks.map(task => (
            <li className="daily-task" key={task.dossierId + ":" + task.id}>
              <label className="daily-task-title">
                <input type="checkbox" checked={task.status === "Fait"}
                  onChange={e => updateTask(task, { status: e.target.checked ? "Fait" : "À faire" })} />
                <strong>{task.title}</strong>
              </label>
              <label>Échéance
                <input type="date" aria-label={`Échéance : ${task.title}`}
                  value={task.dueDate || ""} onChange={e => updateTask(task, { dueDate: e.target.value })} />
              </label>
              <label>Rappel souhaité
                <select aria-label={`Rappel : ${task.title}`}
                  value={task.reminderDaysBefore ?? 1}
                  onChange={e => updateTask(task, { reminderDaysBefore: Number(e.target.value) })}>
                  <option value={0}>Le jour même</option>
                  <option value={1}>1 jour avant</option>
                  <option value={2}>2 jours avant</option>
                  <option value={7}>7 jours avant</option>
                </select>
              </label>
              <label>Durée estimée
                <select aria-label={`Durée estimée : ${task.title}`}
                  value={task.estimatedMinutes || ""}
                  onChange={e => updateTask(task, { estimatedMinutes: e.target.value ? Number(e.target.value) : "" })}>
                  <option value="">À estimer</option>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(n =>
                    <option key={n} value={n}>{dureeLisible(n)}</option>)}
                </select>
              </label>
              {task.status !== "Fait" && <button type="button" onClick={() => reporterTache(task)}>Reporter au lendemain</button>}
              {task.dossierId !== PERSONAL_KEY && <Link to={`/pilotage-actions/dossier/${encodeURIComponent(task.dossierId)}`}>Ouvrir le dossier</Link>}
            </li>
          ))}
        </ul>}
    </section>
  );

  return (
    <main className="page-shell daily-board">
      <style>{`
        .daily-board { max-width:1050px; margin:0 auto; padding:24px; }
        .daily-board input,.daily-board select,.daily-board button { font:inherit; }
        .daily-board input,.daily-board select { padding:7px; border-radius:7px; }
        .daily-board button { padding:9px 13px; border-radius:9px; cursor:pointer; }
        .daily-board button:focus-visible,.daily-board a:focus-visible { outline:3px solid #f2cf88; }
        .daily-summary,.daily-quick-buttons,.daily-controls { display:flex; flex-wrap:wrap; gap:12px; align-items:end; margin:18px 0; }
        .daily-summary > div,.daily-section { border:1px solid #737e65; border-radius:12px; padding:15px; }
        .daily-summary strong { display:block; font-size:1.4rem; }
        .daily-section { margin:16px 0; }
        .daily-tasks { list-style:none; padding:0; display:grid; gap:10px; }
        .daily-task { display:flex; flex-wrap:wrap; align-items:center; gap:12px; border-bottom:1px solid #737e65; padding:9px 0; }
        .daily-task-title { display:flex; gap:8px; align-items:center; flex:2 1 210px; }
        .daily-task > span,.daily-task > label:not(.daily-task-title) { flex:1 1 130px; }
        .daily-board a { color:inherit; text-decoration:underline; }
        .daily-controls label { display:grid; gap:5px; }
        .daily-alert { font-weight:700; border-left:4px solid #d2a85b; padding:10px; }
        .daily-quick-buttons button { min-height:44px; font-weight:700; }
      `}</style>
      <p>Mon organisation — démonstration locale</p>
      <h1>Plan de charge du jour</h1>
      <p>Une seule page pour savoir ce qui t'attend et noter en quelques secondes les entretiens, appels, rendez-vous et imprévus. Sans dossier nominatif dans la saisie express.</p>

      <div className="daily-controls">
        <label>Date du plan de charge
          <input type="date" value={day} onChange={e => isDate(e.target.value) && setDay(e.target.value)} />
        </label>
        <label>Temps mobilisable ce jour (minutes)
          <input type="number" min="1" max="600" step="15" value={capacity}
            onChange={e => saveCapacity(e.target.value)} />
        </label>
      </div>

      <section className="daily-section" aria-labelledby="charge-header">
        <h2 id="charge-header">Charge calculée</h2>
        <div className="daily-summary">
          <div><strong>{dureeLisible(charge.totalKnown)}</strong>Charge connue</div>
          <div><strong>{dureeLisible(charge.capacity)}</strong>Temps mobilisable estimé</div>
          <div><strong>{charge.overload ? "−" : ""}{dureeLisible(Math.abs(charge.margin))}</strong>{charge.overload ? "Dépassement estimé" : "Marge disponible"}</div>
          <div><strong>{charge.overdueCount}</strong>Tâches en retard</div>
        </div>
        <p>Échéances de tâches : {dureeLisible(charge.taskMinutes)} · Événements prévus : {dureeLisible(charge.plannedMinutes)} · Déjà effectués : {dureeLisible(charge.doneMinutes)} · Rendez-vous enregistrés : {dureeLisible(charge.meetingMinutes)}.</p>
        {charge.missingEstimates > 0 && <p className="daily-alert">Attention : {charge.missingEstimates} élément(s) sans durée. La charge réelle peut être supérieure.</p>}
        {charge.overload && <p className="daily-alert">Charge supérieure au temps mobilisable : reporter ou réorganiser des actions.</p>}
        {charge.pendingWithoutDate > 0 && <p className="daily-alert">{charge.pendingWithoutDate} tâche(s) sans échéance restent à planifier.</p>}
        <button type="button" onClick={copierBilanAnonyme}>Copier le bilan sans données personnelles</button>
      </section>

      <section className="daily-section" aria-labelledby="rappels-header">
        <h2 id="rappels-header">Mes rappels à traiter ({reminders.length})</h2>
        {reminders.length === 0
          ? <p>Aucun rappel de tâche à échéance pour cette journée. Les tâches sans date sont à planifier plus bas.</p>
          : <ul className="daily-tasks">
            {reminders.map(task => (
              <li key={task.dossierId + ":" + task.id} className="daily-task">
                <label className="daily-task-title">
                  <input type="checkbox" checked={false} aria-label={`Terminer : ${task.title}`}
                    onChange={() => updateTask(task, { status: "Fait" })} />
                  <strong>{task.title}</strong>
                </label>
                <span>Rappel : {dateLabel(jourDeRappel(task.dueDate, task.reminderDaysBefore ?? 1))}</span>
                <span>Échéance : {dateLabel(task.dueDate)}</span>
                <button type="button" onClick={() => reporterTache(task)}>Reporter au lendemain</button>
              </li>
            ))}
          </ul>}
        <p>Ces rappels apparaissent à l'ouverture de la page. Outlook n'envoie encore aucune notification.</p>
      </section>

      <section className="daily-section" aria-labelledby="new-task-header">
        <h2 id="new-task-header">Noter une tâche en quelques secondes</h2>
        <form onSubmit={ajouterTacheLibre} className="daily-controls">
          <label style={{ flex:"1 1 280px" }}>Action à ne pas oublier
            <input value={freeTask} maxLength={240} onChange={e => setFreeTask(e.target.value)}
              placeholder="Ex. Relancer la réponse d'un partenaire" required />
          </label>
          <button type="submit">Ajouter à ma liste</button>
        </form>
        <p>Pas de date inventée : après l'ajout, choisis une échéance et une durée si tu les connais. Ne saisis aucune identité réelle dans cette maquette.</p>
      </section>

      <section className="daily-section" aria-labelledby="quick-header">
        <h2 id="quick-header">Saisie express — 1 clic pour un événement courant</h2>
        <div className="daily-quick-buttons">
          <button type="button" onClick={() => addQuick({ kind:"Imprévu", duration:15, title:"Imprévu", status:"Fait" })}>+ Imprévu · 15 min</button>
          <button type="button" onClick={() => addQuick({ kind:"Appel", duration:10, title:"Appel", status:"Fait" })}>+ Appel · 10 min</button>
          <button type="button" onClick={() => addQuick({ kind:"Rendez-vous", duration:30, title:"Rendez-vous", status:"À faire" })}>+ RDV à venir · 30 min</button>
        </div>
        <form className="daily-controls" onSubmit={e => { e.preventDefault(); addQuick(); }}>
          <label>Nature
            <select value={type} onChange={e => {
              const next = e.target.value;
              setType(next);
              setMinutes(TYPES_EVENEMENTS[next]);
              setCaptureStatus(quickDefaults[next] || "À faire");
            }}>
              {Object.keys(TYPES_EVENEMENTS).map(name => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label>Résumé bref (facultatif)
            <input type="text" maxLength={100} value={label} onChange={e => setLabel(e.target.value)}
              placeholder="Ex. relancer un partenaire" aria-label="Résumé bref, sans information personnelle" />
          </label>
          <label>Durée (minutes)
            <input type="number" min="1" max="600" value={minutes} onChange={e => setMinutes(e.target.value)} />
          </label>
          <label>Situation
            <select value={captureStatus} onChange={e => setCaptureStatus(e.target.value)}>
              <option>Fait</option><option>À faire</option>
            </select>
          </label>
          <button type="submit">Enregistrer</button>
        </form>
        {lastQuickId && <button type="button" onClick={undoLastQuick}>Annuler la dernière saisie</button>}
        <p>La durée proposée est une estimation modifiable. Pour protéger les personnes accompagnées, ne note pas de nom, téléphone ni information confidentielle dans la saisie express.</p>
        {dailyQuick.length > 0 && <ul className="daily-tasks">
          {dailyQuick.map(e => <li className="daily-task" key={e.id}>
            <strong>{e.type} — {e.title}</strong>
            <span>{dureeLisible(e.minutes)}</span>
            <label>État
              <select aria-label={`État : ${e.title}`} value={e.status} onChange={v => updateQuick(e.id, { status:v.target.value })}>
                <option>Fait</option><option>À faire</option>
              </select>
            </label>
          </li>)}
        </ul>}
      </section>

      <section aria-label="Mes actions">
        <h2>{activeCount} tâche(s) non terminée(s)</h2>
        {taskSection("Priorité 1 — en retard", sorted.overdue, "retards")}
        {taskSection("Priorité 2 — aujourd'hui", sorted.today, "aujourdhui")}
        {taskSection("À anticiper / date à fixer", sorted.upcoming, "anticiper")}
        <details><summary>Voir les tâches terminées ({sorted.done.length})</summary>
          {taskSection("Réalisées", sorted.done, "terminees")}
        </details>
      </section>
      {message && <p role="status">{message}</p>}
      <p>Les saisies restent dans ce navigateur de démonstration. Le total n'est pas une donnée officielle de temps de travail : il exclut les éléments sans durée, et Outlook n'est pas connecté. Une version professionnelle nécessitera le stockage ARTAG sécurisé et les droits validés.</p>
    </main>
  );
}
