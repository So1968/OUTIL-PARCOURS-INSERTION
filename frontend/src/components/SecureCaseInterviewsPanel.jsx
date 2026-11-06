import { useRef, useState } from "react";
import { enregistrerEntretienSecurise, lireEntretiensSecurises } from "../lib/secureApi";
import { loadSecureReminders } from "../lib/secureTasksApi";
import { buildInterviewDraft, checkedInterviewList, validInterviewDay } from "../lib/secureInterviewData";
import "./secureDailyFocus.css";

const dateView = date => date ? date.split("-").reverse().join("/") : "à définir";

export function SecureCaseInterviewsPanel({ caseId }) {
  const [interviews, setInterviews] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const [day, setDay] = useState("");
  const [interviewDay, setInterviewDay] = useState("");
  const [includeFollowUp, setIncludeFollowUp] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminder, setReminder] = useState(1);
  const [minutes, setMinutes] = useState("");
  const [retry, setRetry] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const locked = useRef(false);

  const clearAccess = () => {
    setReady(false); setInterviews([]); setNextOffset(null); setDay("");
    setInterviewDay(""); setRetry(null); setIncludeFollowUp(false);
    setTitle(""); setDueDate(""); setMinutes("");
    setMessage("");
    setError("Accès aux entretiens indisponible. Reconnectez-vous avant de poursuivre.");
  };
  const fail = issue => {
    if ([401,403,404].includes(issue?.status)) { clearAccess(); return; }
    setError(issue?.status === 409
      ? "Cette demande a déjà été utilisée différemment. Vérifiez l’historique avant toute nouvelle saisie."
      : issue?.status === 422
        ? "Vérifiez la date de l’entretien et les précisions de l’action."
        : "Résultat incertain. Vérifiez la liste puis réessayez avec la même demande.");
  };
  const read = async offset => checkedInterviewList(
    await lireEntretiensSecurises({ caseId, offset }), caseId, offset,
  );
  const load = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const [page, server] = await Promise.all([read(0), loadSecureReminders()]);
      if (!validInterviewDay(server.day, server.day)) throw new Error("JOUR_SERVEUR_INVALIDE");
      setDay(server.day);
      setInterviews(page.interviews); setNextOffset(page.nextOffset);
      setReady(true);
      setMessage("Entretiens chargés depuis le serveur. Aucune date n’a été ajoutée automatiquement.");
    } catch(issue) { fail(issue); }
    finally { locked.current = false; setBusy(false); }
  };
  const more = async () => {
    if (locked.current || nextOffset === null) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const page = await read(nextOffset);
      if (page.interviews.some(item => interviews.some(existing => existing.id === item.id))) {
        throw new Error("PAGINATION_MODIFIEE");
      }
      setInterviews(previous => [...previous, ...page.interviews]);
      setNextOffset(page.nextOffset);
    } catch(issue) { fail(issue); }
    finally { locked.current = false; setBusy(false); }
  };
  const save = async payload => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await enregistrerEntretienSecurise({ caseId, ...payload });
      // Le serveur a confirmé ; ne pas réémettre si une lecture ultérieure échoue.
      setRetry(null);
      setInterviewDay(""); setTitle(""); setDueDate(""); setMinutes("");
      setReminder(1); setIncludeFollowUp(false);
      setMessage("Entretien enregistré. Sa suite éventuelle est rattachée au dossier.");
      try {
        const page = await read(0);
        setInterviews(page.interviews); setNextOffset(page.nextOffset);
      } catch(issue) {
        if ([401,403,404].includes(issue?.status)) clearAccess();
        else setMessage("Entretien enregistré. Rechargez la liste pour vérifier son affichage, sans recréer.");
      }
    } catch(issue) {
      if ([401,403,404].includes(issue?.status)) clearAccess();
      else { setRetry(payload); fail(issue); }
    } finally { locked.current = false; setBusy(false); }
  };
  const submit = event => {
    event.preventDefault();
    if (!ready || busy || locked.current || retry) return;
    let draft;
    try {
      draft = buildInterviewDraft({
        interviewDay, serverDay:day, includeFollowUp,
        title, dueDate, reminderDaysBefore:reminder, estimatedMinutes:minutes,
      });
    } catch {
      setError("La date et les informations de suite à donner sont à vérifier.");
      return;
    }
    void save({ requestId:crypto.randomUUID(), ...draft });
  };
  return <section aria-label="Entretiens du dossier" aria-busy={busy} className="secure-notes secure-case-interviews">
    <h2>Entretiens réalisés et suites confirmées</h2>
    <p>Trace minimale : uniquement la date de l’entretien, et éventuellement une action confirmée.
      Ce n’est pas un compte rendu Insertis. Aucun contenu sensible ne doit figurer dans le titre de l’action.</p>
    <button type="button" disabled={busy} onClick={() => void load()}>
      {ready ? "Recharger mes entretiens" : "Charger mes entretiens"}
    </button>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {ready && <>
      <p>Jour métier du serveur : <strong>{dateView(day)}</strong>. Les entretiens futurs ne peuvent pas être déclarés comme réalisés.</p>
      <form autoComplete="off" className="daily-controls" onSubmit={submit}>
        <label>Date de l’entretien réalisé
          <input type="date" required max={day} value={interviewDay}
            disabled={busy || !!retry} onChange={event => setInterviewDay(event.target.value)} />
        </label>
        <label className="secure-interview-choice">
          <input type="checkbox" checked={includeFollowUp} disabled={busy || !!retry}
            onChange={event => setIncludeFollowUp(event.target.checked)} />
          Ajouter une action de suivi à cet entretien (facultatif)
        </label>
        {includeFollowUp && <>
          <label>Action à réaliser
            <input value={title} required maxLength={200} disabled={busy || !!retry}
              placeholder="Ex. Relancer un partenaire"
              onChange={event => setTitle(event.target.value)} />
          </label>
          <details className="secure-task-details">
            <summary>Échéance, rappel et durée (facultatif)</summary>
            <div className="secure-task-details__fields">
              <label>Échéance de l’action
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
              <label>Durée estimée de l’action
                <select value={minutes} disabled={busy || !!retry}
                  onChange={event => setMinutes(event.target.value)}>
                  <option value="">Non estimée</option>
                  {[5,10,15,20,30,45,60,90,120,180].map(value =>
                    <option key={value} value={value}>{value} min</option>)}
                </select>
              </label>
            </div>
          </details>
        </>}
        <button type="submit" disabled={busy || !!retry || !validInterviewDay(interviewDay,day)
          || includeFollowUp && !title.trim()}>Enregistrer cet entretien</button>
      </form>
      {retry && <div role="alert">
        <p>Création non confirmée. Ne saisissez pas le même entretien sous une nouvelle demande.</p>
        <button type="button" disabled={busy} onClick={() => void save(retry)}>Réessayer sans doublon</button>
        <button type="button" disabled={busy} onClick={() => {
          setRetry(null); void load();
        }}>Vérifier l’historique sans recréer</button>
      </div>}
      <h3>Historique des entretiens enregistrés ({interviews.length}{nextOffset !== null ? "+" : ""})</h3>
      {!interviews.length && <p>Aucun entretien déclaré dans cet espace réservé.</p>}
      <ol>{interviews.map(item => <li key={item.id}>
        <strong>Entretien du {dateView(item.interviewDay)}</strong>
        {item.followUp
          ? <p>Action liée : {item.followUp.title} · {item.followUp.status === "FAIT" ? "Terminée" : "À suivre"}
            {item.followUp.dueDate ? " · échéance " + dateView(item.followUp.dueDate) : ""}</p>
          : <p>Aucune suite rattachée à cette trace.</p>}
      </li>)}</ol>
      {nextOffset !== null && <button type="button" disabled={busy}
        onClick={() => void more()}>Voir les entretiens précédents</button>}
      <p>Les actions restent dans le bureau professionnel. Aucune synchronisation Outlook ou Insertis n’est activée.</p>
    </>}
  </section>;
}
