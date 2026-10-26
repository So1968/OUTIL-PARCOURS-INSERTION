import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError, lireReferenceArtagSecurisee, corrigerReferenceArtagSecurisee } from "../lib/secureApi";
import { hasUsableArtagReference } from "../lib/secureCaseDirectoryApi";
import { checkedReferencePage, validDossierVersion, validReferenceReason } from "../lib/secureCaseReferenceData";
import "./secureSharedNotes.css";
import "./secureCaseReference.css";

const dateLabel = value => new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

export function SecureCaseReferencePanel({ caseId }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const clearDraft = () => { setEditing(false); setReference(""); setReason(""); };
  const read = async beforeVersion => checkedReferencePage(
    await lireReferenceArtagSecurisee({ caseId, beforeVersion }), caseId, beforeVersion,
  );
  const failure = (problem, mutation) => {
    if ([401, 403, 404].includes(problem.status)) {
      setData(null); clearDraft(); setReview(null);
      setError("Session ou accès à l’identification indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (problem.code === "HISTORIQUE_REFERENCE_INDISPONIBLE") {
      setData(null); setReview({ checked: false });
      setError("L’historique du numéro ARTAG doit être vérifié avant toute correction.");
    } else if (problem.code === "REFERENCE_INDISPONIBLE") {
      setError("Ce numéro ne peut pas être utilisé. Vérifiez le numéro saisi.");
    } else if (problem.status === 422) {
      setError("Vérifiez le nouveau numéro ARTAG et le motif de correction.");
    } else {
      setReview({ checked: false });
      setError(problem.status === 409
        ? "Le dossier a été modifié ailleurs. Rechargez puis comparez avant de poursuivre. Votre saisie est conservée ici."
        : mutation ? "Enregistrement non confirmé. Rechargez pour vérifier avant toute nouvelle tentative. Votre saisie est conservée ici."
          : "Chargement indisponible. Rechargez la référence avant de poursuivre.");
    }
  };
  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try { const result = await request(); if (alive.current) apply(result); }
    catch (problem) { if (alive.current) failure(problem, mutation); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const reload = () => run(() => read(), page => {
    setData(page);
    if (!hasUsableArtagReference(page.artagReference)) { clearDraft(); setReview(null); }
    else if (editing || review) setReview({ checked: true });
    setMessage(editing || review ? "Référence actuelle rechargée. Relisez-la avant de reprendre votre saisie." : "Référence et historique chargés.");
  });
  const more = () => run(async () => {
    const page = await read(data.nextBeforeVersion);
    if (page.dossierVersion !== data.dossierVersion || page.artagReference !== data.artagReference) throw new ApiAccessError(409);
    if (!page.history.length || page.history[0].artagReference !== data.history.at(-1).previousReference) throw new ApiAccessError(503);
    return page;
  }, page => setData({ ...page, history: [...data.history, ...page.history] }));

  const save = () => run(async () => {
    const result = await corrigerReferenceArtagSecurisee({
      caseId, artagReference: reference, reason, expectedVersion: data.dossierVersion,
    });
    if (!result || result.caseId !== caseId || result.artagReference !== reference
      || !validDossierVersion(result.dossierVersion) || result.dossierVersion !== data.dossierVersion + 1) throw new ApiAccessError(503);
    if (!alive.current) return { page: null };
    // Une lecture en échec après confirmation ne doit pas encourager une seconde écriture.
    try {
      const page = await read();
      if (page.dossierVersion < result.dossierVersion) throw new ApiAccessError(503);
      return { page };
    } catch { return { page: null }; }
  }, ({ page }) => {
    clearDraft(); setReview(null); setData(page);
    setMessage(page ? "Numéro ARTAG corrigé. La valeur précédente reste dans l’historique."
      : "Numéro ARTAG corrigé. Rechargez pour actualiser l’affichage ; aucun nouvel enregistrement n’est nécessaire.");
  }, true);

  const identified = data && hasUsableArtagReference(data.artagReference);
  const canSave = identified && editing && hasUsableArtagReference(reference) && validReferenceReason(reason)
    && reference !== data.artagReference && data.dossierVersion < 2147483647;

  return <section className="secure-notes secure-case-reference" aria-label="Numéro ARTAG et historique" aria-busy={busy}>
    <p>La correction porte sur le numéro ARTAG de ce dossier. Vérifiez sa correspondance avec le dossier de référence avant d’enregistrer.</p>
    <button type="button" disabled={busy} onClick={reload}>{data ? "Recharger la référence" : "Charger la référence et l’historique"}</button>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {review && data && <aside className="secure-notes__review" aria-label="Relecture nécessaire">
      <p>Comparez la référence rechargée avec votre saisie et vérifiez le dossier concerné avant de continuer.</p>
      <button type="button" disabled={busy || !review.checked} onClick={() => { setReview(null); setError(""); setMessage("Relecture prise en compte."); }}>
        Continuer après relecture
      </button>
    </aside>}
    {data && <>
      <section aria-label="Référence actuelle">
        <h2>{identified ? `Numéro ARTAG : ${data.artagReference}` : "Numéro ARTAG non renseigné"}</h2>
        {!identified && <p>Ce dossier doit être identifié dans le processus autorisé avant toute attribution. Cet écran permet uniquement de corriger un numéro déjà renseigné.</p>}
        {identified && <>
          <p><Link to={`/dossiers/${caseId}/notes-partagees`}>Ouvrir les notes partagées</Link></p>
          {!editing && <button type="button" disabled={busy || !!review || data.dossierVersion === 2147483647}
            onClick={() => { setEditing(true); setReference(data.artagReference); setReason(""); setMessage(""); }}>Corriger le numéro ARTAG</button>}
        </>}
      </section>
      {identified && editing && <form onSubmit={event => { event.preventDefault(); if (!busy && !review && canSave) void save(); }}>
        <h2>Corriger le numéro ARTAG</h2>
        <label>Nouveau numéro ARTAG
          <input value={reference} maxLength={160} required disabled={busy} aria-describedby="reference-format"
            onChange={event => setReference(event.target.value)} />
        </label>
        <p id="reference-format">80 caractères au maximum, sans espace en début ou en fin. Le numéro est conservé exactement tel que vous le saisissez.</p>
        <label>Motif de correction
          <input value={reason} maxLength={200} required disabled={busy} onChange={event => setReason(event.target.value)} />
        </label>
        <p>L’ancienne valeur, le motif, l’auteur et la date sont conservés dans l’historique.</p>
        <div className="secure-notes__actions">
          <button type="submit" disabled={busy || !!review || !canSave}>Enregistrer la correction</button>
          <button type="button" disabled={busy} onClick={clearDraft}>Abandonner la saisie</button>
        </div>
      </form>}
      <section aria-label="Historique du numéro ARTAG">
        <h2>Historique des versions</h2>
        {!data.history.length && <p>Aucune modification historisée du numéro ARTAG. Son attribution antérieure n’est pas reconstituée.</p>}
        <ol>{data.history.map(revision => <li key={revision.dossierVersion}>
          <h3>Version du dossier {revision.dossierVersion}</h3>
          <p>{dateLabel(revision.createdAt)}</p>
          <p>Ancien numéro : <strong>{revision.previousReference ?? "Non renseigné"}</strong></p>
          <p>Nouveau numéro : <strong>{revision.artagReference}</strong></p>
          <p>{revision.reason}</p>
          <details><summary>Traçabilité de cette version</summary><p>Référence du compte auteur : {revision.actorId}</p></details>
        </li>)}</ol>
        {data.nextBeforeVersion !== null && <button type="button" disabled={busy || editing || !!review} onClick={more}>Voir les versions précédentes</button>}
      </section>
    </>}
  </section>;
}
