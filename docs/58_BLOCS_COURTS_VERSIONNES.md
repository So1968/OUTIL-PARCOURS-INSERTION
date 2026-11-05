# 58 — Synthèse courte et note de continuité versionnées

## Source métier
Les deux blocs reprennent uniquement les rubriques des documents `docs/08_SYNTHESE_COURTE.md` et `docs/09_NOTE_CONTINUITE.md`. Ils n'ont pas de rapport avec les notes professionnelles réservées et ne réalisent aucune orientation automatique.

- **Synthèse courte** : situation globale ; difficultés principales ; points d'appui ; modules / sujets travaillés ; étape actuelle ; vigilance utile.
- **Note de continuité** : situation en cours ; priorité immédiate ; déjà fait ; si relais / absence ; vigilance utile.

Chaque rubrique est une chaîne courte et peut rester vide tant que l'information n'est pas confirmée. Aucune situation, difficulté ni priorité n'est inventée par l'application. Un texte est limité à 350 caractères par rubrique, 1 400 au total pour la synthèse, 1 000 pour la continuité. La professionnelle reste responsable de la formulation non diagnostique, proportionnée et respectueuse.

## Stockage et historique
Deux vues `CaseBrief` de type distinct, chacune associée au dossier unique, et leurs lignes immuables `CaseBriefRevision`. Chaque écriture atomique en PostgreSQL conserve **avant, après, auteur, date, motif, version commune du dossier et audit**. Un ancien écran ne peut écraser une version plus récente. Une divergence entre l'état courant et le dernier historique interdit l'accès et l'écriture.

Routes de recette explicitement activées :
- `GET /api/dossiers/:caseId/blocs-courts/synthese-courte` et `PATCH` sur la même route ;
- `GET /api/dossiers/:caseId/blocs-courts/note-continuite` et `PATCH` ;
- pagination d'historique via `?beforeVersion=N` ; enregistrement avec `{ expectedVersion, content, reason }`.

## Règles de sécurité / limites
- Seule la **référente titulaire et active** du dossier identifié peut lire et corriger les blocs durant cette phase. Les autres rôles, y compris un appui TNS habilité aux notes, restent refusés.
- Cookies de session serveur, HTTPS/SSO de recette, activation explicite du module, CSRF pour les écritures, données privées non journalisées, absence d'indexation/export automatique.
- L'accès temporaire pour absence et relais reste **non activé** : il exige une politique d'habilitation et une validation ARTAG. La continuité n'est pas une autorisation d'exposer tout le dossier.
- Le prototype localStorage n'est ni relié ni activé en mode professionnel sécurisé. L'écran API contrôlé constitue un lot ultérieur.
- Aucun dossier réel, compte SSO institutionnel, synchronisation Insertis/Outlook/OneDrive ou hébergement en production n'est activé.

## Recette
Tests unitaires de vocabulaire, de brièveté et de refus des champs inattendus ; intégration PostgreSQL/HTTP sur deux profils fictifs : saisie, corrections, concurrence, historique, refus TNS, audit sans contenu, incohérence de l'historique et absence de fuite vers un autre espace.
