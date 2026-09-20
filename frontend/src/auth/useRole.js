import { useContext } from "react";
import { RoleContext } from "./role-context";

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole doit être utilisé dans RoleProvider");
  }

  return context;
}
