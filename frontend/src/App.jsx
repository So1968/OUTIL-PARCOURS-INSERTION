import { Navigate, Route, Routes } from "react-router-dom";
import { PrototypeProfileBanner } from "./auth/PrototypeProfileBanner";
import { RequireRole } from "./auth/RequireRole";
import { RoleProvider } from "./auth/RoleContext";
import { ROLE_APPUI_TNS, ROLE_PROFESSIONNELLE } from "./auth/roles";
import { HomePage } from "./pages/HomePage";
import { SasInsertisPage } from "./pages/SasInsertisPage";
import { TnsAnalysePage } from "./pages/TnsAnalysePage";
import { TnsFicheMinutePage } from "./pages/TnsFicheMinutePage";
import { TnsPage } from "./pages/TnsPage";

const ACCOMPAGNEMENT_ROLES = [ROLE_PROFESSIONNELLE, ROLE_APPUI_TNS];

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/sas-insertis"
          element={
            <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>
              <SasInsertisPage />
            </RequireRole>
          }
        />
        <Route
          path="/accompagnement-global"
          element={
            <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>
              <TnsPage />
            </RequireRole>
          }
        />
        <Route
          path="/accompagnement-global/fiche-minute"
          element={
            <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>
              <TnsFicheMinutePage />
            </RequireRole>
          }
        />
        <Route
          path="/accompagnement-global/lecture-globale"
          element={
            <RequireRole allowedRoles={ACCOMPAGNEMENT_ROLES}>
              <TnsAnalysePage />
            </RequireRole>
          }
        />

        {/* Anciennes routes conservées mais sorties de la façade principale. */}
        <Route path="/appui-tns" element={<Navigate to="/accompagnement-global" replace />} />
        <Route path="/appui-tns/fiche-minute" element={<Navigate to="/accompagnement-global/fiche-minute" replace />} />
        <Route path="/appui-tns/analyse" element={<Navigate to="/accompagnement-global/lecture-globale" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}
