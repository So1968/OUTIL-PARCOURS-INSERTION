# Structure cible — tronc commun, registres d’accompagnement et modules spécialisés

Ce document corrige l’architecture fonctionnelle de l’outil.

Constat : certaines fonctions utiles ont été développées dans Appui TNS alors qu’elles concernent tout l’accompagnement ARTAG. Elles doivent remonter dans un tronc commun.

## 1. Principe général

L’outil ne doit pas être composé de trois applications séparées.

Structure cible :

```text
Un dossier unique ARTAG
+ un tronc commun de suivi
+ des registres d’accompagnement
+ des modules spécialisés activés selon la situation
```

## 2. Tronc commun

Le tronc commun concerne tous les accompagnements : social, socio-professionnel, appui TNS, continuité de service et relais partenaires.

Il contient :

- dossier unique ;
- vue d’ensemble ;
- rendez-vous ;
- rappels J-7 / J-2 ;
- canal préféré : SMS / WhatsApp / appel / mail ;
- accord pour rappel ;
- textos prêts à envoyer ;
- documents à demander ;
- documents reçus / manquants ;
- prochaines actions ;
- responsable ;
- échéance ;
- relances ;
- niveau de vigilance ;
- historique ;
- synthèse partageable ;
- espace professionnel réservé ;
- partenaires / relais.

Règle : si une fonction peut servir à plusieurs types d’accompagnement, elle appartient au tronc commun.

## 3. Registres d’accompagnement

Les registres ne sont pas des silos. Ils indiquent l’angle principal du travail à un moment donné.

### 3.1 Accompagnement social

Objectif : stabiliser la situation, sécuriser les droits et réduire les freins de vie quotidienne.

Domaines principaux :

- accès aux droits ;
- budget ;
- santé ;
- logement / habitat ;
- famille ;
- mobilité ;
- numérique ;
- organisation quotidienne ;
- urgence sociale.

Sorties attendues :

- situation clarifiée ;
- droits ou démarches sécurisés ;
- prochaine action sociale ;
- relais éventuel ;
- synthèse courte.

### 3.2 Accompagnement socio-professionnel

Objectif : soutenir la mise en mouvement vers l’emploi, la formation, l’activité ou une étape réaliste.

Domaines principaux :

- projet professionnel ;
- freins à l’emploi ;
- formation ;
- mobilité emploi / formation ;
- garde d’enfants ;
- rythme et disponibilité ;
- compétences ;
- partenaires emploi ;
- étapes du parcours.

Sorties attendues :

- objectif socio-professionnel ;
- étape suivante ;
- partenaire mobilisé ;
- échéance ;
- frein prioritaire ;
- synthèse Insertis si nécessaire.

### 3.3 Appui TNS

Objectif : éclairer une situation d’activité indépendante sans remplacer le parcours global.

Domaines principaux :

- création d’entreprise ;
- existence de la boîte ;
- SIRET / statut ;
- activité réelle ;
- chiffre d’affaires ;
- URSSAF ;
- impôts ;
- CAF / RSA ;
- factures / devis ;
- régularisation ;
- fermeture / radiation.

Sorties attendues :

- diagnostic de la boîte ;
- documents nécessaires ;
- démarches adaptées ;
- liens officiels ;
- impact sur le parcours ;
- prochaine action TNS ;
- coordination avec la référente.

## 4. Ce qui doit remonter de TNS vers le tronc commun

À sortir de l’espace TNS pour devenir une brique commune :

- rappel de rendez-vous J-7 / J-2 ;
- texto documents ;
- accord pour rappel ;
- canal préféré SMS / WhatsApp ;
- prochaine action ;
- responsable ;
- échéance ;
- documents attendus ;
- documents manquants ;
- relances.

Appui TNS doit utiliser cette brique commune, mais ne doit pas en être le seul propriétaire.

## 5. Ce qui reste spécifique à Appui TNS

Spécifique TNS :

- où en est la boîte ;
- créer / régulariser / fermer ;
- SIRET ;
- statut ;
- chiffre d’affaires ;
- URSSAF ;
- impôts ;
- impact CAF / RSA ;
- liens création entreprise ;
- documents TNS spécifiques ;
- diagnostic de viabilité / difficulté de l’activité.

## 6. Architecture d’écran cible

```text
ACCUEIL
│
├── Dossier unique parcours
│   ├── Vue d’ensemble
│   ├── Rendez-vous & rappels
│   ├── Documents
│   ├── Prochaines actions
│   ├── Historique / traçabilité
│   ├── Synthèse partageable
│   └── Espace professionnel réservé
│
├── Modules communs
│   ├── Accès aux droits
│   ├── Budget
│   ├── Santé
│   ├── Habitat
│   ├── Mobilité
│   ├── Numérique
│   ├── Famille / disponibilité
│   └── Projet / mise en mouvement
│
├── Registre social
│   └── lecture sociale + actions sociales
│
├── Registre socio-professionnel
│   └── lecture socio-pro + étapes emploi / formation
│
├── Appui TNS
│   └── diagnostic de la boîte + démarches entreprise
│
└── Direction / pilotage
    └── indicateurs non nominatifs
```

## 7. Règles ergonomiques

### Une page = une intention

- Accueil : où je vais ?
- Dossier : où en est le suivi ?
- Rendez-vous : qui vient, quand, avec quoi, et comment on rappelle ?
- Documents : qu’est-ce qui est attendu, reçu ou manquant ?
- Social : quel frein social prioritaire ?
- Socio-pro : quelle étape de mise en mouvement ?
- TNS : où en est la boîte ?
- Continuité : que faut-il reprendre sans ouvrir le bureau privé ?

### Toute brique doit finir par une suite

Chaque écran doit produire :

- une prochaine action ;
- un responsable ;
- une échéance ;
- une relance éventuelle ;
- une trace courte.

## 8. Priorité de développement

### Priorité 1

Créer une brique commune :

```text
Rendez-vous / rappels / documents / relances
```

Elle sera utilisée ensuite par :

- accompagnement social ;
- accompagnement socio-professionnel ;
- appui TNS ;
- continuité de service.

### Priorité 2

Rebrancher Appui TNS sur cette brique commune au lieu de garder ses propres rappels isolés.

### Priorité 3

Faire la même chose pour les documents : une logique commune de documents attendus / reçus / manquants, avec des listes spécifiques selon le module.

### Priorité 4

Harmoniser les trois registres : social, socio-professionnel, TNS.

## 9. Décision de trajectoire

On ne développe plus des fonctions transversales uniquement dans TNS.

Désormais :

```text
Commun d’abord.
Spécifique ensuite.
```

Cette règle évite les doublons, facilite le travail de l’équipe et respecte la logique de dossier unique ARTAG.
