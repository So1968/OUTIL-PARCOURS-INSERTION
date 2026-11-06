# Audit de consolidation — branches historiques (6 novembre 2026)

> **Statut : diagnostic de lecture, aucune fusion, suppression ou activation.**
> Base examinée : `main@3115dddd8480b3ea869d7105c063963ba4f48a40`.
> Ce document complète l'issue #71 et ne modifie aucune spécification métier.

## Méthode et limites

Comparaison GitHub `main...branche` des cinq branches signalées dans l'issue #71 ; lecture du service de notes et du stockage local actuels. La comparaison des fichiers signale des écarts mais **ne prouve pas** qu'un correctif soit absent fonctionnellement de `main`. Aucun test, navigateur, base PostgreSQL ou restauration n'a été exécuté dans cette passe. Les décisions définitives exigent revue de code, tests et recette fictive.

## Inventaire des écarts

| Branche | Avance / retard sur main | Éléments distinctifs | Traitement |
| --- | --- | --- | --- |
| `codex/lot-a-revisions-notes-partagees-20261102` | 6 / 39 | service `sharedNoteRevisionService.js`, routes et tests | Ne pas fusionner en bloc : comparer avec le service versionné déjà dans `main` |
| `fix/confirmation-copies` | 3 / 39 | `clipboard.js`, tests de copie, accueil, navigation et persistance | Vérifier le retour utilisateur après copie et l'accessibilité, puis porter uniquement les cas manquants |
| `fix/conflits-notes-partagees` | 4 / 39 | correctif `sharedNoteService.js` et test de concurrence | Comparer au contrôle de version et aux transactions sérialisables actuels |
| `fix/fiabilisation-prototype` | 1 / 39 | stockage local et tests de persistance | Conserver strictement le périmètre démonstration ; aucune migration automatique de données |
| `fix/stabilisation-navigation` | 2 / 39 | navigation, accueil, tests et persistance | Éviter les doublons avec les deux branches de prototype ci-dessus |

## Constats confirmés sur main

- `backend/src/sharedNoteService.js` vérifie les droits de rédaction, utilise une transaction `Serializable`, contrôle la version attendue et transforme `P2034` en conflit métier.
- `docs/49_NOTES_PARTAGEES_VERSIONNEES.md` définit création, correction motivée, validation séparée et historique paginé. Une ancienne implémentation ne doit pas remplacer ce contrat sans tests de non-régression.
- `frontend/src/lib/storage.js` existe ; `frontend/src/lib/clipboard.js` n'existe pas sous ce chemin sur `main`. Ce constat ne permet pas de conclure sur les autres implémentations de copie.
- `backend/src/sharedNoteRevisionService.js` n'existe pas sous ce chemin sur `main` : il faut comparer le comportement, pas les noms.
- Le `README.md` contient encore des formulations historiques sur le frontend non relié à l'API, alors que des écrans sécurisés ont été ajoutés. Clarifier le **mode démonstration par défaut** et le **mode serveur de recette fermé par défaut**, sans annoncer un déploiement.

## Ordre d'exécution et critères de preuve

1. **Notes et conflits** : lire les implémentations et tests des deux branches backend ; construire une matrice création/correction/validation, conflit simultané, droits, audit, perte d'accès. Ne porter que des tests ou corrections manquants sur une branche neuve issue de `main`.
2. **Copie, persistance, navigation** : confronter les trois branches frontend aux parcours actuels ; tester copie refusée, absence de presse-papiers, stockage indisponible, rechargement, navigation clavier et conservation des intitulés.
3. **Recette transversale fictive** : création du dossier, identité, autonomie, synthèse, notes, entretien, suite, transfert de référente, révocation, coupure réseau, réessai idempotent, historique et restauration.
4. **Documentation** : corriger les seules affirmations de statut devenues obsolètes ; ne pas changer le cahier des charges.
5. **Hygiène Git** : documenter pour chaque branche « récupérée / doublon prouvé / conservée », puis supprimer seulement après CI verte et contrôle du diff final.

Pour chaque lot : `npm run lint`, `npm test`, `npm run build`, `npm run privacy`, tests backend/PostgreSQL et contrôles GitHub pertinents. Une CI verte ne vaut pas homologation institutionnelle.

## Interdits et dépendances

Respecter `AGENTS.md`, `docs/23_ORDRE_DE_TRAVAIL.md` et `docs/48_PLAN_AGENT_DEVELOPPEMENT.md`. Pas de données personnelles réelles, de connecteur actif, de production, de fusion aveugle ou de suppression de branches. Les intégrations Insertis, Outlook, OneDrive et Mon Suivi Social nécessitent validation ARTAG et recette technique séparée.

## État de cette passe

- [x] Inventaire comparatif des cinq branches.
- [x] Identification des recouvrements et risques de réintégration.
- [x] Conservation de toutes les branches et de `main`.
- [ ] Comparaison sémantique ligne à ligne.
- [ ] Tests de non-régression exécutés.
- [ ] Décisions finales branche par branche.
