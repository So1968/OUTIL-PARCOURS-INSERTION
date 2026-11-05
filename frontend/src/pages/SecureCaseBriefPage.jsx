import { Link, useParams } from "react-router-dom";
import { SecureCaseBriefPanel } from "../components/SecureCaseBriefPanel";
import { BRIEF_TYPES } from "../lib/secureCaseBriefData";

export function SecureCaseBriefPage({ type }) {
  const { caseId } = useParams();
  if (!BRIEF_TYPES[type] || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId ?? "")) {
    return <main className="secure-notes-page"><h1>Dossier indisponible</h1>
      <Link to="/dossiers">Retour à la file active</Link></main>;
  }
  return <main className="secure-notes-page"><header><img src="/logo-artag.png" alt="ARTAG" />
    <div><h1>{BRIEF_TYPES[type].title}</h1><Link to="/dossiers">Retour à la file active</Link></div></header>
    <SecureCaseBriefPanel key={caseId + ":" + type} caseId={caseId} type={type} />
  </main>;
}
