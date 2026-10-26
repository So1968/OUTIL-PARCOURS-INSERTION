# Identité / références — correction et historique du numéro ARTAG

**26 octobre 2026 — interface de recette privée, suite de l'API versionnée.**

Le lot relie la file active à un écran **Identité / références** pour consulter et corriger le numéro ARTAG d'un dossier existant déjà identifié. Les autres champs d'identité ne sont pas créés. Aucun numéro n'est généré, aucun dossier fusionné ou créé, aucune reprise locale n'est réalisée.

## Parcours et droits

La file active propose **Numéro ARTAG et historique** uniquement lorsque le dossier possède un numéro utilisable et que le serveur indique la titularité de la référente connectée. `GET /api/mes-dossiers` ajoute le booléen `canManageReference`, calculé depuis le compte et le dossier PostgreSQL dans la transaction existante. Il ne contient aucun nouveau rôle, nom ou courriel.

Cette indication ne vaut pas autorisation : le serveur vérifie à nouveau la titularité, le compte actif, la session et l'absence d'archivage à chaque lecture/correction de référence. Une délégation de notes n'ouvre pas l'identification. Modifier le booléen dans le navigateur ne change pas les droits.

La route `/dossiers/:caseId/reference-artag` appartient au module `VITE_ARTAG_SECURE_NOTES`, toujours désactivé par défaut et réservé à HTTPS. Aucun nouveau drapeau n'est ajouté. Les écrans du prototype localStorage et le sélecteur de rôle ne sont pas montés dans ce mode. Un identifiant de route malformé est refusé sans appel réseau.

Après **Charger la référence et l'historique**, l'écran affiche le numéro serveur, son historique et un lien vers les notes du même dossier. Il propose une correction seulement si la référence actuelle est renseignée. Même une route directe vers un dossier sans numéro n'affiche aucun formulaire d'attribution. Les entrées non identifiées de la liste restent sans lien : leur rapprochement fiable relève d'un futur processus ARTAG autorisé.

## Correction et conservation

**Corriger le numéro ARTAG** ouvre un nouveau numéro et un motif obligatoires. Le numéro est conservé exactement, sans changement de casse, de forme Unicode ou de ponctuation. La validation suit l'API : 1 à 80 caractères Unicode valides, sans contrôle ni espace en début/fin ; motif non vide limité à 200 unités UTF-16. Le champ permet 160 unités UTF-16 pour ne pas tronquer 80 caractères hors du plan multilingue de base. Une référence inchangée ou invalide ne peut pas être soumise.

L'API reçoit uniquement la référence, le motif et la version de dossier lue. Le client utilise la session same-origin, un jeton CSRF demandé au serveur, `cache: no-store` et `redirect: error`. Il ne conserve ni brouillon, ni référence, ni jeton dans localStorage ou sessionStorage. Le contenu libre n'est pas reproduit dans les messages techniques.

L'enregistrement confirmé ferme et efface le formulaire, puis recharge la référence et son historique. La réponse de confirmation doit correspondre au dossier, à la référence soumise et à la version suivante. Une réponse incomplète ou étrangère ne devient pas un succès affiché.

Si la correction est confirmée mais que la lecture suivante échoue, l'écran annonce l'enregistrement confirmé et retire l'ancien contenu. Il propose une recharge ; il ne suggère pas un nouvel enregistrement.

## Conflits, coupures et retrait d'accès

- **Version dépassée** : la saisie reste en mémoire dans ce composant, les écritures sont bloquées. Il faut recharger, comparer et choisir **Continuer après relecture**. La version attendue n'est jamais remplacée silencieusement pendant la saisie, y compris lors d'une recharge volontaire.
- **Réponse d'écriture perdue ou invalide** : aucune réémission automatique. Recharge et comparaison exigées avant toute tentative. Si le numéro souhaité est déjà présent, le bouton reste désactivé ; la professionnelle peut lire l'historique puis abandonner la saisie sans doublon.
- **Numéro indisponible** : message fixe demandant de vérifier la saisie, sans révéler l'autre dossier ; aucune recherche de doublon ni donnée de tiers.
- **Historique incohérent** : l'ancien affichage est retiré et la correction bloquée jusqu'à une lecture serveur valide. Une éventuelle saisie reste en mémoire pour comparaison après résolution ; aucun historique n'est inventé.
- **Refus 401/403/404** : référence, historique et saisie sont effacés. Une session ou habilitation retirée ne conserve pas le dossier à l'écran.

Un verrou local empêche deux appels simultanés. Un changement de dossier démonte le composant grâce à sa clé de route : aucun texte ne passe au dossier suivant. Les réponses tardives d'un composant démonté sont ignorées.

## Historique

Les versions affichent ancienne et nouvelle référence, date Europe/Paris, motif et, dans un détail repliable, référence du compte auteur. Aucun nom d'auteur n'est deviné. Les valeurs antérieures sont préservées, même si une ancienne référence issue du provisionnement ne suivait pas les nouvelles règles de saisie. Une valeur nulle est distinguée d'une chaîne vide.

Les réponses sont contrôlées avant affichage : dossier demandé, versions, références, dates, auteurs, ordre et cohérence de la chaîne des anciennes/nouvelles valeurs. Une référence provisionnée avant le versionnement peut avoir un historique vide ; l'écran l'indique sans lui attribuer d'auteur ou de date fictifs.

L'historique se charge par pages de 50, par version décroissante. Il est interdit de mélanger une page issue d'un état de dossier différent : une modification concurrente oblige à recharger. La pagination est suspendue pendant une correction ou une relecture obligatoire.

## Vérification et limites

Les tests vérifient le parcours file → correction → file actualisée → notes, les refus de délégation, l'absence de formulaire pour un numéro manquant, le CSRF, les conflits, les réponses incertaines, les confirmations suivies d'une lecture refusée, la pagination, l'effacement d'accès et l'isolation entre dossiers. La recette PostgreSQL existante contrôle la titularité et les transactions ; la liste distingue désormais explicitement titulaire et délégataire sans exposer de droits supplémentaires.

Chromium vérifie sur une fixture locale strictement fictive : seul le dossier identifié titulaire possède le lien ; correction et historique ; réponse perdue retrouvée sans doublon ; notes portant le numéro rechargé ; formulaire à 390 px sans débordement. Cette fixture est retirée après contrôle et n'active ni drapeau institutionnel, ni SSO simulé en production.

Le lot n'ajoute aucune migration, dépendance, reprise de données ou activation de connecteur. Le module reste en préparation sécurisée ; recette SSO et validation métier ARTAG restent nécessaires. L'identité minimale, la création des dossiers et l'attribution initiale depuis un parcours de rapprochement fiable restent à construire. Les PR précédentes doivent être intégrées dans l'ordre ; aucune fusion n'est effectuée ici.
