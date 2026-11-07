# 77 — Relecture prioritaire des synthèses d'IA locales fictives

**Périmètre :** démonstration fixe de huit entretiens fictifs, sans véritable dossier, sans route API et sans activation automatique d'un modèle. Ce lot complète l'adaptateur expérimental du document 76 ; il ne modifie pas la production.

## Pourquoi ce contrôle

Le validateur de brouillon vérifie déjà que les identifiants d'événements cités existent. **Il ne peut pas vérifier si une phrase est vraie ni si la référence la justifie.**

Pour le scénario inventé, quatre éléments devraient attirer l'attention de la professionnelle :

| Repère | Événements attendus | Point de contrôle |
|---|---|---|
| Évolution du projet | E05 + E08 | Le projet passe vers l'exploration d'un emploi salarié à temps partiel. |
| Déclarations divergentes | E04 + E08 | Deux montants différents sont cités pour juin ; ne conclure ni à une fraude ni à un mensonge. |
| Courrier non analysé | E06 + E08 | Le courrier a été évoqué puis présenté, mais son contenu n'est pas transcrit. |
| Suite non confirmée | E08 | La proposition reste soumise à validation humaine. |

Le module `backend/src/fictionalLocalCoverage.js` vérifie la présence **structurelle** de ces références à l'endroit attendu (évolution, contradiction, incertitude, action). Lorsqu'elles manquent, il émet des **priorités de relecture** et ne réécrit pas lui-même le contenu. Le scénario complet utilise un historique strictement fictif.

## Limites à ne jamais masquer

- Un modèle peut citer E04 et E08 tout en décrivant mal leur contenu : le contrôle ne le saura pas.
- Quatre indicateurs présents ne signifient pas qu'une synthèse est de qualité ni qu'elle respecte le droit en vigueur.
- Aucune note automatique sur 20 n'est attribuée ; le banc d'essai n° 83 exige une **grille humaine déclarée** pour une évaluation.
- Une revue mécanique satisfaisante ne valide ni l'utilisation d'une IA avec des données ARTAG ni une intégration institutionnelle.
- Aucune source juridique réelle n'est injectée dans cet essai.

## Règles de décision

1. **Toujours** afficher « brouillon non validé » et « relecture humaine requise », même si tous les indicateurs de références sont présents.
2. Si l'IA omet un point obligatoire, afficher la priorité correspondante au lieu de considérer son texte complet.
3. Vérifier manuellement les citations, puis le vocabulaire professionnel, la nuance et les suites proposées.
4. Ne pas enregistrer ni transmettre la synthèse automatiquement.
5. Pour une comparaison entre plusieurs IA, ne pas attribuer de score tant que les réponses réelles ne sont pas lues avec la grille de dix dimensions.

## Recette prévue

Les tests artificiels vérifient quatre références présentes, une contradiction omise, le courrier absent, une suite non proposée et un texte potentiellement faux malgré de bonnes références. Cette vérification est intégrée au retour du démonstrateur Ollama, sans contact externe dans les tests.

Le lot reste **en PR brouillon**. Les sources du métier et les permissions ARTAG seront à traiter séparément selon `AGENTS.md`, `docs/23_ORDRE_DE_TRAVAIL.md` et `docs/48_PLAN_AGENT_DEVELOPPEMENT.md`.
