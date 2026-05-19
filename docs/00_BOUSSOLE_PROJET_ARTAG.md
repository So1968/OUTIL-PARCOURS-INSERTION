# BOUSSOLE DU PROJET — OUTIL PARCOURS INSERTION ARTAG

Ce document sert de règle de reprise avant toute nouvelle modification de l’interface.

L’objectif est d’éviter que l’outil parte dans une mauvaise direction en empilant des cadres sans hiérarchie.

## 1. Hiérarchie à respecter

### 1. Projet social ARTAG = cap principal

Le projet social ARTAG 2024-2026 est le cadre prioritaire de l’outil.

L’outil doit donc soutenir :

- la participation et le pouvoir d’agir des voyageurs ;
- l’aller-vers ;
- l’accès aux droits ;
- l’insertion sociale et socio-professionnelle ;
- l’habitat et les lieux de vie ;
- la santé, le vieillissement et le handicap ;
- la culture, le vivre ensemble et les jeunes ;
- l’organisation ouverte, apprenante et transversale de l’équipe ;
- la posture professionnelle ARTAG : bienveillance, non-dénonciation, confidentialité, sur-mesure, pas de côté.

Règle : l’outil ne doit pas transformer l’accompagnement ARTAG en simple procédure administrative.

### 2. Comité des financeurs = architecture organisationnelle

Le comité des financeurs donne une logique d’organisation utile :

- faire œuvre commune ;
- remettre du commun organisationnel ;
- clarifier qui fait quoi et comment ;
- distinguer travail prescrit et travail effectif ;
- décloisonner les silos ;
- construire une gare centrale physique et numérique ;
- utiliser des dossiers uniques ;
- partager des outils de suivi communs ;
- clarifier les espaces de décision, de réflexion et de suivi.

Règle : l’outil doit fonctionner comme une gare centrale de travail, pas comme une juxtaposition de pages isolées.

### 3. Référentiels Métropole / Insertis = couche d’alignement institutionnel

Les référentiels Métropole et Insertis servent à aligner :

- les parcours RSA ;
- le diagnostic ;
- le contrat ;
- les étapes ;
- les suivis ;
- les indicateurs ;
- les obligations de formalisation ;
- la confidentialité et le partage proportionné des informations.

Règle : les référentiels Métropole ne remplacent pas le projet social ARTAG. Ils viennent en appui lorsque le parcours ou le financement l’exige.

## 2. Correction de trajectoire validée

Les modifications futures doivent respecter ces décisions :

1. Le projet social ARTAG reste le cadre de sens principal.
2. Le comité des financeurs inspire l’architecture commune de l’outil.
3. Les référentiels Métropole structurent seulement les obligations de parcours / Insertis.
4. L’interface doit rester un outil métier ARTAG, pas une copie d’Insertis.
5. Le socle autonomie ne doit pas être remplacé brutalement par un diagnostic institutionnel.
6. Les 9 domaines Métropole peuvent exister comme grille complémentaire, mais pas écraser les repères validés du projet.
7. L’accueil doit rester simple : parcours social / socio-professionnel, Appui TNS, Direction discrète.
8. La continuité de service doit soutenir la reprise sans ouvrir tout le bureau privé de la collègue.
9. Le dossier unique partagé doit articuler : identité, historique, socle autonomie, synthèse courte, note de continuité, modules, relais, espace professionnel réservé.
10. La mise en forme visuelle vient après la cohérence métier.

## 3. Ordre de reprise recommandé

### Étape A — Stabiliser le cadre

- Garder `cadreProjetSocialArtag.js`.
- Garder `referentielMetropoleLyon.js`, mais comme cadre secondaire.
- Ne plus remplacer les notions existantes sans vérifier les documents projet.

### Étape B — Réparer les écrans qui ont dérivé

1. Accueil : revenir à deux entrées principales et un accès Direction discret.
2. Socle autonomie : restaurer l’esprit initial et ajouter la grille Métropole comme complément.
3. Dossier : garder dossier unique ARTAG, avec couche Insertis mais sans le transformer en mini-Insertis.
4. Continuité : renforcer la lisibilité sans changer la logique métier.

### Étape C — Harmoniser ensuite

- Créer des composants communs seulement après stabilisation métier.
- Nettoyer le CSS uniquement quand les écrans sont alignés.
- Garder le logo ARTAG en haut à gauche sur toutes les pages.

## 4. Règle de travail pour les prochains commits

Avant chaque modification importante, vérifier :

- Est-ce conforme au projet social ARTAG ?
- Est-ce utile à l’organisation commune demandée par le comité des financeurs ?
- Est-ce compatible avec les référentiels Métropole sans les laisser dominer l’outil ?
- Est-ce que cela réduit la charge mentale des professionnelles ?
- Est-ce que cela protège la confidentialité et la confiance ?
- Est-ce que cela évite de mélanger espace partagé et espace professionnel réservé ?

Si la réponse est non ou incertaine, ne pas modifier l’interface avant clarification.
