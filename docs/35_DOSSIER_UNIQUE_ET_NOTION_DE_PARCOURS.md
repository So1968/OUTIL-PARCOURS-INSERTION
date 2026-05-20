# Dossier unique cible et notion de parcours

Ce document clarifie une règle importante : **le dossier unique est une cible à terme**, mais ce n’est pas encore la réalité actuelle de travail. L’outil doit donc rester lisible par parcours aujourd’hui, tout en préparant une architecture compatible avec un futur dossier unique.

## 1. Point de vigilance immédiat

Il ne faut pas faire croire que l’organisation fonctionne déjà avec un dossier unique.

Aujourd’hui, les professionnelles travaillent encore avec des cadres, parcours, outils et attendus distincts. L’application doit respecter cette réalité.

La cible à terme peut être :

```text
un dossier unique
+ un tronc commun
+ des modules spécialisés
+ des registres d’accompagnement
```

Mais en V1, l’usage doit rester simple et métier :

```text
Quel parcours ou cadre de suivi suis-je en train d’accompagner ?
```

## 2. Règle de conception

```text
V1 : parcours visibles et séparés pour rester compréhensible.
Cible future : architecture compatible avec un dossier unique.
```

Autrement dit :

- on ne fusionne pas artificiellement tous les parcours maintenant ;
- on évite les doublons techniques quand c’est possible ;
- on garde des portes d’entrée claires pour les utilisatrices ;
- on prépare progressivement les briques communes utiles à tous.

## 3. Pourquoi garder la notion de parcours ?

La notion de parcours est nécessaire parce qu’elle parle au métier.

Elle permet de comprendre rapidement :

- le cadre d’accompagnement ;
- le niveau d’attente institutionnelle ;
- le type de suivi attendu ;
- la fréquence des rendez-vous ;
- les partenaires possibles ;
- les éléments à formaliser ;
- les sorties attendues.

Sans la notion de parcours, l’outil risque d’être perçu comme un gros dossier généraliste difficile à lire.

## 4. Ce qui doit rester visible pour l’utilisatrice

L’utilisatrice doit voir des portes d’entrée simples :

```text
Parcours social
Parcours socio-professionnel
Appui TNS
Continuité de service
Pilotage / direction
```

Ces portes d’entrée doivent rester compréhensibles même si, en arrière-plan, certaines briques sont partagées.

## 5. Différence entre parcours, tronc commun et module

### Parcours

Le parcours répond à la question :

> Dans quel cadre accompagne-t-on la personne ?

Exemples :

- parcours social ;
- parcours socio-professionnel ;
- parcours avec appui TNS ;
- situation en continuité / reprise.

### Tronc commun

Le tronc commun répond à la question :

> Qu’est-ce qui sert à plusieurs accompagnements ?

Il contient des fonctions transversales :

- rendez-vous ;
- rappels ;
- documents ;
- présence / absences ;
- prochaines actions ;
- relances ;
- synthèse courte ;
- historique.

Important : le tronc commun ne doit pas effacer les parcours. Il doit seulement éviter de refaire trois fois les mêmes outils.

### Module spécialisé

Le module spécialisé répond à la question :

> Quel sujet doit être travaillé ?

Exemples :

- budget ;
- santé ;
- logement ;
- mobilité ;
- numérique ;
- projet professionnel ;
- activité indépendante / TNS.

## 6. Formulation simple pour l’interface

Éviter les mots trop techniques dans l’interface.

Préférer :

```text
Choisir le cadre du suivi
```

ou :

```text
Quel parcours accompagne-t-on ?
```

Puis proposer :

```text
Social
Socio-professionnel
Appui TNS
Continuité / reprise
```

## 7. Lecture métier des parcours

### Parcours social

But : stabiliser la situation, sécuriser les droits, réduire les freins de vie quotidienne.

L’outil doit aider à suivre :

- droits ;
- budget ;
- santé ;
- logement / lieu de vie ;
- famille ;
- mobilité ;
- numérique ;
- démarches essentielles.

### Parcours socio-professionnel

But : soutenir la mise en mouvement vers emploi, formation, activité ou étape réaliste.

L’outil doit aider à suivre :

- projet professionnel ;
- freins à l’emploi ;
- formation ;
- disponibilité ;
- mobilité ;
- garde d’enfants ;
- partenaires emploi ;
- étapes et contacts attendus.

### Appui TNS

But : éclairer une situation d’activité indépendante.

L’outil doit aider à suivre :

- création ;
- régularisation ;
- fermeture ;
- SIRET ;
- statut ;
- chiffre d’affaires ;
- URSSAF ;
- impôts ;
- impact CAF/RSA ;
- documents utiles.

Appui TNS n’est pas un parcours complet autonome : c’est un appui spécialisé qui peut s’inscrire dans un parcours social ou socio-professionnel.

### Continuité / reprise

But : permettre à une collègue de reprendre sans tout ouvrir.

L’outil doit montrer uniquement :

- dernière action ;
- prochaine action ;
- échéance ;
- document attendu ;
- relais mobilisé ;
- niveau de vigilance.

## 8. Structure d’accueil abordable

La page d’accueil doit présenter les entrées comme des choix simples :

```text
1. Ouvrir un dossier ou un suivi existant
2. Préparer / suivre un rendez-vous
3. Choisir le cadre du suivi
   - social
   - socio-professionnel
   - appui TNS
4. Compléter les repères d’autonomie
5. Ouvrir un module spécialisé
6. Voir la continuité / pilotage
```

L’utilisatrice doit pouvoir comprendre sans connaître les mots “tronc commun” ou “architecture interne”.

## 9. Règle finale

```text
Aujourd’hui : parcours visibles, abordables et respectueux de l’organisation réelle.
Demain : architecture prête pour un dossier unique si l’organisation évolue vers ce modèle.
```

Le dossier unique est une cible possible.
Le parcours reste la façon simple d’entrer dans le travail aujourd’hui.
Le tronc commun évite de refaire plusieurs fois les mêmes outils.
Les modules spécialisés approfondissent seulement ce qui est nécessaire.
