import { SecureTasksPanel } from "../components/SecureTasksPanel";
import { SecureWorkEventsPanel } from "../components/SecureWorkEventsPanel";
import { secureTaskApiEnabled } from "../lib/secureTasksApi";
import { BureauQuotidienPage } from "./BureauQuotidienPage";

/**
 * Aucune cohabitation des sources : le composant local n'est même pas monté
 * quand une instance privée HTTPS utilise les tâches serveur.
 */
export function BureauTravailRoute() {
  if (secureTaskApiEnabled()) {
    return (
      <main className="page-shell" style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
        <h1>Mon bureau professionnel protégé</h1>
        <p>Les tâches et événements de démonstration ne sont ni affichés ni importés automatiquement.</p>
        <SecureWorkEventsPanel />
        <SecureTasksPanel />
      </main>
    );
  }
  return <BureauQuotidienPage />;
}
