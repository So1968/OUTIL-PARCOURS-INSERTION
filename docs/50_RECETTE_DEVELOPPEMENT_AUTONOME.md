# Recette des lots de fiabilisation — 27 octobre 2026

Développement autorisé en autonomie, avec respect d'AGENTS.md et des spécifications. Données de tests exclusivement fictives. Aucun connecteur activé, aucun SSO institutionnel configuré, aucune fusion dans main ou mise en production.

## Lots réalisés

| Branche | Changement | Preuve |
| --- | --- | --- |
| `fix/fiabilisation-prototype` | Le stockage inaccessible ne confirme plus une écriture ou suppression. Dossier, fiche minute, lecture globale, évaluation et repères signalent les échecs au lieu de confirmer une conservation inexistante. | Tests de quota, accès interdit, absence de navigateur, relecture après remontage et refus d'effacement dans `storage.test.js` et `Persistence.test.jsx` |
| `fix/stabilisation-navigation` | Entrées Parcours et Appui TNS, raccourcis conservés, palette claire de l'accueil protégée contre les styles sombres globaux | `App.test.jsx` et correspondance documentaire dans le document 49 ; Chromium desktop/mobile |
| `fix/confirmation-copies` | Attente de la réponse du presse-papiers avant confirmation ; aide à la copie manuelle si refus ou absence de l'API | `Clipboard.test.jsx` : refus sur quatre écrans, attente de la promesse et API absente |
| `fix/conflits-notes-partagees` | Un conflit de sérialisation Prisma P2034 devient le conflit métier existant, sans réexécution automatique | Nouveau test PostgreSQL avec deux transactions réellement concurrentes : une note, une révision, un audit, une version incrémentée ; l'autre tentative reçoit `DossierVersionConflict`, traduit en HTTP 409 par la route existante |

Les branches sont successives : chaque branche inclut les lots précédents. Les PR doivent être ouvertes avec comme base la branche du lot précédent, ou une seule PR de revue consolidée depuis la dernière branche. Ne pas fusionner avant les contrôles requis.

## Vérifications effectuées

- Frontend : 100 tests réussis dans 20 fichiers ; lint et build réussis.
- Backend : 58 tests réussis, aucun ignoré, avec PostgreSQL 16 éphémère.
- Contrôle de confidentialité exécuté sur les fichiers suivis et les nouveaux fichiers ajoutés à l'index. Ce contrôle heuristique ne certifie pas la confidentialité de l'historique.
- Chromium : 126 ouvertures de routes (21 routes, 6 profils) sans erreur JavaScript. Il s'agit d'un contrôle d'ouverture et de refus, pas d'une recette exhaustive des interactions.
- Accueil en 1280 et 390 pixels : logo chargé, liens des deux cartes et retour accueil fonctionnels, pas de débordement horizontal, couleurs calculées conformes à la palette existante.
- Trois migrations versionnées appliquées sur une base vide créée pour cette recette ; seconde exécution sans migration à appliquer ; statut à jour et absence de différence avec le schéma Prisma.
- Restauration : données fictives du script existant, sauvegarde personnalisée, restauration transactionnelle dans une seconde base vide, empreintes identiques, registre de migrations à jour et aucune dérive après restauration. Le dump temporaire a été supprimé.

La base de test a été créée dans un conteneur isolé, exposé seulement sur 127.0.0.1. Les commandes Prisma standard ont été utilisées pour cette reproduction locale ; les restrictions du script réservé au runner GitHub n'ont pas été désactivées et l'environnement GitHub Actions n'a pas été simulé. Aucun schéma institutionnel existant n'a été migré.

## Points restant ouverts

- PR et CI distante, dont CodeQL : l'API GitHub refuse les requêtes depuis cet environnement. L'accès Git HTTPS fonctionne et permet de pousser les branches. L'autorisation réseau `api.github.com` a été ajoutée au brouillon de configuration en conservant `binaries.prisma.sh` ; elle doit être enregistrée/publiée via l'interface avant nouvelle tentative. Aucun jeton n'a été demandé ou copié. Le fonctionnement de l'API devra être revérifié après application de cette configuration.
- L'historique complet des repères d'autonomie et des décisions n'est pas implémenté par ces correctifs. Le dossier serveur métier complet et la migration des écrans restent des lots distincts du plan 48.
- La conformité complète des vingt étapes n'est pas démontrée. Les variantes documentaires de l'accueil ne sont pas toutes équivalentes ; la décision prudente du lot 49 préserve les entrées du README, les parcours du document 35 et les fonctions existantes. Aucune illustration de porte Direction non validée n'a été inventée.
- SSO réel, habilitations institutionnelles, politiques de conservation, hébergement et validation métier restent des prérequis à toute utilisation avec des données réelles.

La disponibilité du prototype de développement et la publication de son environnement cloud ne constituent pas une autorisation d'exploitation ARTAG.
