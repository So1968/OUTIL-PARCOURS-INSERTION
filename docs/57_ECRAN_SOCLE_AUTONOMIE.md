# 57 — Écran professionnel du socle autonomie

## Périmètre
Nouvelle route de recette `/dossiers/:caseId/socle-autonomie`, accessible uniquement depuis le mode serveur HTTPS lorsque les notes sécurisées sont explicitement activées. L'entrée figure dans la file active uniquement si la référente peut gérer l'identification du dossier.

L'écran permet de :
- charger les huit questions validées sans les réécrire ni calculer de score ;
- consulter les repères déjà enregistrés et leurs versions antérieures ;
- compléter ou corriger un repère explicitement, conserver les items non abordés inconnus ;
- fournir un motif, afficher les anciennes valeurs et le compte auteur ;
- refuser les réponses inattendues, une version périmée ou une réponse serveur incohérente ;
- conserver la saisie en cas de conflit réseau et imposer une relecture avant nouvelle action ;
- effacer les contenus de l'interface lors d'un refus d'accès ou d'un changement de dossier.

Le client demande un jeton CSRF frais à chaque mutation, sans stocker de donnée métier en localStorage. Les routes serveur sont celles du lot `docs/56_SOCLE_AUTONOMIE_VERSIONNE.md`.

## Limites
- L'ancien écran `SocleAutonomiePage.jsx` reste démonstratif, isolé du mode sécurisé.
- Aucun accès en mode partage avec la personne ni habilitation élargie n'est créé ; nécessité d'une validation de la politique de droits ARTAG.
- Pas de transfert vers Insertis, aucun compte institutionnel de recette activé, aucune donnée réelle et aucun déploiement.
- Recette visuelle sur vrai navigateur et validation métier encore à réaliser avant usage professionnel.

## Tests
Contrat strict du serveur, absence de stockage navigateur, saisie explicite, édition/versionnement, conflit avec relecture, perte de droits. Vérification CI frontend et backend/PostgreSQL, confidentialité, restauration, CodeQL.
