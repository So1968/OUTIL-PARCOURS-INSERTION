import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError, lireSocleAutonomieSecurise, modifierSocleAutonomieSecurise } from "../lib/secureApi";
import {
  AUTONOMY_IDS, AUTONOMY_CHOICES, EMPTY_AUTONOMY_RESPONSE,
  checkedAutonomyAnswers, checkedAutonomyPage, sameAutonomyAnswers,
} from "../lib/secureAutonomyData";
import "./secureSharedNotes.css";
import "./secureCaseAutonomy.css";

const validReason = value => typeof value === "string" && value.isWellFormed() && value.trim()
  && value.length <= 200 && !Array.from(value).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127);

function AnswersSummary({ questions, reponses }) {
  return <dl className="secure-case-autonomy__summary">{questions.filter(q => Object.hasOwn(reponses, q.id)).map(q =>
    <div key={q.id}><dt>{q.axe}</dt><dd>{reponses[q.id].reponse}
      {reponses[q.id].valide ? " — Repère noté" : " — À reprendre"}
      {reponses[q.id].note && <p className="secure-notes__text">{reponses[q.id].note}</p>}
    </dd></div>)}</dl>;
}

export function SecureCaseAutonomyPanel({ caseId }) {
  const [data, setData] = useState(null), [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [review, setReview] = useState(null);
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const clearDraft = () => { setEditing(false); setDraft({}); setReason(""); };
  const read = async beforeVersion => checkedAutonomyPage(
    await lireSocleAutonomieSecurise({ caseId, beforeVersion }), caseId, beforeVersion,
  );
  const fail = (problem, mutation) => {
    if ([401, 403, 404].includes(problem.status)) {
      setData(null); clearDraft(); setReview(null);
      setError("Session ou accès aux repères d’autonomie indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (problem.code === "HISTORIQUE_AUTONOMIE_INDISPONIBLE") {
      setData(null); setReview({ checked: false });
      setError("L’historique du dossier doit être vérifié avant toute modification.");
    } else if (problem.status === 422) {
      setError("Vérifiez les réponses, les notes et le motif.");
    } else {
      setReview({ checked: false });
      setError(problem.status === 409
        ? "Dossier modifié ailleurs. Rechargez, comparez, puis confirmez la reprise de votre saisie."
        : mutation ? "Enregistrement incertain. Rechargez avant de réécrire. Votre saisie reste ici."
          : "Chargement indisponible. Vérifiez votre connexion avant de poursuivre.");
    }
  };
  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try { const result = await request(); if (alive.current) apply(result); }
    catch (problem) { if (alive.current) fail(problem, mutation); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const reload = () => run(() => read(), page => {
    setData(page);
    if (editing || review) setReview({ checked: true });
    setMessage(editing || review ? "Repères rechargés. Comparez-les avec votre saisie avant de reprendre."
      : "Repères et historique chargés.");
  });
  const more = () => run(async () => {
    const page = await read(data.nextBeforeVersion);
    if (page.dossierVersion !== data.dossierVersion || page.autonomyVersion !== data.autonomyVersion
      || page.history.some(row => data.history.some(old => old.dossierVersion === row.dossierVersion))) {
      throw new ApiAccessError(409);
    }
    return page;
  }, page => setData(previous => ({ ...page, history: [...previous.history, ...page.history] })));
  const patch = (id, field, value) => setDraft(previous => ({
    ...previous, [id]: { ...(previous[id] ?? EMPTY_AUTONOMY_RESPONSE), [field]: value },
  }));
  const remove = id => setDraft(previous => {
    const updated = { ...previous };
    delete updated[id];
    return updated;
  });
  const next = checkedAutonomyAnswers(draft);
  const canSave = !!data && editing && next !== null && !sameAutonomyAnswers(next, data.reponses)
    && !!validReason(reason) && data.dossierVersion < 2147483647;
  const save = () => run(async () => {
    const result = await modifierSocleAutonomieSecurise({
      caseId, expectedVersion: data.dossierVersion, reponses: next, reason,
    });
    if (!result || result.caseId !== caseId || result.dossierVersion !== data.dossierVersion + 1) throw new ApiAccessError(503);
    if (!alive.current) return null;
    try {
      const page = await read();
      if (page.dossierVersion < result.dossierVersion) throw new ApiAccessError(503);
      return page;
    } catch { return null; }
  }, page => {
    clearDraft(); setReview(null); setData(page);
    setMessage(page ? "Repères enregistrés. Les versions précédentes sont conservées."
      : "Repères enregistrés. Rechargez pour vérifier l’affichage, sans renvoyer la modification.");
  }, true);

  return <section className="secure-notes secure-case-autonomy" aria-label="Repères d’autonomie du dossier" aria-busy={busy}>
    <p>Huit questions pour préparer l’échange, sans score ni diagnostic automatique. Consultation réservée à la référente titulaire en recette.</p>
    <button type="button" disabled={busy} onClick={reload}>{data ? "Recharger les repères" : "Charger les repères et l’historique"}</button>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {review && data && <aside className="secure-notes__review" aria-label="Relecture nécessaire">
      <p>Comparez les réponses actuelles et votre saisie. Ne réémettez pas une modification non confirmée.</p>
      <button type="button" disabled={busy || !review.checked} onClick={() => {
        setReview(null); setError(""); setMessage("Relecture confirmée.");
      }}>Continuer après relecture</button>
    </aside>}
    {data && <>
      <section aria-label="Repères actuels">
        <h2>Repères enregistrés</h2>
        <p>{Object.values(data.reponses).filter(answer => answer.valide).length} / {AUTONOMY_IDS.length} repères notés</p>
        <AnswersSummary questions={data.questions} reponses={data.reponses} />
        {!Object.keys(data.reponses).length && <p>Aucun repère enregistré pour ce dossier.</p>}
        <p><Link to={"/dossiers/" + caseId + "/identite"}>Retour à l’identité</Link></p>
        {!editing && <button type="button" disabled={busy || !!review || data.dossierVersion >= 2147483647}
          onClick={() => { setDraft({ ...data.reponses }); setEditing(true); setReason(""); setMessage(""); }}>
          Compléter ou corriger les repères
        </button>}
      </section>
      {editing && <form autoComplete="off" onSubmit={event => {
        event.preventDefault(); if (!busy && !review && canSave) void save();
      }}>
        <h2>Saisie des huit repères</h2>
        {data.questions.map((q, index) => {
          const answer = draft[q.id] ?? EMPTY_AUTONOMY_RESPONSE;
          return <fieldset key={q.id} className="secure-case-autonomy__question">
            <legend>{index + 1}. {q.axe}</legend>
            <p>{q.question}</p>
            <label>Réponse — {q.axe}
              <select disabled={busy} value={answer.reponse} onChange={event => patch(q.id, "reponse", event.target.value)}>
                {AUTONOMY_CHOICES.map(choice => <option key={choice} value={choice}>{choice}</option>)}
              </select>
            </label>
            <label>Éléments recueillis — {q.axe}
              <textarea disabled={busy} maxLength={1500} value={answer.note}
                onChange={event => patch(q.id, "note", event.target.value)}
                placeholder="Uniquement les informations utiles à la suite du parcours." />
            </label>
            <label className="secure-case-autonomy__check"><input type="checkbox" disabled={busy}
              checked={answer.valide} onChange={event => patch(q.id, "valide", event.target.checked)} />
              Repère noté</label>
            {Object.hasOwn(draft, q.id) && <button type="button" disabled={busy}
              onClick={() => remove(q.id)}>Retirer le repère {q.axe}</button>}
          </fieldset>;
        })}
        <label>Motif de modification
          <input disabled={busy} maxLength={200} required value={reason}
            onChange={event => setReason(event.target.value)} />
        </label>
        <p>Chaque modification conserve son auteur, sa date et les réponses antérieures. Aucun envoi vers Insertis.</p>
        <div className="secure-notes__actions">
          <button type="submit" disabled={busy || !!review || !canSave}>Enregistrer les repères</button>
          <button type="button" disabled={busy} onClick={clearDraft}>Abandonner la saisie</button>
        </div>
      </form>}
      <section aria-label="Historique des repères">
        <h2>Historique</h2>
        {!data.history.length && <p>Aucune modification historisée.</p>}
        <ol>{data.history.map(version => <li key={version.dossierVersion}>
          <h3>Version du dossier {version.dossierVersion}</h3>
          <p>{new Date(version.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
          <p>Motif : {version.reason}</p>
          <details><summary>Réponses et état précédent</summary>
            <h4>Après modification</h4><AnswersSummary questions={data.questions} reponses={version.reponses} />
            <h4>Avant modification</h4><AnswersSummary questions={data.questions} reponses={version.previousReponses} />
            <p>Référence du compte auteur : {version.actorId}</p>
          </details>
        </li>)}</ol>
        {data.nextBeforeVersion !== null && <button type="button" disabled={busy || editing || !!review}
          onClick={more}>Voir les versions précédentes</button>}
      </section>
    </>}
  </section>;
}
