# Stabilisation de l’application — arrêt de la dispersion

Ce document sert de point d’arrêt. Il clarifie ce qui doit rester stable avant toute nouvelle évolution.

## 1. Constat

L’application contient désormais plusieurs briques utiles :

- dossier parcours ;
- repères d’autonomie ;
- modules par domaine ;
- appui TNS ;
- diagnostic TNS ;
- rendez-vous / rappels / documents ;
- continuité de service ;
- direction / pilotage.

Le problème n’est plus le manque d’idées.

Le problème est maintenant :

> Trop de briques visibles, pas encore assez d’ordre stable.

L’utilisatrice peut avoir l’impression que tout part dans tous les sens.

## 2. Décision immédiate

À partir de maintenant :

```text
On n’ajoute plus de nouvelles fonctionnalités tant que la structure visible n’est pas stabilisée.
```

Priorité : rendre l’application compréhensible.

## 3. Architecture cible simple

L’application doit être comprise en 5 espaces seulement.

```text
1. Accueil
2. Dossier unique
3. Tronc commun
4. Modules spécialisés
5. Pilotage / direction
```

## 4. Rôle de chaque espace

### 1. Accueil

Question à laquelle l’écran doit répondre :

> Où est-ce que je vais ?

L’accueil ne doit pas tout expliquer.
Il doit orienter vers les grands espaces.

### 2. Dossier unique

Question à laquelle l’écran doit répondre :

> Où en est la personne ?

Le dossier doit rester le centre.
Tout doit revenir au dossier : rendez-vous, documents, modules, synthèses, prochaines actions.

### 3. Tronc commun

Question à laquelle l’écran doit répondre :

> Qu’est-ce qui concerne tous les accompagnements ?

Le tronc commun contient :

- rendez-vous ;
- rappels J-7 / J-2 ;
- documents attendus ;
- présence / absences ;
- prochaines actions ;
- relances ;
- synthèse courte ;
- historique.

Ces fonctions ne doivent pas être enfermées dans TNS, social ou socio-pro.

### 4. Modules spécialisés

Question à laquelle l’écran doit répondre :

> Quel domaine doit être travaillé ?

Les modules spécialisés servent à approfondir un sujet :

- social ;
- socio-professionnel ;
- TNS ;
- budget ;
- santé ;
- logement ;
- mobilité ;
- numérique ;
- famille ;
- projet professionnel.

Chaque module doit finir par :

- une prochaine action ;
- un responsable ;
- une échéance ;
- un document attendu ;
- une synthèse courte.

### 5. Pilotage / direction

Question à laquelle l’écran doit répondre :

> Qu’est-ce que la direction doit voir sans entrer dans l’intime des dossiers ?

Le pilotage doit rester non nominatif autant que possible.
Il sert à objectiver : charge, vigilance, retards, continuité, besoins d’équipe.

## 5. Ce qui est stable maintenant

### Stable 1 — Le dossier est le centre

Il ne faut pas créer des outils autonomes qui vivent à côté du dossier.

### Stable 2 — Le tronc commun est transversal

Les rendez-vous, rappels, documents, absences, relances et prochaines actions doivent servir à tous les accompagnements.

### Stable 3 — TNS est un module spécialisé

Appui TNS ne doit pas devenir une application séparée.
Il traite uniquement ce qui concerne l’activité indépendante :

- création ;
- régularisation ;
- fermeture ;
- SIRET ;
- statut ;
- chiffre d’affaires ;
- URSSAF ;
- impôts ;
- impact CAF/RSA ;
- documents TNS.

### Stable 4 — Social et socio-pro doivent bénéficier des mêmes facilités

Ce qui aide TNS doit aussi aider les autres accompagnements quand c’est transversal.

### Stable 5 — Une page doit avoir une seule intention

On évite les pages qui font tout.

## 6. Ce qui doit être nettoyé ensuite

### 1. Clarifier l’accueil

L’accueil doit afficher seulement les grands choix :

- ouvrir un dossier ;
- préparer / suivre un rendez-vous ;
- compléter les repères ;
- ouvrir un module spécialisé ;
- accéder au pilotage.

### 2. Clarifier le dossier

Le dossier doit afficher en haut :

- identité courte ;
- registre ;
- référente ;
- prochaine action ;
- prochain rendez-vous ;
- niveau de vigilance ;
- documents manquants.

Le reste doit être repliable.

### 3. Clarifier le tronc commun

Créer une page claire :

```text
Rendez-vous / rappels / documents / présence / prochaine action
```

Cette page doit être accessible depuis le dossier.

### 4. Clarifier TNS

TNS doit être réduit à :

```text
Où en est la boîte ?
```

Puis :

- création ;
- régularisation ;
- fermeture ;
- documents ;
- liens officiels ;
- vigilance ;
- coordination.

### 5. Réduire les doublons

Les mêmes fonctions ne doivent pas apparaître à plusieurs endroits avec des logiques différentes.

Exemple : les rappels de rendez-vous ne doivent pas être codés séparément dans TNS et dans le tronc commun.

## 7. Règle de travail pour la suite

Avant toute modification, répondre à ces trois questions :

1. Est-ce une fonction de tronc commun ?
2. Est-ce une fonction spécialisée d’un module ?
3. Est-ce que cette modification rend l’application plus claire ?

Si la réponse à la troisième question est non, on ne modifie pas.

## 8. Prochaine étape validée

La prochaine étape ne doit pas être une nouvelle fonctionnalité.

La prochaine étape doit être :

```text
faire une page d’accueil de stabilisation
```

Elle doit montrer clairement :

- Dossier unique ;
- Rendez-vous / rappels / documents ;
- Repères d’autonomie ;
- Modules spécialisés ;
- Appui TNS ;
- Pilotage.

Objectif : que l’utilisatrice sache toujours où elle est et où aller.

## 9. Phrase repère

> On ne construit plus des morceaux. On stabilise la carte de navigation.
