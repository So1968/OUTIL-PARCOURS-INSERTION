# 64 — Bloc professionnel réservé : relation d’aide, historique et accès strict

## Cahier des charges respecté
Le fichier de référence est `docs/10_BLOC_PRO_RELATION_AIDE.md`. Le bloc reste **strictement interne à la professionnelle**, sans visibilité par la personne accompagnée, un relais, l'appui TNS, la direction ou l'administration technique. Il sert à prendre du recul, objectiver ce qui se joue dans la relation et ajuster la posture professionnelle, sans diagnostic ni notation de la personne.

Ses **six axes** sont :
- entrée en relation ;
- expression de la demande ;
- réception de l’aide proposée ;
- possibilité de co-construction ;
- rapport au cadre ;
- posture professionnelle à privilégier.

L'API utilise uniquement ces six rubriques structurées ; elles peuvent rester vides lorsque l'information est inconnue. Aucun contenu n'est généré automatiquement.

## Propriété des observations
Le stockage PostgreSQL associe chaque version au couple **dossier + autrice**. Il ne s'agit pas d'un champ partagé de dossier, ni d'une note de continuité.

La consultation exige à la fois :
1. une session institutionnelle active avec rôle `REFERENTE` ;
2. la titularité **actuelle** du dossier, non archivé, identifié par une référence ARTAG valide ;
3. la propriété de chaque enregistrement consulté.

Lors d'un changement de référente, la nouvelle professionnelle ne peut accéder au contenu de sa prédécesseure, **même si elle est désormais titulaire du même dossier**. Elle peut créer ses propres observations. L'ancienne professionnelle ne peut plus consulter le dossier après son transfert ; ses observations restent conservées pour un éventuel circuit exceptionnel institutionnel encore à définir. Aucun droit de lecture exceptionnel n'est activé.

## Versionnement et protection
- État courant `CaseProfessionalReflection` par autrice et historique immuable `CaseProfessionalReflectionRevision` : précédent, nouveau, autrice, date, motif, version du dossier.
- Version commune du dossier et transactions sérialisables : refus des écritures concurrentes ou des historiques incohérents.
- Lecture paginée (25 versions maximum par page) et audit d'accès **sans contenu ni motif sensible**.
- Routes de recette, uniquement si le backend sécurisé est explicitement activé :
  - `GET /api/dossiers/:caseId/reflexion-professionnelle` ;
  - `PATCH /api/dossiers/:caseId/reflexion-professionnelle` avec `{expectedVersion, content, reason}` ;
  - historique antérieur par `?beforeVersion=N`.
- Accès refusé de façon uniforme aux comptes non autorisés ; protection CSRF des modifications.
- **Aucun écran professionnel n'est encore livré dans ce lot** : il relève du lot suivant. Aucune utilisation de données réelles n'est autorisée avant recette, conformité institutionnelle, SSI/RGPD et hébergement adapté. La migration ne charge aucune donnée.

## Recette
Tests unitaires des six axes et de leurs contraintes ; tests HTTP/PostgreSQL fictifs : droits, accès non nominaux, CSRF, conflits, historique, absence de texte dans l'audit et changement de référente. Les cinq contrôles CI doivent réussir avant fusion.
