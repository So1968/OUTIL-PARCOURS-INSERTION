import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiAccessError } from "../lib/secureApi";
import { loadWritableCases, hasUsableArtagReference } from "../lib/secureCaseDirectoryApi";
import "./secureCaseDirectory.css";
import { SecureCaseCreationPanel } from "./SecureCaseCreationPanel";

export function SecureCaseDirectory() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(false);
  const locked = useRef(false);
  const accessEpoch = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const clearAccess = () => {
    accessEpoch.current++; setData(null);
    setError("Session ou accès à la file active indisponible. Reconnectez-vous avant de poursuivre.");
  };

  const load = async (more = false) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    const epoch = accessEpoch.current;
    try {
      const page = await loadWritableCases(more ? data.nextCursor : undefined);
      if (!alive.current || epoch !== accessEpoch.current) return;
      if (more && page.cases.some(row => data.cases.some(known => known.id === row.id))) throw new ApiAccessError(409);
      setData(more ? { ...page, cases: [...data.cases, ...page.cases] } : page);
    } catch (failure) {
      if (!alive.current || epoch !== accessEpoch.current) return;
      if ([401, 403, 404].includes(failure.status)) {
        clearAccess();
      } else if (failure.status === 409) {
        setError("La file active a changé. Rechargez-la avant de poursuivre.");
      } else {
        setError("Chargement indisponible. Réessayez lorsque la connexion sera rétablie.");
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };

  return <section className="secure-case-directory" aria-label="Dossiers accessibles en rédaction" aria-busy={busy}>
    <p>Retrouvez les dossiers sur lesquels vous êtes habilitée à rédiger. Les accès sont vérifiés par le serveur.</p>
    <button type="button" disabled={busy} onClick={() => load()}>
      {data ? "Recharger ma file active" : "Charger ma file active"}
    </button>
    {error && <p role="alert">{error}</p>}
    {data && <>
      {data.cases.length === 0 && <p role="status">Aucun dossier accessible en rédaction pour le moment.</p>}
      <ul>{data.cases.map(row => <li key={row.id}>
        <h2>{hasUsableArtagReference(row.artagReference) ? `Numéro ARTAG : ${row.artagReference}` : "Numéro ARTAG non renseigné"}</h2>
        <p>Ouvert le {new Date(row.createdAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
        <p>Dernière mise à jour : {new Date(row.updatedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
        {hasUsableArtagReference(row.artagReference)
          ? <Link to={`/dossiers/${row.id}/notes-partagees`}>Ouvrir les notes partagées</Link>
          : <p>L’identification du dossier doit être complétée avant son ouverture depuis cette liste.</p>}
        {hasUsableArtagReference(row.artagReference) && row.canManageReference && <p>
          <Link to={`/dossiers/${row.id}/reference-artag`}>Numéro ARTAG et historique</Link>
        </p>}
      </li>)}</ul>
      {data.nextCursor !== null && <button type="button" disabled={busy} onClick={() => load(true)}>Voir d’autres dossiers</button>}
      <SecureCaseCreationPanel onAccessLost={clearAccess} />
    </>}
  </section>;
}
