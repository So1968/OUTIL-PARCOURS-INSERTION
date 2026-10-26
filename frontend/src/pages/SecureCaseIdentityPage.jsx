import { Link, useParams } from "react-router-dom";
import { SecureCaseIdentityPanel } from "../components/SecureCaseIdentityPanel";
export function SecureCaseIdentityPage() {
  const { caseId } = useParams();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId ?? "")) {
    return <main className="secure-notes-page"><h1>Dossier indisponible</h1><Link to="/dossiers">Retour à la file active</Link></main>;
  }
  return <main className="secure-notes-page"><header><img src="/logo-artag.png" alt="ARTAG" />
    <div><h1>Identité</h1><Link to="/dossiers">Retour à la file active</Link></div></header>
    <SecureCaseIdentityPanel key={caseId} caseId={caseId} /></main>;
}
