import { useEffect, useMemo, useState } from "react";
import {
  loadSecureTasks, loadSecureWorkEvents, createSecureWorkEvent, editSecureWorkEvent,
} from "../lib/secureTasksApi";
import { syntheseChargePrivee, chargeToText } from "../lib/secureWorkload";

const QUICK = [
  { kind: "IMPREVU", state: "EFFECTUE", minutes: 15, label: "+ Imprévu · 15 min" },
  { kind: "APPEL", state: "EFFECTUE", minutes: 10, label: "+ Appel · 10 min" },
  { kind: "RENDEZ_VOUS", state: "PREVU", minutes: 30, label: "+ Temps RDV prévu · 30 min" },
];
const LABELS = {
  IMPREVU: "Imprévu", APPEL: "Appel", RENDEZ_VOUS: "Temps de rendez-vous",
  ENTRETIEN: "Entretien", RELANCE: "Relance", ADMINISTRATIF: "Administratif",
};
const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export function SecureWorkEventsPanel() {
  const [day, setDay] = useState("");
  const [chosenDay, setChosenDay] = useState("");
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [retryInput, setRetryInput] = useState(null);
  const [kind, setKind] = useState("RELANCE");
  const [minutes, setMinutes] = useState(15);
  const [state, setState] = useState("EFFECTUE");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSecureTasks(), loadSecureWorkEvents()]).then(([list, data]) => {
      if (cancelled) return;
      setTasks(list);
      setEvents(data.events);
      setDay(data.day);
      setChosenDay(data.day);
      setReady(true);
    }).catch(error => {
      if (!cancelled) setMessage(error.message);
    });
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => ready
    ? syntheseChargePrivee({ tasks, events, day })
    : null, [ready, tasks, events, day]);

  async function refresh(targetDay = day) {
    setBusy(true);
    try {
      const [list, data] = await Promise.all([
        loadSecureTasks(), loadSecureWorkEvents(targetDay || null),
      ]);
      setTasks(list);
      setEvents(data.events);
      setDay(data.day);
      setChosenDay(data.day);
      setReady(true);
      setMessage("Charge rechargée depuis le serveur privé.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function record(input) {
    if (busy || !ready) return;
    setBusy(true);
    try {
      await createSecureWorkEvent(input);
      setRetryInput(null);
      // Une requête réussie n'a pas à être répétée si la lecture échoue ensuite.
      setMessage("Événement enregistré sur le serveur privé.");
      const result = await loadSecureWorkEvents(day);
      setEvents(result.events);
    } catch (error) {
      setRetryInput(input);
      setMessage(error.message + " En cas de doute, réessayer utilise la même clé anti-doublon.");
    } finally {
      setBusy(false);
    }
  }

  function addQuick(quick) {
    if (!ready || busy || retryInput) return;
    void record({
      requestId: crypto.randomUUID(), day,
      kind: quick.kind, state: quick.state, minutes: quick.minutes,
    });
  }

  async function correct(entry, changes) {
    setBusy(true);
    try {
      await editSecureWorkEvent(entry, changes);
      const result = await loadSecureWorkEvents(day);
      setEvents(result.events);
      setMessage("Repère de charge actualisé.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Plan de charge professionnel sécurisé"
      style={{ border: "1px solid #a8afa0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
      <h2>Plan de charge professionnel — saisie express</h2>
      <p>Activités personnelles enregistrées sur PostgreSQL. Aucun nom, compte rendu ou numéro de dossier n'est demandé. Ces repères ne créent pas de rendez-vous Outlook.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
        <label>Date du plan
          <input type="date" value={chosenDay} disabled={busy || !ready}
            onChange={e => setChosenDay(e.target.value)} />
        </label>
        <button type="button" disabled={!ready || busy || !chosenDay}
          onClick={() => refresh(chosenDay)}>Afficher cette journée</button>
        <button type="button" disabled={busy} onClick={() => refresh(day)}>Actualiser</button>
      </div>
      {ready && summary && <>
        <p><strong>{chargeToText(summary.totalKnown)}</strong> de charge connue le {day}, dont {chargeToText(summary.doneMinutes)} effectuées, {chargeToText(summary.plannedMinutes)} prévues et {chargeToText(summary.taskMinutes)} de tâches à réaliser.</p>
        <p>{summary.overdue} tâche(s) en retard, {summary.due} tâche(s) échues ou du jour. {summary.unestimatedTasks > 0
          ? String(summary.unestimatedTasks) + " tâche(s) sans temps estimé." : "Toutes les tâches échéantes ont une estimation."}</p>
        <p><strong>Attention :</strong> charge partielle, sans calendrier Outlook ni pauses ni trajets. Un repère de rendez-vous saisi ici ne constitue pas une réservation d'agenda.</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "16px 0" }}>
          {QUICK.map(option => (
            <button type="button" key={option.label} disabled={busy || !!retryInput}
              onClick={() => addQuick(option)} style={{ minHeight: 48, padding: "8px 14px" }}>
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={e => {
          e.preventDefault();
          addQuick({ kind, state, minutes: Number(minutes) });
        }} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
          <label>Activité
            <select value={kind} disabled={busy || !!retryInput} onChange={e => setKind(e.target.value)}>
              {Object.entries(LABELS).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Durée en minutes
            <input type="number" min="1" max="600" required value={minutes}
              disabled={busy || !!retryInput} onChange={e => setMinutes(e.target.value)} />
          </label>
          <label>Situation
            <select value={state} disabled={busy || !!retryInput} onChange={e => setState(e.target.value)}>
              <option value="EFFECTUE">Effectuée</option>
              <option value="PREVU">Prévue</option>
            </select>
          </label>
          <button type="submit" disabled={busy || !!retryInput}>Enregistrer</button>
        </form>
        {retryInput && <div role="alert" style={{ marginTop: 12 }}>
          <p>La confirmation a échoué : ne ressaisis pas l'activité. Vérifie puis réessaie avec sa clé de requête initiale.</p>
          <button type="button" disabled={busy} onClick={() => record(retryInput)}>
            Réessayer sans créer de doublon
          </button>
          <button type="button" disabled={busy} onClick={() => {
            setRetryInput(null);
            void refresh(day);
          }}>Annuler la tentative et vérifier la liste</button>
        </div>}

        <h3>Activités enregistrées ({events.filter(e => e.state !== "ANNULE").length})</h3>
        <ul style={{ display: "grid", gap: 12, paddingLeft: 20 }}>
          {events.map(entry => <li key={entry.id}>
            <strong>{LABELS[entry.kind] || "Activité"} : {chargeToText(entry.minutes)}</strong>
            {" — "}{entry.state === "EFFECTUE" ? "Effectuée" : entry.state === "PREVU" ? "Prévue" : "Annulée"}
            {entry.state !== "ANNULE" && <>
              {" "}
              <label>Modifier la durée
                <select disabled={busy} value={entry.minutes}
                  aria-label={"Durée de " + (LABELS[entry.kind] || "l'activité")}
                  onChange={e => correct(entry, { minutes: Number(e.target.value) })}>
                  {!DURATIONS.includes(entry.minutes) &&
                    <option value={entry.minutes}>{entry.minutes} min</option>}
                  {DURATIONS.map(n => <option key={n} value={n}>{n} min</option>)}
                </select>
              </label>
              {" "}
              <button type="button" disabled={busy} onClick={() => correct(entry, { state:"ANNULE" })}>
                Annuler ce repère
              </button>
            </>}
          </li>)}
        </ul>
      </>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
