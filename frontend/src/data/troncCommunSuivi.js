export const canauxContact = ["SMS", "WhatsApp", "Appel", "Mail"];

export const typesRendezVous = [
  "Rendez-vous social",
  "Rendez-vous socio-professionnel",
  "Rendez-vous Appui TNS",
  "Rendez-vous continuité / reprise",
  "Rendez-vous partenaire",
  "Appel téléphonique",
];

export const motifsRendezVous = [
  "Premier contact / accueil",
  "Repères d’autonomie",
  "Accès aux droits",
  "Budget / urgence sociale",
  "Santé / accès aux soins",
  "Habitat / lieu de vie",
  "Projet socio-professionnel",
  "Appui TNS / activité indépendante",
  "Point de continuité",
  "Autre motif à préciser",
];

export const statutsRendezVous = [
  "À confirmer",
  "Confirmé",
  "Présent",
  "Absent excusé",
  "Absent non prévenu",
  "Reporté",
  "Annulé",
];

export const documentsCommunsParMotif = {
  "Premier contact / accueil": [
    "Pièce d’identité si disponible",
    "Courriers récents importants",
    "Numéro CAF / RSA si concerné",
    "Téléphone et accès mail si disponibles",
  ],
  "Repères d’autonomie": [
    "Courriers ou documents qui posent problème",
    "Dates importantes à ne pas oublier",
    "Informations sur les démarches en cours",
  ],
  "Accès aux droits": [
    "Courrier CAF / RSA",
    "Courrier CPAM",
    "Courrier France Travail",
    "Identifiants ou accès aux comptes en ligne",
    "Justificatifs demandés",
  ],
  "Budget / urgence sociale": [
    "Factures ou impayés",
    "Courriers de relance",
    "Justificatifs de ressources",
    "Échéancier ou dette si existant",
  ],
  "Santé / accès aux soins": [
    "Carte Vitale ou attestation CPAM",
    "Courrier MDPH si concerné",
    "Courrier complémentaire santé",
    "Date ou convocation de rendez-vous santé",
  ],
  "Habitat / lieu de vie": [
    "Justificatif de lieu de vie si disponible",
    "Courrier bailleur / collectivité / aire d’accueil",
    "Demande ou courrier logement / habitat",
  ],
  "Projet socio-professionnel": [
    "CV si disponible",
    "Identifiants France Travail si disponibles",
    "Courriers ou convocations emploi / formation",
    "Informations sur disponibilités, mobilité, garde d’enfants",
  ],
  "Appui TNS / activité indépendante": [
    "SIRET / avis INSEE si existant",
    "Courrier URSSAF",
    "Courrier impôts",
    "Courrier CAF / RSA",
    "Factures / devis",
    "Dernière déclaration de chiffre d’affaires",
  ],
  "Point de continuité": [
    "Document attendu",
    "Date de la prochaine échéance",
    "Nom du relais ou partenaire concerné",
  ],
  "Autre motif à préciser": [
    "Documents utiles à la situation",
    "Courriers récents",
    "Éléments permettant de comprendre la demande",
  ],
};

export const reglesRelanceRendezVous = [
  {
    id: "j-7",
    libelle: "J-7",
    intention: "Préparer tranquillement les documents et limiter l’oubli du rendez-vous.",
  },
  {
    id: "j-2",
    libelle: "J-2",
    intention: "Confirmer la venue et rappeler les documents essentiels.",
  },
];
