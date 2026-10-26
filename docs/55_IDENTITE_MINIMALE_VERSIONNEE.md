# Bloc identité minimal — saisie et historique côté serveur

**26 octobre 2026 — préparation de recette privée sur dossiers déjà identifiés.**

Le bloc reprend les quatre informations visibles de `06_BLOC_IDENTITE.md` : **Nom, Prénom, Numéro Insertis, Âge**. Il complète le dossier serveur existant, sans créer un autre dossier ou rapprocher des personnes. Les repères de parcours, le statut et les autres champs du dossier restent hors de ce lot.

## Parcours

La file active propose **Identité** sur les seuls dossiers identifiés dont le serveur indique la titularité. La confirmation de création donne accès à **Compléter l'identité du dossier** ; l'écran de numéro ARTAG donne aussi accès au bloc. La route `/dossiers/:caseId/identite` reste dans le module `VITE_ARTAG_SECURE_NOTES`, désactivé par défaut et réservé à HTTPS. Aucun nouveau drapeau ni choix de rôle n'est ajouté.

L'écran **Identité** attend une action **Charger l'identité et l'historique** avant toute lecture. Il affiche le numéro ARTAG du dossier vérifié par le serveur, les quatre champs et l'historique. **Compléter ou corriger l'identité** ouvre une saisie et un **Motif de modification** obligatoire. Un champ inconnu peut rester vide ; aucune valeur ni aucun âge n'est déduit d'une référence, d'un nom ou d'une date.

Les liens vers les notes et la référence visent le même identifiant de dossier. Les intitulés et le logo ARTAG sont conservés. Aucun nom n'est ajouté à la file active générale ni automatiquement aux notes.

## Données et valeurs inconnues

`CaseIdentity` contient l'état courant lié par clé au même `CaseFile`, avec sa dernière version de dossier. `CaseIdentityRevision` conserve, pour chaque écriture, les quatre valeurs précédentes et les quatre nouvelles valeurs, l'auteur serveur, la date PostgreSQL, le motif et la version. Le service ne modifie jamais une révision existante.

La migration ne remplit aucune identité existante. Sans état courant ni révision, la lecture présente les quatre champs à `null`, avec `identityVersion: 0`, sans auteur/date inventés. La création de dossier du lot précédent reste limitée au numéro ARTAG : compléter l'identité est une action distincte. Une identité partielle est autorisée ; aucun champ nominal n'est rendu artificiellement obligatoire.

Les noms/prénoms acceptent jusqu'à 200 caractères Unicode, le numéro Insertis jusqu'à 255. Ce sont des limites techniques de stockage, sans modèle institutionnel de nom ou de numéro. Les valeurs non nulles doivent être non vides, bien formées, sans contrôle ASCII ni espaces en début/fin. Aucune modification de casse, ponctuation, accents ou forme Unicode n'est effectuée. Un champ vide du formulaire est envoyé explicitement à `null`.

L'âge est un entier non négatif, borné techniquement au type PostgreSQL `Int`, ou `null` s'il est inconnu. Zéro est distinct d'une absence de valeur. Il est saisi manuellement et ne vieillit pas automatiquement ; aucune date de naissance n'est recueillie. Ce contrôle de type ne constitue ni contrôle de plausibilité métier, ni critère d'éligibilité : d'éventuelles bornes institutionnelles devront être cadrées, sans être inventées ici.

Le numéro Insertis reste une référence opaque, sans contrainte d'unicité inter-dossiers ni recherche de personne, fusion, lien externe ou synchronisation. Ce lot ne change pas `ExternalLink` et n'active aucun connecteur.

## Droits et API

`GET` et `PATCH /api/dossiers/:caseId/identite` utilisent le verrou existant des écritures partagées : base privée, OIDC, HTTPS, secret CSRF et activation explicite. Le serveur reste interdit en production. La session, le compte actif, le rôle et le dossier sont relus dans une transaction sérialisable.

Ce premier périmètre exige la **référente titulaire**, un dossier non archivé et un numéro ARTAG utilisable. Une affectation de rédaction de notes, un accès de continuité ou un rôle technique ne donnent pas accès aux champs nominaux ni à leur historique. Les dossiers inconnus, étrangers, archivés, non identifiés et les sessions invalides partagent le refus `404 DOSSIER_INDISPONIBLE`. Le booléen de lien de la file ne vaut jamais autorisation.

La lecture retourne uniquement `caseId`, `artagReference`, `dossierVersion`, `identityVersion`, `identity`, `history`, `nextBeforeVersion`. Le seul paramètre accepté est `beforeVersion`, entier positif borné. Chaque page contient au plus 50 révisions décroissantes avec `dossierVersion`, `previousIdentity`, `identity`, `actorId`, `reason`, `createdAt`. Une nouvelle révision en tête ne décale pas les pages antérieures.

La modification exige l'origine autorisée et le jeton CSRF de session. Son JSON contient exactement :

```json
{
  "expectedVersion": 1,
  "identity": {
    "lastName": "FICTIF D’EXEMPLE",
    "firstName": "Recette",
    "insertisNumber": "INSERTIS-FICTIF",
    "age": 40
  },
  "reason": "Première saisie fictive vérifiée"
}
```

