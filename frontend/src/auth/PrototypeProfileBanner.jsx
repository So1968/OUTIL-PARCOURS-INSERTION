import { useRole } from "./RoleContext";
import { getRoleLabel } from "./roles";

export function PrototypeProfileBanner() {
  const { currentRole } = useRole();

  if (!currentRole) {
    return null;
  }

  return (
    <aside className="prototype-profile-banner" aria-label="Profil actif en mode prototype">
      <span className="prototype-profile-badge">Mode prototype</span>
      <span>
        Profil actif : <strong>{getRoleLabel(currentRole)}</strong>
      </span>
      <span className="prototype-profile-note">
        Simulation des droits — ne remplace pas une authentification réelle.
      </span>
    </aside>
  );
}
