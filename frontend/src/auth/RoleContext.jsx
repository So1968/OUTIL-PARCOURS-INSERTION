import { createContext, useContext, useMemo, useState } from "react";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(null);

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
