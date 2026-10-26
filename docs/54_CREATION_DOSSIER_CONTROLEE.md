# Création contrôlée d'un dossier identifié par son numéro ARTAG

**26 octobre 2026 — préparation de recette privée, suite de la file active et de l'identification.**

Le cadrage ergonomique prévoit de retrouver ou créer un dossier (`01_PLAN_ERGONOMIE_ORDRE_APPLICATION.md`, niveau Parcours). Ce lot prépare une création minimale dans le modèle serveur existant : un dossier portant un **numéro ARTAG déjà attribué**, rattaché à la référente connectée. Il ne crée ni personne, ni nouveau parcours TNS, ni nouveau format de numérotation. L'identité complète reste à construire selon les champs validés.

## Périmètre de droits

La route de création appartient au verrou des écritures partagées existant : PostgreSQL privé, OIDC configuré, origine HTTPS, secret CSRF robuste et activation explicite. Aucun nouveau drapeau ni compte n'est ajouté ; le serveur refuse toujours la production et reste fermé par défaut.

La session est résolue et le compte actif/son rôle sont relus dans la transaction. Seul le profil `REFERENTE` crée ici un dossier dont **elle-même devient titulaire**. Aucun identifiant de référente ne vient du navigateur. Ce périmètre de préparation ne vaut pas validation institutionnelle des procédures d'ouverture ou de réaffectation ; aucun autre rôle ne peut créer, même avec une affectation de rédaction sur un dossier existant.

Le rôle permet de créer ce nouveau dossier vide ; il ne donne aucun accès à un dossier existant d'autrui. Une collision de référence ne rattache pas ce dossier à la demandeuse et n'en révèle ni l'identifiant ni le contenu. L'attribution initiale d'un numéro aux dossiers existants non identifiés reste fermée dans l'interface.

## API et première version

`POST /api/dossiers` exige une origine conforme et un jeton CSRF associé à la session. Aucun paramètre de requête n'est admis. Le JSON contient exactement :

```json
{
  "requestId": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  "artagReference": "ARTAG-CREATION-FICTIVE"
}
```

La clé est un UUID, renvoyé sous sa forme minuscule canonique. La référence reprend exactement la validation de l'API de correction : 1 à 80 caractères Unicode valides, sans contrôle ni espace en début/fin, sans changement de casse ni normalisation. Aucun nom ou numéro Insertis ne permet de contourner l'identification par référence. Champs supplémentaires, valeurs malformées et JSON bien formé hors contrat sont refusés par `422 CREATION_DOSSIER_INVALIDE` ; un JSON syntaxiquement invalide est refusé par le parseur existant.

La transaction sérialisable crée ensemble :

1. `CaseFile`, titulaire issue de la session, référence et version `1` ;
2. une demande immuable `CaseCreationRequest`, associant auteur, clé et dossier ;
3. la première `CaseReferenceRevision`, valeur antérieure nulle, motif fixe **Création du dossier**, auteur serveur et date PostgreSQL ;
4. l'audit `CASE_CREATED`, avec finalité fixe, sans référence ni contenu libre.

Toute panne annule l'ensemble. Aucune note, affectation de collègue, identité nominative ou autorisation temporaire n'est créée. Les notes commencent vides et restent soumises à leurs propres contrôles.

La réponse confirmée est `201` pour une création, `200` pour une création retrouvée. Elle contient uniquement `requestId`, `created`, `caseId`, `artagReference`, `dossierVersion`, avec `Cache-Control: no-store`.

## Réessais et concurrence

`CaseCreationRequest` est unique par **auteur serveur + clé de demande**, et par dossier. Elle garde une empreinte SHA-256 de la référence initiale plutôt qu'une seconde copie de celle-ci. Une même clé d'un autre compte ne recherche jamais la demande du premier compte.

Rejouer la même demande retrouve son dossier, sans création ni révision supplémentaire. Si le numéro a été corrigé depuis, l'empreinte initiale reste inchangée et la réponse présente la référence et la version **actuelles**, après nouvelle vérification des droits et de la cohérence avec la dernière révision. Cette lecture est auditée par `CASE_CREATION_REPLAYED`. Une panne d'audit ne livre pas le résultat.

La clé n'est jamais une habilitation : compte désactivé, rôle changé, session expirée/révoquée, dossier archivé ou réaffecté refusent le résultat. Un dossier présentant une référence incohérente avec sa dernière révision n'est pas reconstruit artificiellement.

