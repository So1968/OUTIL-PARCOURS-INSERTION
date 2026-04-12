# ARCHITECTURE APPLICATIVE

## Principe général
L’application ne doit pas être construite comme un simple prototype front-only.
Elle doit être pensée dès le départ comme une application exploitable en production.

## Architecture cible
L’application doit reposer sur une séparation claire entre :
- interface utilisateur
- logique métier
- couche d’accès aux données
- journalisation et événements
- sécurité / authentification
- intégrations externes

## Couches attendues
1. Frontend
2. Backend / API
3. Base de données
4. Service d’authentification / gestion des rôles
5. Service de logs / audit
6. Connecteurs d’intégration

## Règle
Aucune logique métier sensible ne doit vivre uniquement dans le frontend.

## Frontend
Le frontend doit :
- afficher les écrans
- gérer les interactions utilisateur
- respecter les droits visibles
- appeler l’API
- afficher les couches didactiques et documentaires selon le mode
- ne pas porter seul la sécurité ou les règles métier critiques

## Backend / API
Le backend doit :
- porter la logique métier
- gérer les autorisations
- gérer la traçabilité
- gérer l’historique des versions
- exposer des endpoints propres
- préparer l’interfaçage futur avec Insertis
- sécuriser les échanges

## Base de données
La base doit permettre :
- le suivi des dossiers
- l’historique
- la séparation dossier partagé / espace réservé
- la gestion des modules
- la traçabilité
- les rôles
- l’audit
- l’évolution future du projet

## Séparation technique obligatoire
Le système doit techniquement séparer :
- le dossier partagé
- l’espace professionnel réservé
- les vues direction
- les logs techniques

## Règle de sécurité
Aucune confiance implicite ne doit être accordée au frontend.
Les contrôles de droits, de rôles et d’accès doivent être validés côté serveur.

## Exigence d’évolutivité
L’architecture doit rester :
- simple
- maintenable
- standard
- extensible
- compatible avec un déploiement serveur réel

## Intention
Construire une vraie application web métier cohérente, déployable, maintenable et fidèle au cadrage métier.
