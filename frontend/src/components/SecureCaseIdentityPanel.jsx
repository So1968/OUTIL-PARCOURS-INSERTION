import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError, lireIdentiteSecurisee, modifierIdentiteSecurisee } from "../lib/secureApi";
import { validDossierVersion, validReferenceReason } from "../lib/secureCaseReferenceData";
import { IDENTITY_FIELDS, checkedIdentityPage, validIdentity, sameIdentity } from "../lib/secureCaseIdentityData";
import "./secureSharedNotes.css";
import "./secureCaseIdentity.css";

const LABELS = { lastName: "Nom", firstName: "Prénom", insertisNumber: "Numéro Insertis", age: "Âge" };
const emptyDraft = () => ({ lastName: "", firstName: "", insertisNumber: "", age: "" });
const toDraft = identity => Object.fromEntries(IDENTITY_FIELDS.map(field => [field, identity[field] === null ? "" : String(identity[field])]));
function fromDraft(draft) {
  if (draft.age !== "" && !/^\d+$/.test(draft.age)) return null;
  return { lastName: draft.lastName === "" ? null : draft.lastName, firstName: draft.firstName === "" ? null : draft.firstName,
    insertisNumber: draft.insertisNumber === "" ? null : draft.insertisNumber, age: draft.age === "" ? null : Number(draft.age) };
}
function IdentityValues({ identity }) {
  return <dl>{IDENTITY_FIELDS.map(field => <div key={field}><dt>{LABELS[field]}</dt><dd>{identity[field] ?? "Non renseigné"}</dd></div>)}</dl>;
}

