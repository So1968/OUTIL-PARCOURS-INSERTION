# Lot A — Révisions des notes partagées

Cette étape complète l'historique existant des notes partagées, sans migration
supplémentaire, sans déploiement et sans donnée réelle.

## Code livré

- Service interne de correction/validation, sur session nominative serveur et droit
  SHARED_WRITE relu en base pour le dossier.
- Verrouillage optimiste sur les versions du dossier et de la note ; traduction des
  collisions PostgreSQL en conflit 409, sans réessai destructeur.
- Historique immuable par version : auteur, date, texte, motif et validation.
- Journal d'audit dans la même transaction, avant tout succès.
- Une note validée reste figée : pas de réouverture implicite.
- Route PATCH /api/dossiers/:caseId/notes-partagees/:noteId, sous le verrou
  enableSharedWrites existant, avec origine HTTPS stricte et jeton CSRF.
- La réponse ne contient ni texte de note ni note réservée.

## Recette

Tests PostgreSQL fictifs pour refus d'accès, espace réservé, note hors dossier,
motif obligatoire, modification identique, collision concurrente, correction,
validation définitive, révocation de session et intégrité de l'historique.

Tests HTTP fictifs pour CSRF, origine étrangère, absence de droit, champs
supplémentaires refusés, invalidité et conflit 409. Les workflows existants
assurent également qualité frontend, Privacy Check et CodeQL suivant la
disponibilité GitHub.

## Limites et suite

C'est une étape du lot A et non l'achèvement de la totalité du dossier métier.
Le versionnement reste à étendre aux autres contenus validés (décisions,
objectifs, évaluations et transmissions). Les règles de correction après
validation devront être arrêtées et testées, sans altérer cet historique.
Aucun écran localStorage n'est raccordé par cette PR ; mode démo conservé.
Aucun connecteur institutionnel n'est activé.

Outil conçu par Sofia de los Rios dans le cadre de sa mission.
