# 56 — Socle autonomie versionné en recette serveur

## Périmètre livré
Le socle autonomie reprend strictement les **8 questions validées** dans `docs/07_SOCLE_AUTONOMIE.md` et les 5 choix existants dans `SocleAutonomiePage.jsx`. Le modèle conserve l'état et les versions des réponses par dossier PostgreSQL, sans calculer de score, diagnostic, module ou orientation automatique.

- État courant : `CaseAutonomy` ; historique : `CaseAutonomyRevision` avec état précédent, état suivant, auteur, date, motif et version du dossier.
- Une mise à jour est atomique avec la version du dossier et l'audit ; une version périmée, un historique incohérent ou un dossier archivé sont refusés.
- Les réponses, y compris les éléments d'entretien potentiellement sensibles, ne sont **jamais incluses dans le journal technique**.
- Aucune réponse manquante n'est inventée. Un repère jamais abordé ne figure pas dans l'objet.
- Lecture : `GET /api/dossiers/:caseId/socle-autonomie` ; correction : `PATCH` sur le même chemin avec `{ expectedVersion, reponses, reason }`.
- L'accès reste temporairement limité à **la référente titulaire active** d'un dossier identifié. Même une délégation de notes ne donne pas cet accès ; autres profils refusés.
- Routes derrière les mêmes verrous HTTPS, session serveur, SSO de recette, activation explicite et anti-CSRF que le dossier sécurisé. La mise en production demeure désactivée.

## Limites non résolues
Le prototype `frontend/src/pages/SocleAutonomiePage.jsx` reste une page de démonstration avec stockage navigateur, inaccessible en mode serveur sécurisé. Il **n'est pas migré** par ce lot : l'écran professionnel devra être raccordé aux nouvelles routes via un composant isolé, après recette. Ne jamais confondre sa simulation avec une donnée professionnelle persistée.

La grille de partage et de conservation des repères d'autonomie doit être validée par ARTAG. La consultation par la personne accompagnée est une fonction UX du prototype, pas une autorisation serveur. Ni import Insertis ni sortie vers un tiers.

## Recette attendue
- Vérifier exactement les 8 libellés et les choix de réponse.
- Valider migrations Prisma, confidentialité, backend/PostgreSQL, sauvegarde/restauration, frontend et CodeQL.
- Tester première saisie, correction, historique, pagination, conflit, session expirée/refus, CSRF, données invalides, audit sans texte sensible, refus en cas d'historique corrompu, séparation des autres rôles.
- Aucune donnée réelle ni déploiement.
