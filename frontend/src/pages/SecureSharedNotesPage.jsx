import { Link, useParams } from "react-router-dom";
import { SecureSharedNotesPanel } from "../components/SecureSharedNotesPanel";

export function SecureSharedNotesPage() {
  const { caseId } = useParams();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId ?? "")) {
    return <main className="secure-notes-page"><h1>Dossier indisponible</h1>
      <Link to="/bureau-quotidien">Retour au bureau professionnel</Link></main>;
  }
  return <main className="secure-notes-page">
    <header>
      <img src="/logo-artag.png" alt="ARTAG" />
      <div><h1>Notes partagées</h1><Link to="/dossiers">Retour à la file active</Link></div>
    </header>
    <SecureSharedNotesPanel key={caseId} caseId={caseId} />
  </main>;
}