La même clé avec une autre référence, une référence actuelle déjà utilisée ou un conflit non rapprochable donne `409 CREATION_DOSSIER_EN_CONFLIT`, sans détail sur un autre dossier. Les index PostgreSQL et la transaction imposent l'unicité. Après une collision `P2002` ou un conflit sérialisable `P2034`, une seconde transaction peut seulement retrouver la demande personnelle existante et l'auditer : elle ne tente jamais une nouvelle création automatique. Un conflit lors de ce rapprochement reste un `409`, à vérifier explicitement avec la même demande.

## Interface

Après une lecture autorisée de la file active — y compris une file vide — **Créer un dossier** propose **Préparer un dossier**, puis le seul champ **Numéro ARTAG du nouveau dossier**. Le numéro doit déjà être attribué ; la professionnelle doit vérifier l'existence du dossier avant de créer. Le serveur revérifie le rôle à l'envoi. Le formulaire ne propose ni référente au choix, ni rôle de simulation, ni attribution en aveugle à une ancienne ligne non identifiée.

Au premier envoi, le composant prépare une clé et conserve la même référence pendant la vérification. Une réponse perdue ou incomplète n'annonce pas un succès. Le bouton **Vérifier cette création** renvoie uniquement cette demande identique, sur action explicite, sans réémission automatique ni génération d'une autre clé. Une confirmation doit porter la clé attendue et des champs valides. Pour une création nouvelle, référence et version initiale doivent aussi correspondre à l'envoi.

Le résultat donne accès aux notes et à l'historique du même dossier. La file s'actualise par recharge explicite ; les notes relisent elles-mêmes référence, version et droits. **Fermer cette demande** ne prétend pas annuler une opération déjà envoyée. Avant toute autre création, vérifier la file active et le dossier concerné.

Un double clic ne produit pas deux appels. Les réponses après démontage sont ignorées. Un refus 401/403/404 efface la saisie, le résultat et la file du parent ; une lecture antérieure encore en vol ne peut pas réafficher cette file. Aucun numéro, brouillon, clé ou jeton n'est conservé dans localStorage/sessionStorage. Après rechargement de la page, la clé en mémoire est perdue : retrouver le dossier dans la file ou via le processus autorisé avant de préparer une autre demande en cas de doute.

## Migration et conservation

La migration Prisma additive `20261026_dossier_creation_requests`, ordonnée après les migrations existantes de référence, ajoute uniquement une table, deux index uniques et les clés étrangères. Aucun ancien dossier n'est modifié, aucun créateur antérieur n'est deviné. Les liens vers compte et dossier sont en suppression restreinte pour éviter qu'une suppression technique perde la clé et permette une recréation silencieuse. Aucune route de suppression de demande ou purge automatique n'est fournie ; la politique de conservation reste à valider institutionnellement. Revenir au code précédent n'exige pas de supprimer ces traces.

L'exception de confidentialité vise uniquement ce fichier de DDL généré. La recette de sauvegarde/restauration inclut la demande fictive, son auteur, sa clé et son empreinte, en plus de la première révision. Aucun schéma n'est déployé sur une base ARTAG dans ce lot.

## Recette et limites

Tests : création + historique initial + notes vides ; droits, CSRF, corps strict ; réessai après correction ; concurrence même clé/même référence, même clé/contenus différents et références en collision ; séparation entre comptes ; retrait de droits, archive/réaffectation ; annulation complète après panne de demande, de révision ou d'audit. Les contrôles d'activation restent fermés si un prérequis manque.

Chromium utilise une fixture strictement fictive, retirée après vérification : file vide, création dont la réponse est perdue, demande retrouvée sans second dossier, première révision, file rechargée et notes du dossier. Un numéro de 80 caractères sans séparateur reste lisible à 390 px sans débordement.

Sur le commit de code `f91f207` de la PR #47, les contrôles GitHub confirment 165 tests frontend, 101 tests backend PostgreSQL sans échec ni test ignoré, migration additive/idempotence/dérive, restauration de la demande et de son audit initial, confidentialité et CodeQL conformes. Localement : 165 tests frontend et 79 tests backend réussis ; 22 recettes PostgreSQL ignorées selon leurs verrous ; client et schéma Prisma, lint, build et diff conformes.

L'unicité porte sur les références **actuelles**, pas sur une identité de personne ni sur un registre historique de numéros. Une autre clé correspond à une autre intention de création ; elle ne constitue pas un mécanisme de rapprochement de personnes. Les règles institutionnelles de réattribution des numéros, l'identité minimale, la reprise des anciens dossiers, la création pour une autre référente, le statut/clôture et les parcours spécialisés restent à cadrer ou construire. Aucun rapprochement automatique sur nom/prénom ni reprise de fichiers locaux. Module désactivé par défaut, validation ARTAG et recette SSO toujours nécessaires ; aucune fusion ni mise en production.
