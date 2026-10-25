# Notes partagées — correction, validation et historique

**25 octobre 2026 — préparation du backend de recette, sans activation institutionnelle.**

Ce lot complète les premières révisions de `SharedNote` prévues par [l'historique des versions](13_HISTORIQUE_VERSIONS.md) et le [plan de développement](48_PLAN_AGENT_DEVELOPPEMENT.md). Il réutilise les tables existantes ; aucune nouvelle migration n'est nécessaire.

## Comportement

- La création enregistre un brouillon et sa première révision.
- Une correction exige un texte différent, un motif non vide de 200 caractères maximum et la version attendue du dossier. Elle conserve l'ancien état et enregistre une nouvelle révision, **non validée**, même si l'état précédent était validé.
- La validation est une opération distincte après relecture : elle porte sur le texte enregistré, n'accepte aucun remplacement de texte et conserve une révision datée et attribuée. Elle ne vaut ni autorisation de transmission ni homologation ARTAG.
- Chaque révision contient texte, numéro de version, état de validation, auteur technique issu de la session, motif et date. Les révisions précédentes ne sont jamais modifiées par le service.
- Une note antérieure au versionnement dont la révision courante manque ou diffère du contenu est refusée : aucune date ni provenance n'est inventée. Sa reprise exige un lot de migration métier validé.
- Note, révision, version du dossier et événement d'audit sont enregistrés dans une transaction PostgreSQL sérialisable. Si l'audit ou la révision échoue, l'opération entière échoue.
- Deux écritures sur la même version ne peuvent pas toutes deux réussir. Un conflit de sérialisation Prisma `P2034` est traduit en conflit métier HTTP 409 ; aucun réessai automatique ne remplace le travail d'une autre professionnelle.

## Routes de recette

Ces routes sont enregistrées uniquement derrière le verrou existant des écritures partagées : base privée injectée, OIDC, origine HTTPS, secret CSRF et activation explicite. Le démarrage normal garde toutes ces routes fermées.

| Méthode et chemin après `/api/dossiers/:caseId/notes-partagees` | Entrée | Résultat |
| --- | --- | --- |
| `POST /` | `text`, `expectedVersion` | Brouillon, première révision et audit ; HTTP 201 |
| `PATCH /:noteId` | `text`, `reason`, `expectedVersion` | Correction non validée ; HTTP 200 |
| `POST /:noteId/validation` | `expectedVersion` | Validation explicite du texte relu ; HTTP 200 |
| `GET /:noteId/historique` | Curseur optionnel `beforeVersion` | Au maximum 50 révisions, de la plus récente à la plus ancienne |

Les champs supplémentaires des mutations sont refusés. Une correction ou validation réussie retourne uniquement `noteId`, `noteVersion`, `validated` et `dossierVersion`. La création conserve son contrat antérieur. L'historique fournit ces mêmes métadonnées, `history` et `nextBeforeVersion` ; le curseur de la page suivante s'utilise comme `beforeVersion`.

Réponses communes : 403 pour CSRF/origine, 404 pour dossier ou note indisponible, 409 pour conflit de version ou historique incomplet, 422 pour entrée invalide, 503 pour service indisponible. L'existence d'une note étrangère n'est pas révélée. Les réponses sont `Cache-Control: no-store`.

## Habilitations et limites du partage

Les brouillons, corrections, validations et versions antérieures restent dans le périmètre de rédaction **`SHARED_WRITE`**, vérifié côté serveur avec le compte actif et l'affectation au dossier. La session est relue dans la transaction de l'opération. Le rôle envoyé par le navigateur n'est jamais utilisé.

Un simple droit `SHARED_READ`, un accès TNS ou une dérogation temporaire de Direction n'ouvre pas les brouillons ni leur historique. Les accès Accueil, relais, Direction, Gouvernance et administration restent soumis à leur périmètre existant. Aucune note réservée n'est sélectionnée ni retournée. L'accès aux seules synthèses validées pour les vues de continuité demeure à construire séparément, avec ses champs et ses habilitations.

La lecture d'une page d'historique exige aussi un audit transactionnel. Le journal conserve l'auteur, le dossier, la date et la nature de l'action, mais jamais le texte ni le motif libre de correction. Ces derniers restent dans les révisions métier protégées.

## Client et vérifications

`frontend/src/lib/secureApi.js` dispose des opérations de correction, validation et lecture paginée. Elles réutilisent les cookies `same-origin`, le contrôle CSRF pour les mutations et l'interdiction des redirections. Aucun jeton n'est stocké et les conflits ne sont pas réessayés automatiquement.

Le client reste préparatoire : **aucun écran localStorage n'est migré ou activé par ce lot**. Aucun changement d'intitulé, de palette, de parcours ou de logique d'accompagnement.

Les tests locaux couvrent le cycle complet, les profils refusés, l'isolation entre dossiers, la pagination, les entrées invalides, le retrait de validation et les pannes. La recette PostgreSQL/HTTP ajoutée au workflow backend vérifie également les écritures concurrentes et le rollback réel lors d'une panne de révision ou d'audit. Elle s'exécute uniquement dans le runner GitHub Actions sur données fictives, selon les verrous existants.

Le workflow conserve la sortie TAP et le code de sortie natif du runner Node ; un reporter complémentaire rend les assertions échouées visibles dans les annotations de la PR, même lorsque les archives de journaux sont inaccessibles.

Restent à réaliser : reprise encadrée des éventuelles notes sans historique, modèle dossier complet, migration des écrans, validation institutionnelle du partage, recette SSO réelle, politique de conservation et revue de sécurité indépendante. Aucun connecteur ni accès de production n'est activé.
