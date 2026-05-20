import { Link } from "react-router-dom";
import { DossierPage } from "./DossierPage";

export function DossierAvecRdvPage({ mode = "complet" }) {
  const isContinuiteMode = mode === "continuite";

  return (
    <>
      <DossierPage mode={mode} />

      {!isContinuiteMode && (
        <nav
          aria-label="Accès rapide au tronc commun de suivi"
          style={{
            position: "fixed",
            right: "22px",
            bottom: "22px",
            zIndex: 50,
            display: "grid",
            gap: "8px",
            maxWidth: "280px",
          }}
        >
          <Link
            className="primary-button"
            to="/parcours-social-socio-professionnel/dossier/rendez-vous"
            style={{ boxShadow: "0 18px 34px rgba(63, 55, 47, 0.18)" }}
          >
            Préparer / suivre un rendez-vous
          </Link>
        </nav>
      )}
    </>
  );
}
