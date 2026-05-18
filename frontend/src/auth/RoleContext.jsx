import { createContext, useContext, useMemo, useState } from "react";

const RoleContext = createContext(null);
const STORAGE_KEY = "artag-prototype-current-role";

function getInitialRole() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRoleState] = useState(getInitialRole);

  function setCurrentRole(role) {
    setCurrentRoleState(role);

    try {
      if (role) {
        localStorage.setItem(STORAGE_KEY, role);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
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
