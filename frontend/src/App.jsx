import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  ACCOMPAGNEMENT_ROLES,
  CONTINUITE_ROLES,
  DIRECTION_ROLES,
  GOUVERNANCE_ROLES,
  PARCOURS_ROLES,
  PORTE_DIRECTION_ROLES,
} from "./auth/access";
import { PrototypeProfileBanner } from "./auth/PrototypeProfileBanner";
import { RequireRole } from "./auth/RequireRole";
import { RoleProvider } from "./auth/RoleContext";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppNavigation } from "./components/AppNavigation";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { AccueilPage } from "./pages/AccueilPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function lazyNamed(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })));
}

const CadreOrientationPage = lazyNamed(() => import("./pages/CadreOrientationPage"), "CadreOrientationPage");
const ContinuiteServicePage = lazyNamed(() => import("./pages/ContinuiteServicePage"), "ContinuiteServicePage");
const DirectionPage = lazyNamed(() => import("./pages/DirectionPage"), "DirectionPage");
const DirectionRegulationPage = lazyNamed(() => import("./pages/DirectionRegulationPage"), "DirectionRegulationPage");
const DossierAvecRdvPage = lazyNamed(() => import("./pages/DossierAvecRdvPage"), "DossierAvecRdvPage");
const DossierPage = lazyNamed(() => import("./pages/DossierPage"), "DossierPage");
const DossierPersonnePage = lazyNamed(() => import("./pages/DossierPersonnePage"), "DossierPersonnePage");
const EcheancesVigilancesPage = lazyNamed(() => import("./pages/EcheancesVigilancesPage"), "EcheancesVigilancesPage");
const EvaluationPersonnePage = lazyNamed(() => import("./pages/EvaluationPersonnePage"), "EvaluationPersonnePage");
const GouvernancePage = lazyNamed(() => import("./pages/GouvernancePage"), "GouvernancePage");
const LectureGlobaleOptimiseePage = lazyNamed(
  () => import("./pages/LectureGlobaleOptimiseePage"),
  "LectureGlobaleOptimiseePage",
);
const ModuleDomainePage = lazyNamed(() => import("./pages/ModuleDomainePage"), "ModuleDomainePage");
const ParcoursPage = lazyNamed(() => import("./pages/ParcoursPage"), "ParcoursPage");
const PilotageActionsPage = lazyNamed(() => import("./pages/PilotageActionsPage"), "PilotageActionsPage");
const RendezVousSuiviPage = lazyNamed(() => import("./pages/RendezVousSuiviPage"), "RendezVousSuiviPage");
const SasInsertisPage = lazyNamed(() => import("./pages/SasInsertisPage"), "SasInsertisPage");
const SocleAutonomiePage = lazyNamed(() => import("./pages/SocleAutonomiePage"), "SocleAutonomiePage");
const TnsCoordinationPage = lazyNamed(() => import("./pages/TnsCoordinationPage"), "TnsCoordinationPage");
const TnsFicheMinutePage = lazyNamed(() => import("./pages/TnsFicheMinutePage"), "TnsFicheMinutePage");
const TnsPage = lazyNamed(() => import("./pages/TnsPage"), "TnsPage");

function ProtectedPage({ allowedRoles, children }) {
  return <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Ouverture de l’espace…</div>}>
      <Routes>
        <Route path="/" element={<AccueilPage />} />
        <Route path="/acces-refuse" element={<AccessDeniedPage />} />

        <Route path="/evaluation-personne" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><EvaluationPersonnePage /></ProtectedPage>} />
        <Route path="/evaluation-personne/:dossierId" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><EvaluationPersonnePage /></ProtectedPage>} />
        <Route path="/pilotage-actions" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><PilotageActionsPage /></ProtectedPage>} />
        <Route path="/pilotage-actions/dossier/:dossierId" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><DossierPersonnePage /></ProtectedPage>} />
        <Route path="/sas-insertis" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><SasInsertisPage /></ProtectedPage>} />

        <Route path="/parcours-social-socio-professionnel" element={<ProtectedPage allowedRoles={PARCOURS_ROLES}><ParcoursPage /></ProtectedPage>} />
        <Route path="/parcours-social-socio-professionnel/dossier" element={<ProtectedPage allowedRoles={PARCOURS_ROLES}><DossierAvecRdvPage /></ProtectedPage>} />
        <Route path="/parcours-social-socio-professionnel/dossier/rendez-vous" element={<ProtectedPage allowedRoles={CONTINUITE_ROLES}><RendezVousSuiviPage /></ProtectedPage>} />
        <Route path="/parcours-social-socio-professionnel/dossier/modules/:moduleId" element={<ProtectedPage allowedRoles={PARCOURS_ROLES}><ModuleDomainePage /></ProtectedPage>} />
        <Route path="/parcours-social-socio-professionnel/dossier/continuite" element={<ProtectedPage allowedRoles={CONTINUITE_ROLES}><DossierPage mode="continuite" /></ProtectedPage>} />
        <Route path="/parcours-social-socio-professionnel/socle" element={<ProtectedPage allowedRoles={PARCOURS_ROLES}><SocleAutonomiePage /></ProtectedPage>} />
        <Route path="/continuite-service" element={<ProtectedPage allowedRoles={CONTINUITE_ROLES}><ContinuiteServicePage /></ProtectedPage>} />

        <Route path="/accompagnement-global" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><TnsPage /></ProtectedPage>} />
        <Route path="/accompagnement-global/fiche-minute" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><TnsFicheMinutePage /></ProtectedPage>} />
        <Route path="/accompagnement-global/lecture-globale" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><LectureGlobaleOptimiseePage /></ProtectedPage>} />
        <Route path="/accompagnement-global/echeances-vigilances" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><EcheancesVigilancesPage /></ProtectedPage>} />
        <Route path="/accompagnement-global/orientation" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><CadreOrientationPage /></ProtectedPage>} />
        <Route path="/appui-tns/coordination" element={<ProtectedPage allowedRoles={ACCOMPAGNEMENT_ROLES}><TnsCoordinationPage /></ProtectedPage>} />

        <Route path="/direction" element={<ProtectedPage allowedRoles={PORTE_DIRECTION_ROLES}><DirectionPage /></ProtectedPage>} />
        <Route path="/direction/regulation" element={<ProtectedPage allowedRoles={DIRECTION_ROLES}><DirectionRegulationPage /></ProtectedPage>} />
        <Route path="/direction/gouvernance" element={<ProtectedPage allowedRoles={GOUVERNANCE_ROLES}><GouvernancePage /></ProtectedPage>} />

        <Route path="/appui-tns" element={<Navigate to="/accompagnement-global" replace />} />
        <Route path="/appui-tns/fiche-minute" element={<Navigate to="/accompagnement-global/fiche-minute" replace />} />
        <Route path="/appui-tns/analyse" element={<Navigate to="/accompagnement-global/lecture-globale" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />
      <AppNavigation />
      <AppErrorBoundary>
        <AppRoutes />
      </AppErrorBoundary>
    </RoleProvider>
  );
}
