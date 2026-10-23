# Migrations PostgreSQL versionnées — recette exclusivement fictive

**23 octobre 2026 — livraison technique, aucune migration institutionnelle ni mise en production ARTAG.**

## Avancée réalisée

Le schéma Prisma actuel de l'outil ARTAG dispose désormais d'un historique de migration initiale dans `backend/prisma/migrations/20261023_initial_schema/migration.sql` et d'un `migration_lock.toml` PostgreSQL. Le SQL initial a été **généré par Prisma CLI 6.19.3 à partir du modèle courant**, sans connexion à une base ARTAG : types énumérés, tables, clés, relations et index. Il ne contient ni donnée de dossier ni instruction d'insertion.

Les tests GitHub Actions utilisent désormais uniquement `prisma migrate deploy`, suivie des vérifications `migrate status` et `migrate diff --exit-code` contre le modèle Prisma. Le test backend réapplique `migrate deploy` pour contrôler l'idempotence.

Le test de récupération PostgreSQL créé précédemment applique la migration sur une base vide, sauvegarde les données fictives, restaure dans une seconde base et confirme **à la fois l'intégrité du registre de migrations et l'absence de dérive du schéma après restauration**.

## Verrous et utilisation

Le programme `backend/scripts/ciMigrate.mjs` accepte uniquement les commandes `deploy`, `status` et `drift`. Il exige simultanément :

- l'environnement GitHub Actions du dépôt `So1968/OUTIL-PARCOURS-INSERTION` ;
- `ARTAG_DB_INTEGRATION_TEST=1` et `ARTAG_SCHEMA_MIGRATION_REHEARSAL=1` ;
- un accès sur `localhost` / `127.0.0.1`, port 5432, compte et mot de passe **fictifs du runner**, avec l'une des deux bases `artag_ci_demo` et `artag_ci_restore` ;
- un mode distinct de `NODE_ENV=production`.

Cela limite les erreurs de destination mais **ne constitue pas une homologation ni une protection suffisante pour administrer une base réelle**. Cette commande est volontairement inutilisable comme procédure de migration ARTAG institutionnelle. Aucun jeton ni accès Microsoft 365 n'est nécessaire.

Le script `db:push:test` est retiré des scripts npm afin de ne pas recréer le schéma en dehors de l'historique versionné.

## Confidentialité du dépôt public

Le fichier `.gitignore` interdit toujours les exports `*.sql`, sauf **la migration initiale précisément nommée**. Le contrôle `scripts/check-privacy.mjs` inspecte le SQL autorisé, vérifie les indicateurs de données personnelles et refuse les instructions DML, imports, créations de rôle, extensions et destructions de tables.

Il ne faut **jamais** committer un export PostgreSQL, un jeu de données, un `INSERT`, une configuration de base privée ou un secret. Les prochaines migrations SQL nécessiteront une revue explicite et une modification ciblée des autorisations, jamais une autorisation globale de `*.sql`.

## Attention — bases existantes

**La migration initiale est destinée exclusivement à une base vide.** Le logiciel a auparavant créé les tables de CI par `prisma db push`. Appliquer cette migration initiale sur une base déjà peuplée échouera et peut produire une situation partielle.

Pour toute future base existante, il faudra un inventaire du schéma et des données, une comparaison des différences, une sauvegarde testée et un **baselining** Prisma décidé par un responsable habilité. Il ne faut pas lancer automatiquement `migrate resolve --applied` : cette opération n'est pertinente que si la base reflète effectivement le schéma initial, après vérification officielle.

Les migrations Prisma n'ont pas de retour arrière universel automatique. Un correctif de migration, une restauration isolée, une évaluation des impacts sur les sessions et un plan de reprise doivent être préparés avant toute intervention.

## Ce qui manque toujours

- L'hébergement privé, la gestion des secrets et l'authentification SSO institutionnelle.
- L'homologation SSI/RGPD, la politique de conservation et les sauvegardes chiffrées de données réelles.
- La stratégie de déploiement et retour arrière, la prise en compte des anciennes bases et la revue d'une deuxième personne.
- Le raccordement sécurisé et autorisé d'Outlook, Insertis, Mon Suivi Social et OneDrive.
- Les tests d'intégration bout en bout sous infrastructure ARTAG approuvée.

**Conclusion : le schéma peut être reconstruit et contrôlé par migrations sur une base éphémère fictive. Ce n'est pas une autorisation d'exploiter des dossiers réels.**

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
