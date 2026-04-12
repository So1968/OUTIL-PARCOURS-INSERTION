# Avancement du projet — Outil ARTAG

## État général
Projet en phase de structuration.
Base métier largement cadrée.
Objectif : construire une application web métier déployable sur serveur, accessible depuis navigateur, sans repartir de zéro et sans progression destructive.

## Décisions déjà prises
- Architecture cible : frontend + backend + base de données
- Stack recommandée :
  - frontend : React + Vite
  - backend : Node.js + Express
  - base : PostgreSQL
  - ORM : Prisma
- Méthode : progression incrémentale, non destructive
- Document d’avancement obligatoire
- Refus des solutions techniques exotiques sans autorisation préalable

## Cadrage métier validé
- dossier unique partagé
- espace professionnel réservé
- logique de parcours
- socle autonomie
- synthèse courte
- note de continuité
- modules principaux
- modules secondaires
- traçabilité
- historique des versions
- indicateurs direction
- mode démonstration sourcé

## Ordre de reconstruction validé
1. Architecture générale
2. Droits d’accès
3. Dossier unique partagé + espace professionnel réservé
4. Parcours visuels
5. Bloc Identité / repères de parcours
6. Socle autonomie
7. Bloc professionnel / relation d’aide
8. Synthèse courte + note de continuité
9. Modules spécifiques
10. Traçabilité automatique
11. Vue direction / secours
12. Sécurisation
13. Mode démonstration sourcé

## Points de vigilance
- Ne pas mélanger logique métier et habillage visuel
- Ne pas casser l’existant
- Ne pas afficher de score brut visible
- Préserver la dignité de la personne accompagnée
- Séparer clairement dossier partagé et espace réservé
- Concevoir pour le travail réel, la reprise rapide et la continuité

## Travail en cours
- préparation du socle technique
- préparation de l’architecture applicative
- préparation du modèle de données initial

## Prochaine étape logique
Créer l’ossature technique du projet :
- frontend
- backend
- base PostgreSQL
- Prisma
- rôles utilisateurs
- premiers modèles métier

## Dette technique actuelle
- pas encore de socle backend propre
- pas encore de modèle de données implémenté
- pas encore d’authentification réelle
- pas encore de stratégie de déploiement codée

## Hypothèses ouvertes
- choix exact du mode d’authentification : session sécurisée côté serveur par défaut
- forme exacte du stockage de certains modules métier : tables dédiées vs JSON structurés
- niveau de granularité initial des permissions par bloc
