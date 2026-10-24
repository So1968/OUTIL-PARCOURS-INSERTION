# 48 — Plan de travail préparé pour un agent de développement

Ce document **ne lance pas de tâche autonome**. Il permet à une session Codex/agent autorisée d'exécuter, sans sollicitation à chaque étape, des lots bornés avec retour GitHub. Respecter d'abord `docs/23_ORDRE_DE_TRAVAIL.md`, `AGENTS.md` et le cahier des charges existant. Aucun délai de livraison n'est garanti.

## Priorités de développement

1. **Dossier métier serveur et droits.** Faire du dossier unique PostgreSQL la source de vérité ; définir les entités strictement nécessaires aux parcours RSA/TNS, affectations, statut et clôture. Tester les droits par référent et Appui TNS, sans introduire de données nominatives fictivement « réelles ».
2. **Versionnement métier complet.** Étendre la première révision des notes partagées aux corrections/validations, décisions, objectifs, évaluations, orientations et transmissions. Conserver auteur, date, justification, valeur antérieure et version. Prévenir pertes de modification concurrente ; ne pas exposer les notes réservées.
3. **Entretiens et tâches post-entretien.** Relier les entretiens, leurs décisions, les tâches et rappels au même dossier. Prévoir confirmation des tâches proposées, échéances, estimations de charge et réessai anti-doublon.
4. **Migration progressive des écrans.** Remplacer les stockages localStorage par les API protégées, écran par écran, en préservant la rapidité de saisie et le vocabulaire métier validé.
5. **Recette de bout en bout.** Cas fictifs et rôles distincts, accès refusé, délégations expirées, édition concurrente, coupure réseau, restauration PostgreSQL, audit et conservation.
6. **Connecteurs après autorisation.** Préparer simulateurs et contrats Outlook, Insertis, OneDrive, Mon Suivi Social. Aucune donnée de bénéficiaire envoyée à un tiers sans validation institutionnelle documentée.

## Exécution de chaque lot

- Lire les spécifications et tests existants ; limiter le périmètre à une PR.
- Brancher sur main à jour ; utiliser une migration additive et versionnée si besoin.
- Ajouter des tests et leur preuve ; lancer lint, tests, build, Privacy Check, CI PostgreSQL et CodeQL.
- Ouvrir une PR explicitant modification, risque, limites et recette. Ne jamais neutraliser un contrôle pour obtenir un résultat vert.
- En cas d'erreur CI, corriger et relancer. En cas de dépendance institutionnelle manquante, documenter le blocage et poursuivre uniquement des tâches indépendantes, sans déploiement réel.

## Critères de livraison

Un lot est terminé quand les parcours métier concernés, les droits serveur, la conservation des informations et les tests sont cohérents. Le projet ne peut être qualifié d'« opérationnel à ARTAG » sans hébergement autorisé, validation RGPD/SSI, sauvegardes testées, habilitations et recette métier.

## Limites de l'autonomie

Laisser le PC allumé ou la conversation ChatGPT ouverte ne déclenche **aucun** agent permanent. Le lancement et l'exécution d'une session de codage autonome nécessitent une fonction agent/Codex disponible et reliée au dépôt, avec son mode d'approbation et ses limites. GitHub Actions déclenche les tests, pas un développeur autonome.