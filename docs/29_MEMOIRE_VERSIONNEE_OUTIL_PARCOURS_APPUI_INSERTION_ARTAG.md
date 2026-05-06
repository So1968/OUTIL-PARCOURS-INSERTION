# Mémoire versionnée — Outil de parcours et d’appui insertion ARTAG

**Document de mémoire des décisions projet**

---

## Objectif du document

Ce document conserve la mémoire des décisions métier, techniques, ergonomiques et organisationnelles prises dans le cadre de la construction de l’outil de parcours et d’appui insertion ARTAG.

Il complète l’historique Git.

> **Git conserve les changements ; la mémoire versionnée conserve le sens des décisions.**

---

## Règles de mise à jour

Chaque décision importante doit être ajoutée avec :

- une date ;
- une version ;
- le sujet concerné ;
- la décision prise ;
- la justification ;
- les impacts sur l’outil ;
- les fichiers concernés ;
- les points à vérifier ou à ne pas modifier sans validation.

---

## Version 0.1 — Socle général du projet

**Date :** 06/05/2026  
**Statut :** validé

### Décisions

L’intitulé stabilisé du projet est :

> **Outil de parcours et d’appui insertion ARTAG**

L’outil est un support interne destiné à structurer :

- les parcours sociaux et socio-professionnels ;
- l’appui TNS ;
- la continuité du suivi ;
- l’harmonisation des pratiques ;
- la lecture direction.

L’outil ne remplace pas :

- Insertis ;
- l’échange avec la personne ;
- l’analyse professionnelle ;
- la décision de la professionnelle ;
- le cadre institutionnel existant.

### Justification

Le projet vise à éviter que l’accompagnement soit réduit à un formulaire administratif ou à un outil de contrôle.  
Il doit aider à structurer le travail réel, sécuriser les parcours et rendre visibles les appuis nécessaires.

### Points à ne pas modifier sans validation

- Ne pas transformer l’outil en site vitrine.
- Ne pas transformer l’outil en dashboard startup.
- Ne pas supprimer la logique d’appui TNS ciblé.
- Ne pas remplacer Insertis.
- Ne pas effacer la distinction entre parcours global, appui ciblé et vue direction.

---

## Version 0.2 — Synthèse transférable vers Insertis

**Date :** 06/05/2026  
**Statut :** validé

### Décision

Ajout d’un bloc :

> **Synthèse transférable vers Insertis**

dans la page professionnelle du dossier.

Cette synthèse doit être :

- courte ;
- professionnelle ;
- modifiable ;
- copiable ;
- non diagnostique ;
- respectueuse de la dignité de la personne ;
- relue avant transfert dans Insertis.

### Justification

La professionnelle doit pouvoir produire une trace utile à la continuité du parcours sans recopier toutes les réponses ni exposer inutilement des éléments sensibles.

### Points de vigilance

- Aucun score visible à la personne.
- Pas de diagnostic.
- Pas de formulation disqualifiante.
- Pas de confusion entre synthèse interne et trace officielle Insertis.

### Fichiers concernés

- `frontend/src/pages/DossierPage.jsx`
- `frontend/src/pages/SocleAutonomiePage.jsx`
- `frontend/src/styles.css`
- `docs/avancement.md`

---

## Version 0.3 — Dignité et écriture professionnelle

**Date :** 06/05/2026  
**Statut :** validé

### Décision

Les formulations visibles dans les synthèses professionnelles doivent éviter de qualifier directement la personne comme fragile ou déficiente.

Les formulations retenues doivent porter sur :

- les besoins repérés ;
- les points à consolider ;
- les conditions d’appui ;
- la sécurisation du parcours ;
- la prudence de l’analyse professionnelle.

### Exemple de formulation retenue

Au lieu de :

> La personne est fragile.

Préférer :

> Plusieurs repères nécessitent un accompagnement structuré afin de soutenir la priorisation, la compréhension des étapes et la mise en action dans le parcours.

### Justification

L’outil doit préserver la dignité des personnes accompagnées et rester aligné avec une posture professionnelle non jugeante.

### Fichiers concernés

- `frontend/src/pages/DossierPage.jsx`
- `docs/avancement.md`

---

## Version 0.4 — Carnet d’appropriation de l’outil

**Date :** 06/05/2026  
**Statut :** V2 validée et poussée

### Décision

Création d’un carnet d’appropriation de l’outil :

`docs/25_CARNET_APPROPRIATION_OUTIL_PARCOURS_APPUI_INSERTION_ARTAG.md`

Ce carnet explique :

