export const ROLE_PROFESSIONNELLE = "professionnelle";
export const ROLE_APPUI_TNS = "professionnelle-appui-tns";
export const ROLE_ACCUEIL = "accueil";
export const ROLE_RELAIS_LOGEMENT = "relais-logement-habitat";
export const ROLE_DIRECTION = "direction";
export const ROLE_GOUVERNANCE_CA = "gouvernance-ca";
export const ROLE_ADMIN = "administrateur";
export const ROLE_DEMO = "mode-demonstration";

export const ROLE_OPTIONS = [
  {
    id: ROLE_PROFESSIONNELLE,
    label: "Professionnelle de parcours",
    accessLabel: "Accès parcours social / socio-professionnel",
  },
  {
    id: ROLE_APPUI_TNS,
    label: "Professionnelle appui TNS",
    accessLabel: "Accès Appui TNS",
  },
  {
    id: ROLE_ACCUEIL,
    label: "Accueil",
    accessLabel: "Accès relais accueil — continuité de service",
  },
  {
    id: ROLE_RELAIS_LOGEMENT,
    label: "Relais logement / habitat",
    accessLabel: "Accès relais logement / habitat — continuité de service",
  },
  {
    id: ROLE_DIRECTION,
    label: "Direction",
    accessLabel: "Accès Direction — régulation opérationnelle",
  },
  {
    id: ROLE_GOUVERNANCE_CA,
    label: "Gouvernance / CA",
    accessLabel: "Accès Gouvernance / CA — lecture agrégée",
  },
  {
    id: ROLE_ADMIN,
    label: "Administrateur",
    accessLabel: "Accès paramétrage et gestion outil",
  },
  {
    id: ROLE_DEMO,
    label: "Mode démonstration",
    accessLabel: "Accès démonstration sans données réelles",
  },
];

export function getRoleLabel(roleId) {
  return ROLE_OPTIONS.find((role) => role.id === roleId)?.label ?? "Aucun profil";
}
