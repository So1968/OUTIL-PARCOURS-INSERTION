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
- référencer un dossier ou un document par son libellé, la personne ou l’action concernée, sa catégorie, son chemin, son statut et une note ;
- rapprocher automatiquement les sous-dossiers importés avec les dossiers de la file active quand le nom/prénom ou le numéro de dossier donnent une correspondance forte ;
- laisser les correspondances ambiguës en « À rapprocher » pour validation manuelle ;
- relancer le rapprochement plus tard si la file active est importée après les documents ;
- rechercher et filtrer les références, notamment « Liés » et « À rapprocher » ;
- copier un chemin Windows ;
- copier une commande `explorer.exe` prête à utiliser ;
- faire évoluer le statut d’une référence : Actif, À classer, Clos, Archivé.

## Sécurité et limites du prototype

- Aucun fichier n’est téléversé dans GitHub.
- L’import de dossier lit seulement les noms, chemins relatifs, tailles et regroupements nécessaires à l’index local ; les contenus des fichiers ne sont pas envoyés.
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
