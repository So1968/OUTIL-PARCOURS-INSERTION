# CONFIDENTIALITÉ — RÈGLES GIT

## Règle absolue

Le dépôt GitHub ne doit contenir **aucun document nominatif d’usager ou de bénéficiaire**.

Sont interdits dans le dépôt :
- exports Insertis bruts ;
- listes nominatives ;
- pièces administratives ;
- courriers individuels ;
- scans, PDF, Word, tableurs ou justificatifs ;
- chemins réels comportant des noms de personnes dans des exemples de code ou de documentation ;
- numéros de dossier réels ;
- données de santé, familiales, financières ou sociales identifiantes.

## Données de démonstration

Les tests, exemples, captures et démonstrations doivent utiliser uniquement des identités fictives explicites, par exemple :
- EXEMPLE Alpha ;
- DEMO Beta ;
- TEST Gamma.

Les numéros utilisés dans les tests sont fictifs.

## Architecture retenue

Les documents réels restent hors de GitHub, dans les espaces professionnels autorisés (Windows / OneDrive ARTAG selon les droits applicables).

Le Hub documentaire :
- indexe localement des chemins ;
- conserve ces références dans le navigateur du poste ;
- ne téléverse pas les documents ;
- ne doit jamais sérialiser les données locales dans le dépôt.

## Contrôle automatique

Le workflow `Privacy check` bloque les formats bureautiques et exports bruts les plus à risque :
`.csv`, `.tsv`, `.xlsx`, `.xls`, `.ods`, `.docx`, `.doc`, `.odt`, `.rtf`, `.pdf`.

Cette protection ne dispense pas d’une relecture humaine avant fusion.
