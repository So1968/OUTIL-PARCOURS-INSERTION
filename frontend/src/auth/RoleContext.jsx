import { createContext, useContext, useMemo, useState } from "react";
import { ROLE_PROFESSIONNELLE } from "./roles";

const RoleContext = createContext(null);
const STORAGE_KEY = "artag-prototype-current-role";

function getInitialRole() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ROLE_PROFESSIONNELLE;
  } catch {
    return ROLE_PROFESSIONNELLE;
  }
}

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRoleState] = useState(getInitialRole);

  function setCurrentRole(role) {
    const nextRole = role || ROLE_PROFESSIONNELLE;
    setCurrentRoleState(nextRole);

    try {
      localStorage.setItem(STORAGE_KEY, nextRole);
    } catch {
      // Le prototype continue même si localStorage est indisponible.
    }
  }

  const value = useMemo(
    () => ({
      currentRole,
      setCurrentRole,
    }),
    [currentRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }

  return context;
}
