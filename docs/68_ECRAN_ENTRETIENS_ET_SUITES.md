# 68 — Écran sécurisé des entretiens réalisés et de leurs suites

## Objectif métier

Depuis l’écran existant **Suites à donner — dossier**, la professionnelle peut enregistrer la **date d’un entretien réellement réalisé** et, si elle le décide, **une seule action de suivi facultative** dans la même opération.

L’interface distingue explicitement l’entretien de la tâche : une action saisie séparément ne prétend pas représenter un entretien et le fait d’enregistrer une date ne fabrique pas de compte rendu.

## Comportement de l’écran

- Chargement volontaire de l’historique des entretiens du dossier, par pages de 100, en lecture serveur seule.
- La date d’entretien est **obligatoire**, saisie par la professionnelle, validée comme date civile, et ne peut dépasser le **jour métier fourni par le serveur** en Europe/Paris ; elle n’est jamais initialisée automatiquement.
- La case « Ajouter une action de suivi » est **désactivée par défaut**. Si elle est cochée, le titre d’action est obligatoire ; échéance, rappel J0/J1/J2/J7 et estimation sont facultatifs.
- Un seul POST enregistre la date et la suite éventuelle via une transaction PostgreSQL existante. Le formulaire n’effectue jamais une seconde création indépendante d’action.
- En cas d’incertitude réseau, le réessai conserve la même clé et les mêmes paramètres. Après confirmation de la création, la nouvelle saisie est vidée ; un échec du rafraîchissement de la liste ne provoque pas de nouveau POST.
- L’historique indique la date de l’entretien et l’existence d’une éventuelle action, avec son état et l’échéance explicitement définie.
- Un refus d’accès efface la liste, le brouillon et les paramètres de saisie affichés.

## Périmètre et interdictions

- Mode **dossiers sécurisés ET tâches sécurisées** exclusivement, sous HTTPS et session autorisée.
- Les droits restent appliqués par le service existant : seule la référente titulaire du dossier lit ou enregistre ses traces ; la nouvelle référente ne lit pas les traces réservées de l’ancienne.
- Aucun localStorage, import automatique des rendez-vous, compte rendu médical, diagnostic, jugement, notification de fond, synchronisation Insertis ou Outlook.
- La trace ne vaut pas justificatif institutionnel d’entretien ; les décisions complexes et le compte rendu complet exigent des travaux métier et des habilitations séparés.
- Données exclusivement fictives dans la recette. Aucun déploiement ARTAG autorisé sans validations institutionnelles, SSI/RGPD et recette terrain.

## Vérifications

Tests du contrat des dates, de la suite optionnelle, de l’historique paginé, du chargement à la demande, du POST unique, du réessai anti-doublon, de la perte d’accès et des protections serveur déjà intégrées dans le lot 67. Cinq contrôles GitHub requis avant fusion.
