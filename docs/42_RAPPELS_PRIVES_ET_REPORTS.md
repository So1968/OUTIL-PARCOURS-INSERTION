# Rappels protégés et reports dans le bureau quotidien

**État : code de recette en environnement fictif, déploiement ARTAG réel interdit sans validation SSI/RGPD.**

## Comportement développé

La future API privée gère maintenant une lecture de rappels personnels :
- `GET /api/mes-rappels` avec pagination, seulement si SSO, PostgreSQL, secret CSRF et `ARTAG_ENABLE_WORK_TASKS=1` sont configurés côté serveur ;
- propriétaire issu exclusivement de la session en base (jamais de l'URL ni du navigateur), compte habilité, audit de consultation ;
- rappel de tâche non terminée à échéance : jour J, 1, 2 ou 7 jours avant la date indiquée ;
- date de référence calculée dans le fuseau **Europe/Paris** pour éviter les décalages liés à l'heure de la machine ou au passage été/hiver ;
- possibilité de **reporter le rappel jusqu'à demain** par `snoozedUntil`, sans supprimer ni déplacer la date limite originelle ;
- action **Terminer** directement dans le volet privé, qui retire ensuite la tâche des rappels actifs.

Le volet `SecureTasksPanel` n'apparaît que sur un site professionnel HTTPS avec une option de build explicite. Les opérations restent protégées par la session HttpOnly, l'autorisation serveur, le contrôle CSRF, les versions anti-écrasement et les écritures d'audit.

## Règles de confidentialité

- Aucune notification email, Teams ou Outlook n'est envoyée.
- Aucun contenu de note réservée, numéro de dossier ou identité de bénéficiaire n'est transmis hors ARTAG.
- Les titres de tâches restent des **données professionnelles potentiellement sensibles** : ne pas les copier dans un calendrier externe tant qu'une revue des champs exportables n'a pas été approuvée.
- Le serveur utilise les affectations nominatives et ne permet pas à la Direction, au CA ou à l'administration technique de consulter la liste personnelle d'un autre professionnel.
- Les tâches existantes du prototype dans `localStorage` ne sont pas migrées automatiquement.
- Les délais indiqués sont des **choix de l'utilisateur**, pas des exigences officielles de la Métropole de Lyon.

## Recette réalisée en CI

Les tests avec PostgreSQL éphémère et données fictives vérifient les sessions, CSRF, propriétaire, journalisation, concurrence, filtres de rappels, date de report, statut « Fait », et dates civiles autour des changements d'heure. Le frontend teste l'absence de tout appel réseau en mode démonstration.

## À réaliser ensuite

Hébergement privé approuvé, vrai fournisseur SSO/M365 ARTAG, sauvegarde/restauration, procédures d'exploitation et revue de la politique de conservation. La synchronisation Outlook exigera ensuite les autorisations Microsoft Graph et un mécanisme de déduplication/reprise après erreur ; aucune connexion n'est activée à ce stade.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
