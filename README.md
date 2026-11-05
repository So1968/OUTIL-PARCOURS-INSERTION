# PROJET ARTAG — OUTIL DE PARCOURS ET D’APPUI

## Objet du projet
Ce projet correspond à la mise en œuvre d’un outil de parcours et d’appui pour ARTAG.

Il s’agit d’un projet déjà cadré sur le fond, sur l’architecture, sur les contenus fonctionnels, sur l’orientation visuelle générale, sur la séparation des espaces de travail, sur la couche didactique, sur la logique de démonstration, sur la sécurité et sur la perspective de déploiement.

## Important
Ce projet ne doit pas être réinventé.

Il ne faut pas :
- changer la logique métier
- renommer les parties validées
- simplifier librement la structure
- proposer une autre direction produit
- remplacer les spécifications par une interprétation personnelle
- transformer le projet en simple maquette décorative
- transformer le projet en dashboard startup
- transformer le projet en formulaire administratif compact

## Principe de travail
Le projet doit être exécuté fidèlement à partir :
- du code existant
- des assets réels
- des fichiers contenus dans le dossier `docs/`

En cas de doute :
- conserver l’existant
- ne rien inventer
- ne pas improviser

## Structure du projet
- `frontend/src/` : interface React et logique du prototype
- `public/` : assets publiés par Vite (voir `frontend/vite.config.js`), dont le logo ARTAG utilisé au build
- `docs/` : spécifications complètes et obligatoires du projet

## Backend — fondations techniques

Un socle séparé `backend/` est en préparation sur GitHub : Express, schéma PostgreSQL/Prisma, contrôles d'habilitation testables côté serveur. Les routes de dossiers restent **désactivées** et le démarrage en production est bloqué.

- [Instructions et limitations du backend](backend/README.md).
- [Habilitations et état du socle](docs/37_SOCLE_BACKEND_ET_HABILITATIONS.md).
- [Correspondance provisoire avec les référentiels de la Métropole](docs/38_CORRESPONDANCE_REFERENTIELS_METROPOLE.md) : repérage documentaire, sans créer d'obligations non confirmées.

Le frontend existant reste en mode prototype et n'est pas relié à cette API. Ne pas y saisir de données réelles.

Un [écran de notes partagées pour la recette privée](docs/50_ECRAN_NOTES_PARTAGEES.md) prépare le chargement, la correction, la validation et l'historique via l'API. Il est désactivé par défaut, exige HTTPS et ne reprend aucune donnée locale du prototype.

La [file active serveur du même module](docs/51_FILE_ACTIVE_SERVEUR.md) permet d'ouvrir les notes depuis les seuls dossiers autorisés en rédaction, avec leur numéro ARTAG. Les dossiers sans numéro sont conservés et signalés pour identification, sans référence générée automatiquement.

L'[API du numéro ARTAG versionné](docs/52_REFERENCE_ARTAG_VERSIONNEE.md) prépare son attribution/correction par la référente titulaire sur un dossier existant identifié. Elle conserve ancienne valeur, auteur et motif, refuse les conflits et ne propose pas d'attribution en aveugle depuis la liste.

L'[écran Identité / références](docs/53_ECRAN_REFERENCE_ARTAG.md) relie maintenant la file active à la correction motivée et à l'historique d'un numéro déjà renseigné. Le module de recette reste désactivé par défaut ; une coupure réseau ne provoque aucun renvoi automatique.

## Démarrage local

Depuis la racine du dépôt :

```bash
npm install --prefix frontend
npm run dev
```

Contrôles avant livraison :

```bash
npm run lint
npm test
npm run build
npm run privacy
```

L’application reste actuellement un prototype frontend. Les droits visibles et le stockage local ne remplacent pas l’authentification, les autorisations serveur, la base de données et la traçabilité prévues dans l’architecture cible.

## Entrées principales validées
- Parcours social / socio-professionnel
- Appui TNS
- Direction

## Assets obligatoires
Le vrai logo ARTAG doit être utilisé :
- fichier : `public/logo-artag.png`
- ne pas déformer
- ne pas recolorer
- vérifier qu’il s’affiche réellement

## Signature à conserver
Outil conçu par Sofia de los Rios dans le cadre de sa mission

Toujours écrire :
- Sofia avec un f
- de los Rios

## Règle finale
Aucune partie du projet ne doit être modifiée hors des spécifications fournies dans `docs/`.

## Entretien du dépôt et confidentialité

- Navigation dans les spécifications : [index documentaire](docs/INDEX.md).
- `main` contient le code consolidé. Les branches de fonctionnalités fusionnées sont des archives de développement, non des versions concurrentes à réintégrer.
- Les contrôles automatiques vérifient lint, tests, build et les chemins/extensions à risque ainsi que certains motifs sensibles dans les fichiers texte suivis par Git. Ils ne certifient pas l’absence de données personnelles non reconnaissables automatiquement ni la confidentialité de l’historique Git.
- Ce dépôt est public à la date de l’état des lieux du 22 octobre 2026 : **aucune donnée réelle de bénéficiaire, document professionnel confidentiel ou secret d’accès ne doit y figurer**.
- Le frontend reste un prototype : **ne pas y saisir de données réelles avant validation ARTAG**, authentification, droits serveur, stockage et sécurité conformes.
- Les documents professionnels restent dans les espaces ARTAG autorisés, sans copie automatique vers GitHub. Toute connexion Outlook, OneDrive ou Insertis exige une validation préalable et un test effectif.

- Les anciennes branches peuvent être archivées sous `archive/20261022/*` (tags Git) avant suppression : l’historique demeure accessible sans multiplier les branches de développement.
