import { Link, Navigate, Route, Routes } from "react-router-dom";
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

function MenuPrincipal() {
  const styleNav = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "12px 22px",
    background: "#101418",
    borderBottom: "1px solid #2f3a46",
  };
  const styleLien = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid #5f745f",
    background: "#1f2a1f",
    color: "#f5f1e8",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: "14px",
  };

  return (
    <nav style={styleNav} aria-label="Navigation principale de l’outil">
      <Link style={styleLien} to="/pilotage-actions">File active dynamique</Link>
      <Link style={styleLien} to="/evaluation-personne">Évaluation avec la personne</Link>
    </nav>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />
      <MenuPrincipal />
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
