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
- Les contrôles automatiques vérifient lint, tests, build et les noms/extensions de fichiers à risque. Ils ne certifient pas l’absence de données personnelles dans le contenu textuel ou dans l’historique Git.
- Ce dépôt est public à la date de l’état des lieux du 22 octobre 2026 : **aucune donnée réelle de bénéficiaire, document professionnel confidentiel ou secret d’accès ne doit y figurer**.
- Le frontend reste un prototype : **ne pas y saisir de données réelles avant validation ARTAG**, authentification, droits serveur, stockage et sécurité conformes.
- Les documents professionnels restent dans les espaces ARTAG autorisés, sans copie automatique vers GitHub. Toute connexion Outlook, OneDrive ou Insertis exige une validation préalable et un test effectif.
