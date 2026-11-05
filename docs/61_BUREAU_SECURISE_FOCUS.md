# 61 — Bureau professionnel allégé (Focus serveur)

## Besoin d'usage
Faciliter la reprise après interruption, la sélection d'une prochaine action et la saisie d'un imprévu sans faire parcourir de longues listes. Ne pas utiliser de note, score, classement ou indicateur sur la personne accompagnée.

## Comportement en mode professionnel sécurisé
- Chargement des tâches de **la session professionnelle serveur autorisée**, sans lecture du stockage navigateur.
- Zone « Mes 3 priorités du jour » : tâche déjà en cours, tâches en retard, échéances du jour, autres tâches. Date issue de l'API en Europe/Paris ; aucune date inventée.
- Actions immédiates sur les tâches : **Terminer**, **Reporter le rappel** (l'échéance n'est pas modifiée), **Commencer**. Le démarrage enregistre le statut `EN_COURS` sur le serveur et entre en mode Focus.
- En Focus : les commandes principales, l'ajout rapide, les rappels et la saisie express restent disponibles ; les réglages longs de tâches, listes d'activités et calculs détaillés sont masqués.
- Une modification de tâche peut être annulée dans la même session : l'API utilise le numéro de version renvoyé par le serveur et refuse l'écrasement si une autre modification est intervenue.
- Le mode Focus lui-même ne persiste pas : il s'agit d'une préférence d'affichage, conservée en mémoire de page uniquement.
- Les actions réseau restent idempotentes pour les créations ; une perte de confirmation impose une vérification, pas une seconde création indépendante.

## Limites explicites
Le serveur ne stocke **pas encore de priorité manuelle** : la sélection des trois tâches est déterministe, sans faux marqueur de priorité. Aucun accès aux dossiers sociaux n'est ajouté par cette interface. Les rappels ne sont pas des événements Outlook ; aucun SMS, email ou synchronisation externe n'est déclenché.

Cette interface ne sera utilisable avec des données réelles qu'après validations ARTAG, recette d'accessibilité en navigateur, habilitations effectives, SSI/RGPD et mise en production autorisée. Le mode démonstration localStorage demeure isolé.

## Recette
- Aucun accès localStorage, aucune donnée de démonstration affichée dans le bureau sécurisé.
- Ordre des tâches basé sur le jour serveur ; trois maximum, pas de tâches terminées.
- Démarrage `EN_COURS`, reprise, Focus masquant les détails, maintien des rappels et de la saisie express.
- Version serveur vérifiée pour l'annulation ; correction refusée en cas de concurrence.
- CI frontend/backend, confidentialité, sauvegarde/restauration et CodeQL obligatoires avant fusion.
