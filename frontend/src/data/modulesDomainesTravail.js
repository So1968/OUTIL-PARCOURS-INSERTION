export const logiqueModulesDomainesTravail = {
  principe:
    "Chaque domaine doit devenir un module de travail concret : il aide la professionnelle à organiser l’accompagnement, objectiver ce qui est observé, repérer les priorités, préparer les actions et produire une synthèse utile, sans transformer la relation d’aide en contrôle froid.",
  objectifs: [
    "Organiser le travail par domaine sans perdre la vision globale du parcours.",
    "Objectiver les constats avec des éléments observables, des faits, des dates, des documents ou des actions réalisées.",
    "Distinguer ce qui est dit par la personne, ce qui est observé, ce qui est vérifié et ce qui reste à clarifier.",
    "Aider à prioriser les actions sans décider à la place de la professionnelle.",
    "Préparer des synthèses transférables vers Insertis quand c’est nécessaire.",
    "Respecter le projet social ARTAG : participation, aller-vers, confiance, confidentialité, sur-mesure et pas de côté.",
  ],
  structureCommuneModule: {
    situation: "Ce que la personne exprime, ce qui est observé, ce qui est déjà connu.",
    forcesAppuis: "Ce qui fonctionne, les ressources de la personne, de la famille, du réseau ou du territoire.",
    freinsVigilances: "Ce qui bloque, fragilise ou nécessite une attention particulière.",
    elementsObjectivables: "Documents, dates, démarches, rendez-vous, droits ouverts, partenaires contactés, actions réalisées.",
    niveauPriorite: "Faible, moyen, fort, urgent — à qualifier selon le risque de rupture, l’échéance et l’impact sur le parcours.",
    actionsPossibles: "Actions proposées ou à décider avec la personne.",
    relaisPartenaires: "Relais internes ARTAG ou partenaires de droit commun utiles.",
    suitePrevue: "Prochaine action, échéance, responsable, point à vérifier.",
    syntheseInsertis: "Formulation courte, factuelle, proportionnée, utile à la formalisation institutionnelle.",
    espaceReserve: "Hypothèses, éléments sensibles ou notes professionnelles non visibles en relais simple.",
  },
};

