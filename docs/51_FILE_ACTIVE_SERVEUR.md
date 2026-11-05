# File active serveur — entrée vers les notes partagées

**26 octobre 2026 — suite de l'écran de notes partagées, préparation de recette privée.**

## Parcours

Le bureau professionnel propose **Ouvrir ma file active**. La route `/dossiers` charge les dossiers auxquels le compte connecté a effectivement accès en rédaction. Un dossier identifié propose **Ouvrir les notes partagées** ; l'écran des notes rappelle son numéro ARTAG après sa propre vérification serveur.

L'entrée reste dans le module `VITE_ARTAG_SECURE_NOTES`, désactivé par défaut et limité à HTTPS. Aucun écran localStorage, sélecteur de rôle fictif ou dossier local n'est utilisé pour construire les liens. Les identifiants techniques passent dans les routes internes ; l'utilisatrice n'a pas à les saisir.

## Identification minimale, sans reprise automatique

`CaseFile.artagReference` ajoute le **numéro ARTAG** prévu par le cadrage du dossier unique. Le champ est optionnel, unique lorsqu'il est renseigné et limité à 80 caractères. Aucun format institutionnel, préfixe ou numéro séquentiel n'est inventé. L'application ne propose pas encore de création ni de modification de cette référence : son provisionnement et son éventuelle correction devront faire l'objet d'une reprise autorisée et tracée.

La migration `20261026_case_artag_reference` est générée par Prisma : ajout d'une colonne nullable et d'un index unique, sans DML, copie ou suppression de données. Les dossiers existants restent présents avec une référence nulle. Plusieurs valeurs nulles sont permises.

Un dossier sans numéro reste visible dans la liste avec la mention **Numéro ARTAG non renseigné**. Son lien d'ouverture est absent pour éviter de le confondre avec un autre dossier. Cette retenue d'interface ne remplace pas les droits serveur : les routes de notes existantes continuent de vérifier leurs propres habilitations.

Aucun nom, âge, numéro Insertis ou autre identité n'est déduit d'une référence. Le modèle complet d'identité et son provisionnement restent à construire.

## API et habilitations

`GET /api/mes-dossiers` est enregistré uniquement lorsque le verrou existant des écritures partagées est satisfait : base privée, OIDC, origine HTTPS, secret CSRF et activation explicite. Il ne nécessite aucun nouveau secret ni nouveau drapeau serveur.

La transaction sérialisable résout la session, relit le compte actif et son rôle, puis filtre **avant pagination** les dossiers non archivés dont la référente est titulaire ou auxquels elle dispose d'une affectation `SHARED_WRITE` active. Chaque ligne est également vérifiée avec la politique de droits existante. Un rôle seul n'ouvre pas les dossiers d'une autre professionnelle.

La liste concerne le périmètre de rédaction des notes : l'Appui TNS, l'Accueil, les relais, la Direction, le CA et l'administration ne reçoivent pas cette liste par un droit de lecture ou une dérogation. Il ne s'agit ni de la file globale ARTAG ni de la vue de continuité partagée. Les modules de lecture ou TNS devront utiliser leurs champs et droits propres, sur le même dossier unique.

La réponse contient uniquement `cases` et `nextCursor`. Chaque ligne comprend `id`, `artagReference`, `version`, `createdAt`, `updatedAt`. Aucun texte de note, détail d'affectation ou courriel n'est renvoyé ; aucun effectif global n'est calculé.

## Pagination et audit

Les pages contiennent au plus 25 dossiers, triés par date de création décroissante puis identifiant décroissant. Le curseur `before` encode uniquement la position date/identifiant de la dernière ligne. Il ne porte aucune habilitation et n'est pas utilisé pour rechercher un dossier étranger ; tous les filtres d'accès sont réappliqués à chaque page.

Un nouveau dossier inséré en tête entre deux demandes ne décale pas la page suivante. Une recharge explicite affiche les nouvelles entrées. Les paramètres inconnus, doublés et les curseurs malformés sont refusés ; aucun `userId` ou rôle du navigateur ne peut élargir la sélection.

Chaque dossier livré exige un événement `CASE_DIRECTORY_READ` dans la même transaction ; une liste vide autorisée produit un événement sans dossier. Une panne d'audit ne livre aucune liste. Les réponses sont `Cache-Control: no-store`. Un retrait de session ou d'habilitation est vérifié à nouveau lors de l'ouverture des notes ; l'interface efface la liste après un refus 401, 403 ou 404.

## Recette et limites

Les tests locaux vérifient refus inter-profils, affectation de rédaction, sessions expirées, curseurs invalides, réponses minimales et effacement de l'affichage. Un test de navigation relie le bureau à la file puis aux notes du bon dossier, sans stockage navigateur.

La recette PostgreSQL/HTTP vérifie les références uniques et nulles, l'exclusion des dossiers étrangers et archivés, la révocation d'affectation, la pagination malgré une insertion, l'absence de notes dans la liste et le refus d'une lecture sans audit. La recette de sauvegarde/restauration inclut un numéro ARTAG strictement fictif dans son empreinte.

Chromium vérifie le lien vers le bon dossier, l'absence de lien pour un dossier non identifié, le rappel de référence dans les notes et l'affichage à 390 px sans débordement horizontal, sur une fixture locale fictive non suivie. Cela ne certifie pas une recette SSO ou un hébergement institutionnel.

Cette suite dépend de la PR #43, elle-même dépendante de #42. Aucune fusion, migration institutionnelle, activation de connecteur ou mise en production n'est effectuée. Restent à préparer la création et l'identification contrôlées des dossiers, l'identité minimale, le statut/clôture, les autres périmètres métier et la recette ARTAG autorisée.
