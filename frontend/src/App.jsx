import { Navigate, Route, Routes } from "react-router-dom";
import { PrototypeProfileBanner } from "./auth/PrototypeProfileBanner";
import { RequireRole } from "./auth/RequireRole";
import { RoleProvider } from "./auth/RoleContext";
import {
  ROLE_APPUI_TNS,
  ROLE_DIRECTION,
  ROLE_GOUVERNANCE_CA,
  ROLE_PROFESSIONNELLE,
} from "./auth/roles";
import { ContinuiteServicePage } from "./pages/ContinuiteServicePage";
import { DirectionPage } from "./pages/DirectionPage";
import { DirectionRegulationPage } from "./pages/DirectionRegulationPage";
import { DossierPage } from "./pages/DossierPage";
import { GouvernancePage } from "./pages/GouvernancePage";
import { HomePage } from "./pages/HomePage";
import { ModuleDomainePage } from "./pages/ModuleDomainePage";
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
          path="/parcours-social-socio-professionnel/dossier/modules/:moduleId"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE]}>
              <ModuleDomainePage />
            </RequireRole>
          }
        />

        <Route
          path="/parcours-social-socio-professionnel/dossier/continuite"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE, ROLE_APPUI_TNS, ROLE_DIRECTION]}>
              <DossierPage mode="continuite" />
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
          path="/continuite-service"
          element={
            <RequireRole allowedRoles={[ROLE_PROFESSIONNELLE, ROLE_APPUI_TNS, ROLE_DIRECTION]}>
              <ContinuiteServicePage />
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
            <RequireRole allowedRoles={[ROLE_DIRECTION, ROLE_GOUVERNANCE_CA]}>
              <DirectionPage />
            </RequireRole>
          }
        />

        <Route
          path="/direction/regulation"
          element={
            <RequireRole allowedRoles={[ROLE_DIRECTION]}>
              <DirectionRegulationPage />
            </RequireRole>
          }
        />

        <Route
          path="/direction/gouvernance"
          element={
            <RequireRole allowedRoles={[ROLE_GOUVERNANCE_CA]}>
              <GouvernancePage />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}
