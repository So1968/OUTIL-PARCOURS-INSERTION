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

export const statutsRelanceContinuite = [
  {
    id: "a-planifier",
    libelle: "À planifier",
    description: "La reprise est identifiée, mais aucune relance n’est encore programmée.",
  },
  {
    id: "programmee",
    libelle: "Programmée",
    description: "Une prochaine relance ou action de reprise est prévue.",
  },
  {
    id: "en-retard",
    libelle: "En retard",
    description: "La relance prévue n’a pas été réalisée dans le délai attendu.",
  },
  {
    id: "traitee",
    libelle: "Traitée",
    description: "La relance ou l’action de reprise a été réalisée.",
  },
];

export const frequencesRelanceContinuite = [
  {
    id: "aucune",
    libelle: "Aucune relance automatique",
    description: "Aucune relance n’est nécessaire à ce stade.",
  },
  {
    id: "quotidienne",
    libelle: "Quotidienne",
    description: "À utiliser pour les situations urgentes ou très sensibles.",
  },
  {
    id: "tous-les-2-jours",
    libelle: "Tous les 2 jours",
    description: "À utiliser lorsqu’une échéance approche ou qu’un document est attendu.",
  },
  {
    id: "hebdomadaire",
    libelle: "Hebdomadaire",
    description: "À utiliser pour un suivi régulier sans urgence immédiate.",
  },
];
