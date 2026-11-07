# 80 — Contrainte de coût : IA gratuite à l'utilisation

**Exigence exprimée par l'utilisatrice :** zéro abonnement IA et zéro facturation par requête, dossier ou message. Ne jamais basculer implicitement vers une solution payante. Aucune dépense matérielle, licence ou hébergement supplémentaire sans accord préalable.

Ce document cadre uniquement les démonstrateurs fictifs des PR précédentes ; il ne vaut ni homologation institutionnelle, ni engagement qu'un PC donné dispose des ressources suffisantes.

## Règles obligatoires

1. **Exécution locale** : appels limités à `127.0.0.1:11434` dans les modules d'essai. Aucun fournisseur distant payant n'est configuré, aucune clé de facturation n'est utilisée.
2. **Modèle présent sur le poste** : la commande vérifie le catalogue local Ollama. Elle ne télécharge aucun modèle et ne déclenche aucun abonnement.
3. **Cloud désactivé au niveau d'Ollama** : le service serveur doit être paramétré en mode sans cloud *avant le lancement*. Le client ne peut pas déduire ce paramétrage de la seule adresse `localhost`.
4. **Confirmation explicite supplémentaire** : les scripts exigent `LOCAL_AI_NO_CLOUD_CONFIRMED=1`, en plus de `LOCAL_AI_FICTIONAL_ONLY=1` et de `--confirm-fiction`. Les fonctions JavaScript exigent aussi `offlineOnlyAcknowledged: true`. Sans confirmation, aucune requête réseau n'est lancée.
5. **Données fictives exclusivement** : seul le scénario de huit événements codé dans le dépôt est admis. Aucun texte libre, aucune route métier, aucun dossier ARTAG. Il est interdit de prendre un identifiant `case-fiction` comme preuve d'anonymisation.
6. **Contrôle des licences** : le fait qu'un modèle ait des poids disponibles ne démontre pas que ses conditions de licence conviennent à un usage professionnel ou commercial. Vérifier les termes du modèle choisi **avant** tout usage hors expérimentation.
7. **Validation métier obligatoire** : un modèle gratuit reste susceptible de produire des erreurs. Les synthèses restent des brouillons vérifiables, sans envoi, sauvegarde ni tâche automatique.

## Exécution manuelle des essais

Depuis `backend/`, avec un modèle déjà installé et le service Ollama vérifié hors cloud :

```bash
LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/tryFictionalLocalAi.mjs --model qwen3:8b --confirm-fiction
```

ou, pour quatre questions prédéfinies :

```bash
LOCAL_AI_FICTIONAL_ONLY=1 LOCAL_AI_NO_CLOUD_CONFIRMED=1 node scripts/tryFictionalLocalDialogue.mjs --model qwen3:8b --confirm-fiction
```

Le nom du modèle est **un exemple** et n'installe rien. L'attestation n'est pas une preuve technique d'isolation : elle ne lit ni la configuration du daemon Ollama ni son comportement réseau. Les frais électriques et l'amortissement de l'ordinateur ne peuvent pas être considérés comme nuls.

## Critères de refus

Arrêter la démarche si l'un de ces points n'est pas vérifié : service cloud non désactivé, modèle uniquement distant, modèle nécessitant un abonnement, licence incompatible, absence d'autorisation pour des données réelles, ordinateur insuffisant. Ne jamais « résoudre » un manque de qualité en activant automatiquement un service payant ou un modèle cloud.

## Preuve technique et limites

Le module `backend/src/fictionalOfflineCostGate.js` est une politique **déclarative** qui ne configure ni ne sonde Ollama. Les tests vérifient qu'une seule confirmation manquante bloque les appels et que les résultats restent classés comme brouillons. Les cinq workflows GitHub constituent une vérification du code et **pas une démonstration que l'essai réel est gratuit ou qu'un modèle est efficace**.

Les seules dépenses possibles annoncées sont l'utilisation des ressources déjà disponibles (électricité, calcul) ; tout éventuel achat ou facturation externe doit rester soumis à accord préalable explicite.
