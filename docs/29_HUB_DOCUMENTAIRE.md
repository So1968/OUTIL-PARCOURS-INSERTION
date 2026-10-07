# HUB DOCUMENTAIRE — PROTOTYPE

## Objectif

Ajouter à l’**Accompagnement global** un point d’entrée documentaire simple pour retrouver les bons dossiers Windows / OneDrive sans transformer le prototype ARTAG en espace de stockage de fichiers.

Le module répond à un besoin de terrain : limiter les fichiers dispersés, les doublons et le temps passé à chercher un dossier.

## Principe retenu

Le hub documentaire est un **index de chemins**, pas un coffre-fort documentaire.

Il permet de :
- mémoriser les racines de travail utiles ;
- importer une première organisation documentaire déjà existante sur le poste en sélectionnant un dossier ;
- indexer les sous-dossiers détectés sans téléverser les pièces ;
- conserver localement un inventaire léger des noms de fichiers, extensions, tailles et dates de modification ;
- limiter cet inventaire détaillé pour éviter de surcharger le navigateur tout en conservant les totaux ;
- référencer un dossier ou un document par son libellé, la personne ou l’action concernée, sa catégorie, son chemin, son statut et une note ;
- rapprocher automatiquement les sous-dossiers importés avec les dossiers de la file active quand le nom/prénom ou le numéro de dossier donnent une correspondance forte ;
- laisser les correspondances ambiguës en « À rapprocher » pour validation manuelle ;
- relancer le rapprochement plus tard si la file active est importée après les documents ;
- rechercher et filtrer les références, notamment « Liés » et « À rapprocher » ;
- retrouver un dossier à partir du nom d’un fichier déjà repéré ;
- afficher dans la fiche personne une liste courte des documents repérés ;
- signaler les doublons potentiels à partir du couple nom de fichier + taille ;
- alimenter une file de rangement assistée avec cinq états : « À décider », « À garder ici », « À déplacer », « À archiver », « Doublon à vérifier » ;
- filtrer le Hub selon ces décisions de classement ;
- copier un chemin Windows ;
- copier une commande `explorer.exe` prête à utiliser ;
- faire évoluer le statut d’une référence : Actif, À classer, Clos, Archivé.

## Sécurité et limites du prototype

- Aucun fichier n’est téléversé dans GitHub.
- L’import de dossier lit seulement les noms, chemins relatifs, extensions, tailles, dates de modification et regroupements nécessaires à l’index local ; les contenus des fichiers ne sont pas envoyés.
- L’inventaire détaillé mémorisé est volontairement limité afin de ne pas saturer le stockage local du navigateur.
- Le rapprochement automatique ne valide que les correspondances fortes et non ambiguës. Un prénom seul ou une égalité de score entre plusieurs personnes ne déclenche pas de rattachement automatique.
- Aucun document usager n’est stocké dans le code.
- Les chemins enregistrés restent dans le `localStorage` du navigateur, comme les autres données de démonstration du prototype.
- Retirer une référence de l’index ne supprime jamais le fichier Windows / OneDrive.
- Ce module ne remplace ni les droits OneDrive, ni l’authentification, ni la GED, ni la base serveur prévue dans l’architecture cible.
- Les chemins locaux sont propres au poste utilisé et ne doivent pas être considérés comme des données partagées entre professionnels.

## Accès

Route :
`/accompagnement-global/documents`

Entrée depuis :
`Accompagnement global > Hub documentaire`

## Évolution cible

Quand le backend sécurisé sera disponible, la référence documentaire devra être rattachée au dossier unique de la personne avec :
- identifiant du dossier ;
- type de pièce ;
- emplacement ou identifiant documentaire ;
- droits d’accès ;
- historique ;
- traçabilité.

Le stockage réel des pièces devra rester hors du code source et respecter le cadre de sécurité ARTAG.


## Rapprochement avec la file active

Le rapprochement documentaire utilise la file active déjà chargée dans le navigateur.

Ordre recommandé :
1. importer ou actualiser la file active Insertis ;
2. renseigner la racine documentaire ;
3. sélectionner le dossier existant ;
4. laisser l’outil rattacher les correspondances fortes ;
5. filtrer « À rapprocher » et valider les cas restants manuellement.

Si les documents ont été indexés avant la file active, le bouton **Rapprocher l’index avec la file active** permet de relancer l’analyse sans réimporter les fichiers.


## Inventaire local des fichiers

Lors de la sélection d’un dossier existant, l’outil calcule localement :
- le nombre total de fichiers par sous-dossier ;
- la taille totale ;
- la répartition par extension ;
- la date de modification la plus récente ;
- une liste limitée de noms de fichiers et de chemins reconstruits ;
- des doublons potentiels quand plusieurs fichiers ont le même nom et la même taille.

La détection de doublon est un **signal de vérification**, pas une autorisation de suppression.

Le contenu des fichiers n’est jamais lu ni transmis au dépôt GitHub.


## File de rangement assistée

Le Hub ne déplace ni ne supprime automatiquement les fichiers.

Pour chaque fichier indexé, l’utilisatrice peut enregistrer une décision :
- **À décider** ;
- **À garder ici** ;
- **À déplacer** ;
- **À archiver** ;
- **Doublon à vérifier**.

Par défaut :
- un fichier repéré comme doublon potentiel est proposé en **Doublon à vérifier** ;
- les autres fichiers restent en **À décider**.

Ces décisions restent locales au navigateur et servent à préparer un rangement futur contrôlé.

Aucune suppression ne doit être déclenchée sur la seule base d’un signal de doublon.
