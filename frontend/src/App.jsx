import { Navigate, Route, Routes } from "react-router-dom";
import { PrototypeProfileBanner } from "./auth/PrototypeProfileBanner";
import { RequireRole } from "./auth/RequireRole";
import { RoleProvider } from "./auth/RoleContext";
import { ROLE_APPUI_TNS, ROLE_PROFESSIONNELLE } from "./auth/roles";
import { DossierPersonnePage } from "./pages/DossierPersonnePage";
import { EcheancesVigilancesPage } from "./pages/EcheancesVigilancesPage";
import { EvaluationPersonnePage } from "./pages/EvaluationPersonnePage";
import { PilotageActionsPage } from "./pages/PilotageActionsPage";
import { SasInsertisPage } from "./pages/SasInsertisPage";

const ACCOMPAGNEMENT_ROLES = [ROLE_PROFESSIONNELLE, ROLE_APPUI_TNS];

function PilotageProtege() {
  return (
    <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>
      <PilotageActionsPage />
    </RequireRole>
  );
}

function PageProtegee({ children }) {
  return <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>{children}</RequireRole>;
}

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />
      <Routes>
        <Route path="/" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/pilotage-actions" element={<PilotageProtege />} />
        <Route path="/pilotage-actions/dossier/:dossierId" element={<PageProtegee><DossierPersonnePage /></PageProtegee>} />
        <Route path="/evaluation-personne" element={<PageProtegee><EvaluationPersonnePage /></PageProtegee>} />
        <Route path="/evaluation-personne/:dossierId" element={<PageProtegee><EvaluationPersonnePage /></PageProtegee>} />
        <Route path="/sas-insertis" element={<PageProtegee><SasInsertisPage /></PageProtegee>} />
        <Route path="/accompagnement-global/echeances-vigilances" element={<PageProtegee><EcheancesVigilancesPage /></PageProtegee>} />

        <Route path="/accompagnement-global" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/accompagnement-global/fiche-minute" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/accompagnement-global/lecture-globale" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/appui-tns" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/appui-tns/fiche-minute" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="/appui-tns/analyse" element={<Navigate to="/pilotage-actions" replace />} />
        <Route path="*" element={<Navigate to="/pilotage-actions" replace />} />
      </Routes>
    </RoleProvider>
  );
}
