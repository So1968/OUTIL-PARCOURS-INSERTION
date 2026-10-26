import { useEffect, useRef, useState } from "react";
import {
  ApiAccessError, lireNotesPartageesSecurisees, lireHistoriqueNotePartageeSecurise,
  creerNotePartageeSecurisee, corrigerNotePartageeSecurisee, validerNotePartageeSecurisee,
} from "../lib/secureApi";
import "./secureSharedNotes.css";
import { hasUsableArtagReference } from "../lib/secureCaseDirectoryApi";

const dateLabel = value => new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
const validVersion = value => Number.isInteger(value) && value >= 0 && value <= 2147483647;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkedList(data) {
  if (!data || !validVersion(data.dossierVersion) || !Array.isArray(data.notes)
    || data.notes.length > 25 || new Set(data.notes.map(note => note?.id)).size !== data.notes.length
    || !data.notes.every(note => note && typeof note.id === "string" && UUID.test(note.id)
      && typeof note.text === "string" && note.text.length <= 4000 && typeof note.validated === "boolean"
      && validVersion(note.version) && note.version > 0 && Number.isFinite(Date.parse(note.updatedAt)))
    || (data.nextOffset !== null && (!Number.isSafeInteger(data.nextOffset) || data.nextOffset < 1))) {
    throw new ApiAccessError(503);
  }
  return data;
}

function checkedHistory(data, noteId, beforeVersion) {
  if (!data || data.noteId !== noteId || !validVersion(data.dossierVersion)
    || !validVersion(data.noteVersion) || data.noteVersion < 1 || typeof data.validated !== "boolean"
    || !Array.isArray(data.history) || data.history.length > 50
    || !data.history.every((revision, i) => revision && validVersion(revision.version) && revision.version > 0
      && typeof revision.text === "string" && revision.text.length <= 4000
      && typeof revision.reason === "string" && revision.reason.length <= 200
      && typeof revision.actorId === "string" && UUID.test(revision.actorId)
      && typeof revision.validated === "boolean" && Number.isFinite(Date.parse(revision.createdAt))
      && (i === 0 || revision.version < data.history[i - 1].version)
      && (beforeVersion === undefined || revision.version < beforeVersion))
    || (beforeVersion === undefined && data.history[0]?.version !== data.noteVersion)
    || (beforeVersion === undefined && data.history[0]?.validated !== data.validated)
    || (data.nextBeforeVersion !== null && (!data.history.length
      || data.nextBeforeVersion !== data.history.at(-1).version))) {
    throw new ApiAccessError(503);
  }
  return data;
}

