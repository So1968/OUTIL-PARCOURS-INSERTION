# Renforcement de la sécurité du backend — audit croisé

**État : 23 octobre 2026, uniquement sur le code public du prototype.**

## Constat vérifié

L'audit externe transmis met en avant les risques de tentatives OIDC répétées, d'accumulation des sessions périmées, de gestion des secrets et de l'absence de mise en service institutionnelle. Un examen direct de `backend/src/` confirme :

- Les cookies `__Host-`, `HttpOnly`, `Secure` et `SameSite=Lax`, sessions opaques hachées et expiration à huit heures sont effectivement déjà prévus.
- `resolveSessionUserId` revérifie l'état `enabled` du compte en base **à chaque résolution**. La désactivation d'un compte empêche donc l'utilisation ultérieure de sa session, même sans purge immédiate de la ligne en base.
- Pour chaque accès professionnel, les fonctions métier relisent les rôles et droits applicables : changer un rôle modifie l'autorisation au prochain accès (sous réserve des tests de non-régression et de la validation opérationnelle). L'audit extérieur était trop large en affirmant l'absence de toute protection en cas de changement de rôle.
- Les routes backend sont soumises au contrôle du propriétaire, aux affectations, à la session et au journal d'audit. **Cela ne suffit pas à autoriser une mise en production**.

## Corrections de ce chantier

1. Correction de la validation `offset` sur `GET /api/mes-rappels` : les nombres de page étaient rejetés par une expression régulière incorrecte. Un test HTTP PostgreSQL couvre `?offset=0`.
2. Limitation en mémoire des tentatives `GET /auth/login` et `GET /auth/callback` : 20 tentatives par chemin et par adresse TCP sur dix minutes, puis `429` avec `Retry-After`. Les en-têtes `X-Forwarded-For` ne sont pas crus. Le nombre de clés mémoire est borné et le dépassement entraîne un refus. Tests de contention et de contournement d'en-tête ajoutés.
3. Diagnostic et purge **explicite** des anciennes sessions et tentatives OIDC : rétention technique minimale de sept jours après leur expiration/révocation, avec transaction de suppression. La commande ne supprime rien par défaut et bloque le mode production et toute exécution destructive sans confirmation explicite de l'opérateur.

### Commandes de maintenance en recette uniquement

```sh
# Sans modifications de la base : compte les lignes techniquement purgeables.
npm --prefix backend run auth:prune -- --dry-run

# À ne lancer que sur une base privée de recette validée :
ARTAG_CONFIRM_AUTH_PRUNE=1 npm --prefix backend run auth:prune -- --apply
```

La variable `DATABASE_URL` doit désigner exclusivement une base dont l'exploitant a approuvé le périmètre. Aucune exécution automatique ni planification dans le dépôt public.

## Risques toujours bloquants

- Le limiteur **n'est pas distribué** entre processus et ne remplace pas la politique de rate limiting du reverse proxy/WAF. En présence d'un proxy frontal, tous les clients peuvent partager l'IP du proxy : la configuration réseau doit être auditée avant activation.
- Pas de rotation automatique de secrets OIDC/CSRF, de coffre de secrets, de sauvegarde/restauration certifiée, ni de supervision de sécurité approuvée.
- Les données de notes ne sont pas chiffrées au niveau de la colonne ; la gestion des clés, le chiffrement au repos des bases et sauvegardes et la rétention légale exigent une décision ARTAG.
- La purge ne remplace **pas** la révocation immédiate lorsqu'un compte quitte la structure ni une politique de conservation approuvée.
- La recette SSO et les tests d'intrusion sur le vrai environnement d'ARTAG sont indispensables. Le serveur interdit toujours `NODE_ENV=production`.
- Aucun secret client, token Microsoft, code de connexion ou information de bénéficiaire ne doit être envoyé dans ce dépôt ou dans une conversation.

## Interopérabilité

Des codes d'application Microsoft, autorisations Entra et scopes Graph devront être vérifiés **sans divulguer les valeurs secrètes**. L'audit fourni ne contient pas ces codes. Les connecteurs Outlook/Insertis/Mon Suivi Social restent volontairement désactivés.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
