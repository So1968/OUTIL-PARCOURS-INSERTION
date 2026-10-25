import { NavLink } from "react-router-dom";
import { ACCOMPAGNEMENT_ROLES, CONTINUITE_ROLES, PARCOURS_ROLES, PORTE_DIRECTION_ROLES, roleIsAllowed } from "../auth/access";
import { useRole } from "../auth/useRole";

// Le premier niveau oriente vers les espaces existants sans créer de nouvelle route.
// Les actions du quotidien restent directement accessibles au second niveau.
const espacesPrincipaux = [
  { to: "/", label: "Accueil", end: true },
  { to: "/parcours-social-socio-professionnel", label: "Parcours", roles: PARCOURS_ROLES },
  { to: "/accompagnement-global", label: "Accompagnement", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/direction", label: "Direction", roles: PORTE_DIRECTION_ROLES },
];

const accesRapides = [
  { to: "/evaluation-personne", label: "Avec une personne", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/pilotage-actions", label: "File active", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/bureau-quotidien", label: "Mes tâches", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/continuite-service", label: "Continuité", roles: CONTINUITE_ROLES },
];

function liensVisibles(items) {
  return items.map(({ to, label, end }) => (
    <NavLink
      className={({ isActive }) => `app-navigation__link${isActive ? " is-active" : ""}`}
      end={end}
      key={to}
      to={to}
    >
      {label}
    </NavLink>
  ));
}

export function AppNavigation() {
  const { currentRole } = useRole();
  const espacesVisibles = espacesPrincipaux.filter(({ roles }) => !roles || roleIsAllowed(currentRole, roles));
  const rapidesVisibles = accesRapides.filter(({ roles }) => !roles || roleIsAllowed(currentRole, roles));

  return (
    <nav className="app-navigation" aria-label="Navigation principale de l’outil">
      <div className="app-navigation__inner">
        <div className="app-navigation__section" role="group" aria-label="Espaces principaux">
          {liensVisibles(espacesVisibles)}
        </div>
        {rapidesVisibles.length > 0 && (
          <div className="app-navigation__section app-navigation__section--quick" role="group" aria-label="Accès rapides">
            <span className="app-navigation__section-label" aria-hidden="true">Accès rapides</span>
            {liensVisibles(rapidesVisibles)}
          </div>
        )}
      </div>
    </nav>
  );
}