export function SecureCaseIdentityPanel({ caseId }) {
  const [data, setData] = useState(null), [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft), [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false), [review, setReview] = useState(null);
  const [message, setMessage] = useState(""), [error, setError] = useState("");
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const clearDraft = () => { setEditing(false); setDraft(emptyDraft()); setReason(""); };
  const read = async beforeVersion => checkedIdentityPage(await lireIdentiteSecurisee({ caseId, beforeVersion }), caseId, beforeVersion);
  const failure = (problem, mutation) => {
    if ([401, 403, 404].includes(problem.status)) {
      setData(null); clearDraft(); setReview(null);
      setError("Session ou accès à l’identité indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (problem.code === "HISTORIQUE_IDENTITE_INDISPONIBLE") {
      setData(null); setReview({ checked: false });
      setError("L’historique de l’identité doit être vérifié avant toute modification.");
    } else if (problem.status === 422) setError("Vérifiez les champs d’identité et le motif de modification.");
    else {
      setReview({ checked: false });
      setError(problem.status === 409 ? "Le dossier a été modifié ailleurs. Rechargez puis comparez avant de poursuivre. Votre saisie est conservée ici."
        : mutation ? "Enregistrement non confirmé. Rechargez l’identité pour vérifier avant toute nouvelle tentative. Votre saisie est conservée ici."
          : "Chargement indisponible. Rechargez l’identité avant de poursuivre.");
    }
  };
  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try { const response = await request(); if (alive.current) apply(response); }
    catch (problem) { if (alive.current) failure(problem, mutation); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const reload = () => run(() => read(), page => {
    setData(page); if (editing || review) setReview({ checked: true });
    setMessage(editing || review ? "Identité actuelle rechargée. Relisez-la avant de reprendre votre saisie." : "Identité et historique chargés.");
  });
  const more = () => run(async () => {
    const page = await read(data.nextBeforeVersion);
    if (page.dossierVersion !== data.dossierVersion || page.identityVersion !== data.identityVersion || page.artagReference !== data.artagReference) throw new ApiAccessError(409);
    if (!page.history.length || !sameIdentity(page.history[0].identity, data.history.at(-1).previousIdentity)) throw new ApiAccessError(503);
    return page;
  }, page => setData({ ...page, history: [...data.history, ...page.history] }));
  const next = fromDraft(draft);
  const canSave = data && editing && validIdentity(next) && !sameIdentity(next, data.identity)
    && validReferenceReason(reason) && data.dossierVersion < 2147483647;
  const save = () => run(async () => {
    const result = await modifierIdentiteSecurisee({ caseId, expectedVersion: data.dossierVersion, identity: next, reason });
    if (!result || result.caseId !== caseId || !validDossierVersion(result.dossierVersion) || result.dossierVersion !== data.dossierVersion + 1) throw new ApiAccessError(503);
    if (!alive.current) return null;
    try { const page = await read(); if (page.dossierVersion < result.dossierVersion) throw new ApiAccessError(503); return page; }
    catch { return null; }
  }, page => {
    clearDraft(); setReview(null); setData(page);
    setMessage(page ? "Identité enregistrée. Les valeurs précédentes restent dans l’historique."
      : "Identité enregistrée. Rechargez pour actualiser l’affichage ; aucun nouvel enregistrement n’est nécessaire.");
  }, true);

  return <section className="secure-notes secure-case-identity" aria-label="Identité du dossier" aria-busy={busy}>
    <p>Renseignez uniquement l’identité vérifiée de ce dossier. Les champs inconnus peuvent rester vides.</p>
    <button type="button" disabled={busy} onClick={reload}>{data ? "Recharger l’identité" : "Charger l’identité et l’historique"}</button>
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
    {review && data && <aside className="secure-notes__review" aria-label="Relecture nécessaire">
      <p>Comparez l’identité rechargée avec votre saisie et vérifiez le dossier concerné avant de continuer.</p>
      <button type="button" disabled={busy || !review.checked} onClick={() => { setReview(null); setError(""); setMessage("Relecture prise en compte."); }}>Continuer après relecture</button>
    </aside>}
    {data && <>
      <section aria-label="Identité actuelle"><h2>Numéro ARTAG : {data.artagReference}</h2>
        <IdentityValues identity={data.identity} />
        <p>L’âge est renseigné manuellement. Vérifiez-le au besoin ; il n’est pas recalculé automatiquement.</p>
        <p><Link to={`/dossiers/${caseId}/reference-artag`}>Numéro ARTAG et historique</Link></p>
        <p><Link to={`/dossiers/${caseId}/notes-partagees`}>Ouvrir les notes partagées</Link></p>
        {!editing && <button type="button" disabled={busy || !!review || data.dossierVersion === 2147483647} onClick={() => {
          setEditing(true); setDraft(toDraft(data.identity)); setReason(""); setMessage("");
        }}>Compléter ou corriger l’identité</button>}
      </section>
      {editing && <form autoComplete="off" onSubmit={event => { event.preventDefault(); if (!busy && !review && canSave) void save(); }}>
        <h2>Compléter ou corriger l’identité</h2>
        {IDENTITY_FIELDS.map(field => <label key={field}>{LABELS[field]}<input value={draft[field]} disabled={busy}
          inputMode={field === "age" ? "numeric" : "text"} maxLength={field === "age" ? 10 : field === "insertisNumber" ? 510 : 400}
          onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} /></label>)}
        <label>Motif de modification<input value={reason} maxLength={200} required disabled={busy} onChange={event => setReason(event.target.value)} /></label>
        <p>Un champ vide signifie « non renseigné ». Les anciennes valeurs sont conservées avec l’auteur et la date de modification.</p>
        <div className="secure-notes__actions"><button type="submit" disabled={busy || !!review || !canSave}>Enregistrer l’identité</button>
          <button type="button" disabled={busy} onClick={clearDraft}>Abandonner la saisie</button></div>
      </form>}
      <section aria-label="Historique de l’identité"><h2>Historique des versions</h2>
        {!data.history.length && <p>Aucune identité historisée. Les valeurs inconnues ne sont pas reconstituées.</p>}
        <ol>{data.history.map(revision => <li key={revision.dossierVersion}>
          <h3>Version du dossier {revision.dossierVersion}</h3><p>{new Date(revision.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
          <h4>Valeurs enregistrées</h4><IdentityValues identity={revision.identity} />
          <details><summary>Valeurs précédentes et traçabilité</summary><IdentityValues identity={revision.previousIdentity} />
            <p>Référence du compte auteur : {revision.actorId}</p></details><p>{revision.reason}</p>
        </li>)}</ol>
        {data.nextBeforeVersion !== null && <button type="button" disabled={busy || editing || !!review} onClick={more}>Voir les versions précédentes</button>}
      </section>
    </>}
  </section>;
}
