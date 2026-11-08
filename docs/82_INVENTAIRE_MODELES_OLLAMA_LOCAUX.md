# 82 — Inventaire des modèles locaux d'Ollama sans utilisation payante

## Objectif

Savoir quels modèles de langage sont **déclarés installés** sur l'ordinateur avant de choisir quoi tester, **sans lancer de génération**, sans téléchargement et sans utiliser de dossiers réels.

Il ne s'agit pas d'une sélection automatique du « meilleur modèle » : nous n'avons pas encore vérifié sa qualité d'analyse sociale, sa licence ni sa compatibilité avec le PC.

## Procédure en deux étapes

**1. Diagnostic passif sans connexion** : dans `backend/`, lancer :

```bash
node scripts/checkFictionalOfflineReadiness.mjs
```

Ce premier outil examine seulement la RAM et le fichier de configuration éventuel, sans contacter Ollama. Il ne certifie pas que le service est hors cloud.

**2. Inventaire local facultatif** : uniquement après avoir vérifié *sur le service Ollama* que les fonctionnalités cloud sont désactivées et que le service est bien local, lancer :

```bash
LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/listFictionalLocalModels.mjs --confirm-local-list
```

L'inventaire n'effectue qu'une requête HTTP **GET** vers `http://127.0.0.1:11434/api/tags`. Il n'envoie aucune question ni donnée sociale, ne lance aucun modèle et n'utilise aucune API de génération. Il ne contacte pas une URL arbitraire. En l'absence des confirmations ou si le service local est indisponible, il s'arrête.

## Ce qui est affiché

Un exemple **entièrement indicatif et non lié à ton poste** :

```text
Catalogue local Ollama seulement : aucun modèle exécuté ni téléchargé.
• exemple-modele:4b — poids déclarés : 3.1 Gio sur disque
Service réellement hors cloud, licence et compatibilité machine : NON VERIFIES.
```

Le script masque les entrées qui contiennent `cloud`, celles sans taille de poids positive ou dont l'identifiant paraît douteux. Les tailles sont celles *déclarées par Ollama pour les fichiers de poids* ; elles ne constituent **pas** une estimation fiable de la RAM ou de la vitesse requises. Le script ne réaffiche ni digest, ni chemins de disque, ni autres métadonnées potentiellement inutiles.

## Quelles conclusions pouvons-nous tirer ?

| Point | État après ce script |
| --- | --- |
| Modèles déclarés par le catalogue local | Oui, avec nom et taille des poids |
| Modèle téléchargé et authentifié indépendamment | **Non** |
| Modèle exécuté gratuitement | **Non testé** : aucune inférence n'est lancée |
| Cloud réellement désactivé sur le service actif | **Non vérifié automatiquement** |
| Licence du modèle compatible avec l'usage prévu | **Non vérifiée** |
| RAM et vitesse adaptées à l'ordinateur | **Non vérifiées** |
| Qualité d'analyse sociale | **Non testée** |
| Usage de données ARTAG autorisé | **Non** |

Cette étape complète, sans la remplacer, la grille d'évaluation humaine conçue dans la PR n° 83.

## Ce que la recette CI vérifie

Les tests utilisent un serveur **simulé**, jamais l'ordinateur de l'utilisatrice : refus sans confirmation triple, unique GET local, absence de génération et téléchargement, filtrage des modèles cloud/invalides, réponse trop volumineuse, erreur réseau générique et absence de divulgation de métadonnées de test.

Les contrôles GitHub ne prouvent ni le fonctionnement d'Ollama sur ton poste, ni l'absence de frais d'un service externe mal configuré, ni la pertinence du modèle. L'essai sur un véritable modèle doit rester **sur données fictives** tant que le cadre professionnel n'est pas validé.

**Statut : lot indépendant en PR brouillon, non fusionné, sans déploiement ni activation.**
