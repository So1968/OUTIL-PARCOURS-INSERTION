import { Link, useParams } from "react-router-dom";
import { SecureCaseFollowUpPanel } from "../components/SecureCaseFollowUpPanel";
import { SecureCaseInterviewsPanel } from "../components/SecureCaseInterviewsPanel";

export function SecureCaseFollowUpPage() {
  const { caseId } = useParams();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId || "")) {
    return <main className="secure-notes-page"><h1>Dossier indisponible</h1>
      <Link to="/dossiers">Retour à la file active</Link></main>;
  }
  return <main className="secure-notes-page">
    <header><img src="/logo-artag.png" alt="ARTAG" />
      <div><h1>Suites à donner — dossier</h1>
        <Link to="/dossiers">Retour à ma file active</Link></div></header>
    <SecureCaseInterviewsPanel key={caseId + ":entretiens"} caseId={caseId} />
    <SecureCaseFollowUpPanel key={caseId} caseId={caseId} />
  </main>;
}
