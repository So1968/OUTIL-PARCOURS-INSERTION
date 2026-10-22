# Tâches professionnelles privées — première intégration PostgreSQL

**Étape du 23 octobre 2026 — recette technique exclusivement fictive, production toujours interdite.**

## Ce qui est désormais développé

- Modèle Prisma `WorkTask` : propriétaire (compte ARTAG actif), titre court, échéance facultative, rappel J0/J1/J2/J7, durée estimée facultative, statut, version et dates techniques.
- Service `backend/src/workTaskService.js` : lecture des tâches **de la personne connectée uniquement**, par pages de 100 ; création et mise à jour avec **contrôle du propriétaire dans chaque requête**, version concurrente, validation stricte des champs et transaction de journalisation.
- Routes préparées : `GET /api/mes-taches`, `POST /api/mes-taches`, `PATCH /api/mes-taches/:taskId`.
- Les opérations de création/modification exigent une session de compte actif, un `Origin` conforme et un jeton CSRF ; un rôle, identifiant de propriétaire ou numéro de dossier fourni par le navigateur n'élargit **jamais** les droits.
- Accès refusé aux rôles Direction, Gouvernance et Administration technique pour cette liste individuelle ; les comptes professionnels ordinaires voient **leurs tâches personnelles et rien d'autre**.
- Tests PostgreSQL réels mais **entièrement fictifs** dans GitHub Actions : anonymat, séparation des comptes, CSRF, versions, refus de fuite, journalisation et déconnexion.
- Adaptateur frontend `secureTasksApi.js` et volet `SecureTasksPanel`, visibles uniquement avec `VITE_ARTAG_SECURE_TASKS=1` **sur HTTPS**. Le frontend démo reste local et séparé du backend.

## Sécurité : configuration bloquée par défaut

Le backend n'active les routes que lorsque les conditions sont réunies :
`ARTAG_OIDC_ENABLED=1`, `ARTAG_ENABLE_WORK_TASKS=1`, `ARTAG_CSRF_SECRET` (secret aléatoire robuste), la connexion PostgreSQL et les paramètres SSO/OIDC HTTPS autorisés.

L'interface affiche les tâches privées uniquement avec `VITE_ARTAG_SECURE_TASKS=1` dans une application servie via HTTPS. Ce paramètre frontend **ne constitue pas une autorisation** : c'est le serveur qui vérifie la session et les droits. Une session absente ou non habilitée renvoie un refus.

Les flags sont des paramètres futurs d'un environnement **de recette privé contrôlé**. Le serveur interdit toujours `NODE_ENV=production`. La présence de l'interface n'autorise pas l'utilisation de données réelles.

## Limitations et étapes restantes

1. Pas de migration ni de reprise automatique des tâches du `localStorage` (évite les doublons et fuites). La maquette locale ne se substitue pas à l'espace professionnel privé.
2. Pas encore de synchronisation Outlook/To Do ou de notifications système ; les rappels locaux apparaissent à l'ouverture du tableau, pas lorsque le navigateur est fermé.
3. Pas encore d'affectation de tâches à des dossiers nominatifs : une liaison future devra vérifier l'habilitation sur **chaque** dossier avant tout rattachement.
4. Pas d'interface de récupération des versions en conflit autre que le message « Recharge la liste ». Pas de mécanisme de suppression/restauration des tâches en serveur à ce stade.
5. La sauvegarde ne constitue pas une exploitation conforme tant que l'hébergement, les sauvegardes/restaurations, le contrôle RGPD/SSI, les règles de rétention, la revue OIDC et la recette ARTAG n'ont pas été validés.
6. Les libellés de tâches sont destinés à rester concis ; aucun texte de note réservée ni donnée personnelle sensible ne doit être reproduit dans une intégration externe.
7. L'interface d'essai ne doit pas introduire d'informations nominatives de bénéficiaires dans le dépôt Git public.

**Décision de déploiement : NON AUTORISÉ sans validation institutionnelle, y compris pour les tests avec bénéficiaires réels.**

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
