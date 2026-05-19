export const referentielMetropoleLyon = {
  sources: [
    "Référentiel parcours social 2026 - Métropole de Lyon",
    "Référentiel parcours socio-professionnel 2026 - Métropole de Lyon",
  ],
  principesCommuns: [
    "Co-construire le parcours avec la personne accompagnée.",
    "Rendre la personne actrice de son parcours.",
    "Formaliser le diagnostic, le contrat, les entretiens et les étapes dans Insertis.",
    "Sécuriser les droits RSA, CAF et France Travail pour éviter les ruptures de parcours.",
    "Adapter l’intensité de l’accompagnement aux capacités de mobilisation de la personne.",
    "Respecter la confidentialité et ne jamais faire apparaître d’informations médicales détaillées dans le dossier de suivi.",
  ],
  domainesDiagnostic: [
    "Logement",
    "Santé / handicap",
    "Organisation familiale",
    "Mobilité",
    "Budget et finances",
    "Linguistique",
    "Numérique et accès aux droits",
    "Rapport à soi et à autrui",
    "Projet professionnel",
  ],
  parcours: {
    social: {
      cible:
        "Personnes dont les freins périphériques entravent l’accès à l’emploi à moyen ou long terme.",
      objectif:
        "Activer un parcours social dynamique, éviter le décrochage, favoriser l’inclusion sociale et préparer une progression vers l’activité quand cela devient possible.",
      intensite:
        "Au moins 5 rendez-vous individuels en présentiel par an, complétés par des contacts diversifiés et des actions ou ateliers adaptés.",
      pointsDeVigilance: [
        "Faire émerger la demande d’insertion par petits pas si la personne est peu mobilisable.",
        "Envisager une réorientation vers un parcours socio-professionnel ou professionnel lorsqu’un projet d’accès à l’emploi se dessine.",
        "Examiner les accompagnements longs en instance lorsque le parcours doit être réinterrogé.",
      ],
    },
    socioProfessionnel: {
      cible:
        "Personnes manifestant une projection de remise en activité ou d’accès / retour à l’emploi, immédiat ou différé, sauf si les difficultés empêchent manifestement l’exercice d’une activité suivie.",
      objectif:
        "Remise en activité, accès, retour et maintien dans l’emploi, tout en levant les freins sociaux et professionnels.",
      intensite:
        "Accompagnement renforcé : 12 contacts formalisés par an, dont au moins 7 rendez-vous physiques individuels, 7 temps collectifs et 4 actions ou étapes dont une en lien avec l’entreprise.",
      pointsDeVigilance: [
        "Réaliser un bilan obligatoire après 18 à 24 mois pour réinterroger le parcours.",
        "Actualiser les acquis et la progression au moins tous les 6 mois.",
        "Prévoir un suivi dans l’emploi ou la formation de 3 à 6 mois si nécessaire.",
      ],
    },
  },
  reglesInterface: [
    "Toujours distinguer parcours social et parcours socio-professionnel dans l’interface.",
    "Afficher les 9 domaines de diagnostic comme grille commune d’analyse.",
    "Faire apparaître la contractualisation, le diagnostic et les étapes comme éléments centraux du parcours.",
    "Rendre visibles les échéances de bilan, d’actualisation et de réorientation.",
    "Séparer les informations partageables en relais des informations protégées ou confidentielles.",
  ],
};
