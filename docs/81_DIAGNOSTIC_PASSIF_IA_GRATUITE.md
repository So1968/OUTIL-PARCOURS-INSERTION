# 81 — Diagnostic passif avant l'essai d'IA gratuite locale

## Objectif

Donner un retour simple sur l'ordinateur **sans installer quoi que ce soit, sans démarrer Ollama, sans appeler de modèle et sans service payant**.

Ce lot ajoute un contrôle préparatoire, pas une inférence. Il complète le cadre de coût gratuit du document 80 et ne donne aucun accès aux dossiers ARTAG.

## Commande

Depuis le dossier `backend/` du projet :

```bash
node scripts/checkFictionalOfflineReadiness.mjs
```

Pour une sortie structurée, par exemple à lire localement :

```bash
node scripts/checkFictionalOfflineReadiness.mjs --json
```

Le script n'a pas d'autres options. Il ne télécharge aucun modèle, ne modifie pas la configuration et ne fait **aucun appel réseau, même vers localhost**. Il examine uniquement la quantité de mémoire RAM signalée par le système et, si disponible, le fichier de configuration `~/.ollama/server.json`. Son contenu n'est jamais affiché ; seul l'état de la propriété `disable_ollama_cloud` apparaît. La variable `OLLAMA_NO_CLOUD` du **processus de diagnostic** est observée séparément, sans être prise pour le réglage du serveur.

**Attention :** lorsque Ollama est lancé comme service Linux, il peut utiliser un autre dossier personnel que celui du compte qui exécute ce script. La seule lecture de `~/.ollama/server.json` ne vérifie ni la configuration effective du service ni la présence de ses modèles téléchargés.

## Interprétation des résultats

| Ligne du rapport | Signification |
| --- | --- |
| `DESACTIVATION_DECLAREE_DANS_FICHIER` | Le fichier consulté contient `disable_ollama_cloud: true`. Cela ne prouve pas qu'Ollama actif l'utilise. |
| `CLOUD_AUTORISE_DANS_FICHIER` | Le fichier consulté autorise explicitement les fonctions cloud : **ne pas lancer d'essai**. |
| `CONFIG_FICHIER_ABSENT` / `CONFIG_JSON_INVALIDE` | Aucun réglage hors-cloud exploitable dans le fichier de ce compte. |
| `clientProcessNoCloudFlagSeen: true` | Le client de diagnostic voit `OLLAMA_NO_CLOUD=1` ; cela ne prouve **rien** sur le service Ollama séparé. |
| `hostMemoryGiB` et `freeMemoryGiB` | Capacité mémoire indicative. Impossible d'en déduire la compatibilité d'un modèle précis sans autres informations. |
| `readyForRealInference: false` | **Toujours faux** : le diagnostic ne contrôle ni le serveur actif ni le modèle et n'autorise pas d'inférence. |
| `networkRequestsMade: 0` | Le code du diagnostic ne lance aucune requête réseau. |
| `noRemoteBillingProven: false` | Le diagnostic ne peut pas certifier l'absence de facturation d'un serveur Ollama non inspecté. |

Le script conserve volontairement un code de sortie **2** même si le fichier paraît correctement configuré : ce résultat signifie « vérifications complémentaires nécessaires », et **pas une erreur de dossier social**.

## Vérification manuelle encore indispensable

D'après [la FAQ officielle Ollama](https://docs.ollama.com/faq), le mode local seul se configure sur le **service** en définissant `OLLAMA_NO_CLOUD=1` ou `disable_ollama_cloud: true` dans son `server.json`, puis en redémarrant Ollama. Le journal du service doit indiquer `Ollama cloud disabled: true`.

Il faut ensuite vérifier, **sans téléchargement automatique**, les modèles déjà installés et leur licence d'utilisation, et tester l'adéquation du matériel. Seul un modèle local déjà présent peut ensuite être sélectionné pour notre scénario de test entièrement fictif.

## Ce que la recette automatisée vérifie

- Un fichier de configuration valide, absent, malformé ou explicitement permissif.
- L'absence de validation automatique, y compris avec un fichier indiquant le mode hors cloud.
- Le cas trompeur d'une variable `OLLAMA_NO_CLOUD=1` dans le client uniquement.
- La confidentialité : aucun contenu du fichier de configuration ni faux jeton de test n'est restitué.
- Le comportement du programme de diagnostic sans ouverture de service.
- Les entrées mémoire incohérentes sont rejetées.

Les tests utilisent exclusivement des fichiers temporaires fictifs. Aucun dossier réel ni modèle Ollama n'est utilisé dans GitHub Actions.

## Limites

Ce diagnostic est **préparatoire et gratuit en appels IA**, sans licence ni abonnement ajouté. Il ne prouve ni qualité d'analyse sociale, ni adéquation matérielle, ni isolation réseau, ni conformité RGPD/SSI. Le travail professionnel reste régi par `AGENTS.md`, `docs/23_ORDRE_DE_TRAVAIL.md` et les validations ARTAG.

**Statut : proposition de code en brouillon**, non fusionnée et non déployée.
