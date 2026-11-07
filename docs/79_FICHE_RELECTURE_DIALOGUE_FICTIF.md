# 79 — Fiche de relecture du dialogue fictif en plusieurs échanges

**Périmètre :** prototype expérimental, uniquement le scénario fixe `case-fiction-essai-local`. Aucune donnée ARTAG, aucun connecteur, aucune route serveur métier et aucune activation d'IA par ce module.

## Ce que le lot apporte

Les réponses du dialogue expérimental sont désormais regroupées dans une **fiche de relecture**, lisible échange par échange. Chaque fiche présente la question, la réponse proposée, les sources citées avec date, statut (déclaration/observation) et extrait d'origine, les informations incertaines et les actions proposées non confirmées.

La fiche conserve également cinq questions de relecture humaine : fidélité aux sources, chronologie, nuance, posture non jugeante et pertinence des suites. **Aucune case n'est prévalidée** : la personne qui relit doit apprécier elle-même la vérité, le contexte et la qualité professionnelle.

La préparation affiche le nombre de questions déjà examinées sur quatre et les questions restantes. Elle signale les **intitulés d'actions répétés à l'identique** à plusieurs échanges : il s'agit d'une invitation à rapprocher ces actions, et non d'une suppression automatique, car une même formulation pourrait correspondre à des situations ou des étapes distinctes.

## Protections et limites

- Seules les quatre réponses du scénario fixe peuvent entrer dans le paquet ; les identifiants de sources et leurs extraits sont comparés au référentiel fictif codé en dur.
- Toute incohérence de provenance, citation étrangère, action indiquée comme confirmée, ou fausse validation sémantique bloque la fiche.
- Aucune API de modèle n'est appelée lors de la préparation de la fiche. Aucun enregistrement, aucune transmission, aucune création de tâche et aucune note chiffrée ne sont effectués.
- La fonction demande une autorisation explicite, uniquement pour l'essai. Ce drapeau **ne constitue pas une habilitation professionnelle**.
- La conformité des références est contrôlée mécaniquement. Une phrase peut être fausse alors même qu'elle cite les bonnes sources. Le logiciel ne sait pas encore détecter les erreurs d'interprétation, un jugement de valeur subtil ou une méconnaissance du droit.
- L'historique de réponses est volatil pendant l'essai : fermer le processus entraîne sa disparition. Ce comportement n'est pas un mécanisme de conservation des dossiers professionnels.

## Démonstration manuelle ultérieure

Le lanceur `backend/scripts/tryFictionalLocalDialogue.mjs` affiche, après chaque réponse fictive, le nombre d'échanges réalisés, les sujets restant à examiner et les intitulés répétés à revoir. Il n'accepte toujours aucune question libre ni note réelle.

Les prérequis à l'exécution avec un modèle sont dans `docs/76_ESSAI_IA_LOCALE_FICTIVE.md` et `docs/78_DIALOGUE_LOCAL_FICTIF_MULTITOUR.md`. Il faut notamment disposer d'un Ollama local configuré sans fonctionnalités cloud. **Cette recette n'a pas été exécutée sur le poste de l'utilisatrice.**

## Recette automatisée

Le fichier `backend/test/fictionalDialogueReviewPacket.test.js` teste sur un faux transport local : quatre échanges, historique partiel ou vide, rapprochement d'actions répétées, copie d'une source falsifiée, citation étrangère, doublon, action prétendument confirmée, refus d'accès et absence d'appel de modèle supplémentaire pendant la relecture.

Ces tests attestent du fonctionnement **technique** de la fiche avec de fausses réponses. Ils ne prouvent aucune compétence de raisonnement d'un modèle IA réel.

## Prochain jalon

Tester un modèle réellement téléchargé localement sur le scénario figé, puis faire évaluer sa qualité par une professionnelle avec la grille établie dans la PR n° 83. Aucun passage à des dossiers réels avant autorisation institutionnelle, contrôle RGPD/SSI, droits serveur et recette métier complète.

**Statut : PR brouillon dépendante de la PR n° 86**, sans fusion ni déploiement.
