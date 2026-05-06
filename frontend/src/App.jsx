import { Navigate, Route, Routes } from "react-router-dom";
import { PrototypeProfileBanner } from "./auth/PrototypeProfileBanner";
import { RequireRole } from "./auth/RequireRole";
import { RoleProvider } from "./auth/RoleContext";
import { ROLE_APPUI_TNS, ROLE_DIRECTION, ROLE_PROFESSIONNELLE } from "./auth/roles";
import { DirectionPage } from "./pages/DirectionPage";
import { DossierPage } from "./pages/DossierPage";
import { HomePage } from "./pages/HomePage";
import { ParcoursPage } from "./pages/ParcoursPage";
import { SocleAutonomiePage } from "./pages/SocleAutonomiePage";
import { TnsPage } from "./pages/TnsPage";

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/parcours-social-socio-professionnel"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE]}>
              <ParcoursPage />
            </RequireRole>
          }
        />

        <Route
          path="/parcours-social-socio-professionnel/dossier"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE]}>
              <DossierPage />
            </RequireRole>
          }
        />

        <Route
          path="/parcours-social-socio-professionnel/socle"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE]}>
              <SocleAutonomiePage />
            </RequireRole>
          }
        />

        <Route
          path="/appui-tns"
          element={
            <RequireRole allowedRoles={[ROLE_APPUI_TNS]}>
              <TnsPage />
            </RequireRole>
          }
        />

        <Route
          path="/direction"
          element={
            <RequireRole allowedRoles={[ROLE_DIRECTION]}>
              <DirectionPage />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}
