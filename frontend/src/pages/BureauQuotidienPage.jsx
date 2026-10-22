import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readStorageJson, writeStorageJson } from "../lib/storage";
import { repartitionTaches } from "../lib/entretienTasks";

const TASKS = "artag-taches-entretien-demo-v1";
const today = () => new Date().toLocaleDateString("sv-SE");
const format = date => date ? new Date(date + "T12:00:00").toLocaleDateString("fr-FR") : "À planifier";

export function BureauQuotidienPage() {
  const [records, setRecords] = useState(() => readStorageJson(TASKS, {}));
  const [message, setMessage] = useState("");
  const items = useMemo(() => Object.entries(records).flatMap(([dossierId, list]) =>
    (Array.isArray(list) ? list : []).map(task => ({ ...task, dossierId }))), [records]);
  const sorted = useMemo(() => repartitionTaches(items, today()), [items]);
  const count = sorted.overdue.length + sorted.today.length + sorted.upcoming.length;

  function update(task, changes) {
    const next = {
      ...records,
      [task.dossierId]: (records[task.dossierId] || []).map(entry =>
        entry.id === task.id ? { ...entry, ...changes } : entry),
    };
    if (!writeStorageJson(TASKS, next)) {
      setMessage("Modification non enregistrée : vérifie le stockage de ce navigateur.");
      return;
    }
    setRecords(next);
    setMessage("Liste de tâches mise à jour dans ce navigateur.");
  }

  const section = (title, tasks, id) => (
    <section aria-labelledby={id} className="daily-section" key={id}>
      <h2 id={id}>{title} ({tasks.length})</h2>
      {tasks.length === 0 ? <p>Aucune tâche dans cette catégorie.</p> :
        <ul className="daily-tasks">
          {tasks.map(task => (
            <li className="daily-task" key={task.dossierId + ":" + task.id}>
              <label>
                <input type="checkbox" checked={task.status === "Fait"}
                  onChange={e => update(task, { status: e.target.checked ? "Fait" : "À faire" })} />
                <strong>{task.title}</strong>
              </label>
              <span>Échéance : {format(task.dueDate)}</span>
              <span>Statut : {task.status}</span>
              <Link to={`/pilotage-actions/dossier/${encodeURIComponent(task.dossierId)}`}>Revenir au dossier</Link>
            </li>
          ))}
        </ul>}
    </section>
  );

  return (
    <main className="page-shell daily-board">
      <style>{`
        .daily-board { max-width: 1050px; margin: 0 auto; padding: 24px; }
        .daily-summary { display: flex; flex-wrap: wrap; gap: 14px; margin: 20px 0; }
        .daily-summary strong { display:block; font-size: 1.5rem; }
        .daily-summary > div, .daily-section { border: 1px solid #636d59; border-radius: 12px; padding: 16px; }
        .daily-section { margin: 16px 0; }
        .daily-tasks { list-style:none; padding:0; display:grid; gap:10px; }
        .daily-task { display:flex; flex-wrap:wrap; align-items:center; gap:12px; border-bottom:1px solid #636d59; padding:10px 0; }
        .daily-task label { display:flex; gap:8px; align-items:center; flex: 2 1 220px; }
        .daily-task span { flex:1 1 130px; }
        .daily-task a { color:inherit; text-decoration:underline; }
      `}</style>
      <p>Organisation du travail — mode démonstration</p>
      <h1>Mon bureau quotidien</h1>
      <p>Une seule liste pour retrouver les actions créées après les entretiens. Commencer par le retard, puis les échéances d’aujourd’hui. Aucune tâche n'est envoyée vers Outlook.</p>
      <div className="daily-summary" aria-label="Résumé des tâches">
        <div><strong>{count}</strong>À réaliser</div>
        <div><strong>{sorted.overdue.length}</strong>En retard</div>
        <div><strong>{sorted.today.length}</strong>Aujourd’hui</div>
        <div><strong>{sorted.done.length}</strong>Terminées</div>
      </div>
      {message && <p role="status">{message}</p>}
      {section("Priorité 1 — en retard", sorted.overdue, "retards")}
      {section("Priorité 2 — aujourd’hui", sorted.today, "aujourdhui")}
      {section("À anticiper / date à fixer", sorted.upcoming, "anticiper")}
      {section("Réalisées", sorted.done, "terminees")}
      <p>Les tâches sont encore conservées sur ce navigateur. Pour un vrai travail partagé, il faudra les stocker sur le serveur privé avec des droits vérifiés, et activer les rappels Outlook uniquement après autorisation Microsoft 365.</p>
    </main>
  );
}
