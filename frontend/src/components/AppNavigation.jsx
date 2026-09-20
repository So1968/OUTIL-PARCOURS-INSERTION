import { NavLink } from "react-router-dom";
import { ACCOMPAGNEMENT_ROLES, CONTINUITE_ROLES, PARCOURS_ROLES, PORTE_DIRECTION_ROLES, roleIsAllowed } from "../auth/access";
import { useRole } from "../auth/useRole";

const navigationItems = [
  { to: "/", label: "Accueil", end: true },
  { to: "/evaluation-personne", label: "Avec une personne", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/pilotage-actions", label: "File active", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/parcours-social-socio-professionnel", label: "Parcours", roles: PARCOURS_ROLES },
  { to: "/accompagnement-global", label: "Accompagnement", roles: ACCOMPAGNEMENT_ROLES },
  { to: "/continuite-service", label: "Continuité", roles: CONTINUITE_ROLES },
  { to: "/direction", label: "Direction", roles: PORTE_DIRECTION_ROLES },
];

export function AppNavigation() {
  const { currentRole } = useRole();

  return (
    <nav className="app-navigation" aria-label="Navigation principale de l’outil">
      <div className="app-navigation__inner">
        {navigationItems
          .filter(({ roles }) => !roles || roleIsAllowed(currentRole, roles))
          .map(({ to, label, end }) => (
            <NavLink
              className={({ isActive }) => `app-navigation__link${isActive ? " is-active" : ""}`}
              end={end}
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
      </div>
    </nav>
  );
}
