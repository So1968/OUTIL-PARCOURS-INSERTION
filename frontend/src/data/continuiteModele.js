export const champsSuiviContinuite = [
  {
    id: "derniere-action",
    libelle: "Dernière action connue",
    statut: "Partageable en relais",
  },
  {
    id: "prochaine-action",
    libelle: "Prochaine action utile",
    statut: "Action prioritaire",
  },
  {
    id: "document-attendu",
    libelle: "Document attendu",
    statut: "À compléter",
  },
  {
    id: "relais-mobilise",
    libelle: "Relais mobilisé",
    statut: "À vérifier",
  },
  {
    id: "niveau-vigilance",
    libelle: "Niveau de vigilance",
    statut: "Vigilance à qualifier",
  },
  {
    id: "date-mise-a-jour",
    libelle: "Date de mise à jour",
    statut: "Traçabilité",
  },
];

export const niveauxVigilanceContinuite = [
  {
    id: "faible",
    libelle: "Faible",
    description: "Suivi à planifier, sans risque immédiat repéré.",
    consequence: "À garder visible dans la continuité, sans relance urgente.",
  },
  {
    id: "moyen",
    libelle: "Moyen",
    description: "Échéance proche, document attendu ou action à ne pas laisser tomber.",
    consequence: "À reprendre dans un délai court.",
  },
  {
    id: "fort",
    libelle: "Fort",
    description: "Risque de rupture du parcours, situation sensible ou absence de relais clair.",
    consequence: "À prioriser et à signaler dans la reprise.",
  },
  {
    id: "urgent",
    libelle: "Urgent",
    description: "Risque immédiat, échéance critique ou situation nécessitant une action rapide.",
    consequence: "À traiter en priorité et à transmettre clairement.",
  },
];
