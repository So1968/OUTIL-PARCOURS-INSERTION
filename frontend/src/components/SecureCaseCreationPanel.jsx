import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError, creerDossierSecurise } from "../lib/secureApi";
import { hasUsableArtagReference } from "../lib/secureCaseDirectoryApi";
import "./secureSharedNotes.css";
import "./secureCaseCreation.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Monté après une lecture autorisée de la file ; le serveur revérifie le rôle. */
export function SecureCaseCreationPanel({ onAccessLost }) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const reset = () => { setOpen(false); setReference(""); setAttempt(null); setResult(null); setError(""); };

  const submit = async () => {
    if (locked.current || (!attempt && !hasUsableArtagReference(reference))) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    let request;
    try {
      request = attempt ?? { requestId: crypto.randomUUID(), artagReference: reference };
      setAttempt(request);
      const saved = await creerDossierSecurise(request);
      if (!saved || saved.requestId !== request.requestId || typeof saved.created !== "boolean"
        || typeof saved.caseId !== "string" || !UUID.test(saved.caseId) || !hasUsableArtagReference(saved.artagReference)
        || !Number.isInteger(saved.dossierVersion) || saved.dossierVersion < 1 || saved.dossierVersion > 2147483647
        || (saved.created && (saved.artagReference !== request.artagReference || saved.dossierVersion !== 1))) throw new ApiAccessError(503);
      if (!alive.current) return;
      setResult(saved); setOpen(false); setAttempt(null); setReference("");
      setMessage(saved.created ? "Dossier créé. Rechargez la file active pour l’actualiser."
        : "Création retrouvée. Aucun nouveau dossier n’a été ajouté.");
    } catch (problem) {
      if (!alive.current) return;
      if ([401, 403, 404].includes(problem.status)) {
        reset();
        setError("Session ou droit de création indisponible. Rechargez la file active après reconnexion.");
        onAccessLost?.();
      } else if (problem.status === 422) {
        setAttempt(null); setError("Vérifiez le numéro ARTAG avant de préparer une nouvelle demande.");
      } else if (problem.status === 409) {
        setError("Ce numéro ou cette demande ne peut pas être utilisé. Rechargez la file active et vérifiez le dossier concerné.");
      } else {
        setError(request ? "Création non confirmée. Vérifiez cette création pour retrouver le résultat sans ajouter un second dossier."
          : "La demande n’a pas pu être préparée. Réessayez lorsque le service sera disponible.");
      }
    } finally { locked.current = false; if (alive.current) setBusy(false); }
  };

  return <section className="secure-notes secure-case-creation" aria-label="Création d’un dossier" aria-busy={busy}>
    <h2>Créer un dossier</h2>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {!open && !result && <button type="button" disabled={busy} onClick={() => { setOpen(true); setError(""); setMessage(""); }}>Préparer un dossier</button>}
    {open && <form onSubmit={event => { event.preventDefault(); if (!busy) void submit(); }}>
      <p>Utilisez le numéro ARTAG déjà attribué et vérifiez que ce dossier n’existe pas. Le dossier sera rattaché à votre compte de référente.</p>
      <label>Numéro ARTAG du nouveau dossier
        <input value={reference} required maxLength={160} disabled={busy || !!attempt} aria-describedby="creation-reference-format"
          onChange={event => setReference(event.target.value)} />
      </label>
      <p id="creation-reference-format">80 caractères au maximum, sans espace en début ou en fin. Aucun numéro n’est généré par l’outil.</p>
      {attempt && <p>La demande garde le même numéro pendant sa vérification. Rechargez la file avant de préparer une autre création.</p>}
      <div className="secure-notes__actions">
        <button type="submit" disabled={busy || (!attempt && !hasUsableArtagReference(reference))}>
          {attempt ? "Vérifier cette création" : "Créer le dossier"}
        </button>
        <button type="button" disabled={busy} onClick={() => { reset(); setMessage("Demande fermée. Rechargez la file active avant de préparer une autre création."); }}>Fermer cette demande</button>
      </div>
    </form>}
    {result && <section aria-label="Dossier créé ou retrouvé">
      <h3>Numéro ARTAG : {result.artagReference}</h3>
      <p>La référence actuelle du dossier est affichée. Son historique conserve les éventuelles corrections.</p>
      <p><Link to={`/dossiers/${result.caseId}/notes-partagees`}>Ouvrir les notes du dossier</Link></p>
      <p><Link to={`/dossiers/${result.caseId}/reference-artag`}>Voir le numéro et son historique</Link></p>
      <p><Link to={`/dossiers/${result.caseId}/identite`}>Compléter l’identité du dossier</Link></p>
      <button type="button" disabled={busy} onClick={() => { reset(); setOpen(true); setMessage(""); }}>Préparer un autre dossier</button>
    </section>}
  </section>;
}