export const modulesDomainesTravail = [
  {
    id: "demarches-acces-droits",
    titre: "Démarches / accès aux droits",
    domaineRepere: "Démarches / accès aux droits",
    domainesMetropoleAssocies: ["Numérique et accès aux droits", "Budget et finances"],
    finalite:
      "Sécuriser les droits, éviter les ruptures administratives et rendre les démarches compréhensibles pour la personne.",
    questionsTravail: [
      "Quels droits sont ouverts, en attente, suspendus ou à vérifier ?",
      "Quelles démarches sont prioritaires ?",
      "La personne comprend-elle ce qui est demandé et pourquoi ?",
      "Quels documents manquent ou doivent être actualisés ?",
    ],
    elementsObjectivables: [
      "Droits CAF / RSA / CPAM / France Travail / MDPH ouverts ou en attente",
      "Dates des démarches et échéances",
      "Documents demandés, reçus ou manquants",
      "Partenaires contactés et réponses obtenues",
      "Démarches réalisées avec ou par la personne",
    ],
    indicateursSimples: [
      "Démarche comprise par la personne",
      "Document attendu identifié",
      "Échéance connue",
      "Relais identifié si besoin",
      "Risque de rupture de droits qualifié",
    ],
    relaisPossibles: ["Accueil ARTAG", "CAF", "CPAM", "France Travail", "Maison de la Métropole", "MDPH", "Défenseur des droits"],
    sortieModule:
      "Une liste courte des droits à sécuriser, des démarches à faire, des documents attendus et de la prochaine action.",
  },
  {
    id: "organisation-quotidien",
    titre: "Organisation du quotidien",
    domaineRepere: "Organisation du quotidien",
    domainesMetropoleAssocies: ["Organisation familiale", "Rapport à soi et à autrui"],
    finalite:
      "Comprendre ce qui facilite ou empêche la personne d’agir concrètement dans son parcours.",
    questionsTravail: [
      "Qu’est-ce qui aide la personne à tenir ses rendez-vous et démarches ?",
      "Qu’est-ce qui fait obstacle dans l’organisation quotidienne ?",
      "Une étape simple peut-elle être définie avec la personne ?",
      "Quel rappel ou relais peut éviter l’abandon d’une démarche ?",
    ],
    elementsObjectivables: [
      "Rendez-vous honorés, manqués ou reportés",
      "Étapes réalisées depuis le dernier échange",
      "Rappels nécessaires",
      "Présence d’un soutien familial ou d’un relais",
      "Échéances comprises ou non comprises",
    ],
    indicateursSimples: [
      "Prochaine étape claire",
      "Responsable de l’action identifié",
      "Besoin de rappel évalué",
      "Risque d’oubli ou de décrochage repéré",
    ],
    relaisPossibles: ["Référente de parcours", "Accueil ARTAG", "Famille / proche avec accord", "Partenaire de proximité"],
    sortieModule:
      "Un mini-plan d’action lisible : quoi faire, avec qui, pour quand, et comment on relance.",
  },
  {
    id: "budget-argent",
    titre: "Budget / argent",
    domaineRepere: "Budget / argent",
    domainesMetropoleAssocies: ["Budget et finances"],
    finalite:
      "Repérer les fragilités budgétaires qui peuvent bloquer le parcours, sans jugement et sans intrusion inutile.",
    questionsTravail: [
      "Y a-t-il une urgence financière ou une dette qui bloque le parcours ?",
      "Les ressources et charges principales sont-elles comprises ?",
      "Un dossier ou une aide doit-il être activé ?",
      "Faut-il protéger une échéance importante ?",
    ],
    elementsObjectivables: [
      "Ressource ou prestation en attente",
      "Dette ou impayé signalé",
      "Échéance de paiement connue",
      "Dossier FSL, aide, prêt ou orientation budgétaire engagé",
      "Partenaire ou service contacté",
    ],
    indicateursSimples: [
      "Urgence financière qualifiée",
      "Échéance critique identifiée",
      "Document justificatif identifié",
      "Orientation budgétaire proposée si besoin",
    ],
    relaisPossibles: ["CAF", "Maison de la Métropole", "CCAS", "Banque / microcrédit", "Partenaire budget", "Bailleur si logement"],
    sortieModule:
      "Une synthèse courte des points budgétaires à sécuriser et des démarches prioritaires.",
  },
  {
    id: "sante-acces-soins",
    titre: "Santé / accès aux soins",
    domaineRepere: "Santé / accès aux soins",
    domainesMetropoleAssocies: ["Santé / handicap"],
    finalite:
      "Repérer ce qui impacte le parcours sans saisir de détails médicaux inutiles ou sensibles.",
    questionsTravail: [
      "La santé empêche-t-elle aujourd’hui certaines démarches ou rendez-vous ?",
      "Un accès aux soins ou aux droits santé est-il à sécuriser ?",
      "Une orientation vers un professionnel ou un droit doit-elle être proposée ?",
      "Qu’est-ce qui peut être écrit sans exposer la personne ?",
    ],
    elementsObjectivables: [
      "Difficulté d’accès aux soins signalée",
      "Droit CPAM / complémentaire / MDPH à vérifier",
      "Rendez-vous santé à prendre ou déjà prévu",
      "Impact concret sur les démarches ou la disponibilité",
      "Relais santé proposé avec accord",
    ],
    indicateursSimples: [
      "Impact sur le parcours qualifié",
      "Relais santé identifié",
      "Information médicale détaillée exclue de la synthèse partagée",
      "Besoin d’aménagement repéré",
    ],
    relaisPossibles: ["CPAM", "MDPH", "Professionnel de santé", "Maison de la Métropole", "Partenaire santé", "Référente ARTAG"],
    sortieModule:
      "Une vigilance santé formulée de manière proportionnée : impact sur le parcours, relais utile, prochaine étape.",
  },
  {
    id: "mobilite-deplacements",
    titre: "Mobilité / déplacements",
    domaineRepere: "Mobilité / déplacements",
    domainesMetropoleAssocies: ["Mobilité"],
    finalite:
      "Vérifier si la personne peut accéder concrètement aux rendez-vous, services, actions, formation ou emploi.",
    questionsTravail: [
      "Comment la personne se déplace-t-elle aujourd’hui ?",
      "Un problème de distance, coût, permis ou transport bloque-t-il le parcours ?",
      "Le lieu de vie rend-il certaines démarches difficiles ?",
      "Une solution ou un relais mobilité est-il possible ?",
    ],
    elementsObjectivables: [
      "Moyen de transport disponible ou absent",
      "Permis / véhicule / assurance / coût identifié",
      "Distance aux services ou rendez-vous",
      "Rendez-vous manqué ou difficulté liée au déplacement",
      "Aide ou partenaire mobilité mobilisé",
    ],
    indicateursSimples: [
      "Risque de non-présentation aux rendez-vous évalué",
      "Solution de déplacement identifiée",
      "Relais mobilité proposé si besoin",
      "Échéance sensible repérée",
    ],
    relaisPossibles: ["Partenaire mobilité", "Mission locale", "France Travail", "Maison de la Métropole", "Association locale", "Famille / proche avec accord"],
    sortieModule:
      "Une lecture claire des obstacles de déplacement et des solutions concrètes possibles.",
  },
  {
    id: "ecrit-numerique",
    titre: "Écrit / numérique",
    domaineRepere: "Écrit / numérique",
    domainesMetropoleAssocies: ["Linguistique", "Numérique et accès aux droits"],
    finalite:
      "Repérer les besoins de compréhension, lecture, écriture ou numérique qui peuvent freiner l’accès aux droits.",
    questionsTravail: [
      "La personne peut-elle lire, comprendre et répondre aux courriers utiles ?",
      "Les démarches sur téléphone ou en ligne sont-elles accessibles ?",
      "Un compte administratif est-il bloqué, perdu ou difficile à utiliser ?",
      "Quel appui rendrait la personne plus autonome ?",
    ],
    elementsObjectivables: [
      "Courrier ou message non compris",
      "Compte CAF / France Travail / impôts / CPAM à créer ou débloquer",
      "Besoin de traduction, lecture ou explication",
      "Action numérique réalisée avec la personne",
      "Orientation vers atelier ou médiation numérique",
    ],
    indicateursSimples: [
      "Autonomie numérique évaluée",
      "Compte ou accès identifié",
      "Besoin d’explication ou de médiation repéré",
      "Action d’autonomisation proposée",
    ],
    relaisPossibles: ["Accueil ARTAG", "Médiation numérique", "Ecrivain public", "France Services", "CAF", "Impôts"],
    sortieModule:
      "Une liste des accès numériques ou écrits à sécuriser et de l’appui nécessaire.",
  },
  {
    id: "vie-familiale-disponibilite",
    titre: "Vie familiale / disponibilité",
    domaineRepere: "Vie familiale / disponibilité",
    domainesMetropoleAssocies: ["Organisation familiale", "Rapport à soi et à autrui"],
    finalite:
      "Comprendre comment les responsabilités familiales, la disponibilité et le lieu de vie influencent le parcours.",
    questionsTravail: [
      "Quelles responsabilités familiales pèsent sur la disponibilité ?",
      "Les enfants, proches ou personnes dépendantes modifient-ils les possibilités d’action ?",
      "Quel rythme de rendez-vous est réaliste ?",
      "Un relais familial ou institutionnel peut-il soutenir la démarche ?",
    ],
    elementsObjectivables: [
      "Contraintes de garde ou d’accompagnement d’un proche",
      "Disponibilités réalistes pour les rendez-vous",
      "Besoin de coordination avec famille ou partenaire",
      "Impact des déplacements ou du lieu de vie",
      "Action collective ou familiale proposée",
    ],
    indicateursSimples: [
      "Disponibilité réelle évaluée",
      "Rythme d’accompagnement adapté",
      "Relais ou soutien identifié",
      "Risque de surcharge repéré",
    ],
    relaisPossibles: ["Référente familles", "Maison de la Métropole", "Partenaire parentalité", "École / collège si concerné", "Relais local"],
    sortieModule:
      "Un rythme d’accompagnement adapté à la réalité familiale et aux responsabilités de la personne.",
  },
  {
    id: "projet-mise-mouvement",
    titre: "Projet / mise en mouvement",
    domaineRepere: "Projet / mise en mouvement",
    domainesMetropoleAssocies: ["Projet professionnel", "Rapport à soi et à autrui"],
    finalite:
      "Transformer une envie, une obligation ou une difficulté en étapes réalistes et compréhensibles.",
    questionsTravail: [
      "La personne exprime-t-elle une envie, un projet, une obligation ou une inquiétude ?",
      "Qu’est-ce qui peut être fait maintenant, sans brûler les étapes ?",
      "Le projet relève-t-il d’un parcours social, socio-professionnel, professionnel ou TNS ?",
      "Quelle première action permet de mettre le parcours en mouvement ?",
    ],
    elementsObjectivables: [
      "Projet exprimé ou à clarifier",
      "Étape réalisée ou à engager",
      "Action emploi / formation / activité indépendante repérée",
      "Frein prioritaire identifié",
      "Partenaire ou action collective proposé",
    ],
    indicateursSimples: [
      "Première étape formulée",
      "Registre de parcours à qualifier",
      "Besoin TNS évalué si activité indépendante",
      "Évolution ou réorientation à surveiller",
    ],
    relaisPossibles: ["France Travail", "Mission locale", "Appui TNS ARTAG", "Partenaire formation", "Entreprise / employeur", "Maison de la Métropole"],
    sortieModule:
      "Une première étape de projet claire, reliée au bon registre d’accompagnement et aux relais utiles.",
  },
  {
    id: "habitat-lieu-vie",
    titre: "Habitat / lieu de vie",
    domaineRepere: "Habitat / lieu de vie",
    domainesMetropoleAssocies: ["Logement"],
    finalite:
      "Prendre en compte le lieu de vie comme condition réelle du parcours : aire d’accueil, TFL, habitat adapté, logement, terrain privé ou situation instable.",
    questionsTravail: [
      "Le lieu de vie facilite-t-il ou complique-t-il les démarches ?",
      "Y a-t-il une demande, une urgence ou une évolution d’habitat à suivre ?",
      "Un partenaire habitat, bailleur ou collectivité est-il mobilisé ?",
      "Le sujet nécessite-t-il médiation, diagnostic ou suivi spécifique ?",
    ],
    elementsObjectivables: [
      "Type de lieu de vie",
      "Demande de logement, TFL, habitat adapté ou autre besoin identifié",
      "Partenaire habitat contacté",
      "Démarche ou diagnostic engagé",
      "Échéance, risque ou point de médiation",
    ],
    indicateursSimples: [
      "Impact du lieu de vie sur le parcours qualifié",
      "Demande habitat formalisée ou à clarifier",
      "Relais habitat identifié",
      "Risque de rupture ou tension repéré",
    ],
    relaisPossibles: ["Pôle logement / habitat ARTAG", "Bailleur", "Maison de la Métropole", "Collectivité", "EPCI", "Partenaire habitat"],
    sortieModule:
      "Une lecture du lieu de vie et de son impact concret sur le parcours, avec relais ou action habitat si nécessaire.",
  },
];
