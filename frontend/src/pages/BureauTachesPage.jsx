import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readStorageJson, writeStorageJson } from "../lib/storage";
import {
  TASKS_STORAGE_KEY, MODELES_ACTIONS_PRO,
  createManualTask, todayLocal, shiftLocalDate, classeEcheance, rappelsDuJour,
} from "../lib/followupTasks";

const css = {
  main: { maxWidth: "1120px", margin: "0 auto", padding: "24px 16px 70px", color: "#29251f" },
  intro: { color: "#625e56", maxWidth: "770px", lineHeight: 1.55 },
  summary: { display: "flex", flexWrap: "wrap", gap: 12, margin: "24px 0" },
  stat: { flex: "1 1 150px", borderRadius: 12, padding: 16, background: "#f5f2ec", border: "1px solid #e6dfd2" },
  card: { border: "1px solid #e6dfd2", borderRadius: 14, padding: 18, background: "#fff", marginBottom: 16 },
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  label: { fontWeight: 700, display: "grid", gap: 5 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #8a8174", maxWidth: "100%" },
  button: { border: "1px solid #675945", borderRadius: 8, background: "#fff", color: "#2a261f", padding: "9px 12px", cursor: "pointer", fontWeight: 700 },
  primary: { border: 0, borderRadius: 8, background: "#334e41", color: "#fff", padding: "11px 16px", fontWeight: 800, cursor: "pointer" },
  badge: { display: "inline-block", fontSize: 13, borderRadius: 8, background: "#eee8dc", padding: "4px 8px" },
};

const FILTERS = [
  ["toutes", "À faire"],
  ["retard", "En retard"],
  ["aujourdhui", "Aujourd'hui"],
  ["semaine", "7 prochains jours"],
  ["en_attente", "En attente"],
  ["fait", "Terminées"],
];
const STATUS = [["a_faire", "À faire"], ["en_cours", "En cours"], ["en_attente", "En attente"], ["fait", "Terminée"]];

const safeTasks = () => {
  const raw = readStorageJson(TASKS_STORAGE_KEY, []);
  return Array.isArray(raw) ? raw.filter(t => t && typeof t.id === "string" && typeof t.title === "string") : [];
};

export function BureauTachesPage() {
  const [tasks, setTasks] = useState(safeTasks);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => shiftLocalDate(todayLocal(), 1));
  const [selectedModel, setSelectedModel] = useState("");
  const [message, setMessage] = useState("");
  const today = todayLocal();

  const active = useMemo(() => tasks.filter(t => t.status !== "fait"), [tasks]);
  const counts = useMemo(() => ({
    retard: active.filter(t => classeEcheance(t, today) === "retard").length,
    aujourdhui: active.filter(t => classeEcheance(t, today) === "aujourdhui").length,
    semaine: active.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= shiftLocalDate(today, 7)).length,
    attente: active.filter(t => t.status === "en_attente").length,
    rappels: rappelsDuJour(active, today).length,
  }), [active, today]);

  const shown = useMemo(() => {
    const text = search.trim().toLocaleLowerCase("fr");
    return [...tasks].filter(t => {
      if (text && !t.title.toLocaleLowerCase("fr").includes(text)) return false;
      if (filter === "fait") return t.status === "fait";
      if (t.status === "fait") return false;
      if (filter === "retard") return classeEcheance(t, today) === "retard";
      if (filter === "aujourdhui") return classeEcheance(t, today) === "aujourdhui";
      if (filter === "semaine") return Boolean(t.dueDate && t.dueDate <= shiftLocalDate(today, 7));
      if (filter === "en_attente") return t.status === "en_attente";
      return true;
    }).sort((a, b) => {
      if (a.status === "fait" && b.status !== "fait") return 1;
      if (b.status === "fait" && a.status !== "fait") return -1;
      if ((a.priority === "haute") !== (b.priority === "haute")) return a.priority === "haute" ? -1 : 1;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
  }, [tasks, filter, search, today]);

  function commit(next, notice = "Liste actualisée.") {
    if (!writeStorageJson(TASKS_STORAGE_KEY, next)) {
      setMessage("Enregistrement impossible : vérifie le stockage de ce navigateur.");
      return false;
    }
    setTasks(next);
    setMessage(notice);
    return true;
  }

  function add(title = newTitle) {
    const draft = createManualTask({ title, dueDate });
    if (!draft) {
      setMessage("Saisis une action courte et une date de reprise valide.");
      return;
    }
    if (commit([...tasks, draft], "Tâche ajoutée à ta liste.")) {
      setNewTitle("");
      setSelectedModel("");
    }
  }

  function edit(id, changes) {
    const next = tasks.map(t => t.id === id ? { ...t, ...changes } : t);
    commit(next);
  }

  function finish(task) {
    const completed = task.status !== "fait";
    edit(task.id, {
      status: completed ? "fait" : "a_faire",
      completedAt: completed ? new Date().toISOString() : null,
    });
  }

  return (
    <main style={css.main}>
      <header>
        <p style={{ fontWeight: 800, color: "#657150" }}>Bureau professionnel · prototype</p>
        <h1>Mes tâches et mes rappels</h1>
        <p style={css.intro}>Une seule liste pour préparer, relancer et terminer les suites d'entretien. Les tâches urgentes remontent en premier ; coche-les une fois faites. Tu n'as pas besoin de les garder en tête.</p>
        <p style={css.intro}><strong>Confidentialité :</strong> maquette enregistrée uniquement dans ce navigateur. N'y saisis aucun nom, donnée sociale ou dossier réel. Outlook et ses notifications ne sont pas encore connectés : les rappels ci-dessous apparaissent lorsque tu ouvres cette page.</p>
        <Link to="/pilotage-actions">← Retour à la file active</Link>
      </header>

      <section style={css.summary} aria-label="Repères de la journée">
        {[
          ["À faire", active.length],
          ["Rappels à voir", counts.rappels],
          ["En retard", counts.retard],
          ["Aujourd'hui", counts.aujourdhui],
          ["Sous 7 jours", counts.semaine],
          ["En attente", counts.attente],
        ].map(([label, value]) =>
          <div key={label} style={css.stat}><div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div><strong style={{ fontSize: 29 }}>{value}</strong></div>
        )}
      </section>

      {counts.rappels > 0 && (
        <section style={{ ...css.card, background: "#fff7e7" }} role="status">
          <h2 style={{ marginTop: 0 }}>À ne pas oublier aujourd'hui</h2>
          <p>{counts.rappels} action(s) ont atteint leur date de rappel ou leur échéance. Commence par une seule tâche, puis passe à la suivante.</p>
          <button type="button" style={css.primary} onClick={() => setFilter("aujourdhui")}>Voir les échéances proches</button>
        </section>
      )}

      <section style={css.card}>
        <h2>Ajouter une tâche en quelques secondes</h2>
        <form onSubmit={event => { event.preventDefault(); add(); }}>
          <div style={css.row}>
            <label style={{ ...css.label, flex: "2 1 310px" }}>Action à faire
              <input style={css.input} maxLength={240} value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Ex. : rappeler un partenaire ou préparer une pièce" required />
            </label>
            <label style={css.label}>Date de reprise
              <input type="date" style={css.input} value={dueDate} onChange={event => setDueDate(event.target.value)} required />
            </label>
            <button type="submit" style={{ ...css.primary, alignSelf: "end" }}>Ajouter à ma liste</button>
          </div>
        </form>
        <div style={{ ...css.row, marginTop: 16 }}>
          <label style={css.label}>Suggestions professionnelles (facultatives)
            <select style={css.input} value={selectedModel} onChange={event => setSelectedModel(event.target.value)}>
              <option value="">Choisir une action type…</option>
              {Object.entries(MODELES_ACTIONS_PRO).map(([group, choices]) =>
                <optgroup key={group} label={group}>
                  {choices.map(title => <option key={title} value={title}>{title}</option>)}
                </optgroup>
              )}
            </select>
          </label>
          <button style={css.button} type="button" disabled={!selectedModel} onClick={() => add(selectedModel)}>Ajouter cette action</button>
        </div>
        <p style={css.intro}>Les suggestions ne sont pas des obligations automatiques de la Métropole : retiens uniquement ce qui correspond au suivi.</p>
      </section>

      <section style={css.card} aria-label="Liste des tâches">
        <div style={{ ...css.row, justifyContent: "space-between" }}>
          <h2>Ma liste de travail</h2>
          <label style={css.label}>Rechercher une action
            <input style={css.input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Mot-clé" />
          </label>
        </div>
        <nav aria-label="Filtres des tâches" style={{ ...css.row, marginBottom: 18 }}>
          {FILTERS.map(([key, label]) => <button key={key} type="button"
            style={{ ...css.button, background: filter === key ? "#d6e3d7" : "#fff" }}
            aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
        </nav>
        {shown.length === 0
          ? <p>Aucune tâche dans cette catégorie. Tu peux en ajouter une juste au-dessus.</p>
          : <div style={{ display: "grid", gap: 12 }}>
            {shown.map(task => (
              <article key={task.id} style={{ ...css.card, margin: 0, borderLeft: classeEcheance(task, today) === "retard" ? "5px solid #b1594a" : "5px solid #77907c" }}>
                <div style={{ ...css.row, justifyContent: "space-between" }}>
                  <label style={{ ...css.row, flex: 1 }}>
                    <input type="checkbox" checked={task.status === "fait"} onChange={() => finish(task)} aria-label={`Marquer ${task.title} comme terminée`} />
                    <strong style={{ textDecoration: task.status === "fait" ? "line-through" : "none" }}>{task.title}</strong>
                  </label>
                  <span style={css.badge}>{task.status === "fait" ? "Terminée" : task.priority === "haute" ? "Prioritaire" : "À suivre"}</span>
                </div>
                <div style={{ ...css.row, marginTop: 12 }}>
                  <label style={css.label}>Date
                    <input type="date" style={css.input} value={task.dueDate || ""} onChange={e => edit(task.id, { dueDate: e.target.value, remindDate: shiftLocalDate(e.target.value, -1) })} />
                  </label>
                  <label style={css.label}>Me le rappeler
                    <input type="date" style={css.input} value={task.remindDate || ""} onChange={e => edit(task.id, { remindDate: e.target.value })} />
                  </label>
                  <label style={css.label}>État
                    <select style={css.input} value={task.status} onChange={e => edit(task.id, {
                      status: e.target.value,
                      completedAt: e.target.value === "fait" ? new Date().toISOString() : null,
                    })}>
                      {STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  {task.status !== "fait" && <>
                    <button style={css.button} type="button" onClick={() => edit(task.id, {
                      dueDate: shiftLocalDate(task.dueDate || today, 1),
                      remindDate: shiftLocalDate(task.dueDate || today, 1),
                    })}>Reporter +1 jour</button>
                    <button style={css.button} type="button" onClick={() => edit(task.id, { priority: task.priority === "haute" ? "normale" : "haute" })}>
                      {task.priority === "haute" ? "Priorité normale" : "Prioritaire"}
                    </button>
                  </>}
                  {task.dossierId && <Link to={`/pilotage-actions/dossier/${encodeURIComponent(task.dossierId)}`}>Revenir au dossier</Link>}
                </div>
                {task.status !== "fait" && <p style={{ ...css.intro, marginBottom: 0 }}>Statut Outlook : non connecté · rappel visible uniquement dans le bureau de travail.</p>}
              </article>
            ))}
          </div>}
      </section>
      {message && <p role="status" style={{ padding: 12, background: "#e9f1e9" }}>{message}</p>}
    </main>
  );
}
