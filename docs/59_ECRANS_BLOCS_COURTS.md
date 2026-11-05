# 59 — Écrans sécurisés de synthèse courte et de continuité

## Interface de recette
Deux entrées distinctes dans la file active et dans l'identité du même dossier :
- `/dossiers/:caseId/synthese-courte`
- `/dossiers/:caseId/note-continuite`

Le composant commun conserve les intitulés, rubriques et limites de `docs/08_SYNTHESE_COURTE.md` et `docs/09_NOTE_CONTINUITE.md`. L'interface n'invente ni texte, ni priorité ni diagnostic. Les rubriques non renseignées restent vides, et la saisie est limitée à 350 caractères par rubrique (1 400 / 1 000 au total). Les deux documents restent indépendants.

Chaque bloc :
- demande explicitement un chargement depuis le serveur habilité (jamais depuis localStorage) ;
- affiche l'état actuel et les versions antérieures, sans texte caché dans les journaux techniques ;
- permet une correction motivée, journalisée et versionnée ;
- empêche une écriture sans changement, sur une version périmée ou avec des champs inconnus ;
- exige recharge puis relecture humaine après conflit ou écriture incertaine, sans retenter aveuglément ;
- efface la vue et le brouillon en cas de refus d'accès / changement de dossier.

## Contrôles et limitations
Le client utilise la session HTTPS du serveur, la protection CSRF existante et les nouvelles routes de `docs/58_BLOCS_COURTS_VERSIONNES.md`. L'ancien prototype localStorage ne sert pas de source aux blocs en mode sécurisé. La route reste désactivée en dehors du mode serveur professionnel explicite.

Aucun partage à l'accueil, à l'appui TNS ni à la direction n'est activé sans définition institutionnelle des habilitations. Les blocs courts n'envoient rien automatiquement vers Insertis, Outlook ou OneDrive. Aucun usage de données réelles avant autorisations ARTAG et recette complète sur un navigateur professionnel.

## Vérifications
Tests de contrat JSON, limites des rubriques, affichage seulement après lecture, restitution de versions, copie d'une version enregistrée, séparation des deux blocs, interdiction de localStorage, reprise après conflit, purge de la vue après refus d'accès. Tous les contrôles CI doivent réussir avant fusion.