/** Monté uniquement par la route de recette ; aucune lecture/écriture locale. */
export function SecureSharedNotesPanel({ caseId }) {
  const [catalog, setCatalog] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [review, setReview] = useState(null);
  const alive = useRef(false);
  const locked = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const list = async (offset = 0) => {
    const data = checkedList(await lireNotesPartageesSecurisees({ caseId, offset }));
    if (data.nextOffset !== null && (data.nextOffset !== offset + 25 || data.notes.length !== 25)) {
      throw new ApiAccessError(503);
    }
    return data;
  };
  const history = async (noteId, beforeVersion) => checkedHistory(
    await lireHistoriqueNotePartageeSecurise({ caseId, noteId, beforeVersion }), noteId, beforeVersion,
  );

  const failure = (error, mutation) => {
    if ([401, 403, 404].includes(error.status)) {
      // Une session expirée ou une habilitation retirée efface aussi la saisie.
      setCatalog(null); setDetail(null); setText(""); setReason(""); setEditing(false); setReview(null);
      setErrorMessage("Session ou accès au dossier indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (error.code === "HISTORIQUE_NOTE_INDISPONIBLE") {
      if (mutation) setReview({ checked: false });
      setErrorMessage("L’historique de la note demandée doit être repris avant sa modification.");
    } else if (error.status === 409) {
      setReview({ checked: false });
      setErrorMessage("Le dossier a été modifié ailleurs. Votre saisie est conservée ici. Rechargez puis comparez avant de poursuivre.");
    } else if (error.status === 422) {
      setErrorMessage("Vérifiez le texte de la note et le motif de correction.");
    } else {
      if (mutation) setReview({ checked: false });
      setErrorMessage(mutation
        ? "Enregistrement non confirmé. Rechargez les notes pour vérifier avant toute nouvelle tentative. Votre saisie est conservée ici."
        : "Chargement indisponible. Réessayez lorsque la connexion sera rétablie.");
    }
  };

  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setErrorMessage(""); setMessage("");
    try {
      const result = await request();
      if (alive.current) apply(result);
    } catch (error) {
      if (alive.current) failure(error, mutation);
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const reload = () => run(async () => {
    const data = await list();
    const selected = detail ? await history(detail.noteId) : null;
    if (selected && selected.dossierVersion !== data.dossierVersion) throw new ApiAccessError(409);
    return { data, selected };
  }, ({ data, selected }) => {
    setCatalog(data); setDetail(selected);
    if (review || dirty) setReview({ checked: true });
    setMessage(review || dirty ? "Version actuelle rechargée. Relisez-la avant de reprendre votre saisie." : "Notes chargées.");
  });

  const open = noteId => run(() => history(noteId), data => {
    setDetail(data); setEditing(false); setText(""); setReason(""); setReview(null);
  });

  const save = (operation, expectedNoteId) => run(async () => {
    const result = await operation();
    if (!result || !UUID.test(result.noteId ?? "") || !validVersion(result.dossierVersion)
      || typeof result.validated !== "boolean" || (expectedNoteId && result.noteId !== expectedNoteId)) {
      throw new ApiAccessError(503);
    }
    // Une panne de lecture après un succès confirmé n'est pas une panne d'écriture.
    const refreshed = await Promise.allSettled([list(), history(result.noteId)]);
    return { refreshed };
  }, ({ refreshed }) => {
    setText(""); setReason(""); setEditing(false); setReview(null);
    if (refreshed.every(result => result.status === "fulfilled")
      && refreshed[0].value.dossierVersion === refreshed[1].value.dossierVersion) {
      setCatalog(refreshed[0].value); setDetail(refreshed[1].value);
      setMessage("Note enregistrée. La version précédente reste dans l’historique.");
    } else {
      setCatalog(null); setDetail(null);
      setMessage("Note enregistrée. Rechargez les notes pour actualiser leur affichage.");
    }
  }, true);

  const moreNotes = () => run(() => list(catalog.nextOffset), data => {
    if (data.dossierVersion !== catalog.dossierVersion) {
      failure(new ApiAccessError(409), false); return;
    }
    const ids = new Set(catalog.notes.map(note => note.id));
    if (data.notes.some(note => ids.has(note.id)) || (data.nextOffset !== null && data.nextOffset <= catalog.nextOffset)) {
      failure(new ApiAccessError(503), false); return;
    }
    setCatalog({ ...data, notes: [...catalog.notes, ...data.notes] });
  });

  const moreHistory = () => run(() => history(detail.noteId, detail.nextBeforeVersion), data => {
    if (data.noteVersion !== detail.noteVersion) {
      failure(new ApiAccessError(409), false); return;
    }
    setDetail({ ...detail, history: [...detail.history, ...data.history], nextBeforeVersion: data.nextBeforeVersion });
  });

  const writing = !detail || editing;
  const dirty = editing || (!detail && (text.trim() || reason.trim()));
  const currentText = detail?.history[0]?.text ?? "";
  const canSave = catalog && writing && text.trim() && text.length <= 4000
    && (!editing || (reason.trim() && reason.length <= 200 && text.trim() !== currentText));

  return (
    <section className="secure-notes" aria-label="Notes partagées du dossier" aria-busy={busy}>
      {catalog && hasUsableArtagReference(catalog.artagReference) && <h2>Numéro ARTAG : {catalog.artagReference}</h2>}
      <p>Seuls les éléments utiles au dossier partagé ont leur place ici. Les notes professionnelles réservées restent séparées.</p>
      <button type="button" disabled={busy} onClick={reload}>
        {catalog ? "Recharger les notes" : "Charger les notes partagées"}
      </button>
      {message && <p role="status">{message}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {review && <aside className="secure-notes__review" aria-label="Relecture nécessaire">
        <p>Relisez les notes rechargées et comparez-les avec votre saisie avant de continuer.</p>
        <button type="button" disabled={busy || !review.checked} onClick={() => { setReview(null); setErrorMessage(""); }}>
          Continuer après relecture
        </button>
      </aside>}
      {catalog && <div className="secure-notes__layout">
        <nav aria-label="Notes du dossier">
          <h2>Notes partagées</h2>
          <button type="button" disabled={busy || !!dirty || !!review} onClick={() => {
            setDetail(null); setEditing(false); setText(""); setReason(""); setMessage("");
          }}>Nouvelle note</button>
          {catalog.notes.length === 0 && <p>Aucune note partagée enregistrée.</p>}
          <ul>
            {catalog.notes.map(note => <li key={note.id}>
              <button type="button" disabled={busy || !!dirty || !!review}
                aria-current={detail?.noteId === note.id ? "true" : undefined} onClick={() => open(note.id)}>
                <strong>{note.validated ? "Validée" : "Brouillon"} — {dateLabel(note.updatedAt)}</strong>
                <span>{note.text.slice(0, 120)}{note.text.length > 120 ? "…" : ""}</span>
              </button>
              {review?.checked && !detail && <details>
                <summary>Lire la note enregistrée</summary><p className="secure-notes__text">{note.text}</p>
                {text.trim() === note.text.trim() && <button type="button" disabled={busy} onClick={() => open(note.id)}>
                  Ouvrir cette note et abandonner la saisie
                </button>}
              </details>}
            </li>)}
          </ul>
          {catalog.nextOffset !== null && <button type="button" disabled={busy || !!review} onClick={moreNotes}>Voir d’autres notes</button>}
        </nav>
        <div>
          {detail && <section aria-label="Version actuelle">
            <h2>Version actuelle — {detail.validated ? "Validée" : "Brouillon"}</h2>
            <p className="secure-notes__text">{currentText}</p>
            {!editing && <div className="secure-notes__actions">
              <button type="button" disabled={busy || !!review} onClick={() => { setEditing(true); setText(currentText); setReason(""); }}>
                Corriger cette note
              </button>
              {!detail.validated && <button type="button" disabled={busy || !!review} onClick={() => save(() =>
                validerNotePartageeSecurisee({ caseId, noteId: detail.noteId, expectedVersion: detail.dossierVersion }), detail.noteId)}>
                Valider après relecture
              </button>}
            </div>}
          </section>}
          {writing && <form onSubmit={event => {
            event.preventDefault();
            if (!canSave || busy || review) return;
            void save(() => editing
              ? corrigerNotePartageeSecurisee({ caseId, noteId: detail.noteId, text, reason, expectedVersion: detail.dossierVersion })
              : creerNotePartageeSecurisee({ caseId, text, expectedVersion: catalog.dossierVersion }), detail?.noteId);
          }}>
            <h2>{editing ? "Corriger la note partagée" : "Nouvelle note partagée"}</h2>
            <label>Texte de la note
              <textarea value={text} maxLength={4000} required disabled={busy}
                onChange={event => setText(event.target.value)} />
            </label>
            {editing && <label>Motif de correction
              <input value={reason} maxLength={200} required disabled={busy}
                onChange={event => setReason(event.target.value)} />
            </label>}
            <p>Toute correction demande une nouvelle relecture. La validation est une action distincte.</p>
            <div className="secure-notes__actions">
              <button type="submit" disabled={busy || !!review || !canSave}>
                {editing ? "Enregistrer la correction" : "Enregistrer le brouillon"}
              </button>
              <button type="button" disabled={busy} onClick={() => { setEditing(false); setText(""); setReason(""); }}>
                Abandonner la saisie
              </button>
            </div>
          </form>}
          {detail && <section aria-label="Historique de la note">
            <h2>Historique des versions</h2>
            <ol>{detail.history.map(revision => <li key={revision.version}>
              <h3>Version {revision.version} — {revision.validated ? "Validée" : "Brouillon"}</h3>
              <p>{dateLabel(revision.createdAt)}</p>
              <details><summary>Traçabilité de cette version</summary>
                <p>Référence du compte auteur : {revision.actorId}</p>
              </details>
              <p>{revision.reason === "CREATION_BROUILLON" ? "Création du brouillon"
                : revision.reason === "VALIDATION_APRES_RELECTURE" ? "Validation après relecture" : revision.reason}</p>
              <p className="secure-notes__text">{revision.text}</p>
            </li>)}</ol>
            {detail.nextBeforeVersion !== null && <button type="button" disabled={busy} onClick={moreHistory}>Voir les versions précédentes</button>}
          </section>}
        </div>
      </div>}
    </section>
  );
}
