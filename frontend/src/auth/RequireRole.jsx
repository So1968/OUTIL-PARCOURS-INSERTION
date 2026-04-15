import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "./RoleContext";
import { getRoleLabel } from "./roles";

export function RequireRole({ allowedRoles, children }) {
  const location = useLocation();
  const { currentRole } = useRole();

  if (!allowedRoles.includes(currentRole)) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          deniedPath: location.pathname,
          deniedRoleLabel: getRoleLabel(currentRole),
        }}
      />
    );
  }

  return children;
}
