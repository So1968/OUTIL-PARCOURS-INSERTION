export const demarchesCreationEntreprise = {
  titre: "Création d’entreprise — démarches et documents",
  principe:
    "Quand la personne veut créer une entreprise, l’appui TNS transforme l’idée en parcours clair : qualifier l’activité, choisir une forme adaptée, préparer les documents, créer sur le guichet unique et sécuriser les impacts RSA / CAF / impôts / URSSAF.",
  liensOfficiels: [
    {
      libelle: "Entreprendre Service Public — créer une entreprise",
      url: "https://entreprendre.service-public.fr/vosdroits/N31901",
      usage: "Comprendre les démarches de création.",
    },
    {
      libelle: "Guichet unique des formalités",
      url: "https://formalites.entreprises.gouv.fr/",
      usage: "Créer, modifier ou cesser une entreprise.",
    },
    {
      libelle: "Portail e-procédures INPI",
      url: "https://procedures.inpi.fr/",
      usage: "Accéder et suivre les formalités.",
    },
    {
      libelle: "Autoentrepreneur URSSAF",
      url: "https://www.autoentrepreneur.urssaf.fr/",
      usage: "Gérer et déclarer une micro-entreprise.",
    },
    {
      libelle: "Impôts professionnels",
      url: "https://www.impots.gouv.fr/professionnel",
      usage: "Gérer fiscalité, espace professionnel, CFE.",
    },
    {
      libelle: "Annuaire des entreprises",
      url: "https://annuaire-entreprises.data.gouv.fr/",
      usage: "Vérifier SIREN, SIRET, activité et état administratif.",
    },
  ],
  scenarios: {
    creation: {
      declencheurs: ["En idée / envie de créer", "Création en cours", "Pas encore créée"],
      titre: "La personne veut créer",
      objectif:
        "Passer de l’idée à un plan de création réaliste, sans immatriculer trop vite si l’activité, les droits ou les obligations ne sont pas compris.",
      demarches: [
        "Décrire l’activité concrète : quoi, pour qui, où, comment, à quel prix.",
        "Vérifier si l’activité est réglementée ou nécessite diplôme, assurance, autorisation ou carte professionnelle.",
        "Étudier la forme adaptée : micro-entreprise souvent simple pour démarrer, mais à vérifier selon charges, risques et activité.",
        "Préparer les informations avant le guichet unique : identité, adresse, activité, date de début, options fiscales/sociales, pièces justificatives.",
        "Créer ou vérifier les accès utiles : FranceConnect, mail accessible, téléphone pour codes de validation.",
        "Faire la formalité sur le guichet unique lorsque le projet est suffisamment clarifié.",
        "Après création : récupérer SIREN/SIRET, vérifier l’annuaire des entreprises, noter les premières obligations déclaratives.",
        "Vérifier les impacts possibles sur RSA / CAF / France Travail avec la référente.",
      ],
      documents: [
        "Pièce d’identité en cours de validité",
        "Justificatif de domicile ou domiciliation",
        "Adresse mail accessible",
        "Téléphone pour codes de validation",
        "Description simple de l’activité envisagée",
        "Date souhaitée de début d’activité",
        "Nom commercial si besoin",
        "Diplôme, qualification ou expérience si activité réglementée",
        "Assurance professionnelle si nécessaire",
        "RIB",
        "Informations CAF / RSA utiles pour vérifier l’impact sur les droits",
        "Identifiants FranceConnect si disponibles",
      ],
      vigilance: [
        "Ne pas créer trop vite si les obligations déclaratives ne sont pas comprises.",
        "Vérifier les activités réglementées avant l’immatriculation.",
        "Clarifier l’impact RSA / CAF / France Travail.",
        "Prévoir un suivi simple du chiffre d’affaires, des factures et des déclarations.",
      ],
      prochaineActionModele:
        "La personne revient avec pièce d’identité, justificatif d’adresse, accès mail/téléphone, description de l’activité et documents liés au projet. L’appui TNS vérifie ensuite la faisabilité et prépare la formalité sur le guichet unique.",
    },
    regularisation: {
      declencheurs: ["À régulariser", "Activité non déclarée", "Non déclaré / risque à clarifier"],
      titre: "La situation doit être régularisée",
      objectif:
        "Comprendre ce qui existe réellement, limiter les risques et construire une reprise administrative progressive.",
      demarches: [
        "Lister ce qui a été fait : activité, clients, paiements, déclarations, courriers reçus.",
        "Vérifier si un SIRET existe via l’annuaire des entreprises.",
        "Identifier les organismes concernés : URSSAF, impôts, CAF/RSA, France Travail, assurance, banque.",
        "Classer les courriers et échéances par urgence.",
        "Décider avec la personne de la première régularisation à faire.",
      ],
      documents: [
        "Tout courrier URSSAF / impôts / CAF / France Travail",
        "SIRET ou ancien document d’immatriculation si existant",
        "Factures, devis, messages clients, preuves de paiement",
        "Relevés ou estimations de chiffre d’affaires",
        "Identifiants des comptes en ligne",
        "Échéanciers, relances, mises en demeure ou dettes éventuelles",
      ],
      vigilance: [
        "Ne pas promettre une solution immédiate si dettes ou retards importants.",
        "Distinguer ce qui est certain, supposé et à vérifier.",
        "Éviter de transmettre des informations non nécessaires sans accord.",
      ],
      prochaineActionModele:
        "La personne revient avec tous les courriers et preuves d’activité. L’appui TNS classe les urgences et vérifie l’existence administrative de l’activité.",
    },
    fermeture: {
      declencheurs: ["À fermer / radiation à envisager", "Activité arrêtée", "En pause / sommeil"],
      titre: "Fermeture ou mise en pause à étudier",
      objectif:
        "Vérifier si l’activité doit être relancée, régularisée ou fermée proprement.",
      demarches: [
        "Vérifier si l’activité existe encore administrativement.",
        "Repérer les dernières déclarations et dettes éventuelles.",
        "Clarifier si la personne veut arrêter, suspendre ou relancer.",
        "Si arrêt confirmé, préparer la cessation sur le guichet unique.",
        "Vérifier les impacts CAF/RSA et France Travail.",
      ],
      documents: [
        "SIRET / avis de situation",
        "Dernière déclaration de chiffre d’affaires",
        "Courriers URSSAF / impôts",
        "Justificatifs de dette ou échéancier",
        "Accès au guichet unique / FranceConnect",
      ],
      vigilance: [
        "Une activité arrêtée peut continuer à générer des obligations si elle n’est pas fermée.",
        "Vérifier les dettes ou déclarations manquantes avant clôture.",
      ],
      prochaineActionModele:
        "Vérifier l’état administratif de l’entreprise et décider avec la personne si l’objectif est relance, régularisation ou fermeture.",
    },
  },
};

