# INFRA, HÉBERGEMENT ET ACCÈS EXTERNES

## Destination finale du projet
L’application n’est pas pensée comme un simple prototype local.
Elle doit être préparée pour un déploiement sur l’infrastructure privée d’ARTAG.

## Exigences de destination
L’outil doit être conçu pour :
- être déployé sur le serveur privé d’ARTAG
- être accessible aux salariées autorisées de l’association
- fonctionner de manière fiable en environnement multi-utilisatrices
- être préparé pour une interconnexion avec Insertis
- pouvoir être consulté depuis l’extérieur de manière sécurisée
- limiter au maximum les problèmes de connexion, d’authentification et de session

## Contraintes d’architecture
L’application doit être pensée dès le départ pour un déploiement de type production.

Elle doit donc être compatible avec :
- un hébergement serveur privé
- un reverse proxy
- une authentification centralisée ou fédérée
- une gestion propre des sessions
- des droits d’accès par profil
- une journalisation des connexions et des actions sensibles

## Accès extérieur
Le projet doit viser :
- accès web externe sécurisé
- authentification nominative robuste
- MFA si l’environnement le permet
- gestion des rôles
- sessions stables
- séparation claire front / logique métier / données

## Interfaçage Insertis
Le projet doit être préparé pour une connexion future ou progressive avec Insertis.

Cela implique :
- une architecture propre côté API
- des identifiants exploitables pour l’échange
- une séparation claire entre interface, logique métier et couche de données
- une préparation aux échanges de données sécurisés
- l’absence de dépendances bloquantes qui empêcheraient un interfaçage ultérieur

## Interdits
- ne pas développer comme un simple prototype jetable
- ne pas coder en supposant un usage mono-utilisatrice
- ne pas lier toute l’application à des chemins locaux
- ne pas construire une authentification bricolée
- ne pas empêcher une future interconnexion avec Insertis
