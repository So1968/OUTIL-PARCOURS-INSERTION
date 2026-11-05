import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError, lireBlocCourtSecurise, modifierBlocCourtSecurise } from "../lib/secureApi";
import { BRIEF_TYPES, checkedBriefContent, checkedBriefPage, sameBriefContent } from "../lib/secureCaseBriefData";
import "./secureSharedNotes.css";
import "./secureCaseBrief.css";

const validReason = value => typeof value === "string" && value.isWellFormed()
  && value.trim().length > 0 && value.length <= 200
  && !Array.from(value).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127);

function BriefContent({ config, content }) {
  return <dl className="secure-case-brief__fields">{config.fields.map(([field, label]) =>
    <div key={field}><dt>{label}</dt><dd className="secure-notes__text">{content[field] || "Non renseigné"}</dd></div>)}</dl>;
}

export function SecureCaseBriefPanel({ caseId, type }) {
  const config = BRIEF_TYPES[type];
  const [data, setData] = useState(null), [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [review, setReview] = useState(null);
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const clearDraft = () => { setEditing(false); setDraft({}); setReason(""); };
  const read = async beforeVersion => checkedBriefPage(
    await lireBlocCourtSecurise({ caseId, type, beforeVersion }), caseId, type, beforeVersion,
  );
  const failed = (problem, mutation) => {
    if ([401, 403, 404].includes(problem.status)) {
      clearDraft(); setData(null); setReview(null);
      setError("Session ou accès à ce bloc indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (problem.code === "HISTORIQUE_BLOC_COURT_INDISPONIBLE") {
      setData(null); setReview({ checked: false });
      setError("L’historique du bloc doit être vérifié avant toute modification.");
    } else if (problem.status === 422) {
      setError("Vérifiez les rubriques, leur longueur et le motif.");
    } else {
      setReview({ checked: false });
      setError(problem.status === 409
        ? "Le dossier a changé. Rechargez, comparez, puis confirmez avant de reprendre."
        : mutation ? "Enregistrement non confirmé. Rechargez pour vérifier sans renvoyer votre saisie."
          : "Chargement indisponible. Vérifiez la connexion avant de reprendre.");
    }
  };
  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try { const response = await request(); if (alive.current) apply(response); }
    catch (problem) { if (alive.current) failed(problem, mutation); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const reload = () => run(() => read(), page => {
    setData(page);
    if (editing || review) setReview({ checked: true });
    setMessage(editing || review
      ? "Version rechargée. Comparez l’état actuel à votre saisie avant de reprendre."
      : "Bloc court et historique chargés.");
  });
  const more = () => run(async () => {
    const page = await read(data.nextBeforeVersion);
    if (page.dossierVersion !== data.dossierVersion || page.briefVersion !== data.briefVersion
      || page.history.some(row => data.history.some(previous => previous.dossierVersion === row.dossierVersion))
      || !page.history.length
      || !sameBriefContent(type, data.history.at(-1).previousContent, page.history[0].content)) {
      throw new ApiAccessError(409);
    }
    return page;
  }, page => setData(previous => ({ ...page, history: [...previous.history, ...page.history] })));
  const next = checkedBriefContent(type, draft);
  const total = config.fields.reduce((sum, [field]) => sum + Array.from(draft[field] || "").length, 0);
  const canSave = data && editing && next !== null && !sameBriefContent(type, next, data.content)
    && validReason(reason) && data.dossierVersion < 2147483647;
  const save = () => run(async () => {
    const result = await modifierBlocCourtSecurise({
      caseId, type, expectedVersion: data.dossierVersion, content: next, reason,
    });
    if (!result || result.caseId !== caseId || result.type !== type
      || result.dossierVersion !== data.dossierVersion + 1) throw new ApiAccessError(503);
    if (!alive.current) return null;
    try {
      const page = await read();
      if (page.dossierVersion < result.dossierVersion) throw new ApiAccessError(503);
      return page;
    } catch { return null; }
  }, page => {
    clearDraft(); setReview(null); setData(page);
    setMessage(page
      ? "Bloc enregistré. Les versions précédentes sont conservées."
      : "Bloc enregistré. Rechargez pour vérifier, sans renvoyer la modification.");
  }, true);

  if (!config) return null;
  return <section className="secure-notes secure-case-brief" aria-label={config.title} aria-busy={busy}>
    <p>{config.purpose} Aucune transmission externe n’est automatique.</p>
    <button type="button" disabled={busy} onClick={reload}>{data ? "Recharger le bloc" : "Charger le bloc et l’historique"}</button>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {review && data && <aside className="secure-notes__review" aria-label="Relecture obligatoire">
      <p>Relisez les valeurs actuelles et votre saisie avant de poursuivre. Une sauvegarde incertaine ne doit pas être renvoyée en aveugle.</p>
      <button type="button" disabled={busy || !review.checked} onClick={() => {
        setReview(null); setError(""); setMessage("Relecture prise en compte.");
      }}>Continuer après relecture</button>
    </aside>}
    {data && <>
      <section aria-label="Version actuelle">
        <h2>Version actuelle</h2><BriefContent config={config} content={data.content} />
        <p><Link to={"/dossiers/" + caseId + "/identite"}>Retour à l’identité du dossier</Link></p>
        {!editing && <button type="button" disabled={busy || !!review || data.dossierVersion >= 2147483647}
          onClick={() => { setDraft({ ...data.content }); setEditing(true); setReason(""); setMessage(""); }}>
          Compléter ou corriger ce bloc
        </button>}
      </section>
      {editing && <form autoComplete="off" onSubmit={event => {
        event.preventDefault(); if (!busy && !review && canSave) void save();
      }}>
        <h2>Compléter ou corriger</h2>
        {config.fields.map(([field, label]) => <label key={field}>{label}
          <textarea value={draft[field] ?? ""} maxLength={350} disabled={busy}
            placeholder="Uniquement les informations utiles et vérifiées."
            onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} />
        </label>)}
        <p role="status">Longueur totale : {total} / {config.maxTotal} caractères</p>
        <label>Motif de modification
          <input maxLength={200} required disabled={busy} value={reason}
            onChange={event => setReason(event.target.value)} />
        </label>
        <p>Chaque correction conserve les valeurs précédentes, la date et l’auteur. Aucun envoi vers Insertis.</p>
        <div className="secure-notes__actions">
          <button type="submit" disabled={busy || !!review || !canSave}>Enregistrer le bloc</button>
          <button type="button" disabled={busy} onClick={clearDraft}>Abandonner la saisie</button>
        </div>
      </form>}
      <section aria-label="Historique du bloc"><h2>Historique</h2>
        {!data.history.length && <p>Aucune version antérieure à afficher.</p>}
        <ol>{data.history.map(version => <li key={version.dossierVersion}>
          <h3>Version du dossier {version.dossierVersion}</h3>
          <p>{new Date(version.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
          <p>Motif : {version.reason}</p>
          <details><summary>Voir les valeurs avant et après</summary>
            <h4>Après modification</h4><BriefContent config={config} content={version.content} />
            <h4>Avant modification</h4><BriefContent config={config} content={version.previousContent} />
            <p>Référence du compte auteur : {version.actorId}</p>
          </details>
        </li>)}</ol>
        {data.nextBeforeVersion !== null && <button type="button" disabled={busy || editing || !!review}
          onClick={more}>Voir les versions précédentes</button>}
      </section>
    </>}
  </section>;
}