export const documentsTnsTousTypes = [
  {
    categorie: "Identité / accès",
    items: [
      "Pièce d’identité",
      "Adresse mail accessible",
      "Téléphone pour codes de validation",
      "Identifiants FranceConnect",
      "Mots de passe utiles si la personne les connaît",
    ],
  },
  {
    categorie: "Entreprise / immatriculation",
    items: [
      "SIREN / SIRET",
      "Avis INSEE / avis de situation SIRENE",
      "Extrait d’immatriculation ou justificatif d’existence",
      "Nom commercial ou enseigne si utilisée",
      "Adresse de domiciliation ou lieu d’exercice",
    ],
  },
  {
    categorie: "Activité / clients",
    items: [
      "Description de l’activité",
      "Devis",
      "Factures",
      "Messages clients",
      "Carnet de commandes ou chantiers prévus",
      "Tarifs pratiqués",
      "Assurance professionnelle si nécessaire",
    ],
  },
  {
    categorie: "Argent / chiffre d’affaires",
    items: [
      "Dernières déclarations de chiffre d’affaires",
      "Estimation des encaissements",
      "Relevés ou preuves de paiement",
      "Charges principales",
      "Dettes ou échéanciers",
      "RIB",
    ],
  },
  {
    categorie: "Administratif / organismes",
    items: [
      "Courriers URSSAF",
      "Courriers impôts",
      "Courriers CAF / RSA",
      "Courriers France Travail",
      "Accès aux espaces en ligne",
      "Dates d’échéance ou relances",
    ],
  },
  {
    categorie: "Projet / création",
    items: [
      "Idée d’activité formulée simplement",
      "Date souhaitée de début",
      "Lieu d’exercice",
      "Public ou clients visés",
      "Besoin de matériel",
      "Besoin de formation ou qualification",
      "Aides ou accompagnements déjà sollicités",
    ],
  },
];
