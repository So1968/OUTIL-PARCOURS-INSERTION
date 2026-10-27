# Stabilisation de l'accueil et contrôles — 27 octobre 2026

Ce lot applique l'étape 1 de `23_ORDRE_DE_TRAVAIL.md` aux portes d'entrée existantes. Il ne déclare pas l'ensemble de l'architecture ou des vingt étapes conforme.

## Correspondance aux exigences

| Exigence existante | Mise en œuvre |
| --- | --- |
| README, documents 02 et 04 : Parcours social / socio-professionnel et Appui TNS | Deux cartes principales ; intitulé Parcours sur deux lignes sans slash ; entrée Appui TNS conservée |
| Document 35 : garder des parcours visibles, sans fusion artificielle | Routes existantes conservées ; aucune création de dossier unique ni migration de données |
| Document 35 : accès aux actions courantes et à la continuité | Évaluation, file active, tâches et continuité conservées comme raccourcis, filtrées selon les droits existants |
| Document 03 : accès selon les profils | Mêmes listes de rôles ; profils accueil/relais/direction/CA sans cartes professionnelles |
| Document 20 : palette claire et lisible | Palette existante de l'accueil préservée contre les surcharges globales sombres ; aucun changement de palette sur les autres écrans |
| Document 22 : logo et signature | Asset ARTAG et signature conservés |

La route `/appui-tns` continue de rediriger vers `/accompagnement-global`. Le titre interne « Accompagnement global » est conservé : il figure notamment dans le document 29. Le lot clarifie la porte d'entrée Appui TNS sans renommer cet espace ou sa logique métier.

## Validation et limites

Tests de navigation : ouverture des deux cartes, retour à l'accueil, compatibilité de l'ancienne route fiche minute, filtrage des profils et refus d'accès existant. Contrôle Chromium local aux largeurs 1280 et 390 pixels : logo chargé, liens fonctionnels, absence de débordement horizontal et vérification des couleurs calculées. Aucune donnée réelle utilisée.

La représentation discrète de Direction reste textuelle : aucune illustration de porte validée n'a été inventée. La conformité visuelle exhaustive du document 04 et la recette métier utilisateur restent à établir. La structure des pages dossier, modules et droits serveur doit encore être contrôlée avant de déclarer les étapes suivantes terminées.
