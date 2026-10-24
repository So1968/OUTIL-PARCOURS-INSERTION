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

## Règle de modification
- Ne pas faire de grosses modifications structurelles à la main dans Notepad.
- Les changements métier doivent être faits par blocs contrôlés, vérifiés par diff, testés, puis commités.
- Toujours vérifier le chemin du projet avant toute commande.
- Toujours lancer le projet depuis `frontend/` avec `npm run dev` pour contrôle visuel.

## Sécurité obligatoire pour tout agent (complément)
- Utiliser exclusivement des données fictives dans les tests, captures, journaux CI et commits. Ne jamais copier de données de bénéficiaires RSA/TNS, pièces, notes sociales, secrets ou exports dans Git.
- Ne pas activer les connecteurs externes ni déployer en production sans autorisations ARTAG, contrôle sécurité et respect des habilitations.
- Les autorisations de dossier doivent provenir de la session côté serveur et des droits PostgreSQL, jamais du rôle affiché dans le navigateur.
- En mode professionnel sécurisé, maintenir la séparation entre les écrans du prototype localStorage et les données professionnelles serveur.
- Créer une branche par lot, ajouter tests fonctionnels et d'accès, puis ouvrir une PR; ne pas fusionner une PR avec contrôles rouges.
- Conserver les migrations de schéma additives, versionnées et réversibles autant que possible. Les décisions métier, corrections et transmissions doivent être historisées.
- Le plan de travail opérationnel se trouve dans `docs/48_PLAN_AGENT_DEVELOPPEMENT.md` et reste subordonné à `docs/23_ORDRE_DE_TRAVAIL.md` et aux exigences validées.
- Si une autorisation institutionnelle, un accès SSO ou un arbitrage de protection des données manque, stopper ce lot à la maquette sécurisée, sans inventer de validation.
