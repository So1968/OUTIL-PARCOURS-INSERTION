# AGENTS.md

Ce projet est déjà entièrement cadré.

## Règle absolue
- Ne réinvente rien
- Ne change pas la logique métier
- Ne renomme pas les intitulés validés
- Ne simplifie pas librement la structure
- N'interprète pas
- N'improvise pas
- N'ajoute pas de direction produit personnelle

## Source de vérité
Les fichiers de vérité sont :
- `README.md`
- tout le dossier `docs/`
- `public/logo-artag.png`
- `PROMPT_GLOBAL_FINAL_POUR_CODEX.md`

## Comportement attendu
- Exécuter fidèlement les spécifications
- Travailler dans l'ordre défini dans `docs/23_ORDRE_DE_TRAVAIL.md`
- Conserver l'existant en cas de doute
- Ne pas passer à l'étape suivante tant que la précédente n'est pas conforme

## Interdits
- Transformer le projet en site vitrine
- Transformer le projet en dashboard startup
- Modifier les intitulés validés
- Déformer ou recolorer le logo ARTAG
- Remplacer une consigne précise par une approximation
- Livrer une réinterprétation au lieu d'une exécution fidèle

## Important
Ce projet doit être traité comme une mise en œuvre stricte d'un cahier des charges déjà stabilisé.

## R�gle de modification
- Ne pas faire de grosses modifications structurelles � la main dans Notepad.
- Les changements m�tier doivent �tre faits par blocs contr�l�s, v�rifi�s par diff, test�s, puis commit�s.
- Toujours v�rifier le chemin du projet avant toute commande.
- Toujours lancer le projet depuis \rontend\ avec \
pm run dev\ pour contr�le visuel.