- la finalité de l’outil ;
- ce que l’outil fait / ne fait pas ;
- les modules métier ;
- eva ;
- la synthèse Insertis ;
- les fiches relais internes ;
- les relais externes ;
- la transversalité ;
- la vue tous les parcours ;
- la vue direction ;
- les alertes continuité ;
- l’appropriation par l’équipe ;
- les données personnelles.

### Justification

Le carnet doit permettre à l’équipe de comprendre rapidement l’intention professionnelle de l’outil et de s’en emparer sans réduire l’outil à une interface technique.

### Phrase validée

> **Harmoniser les pratiques, ce n’est pas standardiser les personnes ; c’est partager des repères pour mieux sécuriser les parcours.**

---

## Version 0.5 — Notices données personnelles

**Date :** 06/05/2026  
**Statut :** créées, à valider avant diffusion

### Décision

Création de trois supports distincts :

- notice complète ;
- version FALC ;
- version lecture accompagnée.

### Fichiers concernés

- `docs/26_NOTICE_DONNEES_PERSONNELLES_COMPLETE.md`
- `docs/27_NOTICE_DONNEES_PERSONNELLES_FALC.md`
- `docs/28_NOTICE_DONNEES_PERSONNELLES_LECTURE_ACCOMPAGNEE.md`

### Décision importante

Chaque notice doit afficher clairement en haut du document :

> **Points à valider avant diffusion**

### Justification

Ces documents ne doivent pas être utilisés auprès des personnes accompagnées sans validation institutionnelle, notamment concernant :

- le responsable de traitement ;
- la base légale ;
- les finalités ;
- les destinataires ;
- la durée de conservation ;
- le contact RGPD ;
- les modalités d’exercice des droits ;
- l’articulation avec Insertis.

---

## Version 0.6 — Accès nominatifs et niveaux d’information

**Date :** 06/05/2026  
**Statut :** décision validée, à implémenter

### Décision

L’outil doit prévoir des accès nominatifs.

Chaque professionnelle doit pouvoir être identifiée par son accès propre.

L’outil doit distinguer trois niveaux :

1. **Partie partageable — continuité de service**
2. **Partie professionnelle réservée**
3. **Vue direction neutre et agrégée**

### Partie partageable — continuité de service

Elle doit contenir uniquement les informations nécessaires pour qu’une collègue puisse assurer la continuité du suivi.

Exemples :

- référence dossier ;
- référente ;
- statut du parcours ;
- prochaine action ;
- point à reprendre ;
- module concerné ;
- alerte continuité ;
- relais en cours ;
- synthèse courte validée.

### Partie professionnelle réservée

Elle contient l’analyse professionnelle :

- lecture des repères d’autonomie ;
- modules recommandés ;
- synthèse transférable vers Insertis ;
- notes de continuité ;
- relais internes ou externes ;
- éléments utiles à la décision professionnelle.

### Vue direction

Elle doit rester neutre et agrégée.

Elle doit permettre de réguler :

- la charge par professionnelle ;
- les temps de travail : 100 %, 80 %, autre ;
- les missions annexes ;
- les parcours actifs ;
- les alertes continuité ;
- les actions à venir ;
- les appuis TNS ;
- les personnes en projet ;
- les besoins récurrents.

### Phrase validée

> **L’outil doit distinguer ce qui relève de la continuité de service, ce qui relève de l’analyse professionnelle, et ce qui relève du pilotage direction. Les accès nominatifs permettent de sécuriser cette séparation et de tracer les interventions sans transformer l’outil en dispositif de surveillance.**

---

## Version 0.7 — Transversalité

**Date :** 06/05/2026  
**Statut :** validé

### Décision

La transversalité doit être intégrée dans l’outil et dans la documentation.

Elle ne doit pas être présentée comme une liste fictive de relais internes.

À ce stade, l’orientation interne formalisable concerne principalement :

- le logement ;
- l’habitat ;
- éventuellement le relais AS / logement-habitat selon validation interne.

Les autres besoins peuvent donner lieu à :

- une orientation externe ;
- une reprise en équipe ;
- une coordination avec la référente ;
- une clarification du cadre d’intervention ;
- une régulation direction.

### Phrase validée

> **La transversalité permet de relier les interventions sans confondre les responsabilités.**

### Point à ne pas modifier sans validation

Ne pas afficher comme relais interne ce qui n’est pas réellement structuré en interne.

---

## Version 0.8 — Vue direction et régulation de charge

**Date :** 06/05/2026  
**Statut :** validé, à implémenter

### Décision

La vue direction doit permettre de réguler la charge réelle de travail sans exposer les détails sensibles des dossiers.

Elle doit intégrer :

