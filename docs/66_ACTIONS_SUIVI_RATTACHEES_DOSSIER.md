# 66 — Suites à donner et rappels rattachés au dossier (premier lot)

## Besoin du cahier des charges
Le tronc commun doit éviter de saisir plusieurs fois les mêmes relances. Le rattachement d'une action au dossier facilite la reprise après entretien, sans confondre les parcours social, socio-professionnel, appui TNS ou continuité. Voir `docs/35_DOSSIER_UNIQUE_ET_NOTION_DE_PARCOURS.md`, `docs/40_PLAN_CHARGE_QUOTIDIEN.md` et `docs/48_PLAN_AGENT_DEVELOPPEMENT.md`.

## Comportement livré
- Une tâche `WorkTask` peut recevoir un `caseId` **facultatif et explicite** lors de sa création, avec un titre court, une éventuelle échéance, un rappel J0/J1/J2/J7 et une durée estimée. Un seul `POST /api/mes-taches` idempotent enregistre cet ensemble.
- Les tâches déjà créées sans lien restent privées et leur contrat JSON historique est inchangé ; aucune migration/import ni affectation automatique à un dossier.
- L'écran sécurisé `/dossiers/:caseId/actions-suivi` propose des **suites à donner** après un entretien, sans créer automatiquement des tâches. Le titre est le seul champ obligatoire. Les précisions restent dans un panneau replié ; le professionnel choisit s'il confirme.
- Les actions du dossier figurent aussi dans le bureau professionnel et dans les rappels privés existants, en fonction de l'échéance et du report enregistrés.
- Pour éviter la surcharge visuelle, trois actions ouvertes s'affichent d'abord ; les autres et les terminées restent consultables. Le tri visible ne constitue pas une classification des personnes.
- Les suggestions « relancer la CAF », « tracer dans Insertis », etc. sont **des libellés manuels** : aucun transfert ni connexion à la CAF, Insertis ou Outlook.
- Une réponse réseau incertaine permet un réessai **avec le même identifiant et les mêmes champs**. Aucune date inventée ni duplication automatique.

## Droits et intégrité
- Le rattachement à un dossier demande la session serveur de sa **référente actuelle**, un dossier identifié par une référence ARTAG valide, ouvert et non archivé. Les rôles Appui TNS, relais, direction ou admin ne peuvent créer une tâche rattachée par cette route.
- Une tâche rattachée reste **personnelle à son autrice**. Une autre référente, même devenue titulaire du dossier, n'obtient pas accès au contenu privé d'une collègue.
- Les listes de tâches personnelles et de rappels masquent, côté SQL, les tâches liées à un dossier transféré, archivé ou privé de sa référence. Toute tentative de modification sur une tâche liée vérifie à nouveau la titularité.
- Le `caseId` ne peut pas être changé par `PATCH`, pour prévenir les rattachements involontaires. Une suppression de dossier est bloquée si des tâches rattachées existent : elle ne peut pas transformer silencieusement ces dernières en tâches libres.
- Le contrôle de session, le CSRF, les transactions sérialisables, l'anti-doublon et l'audit de tâches restent en vigueur. Les journaux techniques n'enregistrent pas les titres.
- L'interface n'est accessible que lorsque **les deux** modes sécurisés HTTPS (dossiers et tâches) sont explicitement activés. Aucune donnée du prototype `localStorage` n'est lue.

## Ce que ce lot ne prétend pas faire
Les **entretiens eux-mêmes ne sont pas encore une entité PostgreSQL** : la date, le contenu, les décisions et la provenance exacte des tâches seront ajoutés dans un autre lot, avec historique et droits spécifiques. Une tâche créée depuis le dossier est une *suite à donner*, pas une preuve qu'un entretien a eu lieu. Les listes sont actualisées sur demande : ce n'est pas une notification d'arrière-plan. La politique de transmission des tâches privées au changement de référente doit être arbitrée par ARTAG avant d'autoriser un relais.

## Recette
Les tests d'intégration PostgreSQL fictifs vérifient : création personnelle et liée, référente du bon dossier, refus Appui TNS, CSRF, changement de référente, archivage, rappel, version, tentative de transfert de tâche et idempotence. Les tests d'interface vérifient les formulaires courts, la séparation des dossiers, les refus d'accès et les réessais. Les cinq workflows CI doivent réussir avant fusion.

**Aucune utilisation de dossiers réels ni mise en production sans recette institutionnelle ARTAG, conformité RGPD/SSI et hébergement validé.**
