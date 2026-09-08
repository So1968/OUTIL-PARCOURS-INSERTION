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
      <Link style={styleLien} to="/">Accueil</Link>
      <Link style={styleLien} to="/evaluation-personne">Travailler avec une personne</Link>
      <Link style={styleLien} to="/pilotage-actions">Voir la file active</Link>
    </nav>
  );
}

function AccueilSimple() {
  const s = {
    page: {
      minHeight: "100vh",
      background: "#171a18",
      color: "#f4efe6",
      padding: "34px 22px 56px",
      fontFamily: "Arial, system-ui, sans-serif",
    },
    wrap: { maxWidth: "980px", margin: "0 auto" },
    label: {
      margin: "0 0 8px",
      color: "#b7c7a6",
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    h1: { margin: 0, color: "#fff8ea", fontSize: "34px", lineHeight: 1.1 },
    intro: { margin: "12px 0 0", color: "#d7cfbf", fontSize: "17px", lineHeight: 1.5, maxWidth: "780px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginTop: "24px" },
    card: {
      display: "block",
      minHeight: "190px",
      background: "#242822",
      border: "1px solid #59634f",
      borderRadius: "22px",
      padding: "22px",
      color: "#f4efe6",
      textDecoration: "none",
      boxShadow: "0 12px 24px rgba(0,0,0,0.22)",
    },
    title: { margin: 0, color: "#fff8ea", fontSize: "25px", lineHeight: 1.2 },
    text: { margin: "12px 0 0", color: "#d7cfbf", fontSize: "16px", lineHeight: 1.45 },
    action: {
      display: "inline-flex",
      marginTop: "18px",
      borderRadius: "999px",
      padding: "9px 14px",
      background: "#7f8a69",
      color: "white",
      fontWeight: 900,
    },
    aide: {
      marginTop: "18px",
      background: "#2c3029",
      border: "1px solid #46513f",
      borderRadius: "18px",
      padding: "16px",
      color: "#d7cfbf",
      lineHeight: 1.45,
    },
  };

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <p style={s.label}>Outil insertion</p>
        <h1 style={s.h1}>Qu’est-ce que je fais maintenant ?</h1>
        <p style={s.intro}>
          Choisis seulement ton point d’entrée. Le reste vient après. L’idée est de ne pas ouvrir tout l’atelier quand tu as juste besoin d’un marteau.
        </p>

        <section style={s.grid}>
          <Link style={s.card} to="/evaluation-personne">
            <h2 style={s.title}>Je suis avec une personne</h2>
            <p style={s.text}>Pour faire l’évaluation simplement, avec elle, sans afficher les notes professionnelles.</p>
            <span style={s.action}>Ouvrir l’évaluation</span>
          </Link>

          <Link style={s.card} to="/pilotage-actions">
            <h2 style={s.title}>Je regarde ma file active</h2>
            <p style={s.text}>Pour voir qui remonte en urgence, ce qui est à faire, les échéances et les traces Insertis.</p>
            <span style={s.action}>Ouvrir la file active</span>
          </Link>
        </section>

        <section style={s.aide}>
          <strong>Repère simple :</strong> la page personne sert à évaluer. La file active sert à prioriser. Le dossier pro sert à écrire, analyser et tracer.
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <PrototypeProfileBanner />
      <MenuPrincipal />
      <Routes>
        <Route path="/" element={<PageProtegee><AccueilSimple /></PageProtegee>} />
        <Route path="/pilotage-actions" element={<PilotageProtege />} />
        <Route path="/pilotage-actions/dossier/:dossierId" element={<PageProtegee><DossierPersonnePage /></PageProtegee>} />
        <Route path="/evaluation-personne" element={<PageProtegee><EvaluationPersonnePage /></PageProtegee>} />
        <Route path="/evaluation-personne/:dossierId" element={<PageProtegee><EvaluationPersonnePage /></PageProtegee>} />
        <Route path="/sas-insertis" element={<PageProtegee><SasInsertisPage /></PageProtegee>} />
        <Route path="/accompagnement-global/echeances-vigilances" element={<PageProtegee><EcheancesVigilancesPage /></PageProtegee>} />

        <Route path="/accompagnement-global" element={<Navigate to="/" replace />} />
        <Route path="/accompagnement-global/fiche-minute" element={<Navigate to="/" replace />} />
        <Route path="/accompagnement-global/lecture-globale" element={<Navigate to="/" replace />} />
        <Route path="/appui-tns" element={<Navigate to="/" replace />} />
        <Route path="/appui-tns/fiche-minute" element={<Navigate to="/" replace />} />
        <Route path="/appui-tns/analyse" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}