- le nombre de parcours ouverts ;
- le nombre de parcours actifs ;
- les parcours soutenus ;
- les alertes continuité ;
- les actions à venir ;
- les appuis TNS ;
- les personnes en projet ;
- les modules mobilisés ;
- les temps de travail des professionnelles : 100 %, 80 %, autre ;
- les missions annexes.

### Justification

La charge ne peut pas être lue uniquement en nombre de dossiers.  
Elle doit être rapportée au temps disponible, à l’intensité des parcours et aux missions réellement confiées.

### Phrase validée

> **La vue direction ne sert pas à surveiller les personnes ; elle sert à rendre visible la charge réelle pour pouvoir la réguler.**

---

## Version 0.9 — Eva dans le module Écrit / numérique

**Date :** 06/05/2026  
**Statut :** validé

### Décision

eva peut être introduit dans le module Écrit / numérique comme outil de positionnement complémentaire.

Lien :

https://eva.anlci.gouv.fr/

### Conditions

eva doit être proposé :

- comme un appui au parcours ;
- jamais comme une épreuve ;
- avec explication préalable ;
- avec accord de la personne ;
- idéalement en passation accompagnée ;
- avec partage d’écran ;
- avec restitution valorisante.

### Refus ou report

Un refus ou report d’eva ne doit pas être interprété comme un manque d’adhésion.

### Phrase validée

> **Un refus n’est pas une fermeture définitive ; c’est un indicateur de rythme, de confiance ou de priorité à retravailler.**

---

## Version 0.10 — Appropriation par l’équipe

**Date :** 06/05/2026  
**Statut :** validé

### Décision

L’outil doit être déployé avec une phase d’appropriation.

Son usage ne peut pas dépendre uniquement de l’adhésion individuelle s’il est validé comme support commun de service.

### Règle validée

> **L’adhésion se travaille, mais le cadre ne peut pas dépendre uniquement de l’adhésion individuelle.**

### Justification

Un outil commun ne peut pas produire ses effets si chacune l’utilise ou le contourne selon ses préférences individuelles.

---

## Version 0.11 — Mention de conception

**Date :** 06/05/2026  
**Statut :** à arbitrer selon support

### Décision de principe

Le rôle de Sofia de los Rios comme conceptrice initiale doit rester traçable.

Mais la mention doit être adaptée selon les supports.

### Recommandation

Pour les documents d’équipe :

> Document élaboré dans le cadre de la mission d’appui insertion / TNS.  
> Conception initiale et formalisation : Sofia de los Rios, dans le cadre de sa mission.

Pour le dépôt et la documentation projet, une mention plus explicite peut être conservée.

### Justification

Préserver la reconnaissance de la contribution sans donner l’impression que l’outil est un outil personnel et non un outil de service.

---

## Prochaines décisions à documenter

- Implémentation des profils et droits.
- Création de la vue Tous les parcours.
- Création de la vue direction.
- Intégration des alertes continuité.
- Formalisation des fiches relais dans l’outil.
- Intégration progressive des notices données personnelles dans le parcours.
- Clarification du statut juridique / propriété / droit d’usage si demandé par contrat ou avenant.


---

## Version 0.12 — Vue équipe continuité de service activable

**Date :** 06/05/2026  
**Statut :** validé, à implémenter

### Décision

La vue équipe — continuité de service n’est pas une vue permanente sur l’ensemble des parcours.

Elle peut être activée uniquement dans certains cas :

- absence d’une professionnelle ;
- relais organisé ;
- urgence de service ;
- besoin temporaire de reprise d’un dossier.

### Règle d’accès

Quand une professionnelle est présente, ses dossiers restent dans son périmètre nominatif.

En cas d’absence, un accès équipe limité peut être ouvert sur les dossiers concernés, uniquement en version continuité de service.

### Informations visibles en accès continuité

- référence dossier ;
- statut du parcours ;
- prochaine action ;
- date prévue ;
- alerte continuité ;
- relais en cours ;
- information utile à l’accueil ;
- synthèse courte validée.

### Informations non visibles

- notes sensibles ;
- analyse professionnelle réservée ;
- réponses détaillées des repères d’autonomie ;
- synthèse Insertis complète non validée ;
- éléments intimes ou non nécessaires à la continuité.

### Exigences

Cet accès doit être :

- temporaire ;
- proportionné ;
- nominatif ;
- tracé ;
- limité aux professionnelles autorisées ;
- refermé au retour de la professionnelle ou à la fin du relais.

### Phrases validées

> **La continuité de service justifie un accès temporaire au nécessaire, pas un accès général au dossier complet.**

> **L’absence peut ouvrir un relais ; elle ne doit pas ouvrir toute l’intimité du dossier.**

