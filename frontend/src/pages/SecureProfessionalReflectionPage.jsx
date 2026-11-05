import { Link, useParams } from "react-router-dom";
import { SecureProfessionalReflectionPanel } from "../components/SecureProfessionalReflectionPanel";

export function SecureProfessionalReflectionPage() {
  const { caseId } = useParams();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId ?? "")) {
    return <main className="secure-notes-page"><h1>Dossier indisponible</h1>
      <Link to="/dossiers">Retour à la file active</Link></main>;
  }
  return <main className="secure-notes-page">
    <header><img src="/logo-artag.png" alt="ARTAG" />
      <div><h1>Bloc professionnel — relation d’aide</h1>
        <Link to="/dossiers">Retour à la file active</Link></div></header>
    <SecureProfessionalReflectionPanel key={caseId} caseId={caseId} />
  </main>;
}
