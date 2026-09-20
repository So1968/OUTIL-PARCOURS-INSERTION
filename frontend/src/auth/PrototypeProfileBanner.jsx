import { useRole } from "./useRole";
import { getRoleLabel, ROLE_OPTIONS } from "./roles";

export function PrototypeProfileBanner() {
  const { currentRole, setCurrentRole } = useRole();

  if (!currentRole) {
    return null;
  }

  return (
    <aside className="prototype-profile-banner" aria-label="Profil actif en mode prototype">
      <span className="prototype-profile-badge">Mode prototype</span>
      <span>
        Profil actif : <strong>{getRoleLabel(currentRole)}</strong>
      </span>
      <label className="prototype-profile-selector">
        <span>Changer de profil</span>
        <select value={currentRole} onChange={(event) => setCurrentRole(event.target.value)}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.id} value={role.id}>{role.label}</option>
          ))}
        </select>
      </label>
      <span className="prototype-profile-note">
        Simulation des droits — ne remplace pas une authentification réelle.
      </span>
    </aside>
  );
}
