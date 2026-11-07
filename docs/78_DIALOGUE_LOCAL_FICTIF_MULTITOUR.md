# 78 — Dialogue local en plusieurs échanges sur un parcours fictif

**Statut :** démonstration réservée au développement, sans route API, sans données professionnelles, sans connexion Insertis et sans stockage. Cette étape suit le contrôle des synthèses de la PR n° 85.

## Ce qui est réellement possible

Sur le scénario fictif fixe `case-fiction-essai-local`, le prototype propose quatre questions, auxquelles un modèle Ollama **installé sur le poste** peut répondre successivement :

1. Comment le projet professionnel a-t-il évolué depuis septembre ?
2. Comment aborder les déclarations différentes de chiffre d'affaires de juin sans porter d'accusation ?
3. Que sait-on effectivement du courrier administratif ?
4. Quelles suites peut-on proposer sans les exécuter ?

Le menu est volontairement **fermé** : il ne prend aucun texte libre, nom de personne, document, identifiant de dossier réel ni requête arbitraire. Le contenu de l'historique est figé dans le code existant du démonstrateur. Les réponses du modèle sont conservées uniquement dans la mémoire du processus pour enrichir le tour suivant, puis perdues à la fermeture. Les anciennes réponses de l'IA restent classées comme **non fiables et non citables comme preuve**.

Une réponse est structurée : texte, identifiants des événements sources, incertitudes et actions proposées `confirmed: false`. Le code restitue également, pour chaque référence citée, **l'extrait fictif d'origine, sa date et son statut** (déclaration ou observation), afin de faciliter la relecture. Le code bloque les références inconnues et exige les événements essentiels au sujet de la question. Cette vérification **ne prouve ni l'exactitude ni la pertinence réelle** des citations.

## Protections

- Mode désactivé par défaut, confirmation explicite nécessaire pour l'essai.
- Seuls les noms de modèles du catalogue local téléchargé sont acceptés ; les alias contenant `cloud` sont refusés.
- Destination réseau fixe `127.0.0.1:11434`, refus des redirections, durée et taille des réponses limitées.
- Aucune sortie vers Outlook, Insertis, OneDrive, PostgreSQL ni vers une API de production.
- Aucune sauvegarde du dialogue ni création automatique d'actions.
- Les erreurs techniques remontent sous des codes limités, sans fuite de contenu.
- Un tour commencé bloque l'envoi d'un deuxième tour simultané ; les questions déjà posées ne sont pas rejouées involontairement.

**Limite absolue :** l'URL locale n'atteste pas de la désactivation des fonctions cloud du serveur Ollama. Avant une exécution avec Ollama, vérifier son paramétrage **sur le service lui-même**, comme indiqué dans `docs/76_ESSAI_IA_LOCALE_FICTIVE.md`. Ne jamais introduire d'informations sociales réelles dans ce prototype, même pseudonymisées.

## Lancement ultérieur, uniquement sur un poste de développement autorisé

Vérifier l'installation d'un modèle local, la configuration du service Ollama et le bon dossier `backend/`. Depuis ce dossier :

```bash
LOCAL_AI_FICTIONAL_ONLY=1 node scripts/tryFictionalLocalDialogue.mjs --model qwen3:8b --confirm-fiction
```

Le modèle `qwen3:8b` est seulement un exemple de nom ; aucun téléchargement ni installation n'est lancé par la commande. L'opérateur choisit un numéro de 1 à 4 ; `0` quitte. **Une phrase libre n'est pas interprétée comme une question**, et aucune réponse n'est enregistrée.

## Tests et limites de la validation

Les tests Node simulent le transport Ollama : ils valident le comportement du code, le maintien de la conversation d'un tour à l'autre, la restriction aux questions fixées, les citations, les blocages réseau et l'absence de transmission. Les réponses utilisées dans les tests sont écrites artificiellement.

Ils ne constituent pas une preuve qu'un modèle réel :

- raisonne justement ;
- adapte son expression au travail social ;
- évite les hallucinations ou les jugements de valeur ;
- respecte une confidentialité institutionnelle ;
- sera utilisable sur le PC de l'utilisatrice.

Il faudra ensuite exécuter un véritable modèle, comparer ses quatre réponses à des attentes professionnelles et les noter avec le banc d'essai de la PR n° 83. Un passage à la saisie libre ne peut être envisagé qu'avec une architecture autorisée et une gouvernance des données, **pas simplement en supprimant la restriction du menu**.

Le module reste isolé dans une **PR brouillon dépendante de la PR n° 85**. Ne pas fusionner sans révision de sécurité et recette métier, conformément à `AGENTS.md` et aux priorités du cahier des charges.
