import { useMemo, useState } from "react";
import { readStorageItem, writeStorageItem } from "../lib/storage";
import { RoleContext } from "./role-context";
import { ROLE_OPTIONS, ROLE_PROFESSIONNELLE } from "./roles";

const STORAGE_KEY = "artag-prototype-current-role";

function getInitialRole() {
  const storedRole = readStorageItem(STORAGE_KEY, ROLE_PROFESSIONNELLE);
  return ROLE_OPTIONS.some(({ id }) => id === storedRole) ? storedRole : ROLE_PROFESSIONNELLE;
}

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRoleState] = useState(getInitialRole);

  function setCurrentRole(role) {
    const nextRole = ROLE_OPTIONS.some(({ id }) => id === role) ? role : ROLE_PROFESSIONNELLE;
    setCurrentRoleState(nextRole);
    writeStorageItem(STORAGE_KEY, nextRole);
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
