# Backend et habilitations — socle technique au 22 octobre 2026

Ce document complète le cadrage métier sans le remplacer : `docs/03_PROFILS_ACCES_DROITS.md`, `docs/27_ARCHITECTURE_APPLICATIVE.md` et `docs/30_PROFILS_DROITS_TRACABILITE.md`.

## Étape d'authentification OIDC (préparée, non activée)

- La bibliothèque `openid-client` 6 valide les réponses OpenID Connect : code d'autorisation, PKCE S256, état et nonce.
- L'émetteur doit être **HTTPS**, et pour Microsoft Entra le tenant doit être dédié ; les autorités partagées `common`, `organizations` et `consumers` sont refusées.
- La tentative de connexion est stockée sous empreinte de l'état et **consommée à usage unique** au retour du fournisseur. Le navigateur doit aussi présenter le cookie d'état correspondant.
- Le couple `issuer` / `subject` n'ouvre une session que s'il figure déjà dans la table `IdentityLink` reliée à un compte actif. **Jamais de création automatique d'utilisateur ni de droit à partir d'un email.**
- Les sessions sont créées uniquement après validation du fournisseur et association au compte habilité ; déconnexion avec révocation côté serveur et vérification `Origin`.
- `backend/src/server.js` garde les routes métier fermées par défaut, refuse toujours `NODE_ENV=production` et n'active les modules de connexion qu'avec `ARTAG_OIDC_ENABLED=1` et tous les paramètres institutionnels présents.
- Les tests valident le parcours avec un **faux fournisseur déterministe** et une base PostgreSQL éphémère. **Ils ne remplacent pas un test SSO réel validé par ARTAG.**
- Aucun mot de passe, secret ou jeton ne figure dans le dépôt.

**Important :** le code constitue une préparation d'intégration SSO, pas une autorisation d'usage réel. Avant toute activation institutionnelle : revue indépendante, protection TLS et proxy, règles de provisionnement, MFA, procédures de révocation et validation ARTAG.

## Étape suivante — sessions serveur et route HTTP protégée (non activée en exploitation)

- `backend/src/sessions.js` crée des jetons aléatoires de 256 bits. Seul leur **hachage** est stocké dans PostgreSQL ; expiration après huit heures, révocation possible, compte utilisateur actif obligatoire.
- Le navigateur ne contient qu'un cookie opaque `__Host-artag-session` (`Secure`, `HttpOnly`, `SameSite=Lax`). Un rôle transmis par le navigateur n'est jamais accepté comme preuve d'autorisation.
- Un modèle `IdentityLink` permet le **provisionnement manuel contrôlé** du futur couple (émetteur OIDC, sujet), sans créer automatiquement des comptes à partir des emails.
- `GET /api/dossiers/:caseId/overview` nécessite l'injection **côté serveur** de la base. Il réutilise les contrôles de permissions par dossier et la journalisation transactionnelle et ne retourne que l'identifiant technique, la version et la date de modification.
- Les tests vérifient les accès avec/sans cookie, les refus de la Direction, la révocation, et l'absence de notes personnelles dans la réponse sur une base PostgreSQL éphémère.
- **Par défaut `server.js` n'injecte aucune base** : l'application accessible localement retourne toujours `503` pour les routes de dossier. L'authentification OIDC institutionnelle reste à configurer et valider, aucun accès à des données ARTAG réelles n'est ouvert.

## Étape supplémentaire : lecture contrôlée, réservée au backend

- `backend/src/caseAccessService.js` prépare une **lecture de métadonnées uniquement**, jamais le contenu des notes ni les informations personnelles.
- Le fournisseur d'identité vérifiée devra fournir l'identifiant de session, puis le backend relira dans PostgreSQL le **rôle et l'activation du compte**. Les rôles transmis par le navigateur sont ignorés.
- La lecture vérifie la référente ou l'affectation explicite à un dossier ; une dérogation de Direction doit être nominative, approuvée et encore valide.
- Chaque lecture réussie exige une entrée `AuditEvent` créée dans une transaction PostgreSQL ; si la trace échoue, la consultation échoue.
- Tests unitaires et **test d'intégration sur un PostgreSQL éphémère dans GitHub Actions**. Aucun dossier ni compte ARTAG réel n'est utilisé.
- Ce service n'est **branché à aucune route HTTP**. Le serveur renvoie toujours `503 METIER_NON_ACTIVE` pour les routes de dossiers. Il n'existe pas encore de session SSO réelle.

## Socle préparé et non activé

- Backend Express + Helmet, dépendances verrouillées, modèle PostgreSQL/Prisma à valider.
- `backend/src/policy.js` définit des règles de refus par défaut (role + affectation + périmètre + accès temporaire borné) et des tests avec comptes **fictifs**.
- Seul `GET /healthz` est accessible. Toute route `/api/*` retourne `503 METIER_NON_ACTIVE`.
- Le serveur refuse le mode production et écoute en développement sur `127.0.0.1`.
- Aucun dépôt de données de bénéficiaires, aucune migration de base réelle, aucune session ni connecteur actif.

## Règles métier que la future implémentation devra appliquer

1. Un rôle choisi dans React ne constitue jamais une authentification.
2. L'Appui TNS agit sur les seules missions et informations qui lui sont attribuées ; pas de dossier social complet par défaut.
3. L'accueil et les relais ne voient que le nécessaire à leur intervention.
4. Les analyses professionnelles et notes réservées ne sont jamais partagées implicitement.
5. La direction dispose d'indicateurs agrégés ; un accès exceptionnel doit être justifié, autorisé et tracé.
6. La gouvernance / CA ne consulte pas de dossiers nominatifs. L'administration technique ne lit pas les notes métier par défaut.
7. Les futurs échanges Insertis, Mon Suivi Social, Outlook, OneDrive devront être validés et désactivés par défaut.

## Ce qui bloque encore la production

- SSO ou authentification et MFA conforme ARTAG, gestion de session serveur et CSRF.
- Base PostgreSQL privée, migrations encadrées, transactions, tests de restauration.
- API métier avec tests d'autorisation sur chaque objet et cloisonnement documentaire.
- Journalisation vérifiée de toute consultation d'espace réservé et des ouvertures temporaires.
- Validation RGPD, sécurité et modalités d'hébergement ARTAG.
- Accord d'intégration pour chaque service externe.

**Ne jamais saisir de données réelles dans le prototype.**

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
