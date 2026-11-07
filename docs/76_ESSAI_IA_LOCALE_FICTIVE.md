# 76 — Essai d'IA locale sur un scénario social fictif

**État : prototype pour développeur, non intégré à l'interface professionnelle.**

## Objectif

Exercer pour la première fois la chaîne : dossier fictif fixe de huit événements → consignes de posture sociale → appel à un modèle tournant sur le poste du développeur → réponse JSON structurée → contrôle de citations et statut de brouillon. Un modèle peut produire une analyse médiocre : seule une évaluation humaine ultérieure permet de mesurer la qualité.

**Aucune donnée ARTAG, note réelle, donnée familiale ou contenu Insertis n'est accepté en entrée.** Le fichier `backend/src/fictionalLocalAiDemo.js` contient le seul scénario admis ; ni route HTTP ni service métier n'utilisent ce code. Il n'existe ni export, ni stockage, ni création de tâches.

## Ce qui a été construit

- Transport `POST http://127.0.0.1:11434/api/chat`, sans URL configurable, sans redirection, sans streaming.
- Contrôle préalable de `GET http://127.0.0.1:11434/api/tags` : le modèle demandé doit figurer dans la liste des modèles locaux téléchargés avec une taille positive ; les noms contenant `cloud` sont rejetés.
- JSON Schema transmis dans `format` ; après génération, la sortie est de nouveau contrôlée par `reviewFictionalSummaryDraft`. Le respect du schéma **ne démontre pas que la citation appuie réellement une affirmation**.
- Double autorisation dans la fonction, et triple condition de lancement en ligne de commande (variable d'environnement, indicateur de confirmation, nom de modèle installé).
- Des tests avec faux transport vérifient l'absence d'appel quand le mode est désactivé, l'accès à la seule boucle locale, le refus d'un modèle non installé, les erreurs réseau, les faux identifiants de source et les actions préconfirmées.

## Sécurité de l'inférence et limites

**Ne pas confondre URL locale et garantie absolue d'inférence locale.** Ollama peut exposer des fonctionnalités cloud. Dans le service Ollama du poste, désactiver les fonctionnalités cloud via `OLLAMA_NO_CLOUD=1` **au démarrage du service** ou `disable_ollama_cloud: true` dans `~/.ollama/server.json`, puis redémarrer Ollama et vérifier dans ses journaux le message `Ollama cloud disabled: true`.

Le test préfiltre les alias cloud et les modèles absents du catalogue local. Il **ne vérifie pas lui-même la configuration du service**, les éventuelles extensions, les tunnels ni l'emplacement physique de toutes les opérations du modèle. Les essais restent donc strictement fictifs. L'électricité et les ressources matérielles ne sont pas gratuites ; aucune facturation externe ne peut être exclue par le seul fait de viser `localhost`.

Référence technique : [Ollama — Generate a chat message](https://docs.ollama.com/api/chat), [Structured Outputs](https://docs.ollama.com/capabilities/structured-outputs), [FAQ — Désactiver les fonctionnalités cloud](https://docs.ollama.com/faq).

## Exécution manuelle sur un poste de développement autorisé

Prérequis : Ollama installé et démarré en mode local uniquement, modèle réellement téléchargé, Node compatible. **Lancer uniquement quand l'opérateur a vérifié les prérequis.** Cette étape n'a pas été exécutée par la rédaction de ce document.

Depuis le répertoire `backend/` :

```bash
LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalAi.mjs --model qwen3:8b --confirm-fiction
```

Le nom `qwen3:8b` n'est qu'un exemple ; la commande n'installe rien et échouera proprement si le modèle n'est pas téléchargé. Aucun modèle n'est recommandé ni approuvé pour l'usage ARTAG à ce stade. L'impression d'un brouillon en console concerne **le scénario fixe inventé dans le code**.

## Ce qu'il reste à démontrer

1. L'essai sur **un modèle réellement installé**. Les tests actuels utilisent un transport simulé, donc aucun jugement sur la qualité d'une IA.
2. La notation du brouillon par une professionnelle selon les dix critères du banc d'essai n° 83, y compris le temps de correction et les inventions critiques.
3. La prise en compte de sources sociales **publiques réellement qualifiées**, mises à jour et versionnées : actuellement, la recherche documentaire ne traite que des textes fictifs.
4. Les droits, la confidentialité, la mémoire longue et l'hébergement institutionnel. Aucune intégration de dossiers réels ne peut commencer sans validation ARTAG/RGPD/SSI.

## Statut métier

Cette expérimentation est **un adaptateur indépendant**. Elle n'altère ni `backend/src/app.js`, ni les routes HTTPS, ni les rôles, ni les écrans de saisie validés. Conformément à `AGENTS.md` et `docs/23_ORDRE_DE_TRAVAIL.md`, elle reste en PR brouillon et n'est pas fusionnée tant que les préalables métier et la recette ne sont pas satisfaits.
