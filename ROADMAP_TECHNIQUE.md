# ROADMAP TECHNIQUE PAR ÉTAPES

## ÉTAPE 1 — Socle technique
- créer frontend React + Vite
- créer backend Express
- connecter PostgreSQL avec Prisma
- créer README
- créer docs/avancement.md

## ÉTAPE 2 — Authentification et rôles
- modèle User
- rôles
- login
- logout
- récupération mot de passe
- middleware de permissions

## ÉTAPE 3 — Modèle dossier partagé / espace réservé
- Person
- SharedCase
- ProfessionalPrivateSpace
- règles d’accès

## ÉTAPE 4 — Socle autonomie
- modèle SocleAssessment
- API création / lecture
- écran de saisie socle autonomie
- suggestion de modules

## ÉTAPE 5 — Synthèse courte / note de continuité
- lecture / écriture
- versioning
- droits d’accès
- affichage dans dossier

## ÉTAPE 6 — Modules métier
- commencer par :
  1. Droits
  2. Habitat
  3. TNS
  4. Budget
  5. Santé
  6. Écrit
- puis modules secondaires

## ÉTAPE 7 — Audit et historique
- AuditLog
- LoginLog
- versioning des blocs sensibles

## ÉTAPE 8 — Vue direction
- indicateurs principaux
- vue détaillée
- accès de secours dossier

## ÉTAPE 9 — Mode démonstration sourcé
- couche optionnelle
- source / page / citation / traduction outil

## ÉTAPE 10 — Déploiement
- build frontend
- reverse proxy Apache/Nginx
- variables d’environnement
- base PostgreSQL en production
