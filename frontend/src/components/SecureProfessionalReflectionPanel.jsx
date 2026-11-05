import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ApiAccessError, lireReflexionProfessionnelleSecurisee, modifierReflexionProfessionnelleSecurisee,
} from "../lib/secureApi";
import {
  RELATION_AIDE_FIELDS, checkedReflectionContent, checkedReflectionPage, sameReflectionContent,
} from "../lib/secureProfessionalReflectionData";
import "./secureSharedNotes.css";
import "./secureCaseBrief.css";
import "./secureProfessionalReflection.css";

const reasonValid = reason => typeof reason === "string" && reason.isWellFormed()
  && reason.trim().length > 0 && reason.length <= 200
  && !Array.from(reason).some(char => char.codePointAt(0) < 32 || char.codePointAt(0) === 127);

function ReflectionContent({ content }) {
  return <dl className="secure-case-brief__fields">{RELATION_AIDE_FIELDS.map(([field, label]) =>
    <div key={field}><dt>{label}</dt><dd className="secure-notes__text">
      {content[field] || "Non renseigné"}
    </dd></div>)}</dl>;
}

export function SecureProfessionalReflectionPanel({ caseId }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const alive = useRef(false), locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const resetDraft = () => { setEditing(false); setDraft({}); setReason(""); };
  const read = async beforeVersion => checkedReflectionPage(
    await lireReflexionProfessionnelleSecurisee({ caseId, beforeVersion }), caseId, beforeVersion,
  );
  const failed = (problem, mutation) => {
    if ([401, 403, 404].includes(problem.status)) {
      resetDraft(); setData(null); setReview(null);
      setError("Accès professionnel indisponible. Reconnectez-vous avant de poursuivre.");
    } else if (problem.code === "HISTORIQUE_REFLEXION_INDISPONIBLE") {
      setData(null); setReview({ checked: false });
      setError("L’historique réservé doit être vérifié avant toute modification.");
    } else if (problem.status === 422) {
      setError("Vérifiez les six rubriques, leur longueur et le motif de la correction.");
    } else {
      setReview({ checked: false });
      setError(problem.status === 409
        ? "Le dossier a changé. Rechargez et relisez avant de reprendre votre saisie."
        : mutation
          ? "Enregistrement non confirmé. Rechargez pour vérifier, sans envoyer deux fois."
          : "Lecture indisponible. Vérifiez la connexion avant de reprendre.");
    }
  };
  const run = async (request, apply, mutation = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage(""); setError("");
    try { const response = await request(); if (alive.current) apply(response); }
    catch (problem) { if (alive.current) failed(problem, mutation); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const reload = () => run(() => read(), page => {
    setData(page);
    if (editing || review) setReview({ checked: true });
    setMessage(editing || review
      ? "Réflexion rechargée. Comparez votre brouillon avec l'état actuel."
      : "Réflexion réservée et historique chargés.");
  });
  const more = () => run(async () => {
    const page = await read(data.nextBeforeVersion);
    if (page.dossierVersion !== data.dossierVersion || page.reflectionVersion !== data.reflectionVersion
      || page.history.some(row => data.history.some(previous => previous.dossierVersion === row.dossierVersion))
      || !page.history.length
      || !sameReflectionContent(data.history.at(-1).previousContent, page.history[0].content)
      || data.history[0]?.actorId !== page.history[0]?.actorId) throw new ApiAccessError(409);
    return page;
  }, page => setData(previous => ({ ...page, history: [...previous.history, ...page.history] })));
  const next = checkedReflectionContent(draft);
  const total = RELATION_AIDE_FIELDS.reduce((sum, [field]) => sum + Array.from(draft[field] || "").length, 0);
  const canSave = data && editing && next !== null
    && !sameReflectionContent(data.content, next)
    && reasonValid(reason) && data.dossierVersion < 2147483647;
  const save = () => run(async () => {
    const result = await modifierReflexionProfessionnelleSecurisee({
      caseId, expectedVersion: data.dossierVersion, content: next, reason,
    });
    if (!result || result.caseId !== caseId
      || result.dossierVersion !== data.dossierVersion + 1) throw new ApiAccessError(503);
    if (!alive.current) return null;
    try {
      const page = await read();
      if (page.dossierVersion < result.dossierVersion) throw new ApiAccessError(503);
      return page;
    } catch { return null; }
  }, page => {
    resetDraft(); setReview(null); setData(page);
    setMessage(page
      ? "Réflexion réservée enregistrée. Les versions antérieures restent accessibles à l’autrice."
      : "Modification enregistrée. Rechargez pour vérifier, sans la renvoyer.");
  }, true);

  return <section className="secure-notes secure-professional-reflection"
    aria-label="Bloc professionnel — relation d’aide" aria-busy={busy}>
    <p><strong>Espace réservé à la professionnelle.</strong> Ce contenu n’appartient ni à la synthèse courte ni à la note de continuité. Il n’est pas transmis au dossier partagé ou à Insertis.</p>
    <p>Décrire les éléments utiles à votre posture professionnelle, en distinguant observations et hypothèses, sans diagnostic ni jugement de la personne accompagnée.</p>
    <button type="button" disabled={busy} onClick={reload}>
      {data ? "Recharger ma réflexion" : "Charger ma réflexion réservée"}
    </button>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {review && data && <aside className="secure-notes__review" aria-label="Relecture obligatoire">
      <p>Relisez l’état actuel et votre brouillon. Aucun renvoi automatique de la modification incertaine.</p>
      <button type="button" disabled={busy || !review.checked} onClick={() => {
        setReview(null); setError(""); setMessage("Relecture prise en compte.");
      }}>Continuer après relecture</button>
    </aside>}
    {data && <>
      <section aria-label="État actuel réservé"><h2>Ma réflexion actuelle</h2>
        <ReflectionContent content={data.content} />
        <p><Link to={"/dossiers/" + caseId + "/identite"}>Retour à l’identité du dossier</Link></p>
        {!editing && <button type="button" disabled={busy || !!review || data.dossierVersion >= 2147483647}
          onClick={() => { setDraft({ ...data.content }); setEditing(true); setReason(""); setMessage(""); }}>
          Compléter ou corriger ma réflexion
        </button>}
      </section>
      {editing && <form autoComplete="off" onSubmit={event => {
        event.preventDefault(); if (!busy && !review && canSave) void save();
      }}>
        <h2>Compléter ou corriger</h2>
        {RELATION_AIDE_FIELDS.map(([field, label]) => <label key={field}>{label}
          <textarea value={draft[field] ?? ""} maxLength={1200} disabled={busy}
            placeholder="Observations professionnelles pertinentes, sans jugement."
            onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} />
        </label>)}
        <p role="status">Longueur totale : {total} / 6 000 caractères</p>
        <label>Motif de modification
          <input maxLength={200} required disabled={busy} value={reason}
            onChange={event => setReason(event.target.value)} />
        </label>
        <div className="secure-notes__actions">
          <button type="submit" disabled={busy || !!review || !canSave}>Enregistrer ma réflexion</button>
          <button type="button" disabled={busy} onClick={resetDraft}>Abandonner la saisie</button>
        </div>
      </form>}
      <section aria-label="Historique personnel réservé"><h2>Historique de mes corrections</h2>
        {!data.history.length && <p>Aucune correction antérieure.</p>}
        <ol>{data.history.map(version => <li key={version.dossierVersion}>
          <h3>Version du dossier {version.dossierVersion}</h3>
          <p>{new Date(version.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
          <p>Motif : {version.reason}</p>
          <details><summary>Voir cette correction avant et après</summary>
            <h4>Après correction</h4><ReflectionContent content={version.content} />
            <h4>Avant correction</h4><ReflectionContent content={version.previousContent} />
            <p>Référence du compte auteur : {version.actorId}</p>
          </details>
        </li>)}</ol>
        {data.nextBeforeVersion !== null && <button type="button" disabled={busy || editing || !!review}
          onClick={more}>Voir les corrections précédentes</button>}
      </section>
    </>}
  </section>;
}
