# Écran des notes partagées — recette privée

**26 octobre 2026 — suite du lot de [versionnement des notes](49_NOTES_PARTAGEES_VERSIONNEES.md), sans activation institutionnelle.**

## Périmètre

Une page React de notes partagées utilise désormais le client API : chargement des notes d'un dossier, création d'un brouillon, correction motivée, validation après relecture et consultation des versions précédentes. Elle conserve le vocabulaire et le thème de l'application, le logo ARTAG et la séparation avec les notes professionnelles réservées.

Cette page ne constitue pas le dossier complet, une synthèse de continuité validée pour tous les profils ni un nouvel espace de notes privées. Les écrans historiques de démonstration restent distincts.

## Activation et entrée

- Le module est **désactivé par défaut**. `frontend/.env.example` conserve `VITE_ARTAG_SECURE_NOTES=0`.
- Une recette autorisée peut préparer un build avec `VITE_ARTAG_SECURE_NOTES=1` et HTTPS. Le serveur doit déjà disposer de sa configuration SSO et du verrou des écritures partagées ; le drapeau frontend ne donne aucun droit.
- La route est `/dossiers/:caseId/notes-partagees`. Elle reçoit le contexte d'un dossier serveur connu, sans saisie d'identifiant technique dans l'interface.
- Un module demandé sur une adresse HTTP affiche un blocage HTTPS et ne revient pas aux écrans localStorage.
- Le module peut être préparé indépendamment des tâches. Dans ce mode, le bureau professionnel ne monte ni les tâches désactivées ni les composants locaux.
- Le bouton **Charger les notes partagées** effectue la première demande. Aucun formulaire de saisie n'est ouvert avant la réponse autorisée du serveur.

**Reste à raccorder :** le répertoire de dossiers professionnels et son ouverture depuis la file active serveur. Aucun lien n'est créé depuis un dossier local du prototype vers un dossier PostgreSQL supposé équivalent. Aucune donnée du navigateur n'est migrée automatiquement.

## Protection de la saisie

Le texte et le motif restent uniquement en mémoire dans le composant monté. Aucune lecture ou écriture localStorage/sessionStorage, aucun jeton conservé, aucun transfert externe.

- Un changement de dossier démonte l'ancienne saisie ; une réponse tardive ne l'affiche pas dans le nouveau dossier.
- Un refus serveur 401, 403 ou 404 efface les notes affichées et la saisie, puis demande une reconnexion ou une vérification d'accès.
- Une correction ou validation soumet la version du dossier affichée. En cas de conflit, la saisie est conservée, les mutations sont bloquées et l'utilisatrice doit **recharger, comparer puis continuer après relecture**. Une recharge volontaire pendant une saisie impose la même étape.
- Une réponse d'écriture perdue ou invalide n'est jamais présentée comme un enregistrement confirmé. Aucun réessai automatique ; une vérification des notes est exigée. Si le texte retrouvé correspond à la saisie, une action explicite permet d'ouvrir cette note et d'abandonner la nouvelle saisie.
- Une écriture confirmée suivie d'une panne de rafraîchissement reste annoncée comme enregistrée ; le formulaire est fermé pour ne pas recréer involontairement la note.
- Les changements de note sont bloqués pendant une saisie non abandonnée. La validation est distincte de la correction ; une note validée corrigée repasse en brouillon.

## Lecture du dossier côté serveur

`GET /api/dossiers/:caseId/notes-partagees?offset=0` complète les routes du lot précédent. La liste exige le même compte actif, la même session et le même droit **SHARED_WRITE** que les brouillons. Un droit SHARED_READ, une affectation TNS ou une dérogation Direction ne suffisent pas.

La transaction renvoie `dossierVersion`, au plus 25 notes et `nextOffset`. Chaque note comprend seulement `id`, `text`, `version`, `validated`, `createdAt`, `updatedAt`. Le tri stable utilise date de création décroissante puis identifiant décroissant. Les paramètres inconnus ou répétés et les offsets invalides sont refusés. Le client refuse de mélanger deux versions de dossier pendant la pagination ; les pages d'historique ne remplacent pas la version de rédaction.

La lecture exige un événement `SHARED_NOTES_READ` dans la même transaction. Si l'audit échoue, aucune liste n'est livrée. Aucun espace réservé, courriel de compte, cookie ou détail d'habilitation n'est renvoyé. Les réponses restent `Cache-Control: no-store`. Aucune migration ni dépendance supplémentaire.

## Recette et limites

Les tests React couvrent création, correction, validation, pagination, réponses invalides, panne de connexion, reprise d'une création incertaine, perte d'accès et changement de dossier. Les tests de route couvrent l'activation indépendante, le blocage HTTP et l'isolation des données locales. La recette PostgreSQL vérifie les droits, le tri, la pagination, l'absence de notes réservées et le refus d'une lecture sans audit.

Le contrôle Chromium utilise une fixture locale non suivie, des réponses API simulées et des textes exclusivement fictifs. Il vérifie lecture, correction, validation et présentation à 390 px sans débordement horizontal. Il ne certifie pas une intégration SSO ou TLS institutionnelle. La CI du lot assure séparément les contrôles PostgreSQL/HTTP réels sur base fictive.

Cette suite dépend de la PR #42 encore ouverte lors de sa création. La PR est proposée sur sa branche pour limiter la revue au nouveau lot ; l'intégration dans main doit respecter cet ordre. L'activation métier, la politique de conservation, la recette SSO réelle et la validation ARTAG restent à obtenir.
