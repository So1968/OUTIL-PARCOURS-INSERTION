export const ROLE_PROFESSIONNELLE = "professionnelle";
export const ROLE_APPUI_TNS = "professionnelle-appui-tns";
export const ROLE_DIRECTION = "direction";

export const ROLE_OPTIONS = [
  {
    id: ROLE_PROFESSIONNELLE,
    label: "Professionnelle",
    accessLabel: "Accès parcours social / socio-professionnel",
  },
  {
    id: ROLE_APPUI_TNS,
    label: "Professionnelle appui TNS",
    accessLabel: "Accès Appui TNS",
  },
  {
    id: ROLE_DIRECTION,
    label: "Direction",
    accessLabel: "Accès Direction",
  },
];

export function getRoleLabel(roleId) {
  return ROLE_OPTIONS.find((role) => role.id === roleId)?.label ?? "Aucun profil";
}
