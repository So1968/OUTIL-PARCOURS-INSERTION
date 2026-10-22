# Backend ARTAG — socle technique désactivé par défaut

Ce dossier introduit **Express + PostgreSQL/Prisma** conformément à `STACK_RECOMMANDEE.md` et `docs/27_ARCHITECTURE_APPLICATIVE.md`.

**État : développement seulement. Aucune donnée de bénéficiaire ne doit être utilisée.**
- Un serveur Express limité à `GET /healthz` ; toutes les routes `/api/*` répondent `503 METIER_NON_ACTIVE`.
- Écoute sur `127.0.0.1` uniquement ; refus explicite de démarrer si `NODE_ENV=production`.
- Cas de tests avec identités purement fictives : décisions d'accès par rôle, affectation, auteur de note et dérogation temporaire.
- Modèle Prisma de préparation : utilisateurs, dossiers, affectations, autorisations limitées, journal d'audit, notes partagées et réservées, références externes inactives par défaut.
- **Aucune session utilisateur, aucun mot de passe, aucune authentification réelle, aucun contrôle de dossier en base, aucune migration et aucun connecteur actif à ce stade.** Les tests de permissions sont un contrat pour l'implémentation future, pas une autorisation d'utiliser des données réelles.

## En environnement de développement isolé

```sh
npm ci --prefix backend
npm run backend:test
npm run backend:dev
```

Vérification *statique* du schéma Prisma (avec une URL fictive, sans connexion ni migration de base) :

```sh
DATABASE_URL='postgresql://demo:demo@127.0.0.1:5432/artag_demo?schema=public' npm --prefix backend run db:validate
```

Une future instance ARTAG devra obtenir validation du responsable de traitement, authentification nominative (sessions serveur), configuration chiffrée, sauvegardes testées et traçabilité conforme avant l'ouverture de la moindre route de dossier.

## Règles de conception

- Le rôle est une assertion issue d'une **session vérifiée côté serveur**, jamais la valeur du sélecteur React.
- Chaque accès au dossier doit vérifier **l'affectation effective au dossier** et la finalité professionnelle.
- Le profil technique et le CA ne lisent pas les notes individuelles. La direction lit les indicateurs agrégés ; une consultation ponctuelle du dossier nécessite une dérogation nominative et tracée.
- Les notes réservées ne sont jamais déduites d'un droit de lecture sur le dossier partagé.
- Les connecteurs Insertis, Mon Suivi Social, Outlook et OneDrive sont désactivés par défaut. Aucun secret dans Git ni dans le frontend.

## Service de lecture testé, mais non exposé

`src/caseAccessService.js` fournit `readCaseOverview` : il reçoit un futur fournisseur de sujet authentifié par le serveur, lit le rôle depuis PostgreSQL, vérifie l'affectation et journalise la lecture dans la même transaction. Son résultat ne contient que `id`, `version` et `updatedAt`, **jamais les notes professionnelles ou les données nominatives**. Les comptes et données d'essai sont exclusivement fictifs. Aucun endpoint ne l'appelle actuellement.

La CI utilise un conteneur PostgreSQL éphémère et y applique le schéma par `prisma db push` uniquement dans ce contexte. Cela n'est **pas** une migration de production ni une procédure à lancer sur une base ARTAG.

## Sessions HTTP : état de préparation

Le backend prévoit des sessions de huit heures avec jeton aléatoire de 256 bits et hachage en base, jamais une identité ou un rôle provenant des requêtes. Un compte doit être actif en base. La route `GET /api/dossiers/:caseId/overview` n'existe que si une base privée est explicitement injectée côté serveur ; elle ne lit aucune note, ne renvoie aucune identité et journalise toute lecture. L'application lancée avec `npm run backend:dev` **ne branche pas** cette base et garde toutes les routes métier fermées. Les tests HTTP utilisent uniquement PostgreSQL fictif.

Un futur callback OpenID Connect valide devra rattacher le sujet émis par un fournisseur autorisé au modèle `IdentityLink` pré-provisionné, puis appeler `issueSession`. **Ne jamais appeler cette fonction depuis une route qui accepterait un identifiant de compte envoyé par le navigateur.**

## Authentification nominative — intégration SSO préparée

Le module `src/oidcProvider.js` utilise `openid-client` 6 pour le flux d'autorisation OIDC avec PKCE, state et nonce. `src/authRouter.js` impose une tentative courte à usage unique, et contrôle la correspondance d'un `issuer + subject` cryptographiquement validé avec un lien `IdentityLink` **pré-provisionné** vers un compte actif en base. Il ne crée pas de comptes à partir du nom ou de l'email. La déconnexion révoque la session, et le serveur n'accepte pas d'opérations métier sans une session vérifiée.

L'activation est **désactivée par défaut**. Un environnement local sécurisé, sous contrôle de la structure, devra fournir `ARTAG_OIDC_ENABLED=1`, `DATABASE_URL`, `ARTAG_OIDC_ISSUER` (tenant dédié), `ARTAG_OIDC_CLIENT_ID`, `ARTAG_OIDC_CLIENT_SECRET`, `ARTAG_PUBLIC_ORIGIN` (HTTPS), `ARTAG_OIDC_REDIRECT_URI` (HTTPS, chemin `/auth/callback`). Ces valeurs ne doivent jamais être commitées. L'instance normale n'a pas ces paramètres et conserve les routes fermées. Le mode production demeure interdit.

Le test d'intégration emploie un fournisseur OIDC **simulé** pour tester les règles métier sans s'authentifier chez Microsoft ; aucune preuve d'interopérabilité réelle avec le tenant ARTAG n'en découle. La mise en production exige une revue SSI/RGPD, une configuration M365/SSO autorisée et un essai en environnement de recette.

## Écriture HTTP et CSRF (désactivés par défaut)

L'activation de la préparation des notes exige `ARTAG_OIDC_ENABLED=1` **et** `ARTAG_ENABLE_SHARED_WRITES=1`, avec `ARTAG_CSRF_SECRET` (au minimum 32 caractères aléatoires) fourni exclusivement par l'environnement de recette autorisé. Le navigateur doit joindre son cookie de session `Secure/HttpOnly`, un `Origin` HTTPS conforme et l'en-tête `X-CSRF-Token` obtenu sur `GET /auth/csrf`. Le serveur vérifie à nouveau le compte, l'affectation, la version du dossier et journalise l'opération dans une transaction PostgreSQL. Aucune écriture externe n'est active. Le frontend comprend un client same-origin *non encore branché aux écrans historiques*.

## Tâches personnelles PostgreSQL (recette contrôlée)

Le modèle `WorkTask` et `src/workTaskService.js` introduisent une liste **privée à chaque compte actif**. Les routes `/api/mes-taches` ne sont disponibles que si `ARTAG_ENABLE_WORK_TASKS=1`, `ARTAG_OIDC_ENABLED=1`, `ARTAG_CSRF_SECRET` robuste et les paramètres HTTPS/SSO sont présents. Les mutations demandent un jeton `/auth/csrf`, une session valide, vérifient propriétaire et version puis écrivent un journal transactionnel.

Le volet React ne se manifeste que si `VITE_ARTAG_SECURE_TASKS=1` et si le site est servi en HTTPS ; il ne migre ni ne partage les données du navigateur. Tests avec comptes fictifs, **aucune activation automatique, aucun dossier réel et production toujours interdite**. Détail : `docs/41_TACHES_PRIVEES_POSTGRESQL.md`.

Les passages historiques en début de ce README décrivent les étapes précédentes du prototype ; l'état actuel des routes est expliqué dans la présente section et le code.
