import { useRef, useState } from "react";
import { readStorageJson, writeStorageJson } from "../lib/storage";
import {
  TASKS_STORAGE_KEY, QUICK_EVENT_TYPES, creerCaptureRapide, todayLocal,
} from "../lib/followupTasks";

const ui = {
  box: { padding: 18, border: "1px solid #cfdccc", borderRadius: 12, background: "#f6faf5" },
  input: { padding: "10px 12px", border: "1px solid #8a9288", borderRadius: 8, width: "100%" },
  label: { display: "grid", gap: 5, fontWeight: 700, flex: "1 1 145px" },
  primary: { border: 0, borderRadius: 8, padding: "11px 18px", background: "#334e41", color: "white", cursor: "pointer", fontWeight: 800 },
};

export function SaisieRapide({ onSaved }) {
  const [type, setType] = useState("imprevu");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [time, setTime] = useState("");
  const [details, setDetails] = useState(false);
  const [feedback, setFeedback] = useState("");
  const input = useRef(null);

  function save(event) {
    event.preventDefault();
    const draft = creerCaptureRapide({ type, title, date, time });
    if (!draft) {
      setFeedback("Indique une action courte, une date et une heure valides.");
      return;
    }
    const before = readStorageJson(TASKS_STORAGE_KEY, []);
    const next = [...(Array.isArray(before) ? before : []), draft];
    if (!writeStorageJson(TASKS_STORAGE_KEY, next)) {
      setFeedback("Enregistrement impossible. Le mémo n'a pas été conservé.");
      return;
    }
    setTitle("");
    setFeedback("Noté dans Mes tâches. Tu peux saisir l'événement suivant.");
    input.current?.focus();
    onSaved?.(next);
  }

  return (
    <section style={ui.box} aria-label="Saisie rapide d'un événement professionnel">
      <h2 style={{ marginTop: 0 }}>Noter en 10 secondes</h2>
      <p style={{ marginTop: 0 }}>Imprévu, appel ou tâche : choisis le type, écris une phrase et appuie sur Entrée. La date est aujourd'hui par défaut.</p>
      <form onSubmit={save}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {QUICK_EVENT_TYPES.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={type === key}
              onClick={() => { setType(key); input.current?.focus(); }}
              style={{ border: "1px solid #677a6a", borderRadius: 9, padding: "8px 12px", cursor: "pointer", fontWeight: 700,
                background: type === key ? "#334e41" : "#fff", color: type === key ? "#fff" : "#334e41" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <label style={{ ...ui.label, flex: "3 1 260px" }}>Qu'est-ce qu'il faut garder en mémoire ?
            <input ref={input} style={ui.input} maxLength={240} value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Ex. : relancer un partenaire demain" required />
          </label>
          <button type="submit" style={ui.primary}>Noter ✓</button>
          <button type="button" aria-expanded={details}
            onClick={() => setDetails(value => !value)}
            style={{ background: "transparent", border: 0, color: "#334e41", cursor: "pointer", textDecoration: "underline" }}>
            {details ? "Masquer date / heure" : "Changer date / heure"}
          </button>
        </div>
        {details && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <label style={ui.label}>Date à traiter
              <input style={ui.input} type="date" value={date} onChange={event => setDate(event.target.value)} required />
            </label>
            <label style={ui.label}>Heure (facultative)
              <input style={ui.input} type="time" value={time} onChange={event => setTime(event.target.value)} />
            </label>
          </div>
        )}
      </form>
      {feedback && <p role="status" style={{ marginBottom: 0 }}>{feedback}</p>}
      <p style={{ fontSize: 13, color: "#545f56", marginBottom: 0 }}>Prototype : aucun nom, numéro de dossier réel ou détail confidentiel. Un rendez-vous saisi ici est un mémo de planification, pas encore un événement Outlook.</p>
    </section>
  );
}