Les quatre clés d'identité sont obligatoirement présentes dans cette photographie complète, chacune pouvant valoir `null`. Aucun rôle, auteur, référence ARTAG, référente ou champ supplémentaire n'est accepté. Les paramètres de requête en modification sont refusés. Le motif doit être non vide, limité à 200 unités UTF-16 et sans contrôle. Une écriture inchangée ou invalide reçoit `422 IDENTITE_INVALIDE`. La limite JSON de 16 ko couvre aussi les caractères Unicode valides représentés sous forme échappée.

## Cohérence, audit et concurrence

L'état courant, la nouvelle révision, l'incrément du compteur global `CaseFile.version` et l'audit `CASE_IDENTITY_UPDATED` sont atomiques. Une modification des notes ou du numéro ARTAG invalide donc une ancienne version attendue d'identité. Les trous entre versions d'identité correspondent aux autres opérations sur le dossier.

Avant lecture et écriture, le service compare l'état à sa dernière révision : valeurs, numéro de version et borne du compteur global. Une ligne d'identité sans historique, un historique sans état ou une incohérence sont bloqués par `409 HISTORIQUE_IDENTITE_INDISPONIBLE`. Une référence ARTAG en désaccord avec sa dernière révision connue bloque aussi l'accès au bloc, pour éviter une association sur une identification incohérente. Une identité inconnue n'est jamais reconstituée artificiellement.

Une version attendue dépassée ou un conflit PostgreSQL `P2034`/`P2002` reçoit `409 DOSSIER_MODIFIE_ENTRE_TEMPS`. Aucun réessai automatique d'écriture. La réponse confirmée contient uniquement `caseId`, `dossierVersion`, sans renvoyer tout le contenu nominal.

Toute lecture exige un audit `CASE_IDENTITY_READ` dans la même transaction. Une panne d'audit ne livre aucune identité. Les journaux utilisent des finalités fixes, sans nom, prénom, référence Insertis, âge ou motif libre. Les réponses sont `Cache-Control: no-store`. Les API de file, notes, création et référence gardent leurs réponses minimales : aucun ajout de ces champs nominaux.

## Reprise dans l'interface

Le client utilise uniquement la session same-origin et le CSRF serveur. Aucun brouillon, identité ou jeton n'est écrit en localStorage/sessionStorage. Le formulaire désactive l'autocomplétion ; les données professionnelles ne sont pas reprises du prototype.

En conflit, en réponse incertaine ou après recharge volontaire pendant une saisie, l'interface conserve la saisie uniquement en mémoire et bloque les écritures. Elle exige recharge, comparaison puis **Continuer après relecture**, sans remplacement silencieux de version. Si la même identité est retrouvée après réponse perdue, elle n'est pas envoyée une seconde fois. Un succès confirmé suivi d'une panne de lecture reste annoncé comme enregistré et retire l'ancien affichage.

Un refus 401/403/404 efface l'identité, l'historique et la saisie. Un historique incohérent retire les données affichées et interdit la modification jusqu'à une lecture valide. Un changement de dossier détruit le composant et son brouillon ; les réponses tardives et doubles clics ne peuvent transférer de contenu. La pagination ne mélange pas deux états du dossier et reste suspendue pendant une correction/relecture.

## Migration, recette et limites

La migration additive Prisma `20261026_identite_dossier`, après les migrations existantes, crée uniquement les deux tables, leurs clés étrangères et l'index unique dossier/version. Aucun ancien dossier ni compteur n'est modifié. L'exception de confidentialité vise ce seul fichier DDL. Les règles de suppression suivent celles des révisions existantes ; aucune purge ou nouvelle durée de rétention n'est décidée. Vider un champ est une correction historisée, pas une suppression de ses anciennes valeurs.

Les tests vérifient identités inconnues/partielles, zéro et valeurs nulles, droits par session, délégation insuffisante, CSRF, validation, concurrence, historique et pagination, annulation après panne, non-diffusion aux autres API, refus de réécriture d'un état incohérent et isolation entre dossiers. La restauration PostgreSQL conserve une identité strictement fictive, sa première révision, l'auteur, les valeurs antérieures nulles et l'audit.

Chromium sur fixture fictive retirée après contrôle : accès titulaire depuis la file, saisie, conflit avec relecture, réponse perdue retrouvée sans nouvelle écriture, retrait d'accès et effacement, affichage à 390 px sans débordement avec un numéro Insertis de 255 caractères. Cela ne certifie pas un SSO ou une homologation institutionnelle.

Sur le commit de code/recette `dfe2e84` de la PR #48, les contrôles GitHub confirment 185 tests frontend, 112 tests backend PostgreSQL sans échec ni test ignoré, migration additive/idempotence/dérive, restauration de l'identité fictive, confidentialité et CodeQL conformes. Localement : 185 tests frontend et 86 tests backend réussis ; 26 recettes PostgreSQL ignorées selon leurs verrous ; client/schéma Prisma, lint, build et diff conformes. La recette préexistante des refus de création prépare une clé réellement persistée et contrôle une reconnaissance `200` avant d'éprouver ses refus : une réponse de conflit n'est plus confondue avec un dossier créé.

Ce lot prépare les quatre champs du bloc identité ; les repères de parcours et autres espaces restent à construire. Aucune reprise de noms ou de fichiers institutionnels, aucun rapprochement automatique, aucun connecteur ou compte créé. Les règles d'accès élargies, de conservation, de plausibilité métier et la recette SSO restent à valider avec ARTAG. Module fermé par défaut, sans fusion ni mise en production.
