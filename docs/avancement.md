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

## Étape réalisée — socle frontend exécutable minimal
- création d'une base frontend autonome dans `frontend/`
- ajout d'un `package.json` frontend avec React, React DOM, React Router et Vite
- ajout des fichiers indispensables au démarrage :
  - `frontend/index.html`
  - `frontend/vite.config.js`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/styles.css`
- création d'un routing minimal pour :
  - accueil
  - parcours social / socio-professionnel
  - appui TNS
  - direction
- conservation et remise en forme du visuel d'accueil déjà amorcé
- correction du raccordement du logo ARTAG via `public/logo-artag.png`
- maintien d'un périmètre strictement frontend, sans ajout de logique métier sensible

## Validation de l'étape 1
- application frontend démarrée correctement en local
- pages principales accessibles
- routing validé
- build frontend validé
- logo ARTAG correctement raccordé et servi depuis `public/logo-artag.png`

## Clôture de l'étape 1
- étape 1 clôturée et considérée comme conforme

## Validation de l'étape 2
- source de vérité du logo conforme : `public/logo-artag.png`
- emplacement du fichier conforme
- usage réel du logo conforme dans le frontend
- suppression de l’asset parasite `src/logo-artag.png`
- étape 2 validée et conforme

## Validation de l'étape 3
- structure frontend simple de rôles en place
- séparation visuelle claire des 3 accès
- protection frontend minimale des routes en place
- redirection vers l’accueil en cas d’accès non autorisé
- absence de backend, d’authentification réelle, de session et de stockage persistant
- étape 3 validée et conforme

## Laissé inchangé volontairement
- aucun backend Express à ce stade
- aucune base PostgreSQL à ce stade
- aucun schéma Prisma à ce stade
- aucune authentification réelle à ce stade
- aucun module métier, aucun socle autonomie métier, aucune traçabilité serveur

## Points de vigilance immédiats
- les pages parcours, TNS et direction restent des points d'entrée techniques minimaux, pas encore des écrans métier finalisés

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
