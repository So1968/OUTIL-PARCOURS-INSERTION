import { Link } from "react-router-dom";
import { SecureCaseDirectory } from "../components/SecureCaseDirectory";
import "../components/secureSharedNotes.css";

export function SecureCaseDirectoryPage() {
  return <main className="secure-notes-page">
    <header><img src="/logo-artag.png" alt="ARTAG" />
      <div><h1>File active</h1><Link to="/bureau-quotidien">Retour au bureau professionnel</Link></div>
    </header>
    <SecureCaseDirectory />
  </main>;
}
