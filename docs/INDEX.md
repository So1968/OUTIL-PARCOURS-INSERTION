# INDEX — Documents de référence du projet ARTAG

Cet index facilite la navigation **sans modifier ni remplacer** les spécifications existantes. Les intitulés métier validés restent inchangés.

## Priorités de lecture

1. [Boussole du projet](00_BOUSSOLE_PROJET_ARTAG.md) — cadre social ARTAG et place d’Insertis.
2. [Règle absolue](00_REGLE_ABSOLUE.md) et [ordre de travail](23_ORDRE_DE_TRAVAIL.md) — discipline de conception.
3. [Stabilisation de l’architecture](34_STABILISATION_ARCHITECTURE_APPLICATION.md) — dossier unique, tronc commun, modules, pilotage.
4. [Dossier unique et notion de parcours](35_DOSSIER_UNIQUE_ET_NOTION_DE_PARCOURS.md) — principes métier.
5. [Architecture applicative](27_ARCHITECTURE_APPLICATIVE.md) — cible technique.
6. [Confidentialité Git](30_CONFIDENTIALITE_GIT.md) — données qui ne doivent jamais être commitées.
7. [Avancement](avancement.md) — mémoire de progression, à vérifier avec le code actuel.
8. [Audit technique et interopérabilité du 22/10/2026](36_AUDIT_TECHNIQUE_ET_INTEROPERABILITE_20261022.md) — risques confirmés, correctifs, dépendances Insertis / Mon Suivi Social / Outlook / OneDrive.
9. [Socle backend et habilitations](37_SOCLE_BACKEND_ET_HABILITATIONS.md) — Express, Prisma, routes bloquées et contrôles de droits à tester.
10. [Correspondance aux référentiels de la Métropole](38_CORRESPONDANCE_REFERENTIELS_METROPOLE.md) — repérage des modèles de suivi social, socio-professionnel et Appui TNS, **à faire valider**.
11. [Plan de charge quotidien et saisie express](40_PLAN_CHARGE_QUOTIDIEN.md) — rendez-vous, imprévus, tâches et estimation des temps sans données personnelles.
12. [Tâches personnelles PostgreSQL](41_TACHES_PRIVEES_POSTGRESQL.md) — première API protégée par session, rôle, propriétaire, CSRF et audit ; inactive par défaut.
13. [Rappels privés et reports](42_RAPPELS_PRIVES_ET_REPORTS.md) — rappels calculés sur la journée Europe/Paris, report, sécurité et tests PostgreSQL.
14. [État de livraison et conditions de recette](39_ETAT_LIVRAISON_ET_RECETTE.md) — fonctions testées, activation bloquée et validations ARTAG indispensables.
15. [Audit sécurité et correctifs du backend](43_AUDIT_SECURITE_BACKEND_ET_CORRECTIFS.md) — limitation des tentatives, purge contrôlée et points bloquants.
16. [Audit Grok : priorités et séparation des modes](44_AUDIT_GROK_PRIORITES_ET_MODES.md) — mode Focus, limites du frontend et révocation des sessions.
17. [Second audit Grok : reprise des tâches et activation sécurisée](45_AUDIT_GROK_REPRISE_ET_ACTIVATION.md) — actions immédiates dédoublonnées et verrou de recette.
18. [Bureau privé : événements express et charge connue](46_BUREAU_PRIVE_SAISIE_EXPRESS.md) — PostgreSQL, idempotence, charge partielle, sécurité et recette fictive.
19. [Recette de restauration PostgreSQL](47_RECETTE_RESTAURATION_POSTGRES.md) — exercice automatisé avec base fictive isolée et checklist institutionnelle.
20. [Migrations Prisma versionnées](48_MIGRATIONS_PRISMA_VERSIONNEES.md) — migration initiale, registre, contrôle de dérive et interdiction de reprise aveugle des bases existantes.
21. [Notes partagées versionnées](49_NOTES_PARTAGEES_VERSIONNEES.md) — correction motivée, validation distincte, historique paginé et refus des conflits d'écriture.

## Grandes familles documentaires

- **Identité, vision et interface** : fichiers `00_` à `06_`, `19_` à `22_`.
- **Accompagnement et modules métier** : `07_` à `15_`, `24_`, `31_`, `32_`, `33_`, `35_`.
- **Pilotage, sécurité et gouvernance** : `16_`, `17_`, `18_`, `25_ETHIQUE.md`, `26_INFRA_`, `30_PROFILS_`.
- **Notices et appropriation** : `25_CARNET_`, `26_NOTICE_`, `27_NOTICE_`, `28_NOTICE_`, `29_MEMOIRE_`.
- **Documents et échéances** : [Hub documentaire](29_HUB_DOCUMENTAIRE.md) et [Échéances et vigilances](module-echeances-et-vigilances.md).
- **Références techniques** : [dossier reference](reference/).

## État vérifié le 22 octobre 2026

- Le projet est un prototype React/Vite ; son code est dans `frontend/src`.
- `main` comporte des écrans de dossier, Appui TNS, rendez-vous, échéances, documents et sas de préparation Insertis.
- Aucune synchronisation officielle avec Outlook, OneDrive ou Insertis n’est validée dans ce dépôt.
- Le logo utilisé par la configuration Vite est `public/logo-artag.png`.
- Ne pas saisir de données réelles tant que les contrôles d’accès, le stockage serveur et les autorisations n’ont pas été validés.
