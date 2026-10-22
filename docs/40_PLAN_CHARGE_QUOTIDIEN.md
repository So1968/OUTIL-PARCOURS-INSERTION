# Plan de charge quotidien et saisie express — prototype

## Objectif

Permettre à une professionnelle ARTAG de connaître **sa charge de travail par journée** et de saisir un rendez-vous, un appel ou un imprévu **en un clic pour les cas usuels**, sans devoir remplir une fiche longue.

L'outil doit rester une aide à l'organisation et à la continuité, et non un outil d'évaluation automatisée de la personne accompagnée ou de la performance individuelle.

## Comportement mis en œuvre

- Espace **Mes tâches → Plan de charge du jour**.
- Sélection d'une journée et **temps mobilisable modifiable**. Valeur de démonstration initiale : 360 minutes, **pas une déclaration officielle des horaires ni de la capacité réelle**.
- Calcul d'une charge connue à partir :
  - des tâches issues des suites d'entretien dont l'échéance est dépassée ou tombe le jour choisi, et pour lesquelles une durée est renseignée ;
  - des rendez-vous du module « Rendez-vous, rappels et documents » enregistrés à cette date avec une durée estimée ;
  - des événements saisis dans le bureau quotidien (prévus ou déjà effectués).
- Affichage de la marge, de la surcharge probable, du nombre de tâches en retard et des éléments **non chiffrables** sans durée. Les tâches sans échéance demeurent visibles mais ne gonflent pas arbitrairement la charge du jour.
- Boutons rapides **Imprévu +15 min**, **Appel +10 min** et **Rendez-vous à venir +30 min**, avec annulation en un clic. Les durées sont **des estimations initiales modifiables** et les boutons ne doivent pas être pris pour une saisie officielle du temps de travail.
- Formulaire très court pour les autres événements : type, résumé facultatif, durée, état. Aucune identité n'est requise dans ce formulaire.
- Chaque tâche post-entretien dispose d'un champ « temps estimé », renseigné en un seul choix.
- Possibilité de **copier un bilan chiffré anonymisé**, sans nom, numéro de dossier ni note d'entretien.

## Confidentialité et limites

- **Prototype public et local** : les données sont dans `localStorage`, donc **ne pas utiliser avec des cas réels**. Les contrôles de profils du navigateur ne suffisent pas.
- Les rendez-vous sont additionnés en charge **uniquement si une durée explicite est disponible** ; aucun horaire ni rendez-vous n'est inventé.
- Les entrées rapides peuvent coexister avec un rendez-vous du module dédié : l'utilisateur doit éviter de comptabiliser deux fois la même période tant qu'une déduplication sur identifiant de rendez-vous n'existe pas.
- Ni Outlook ni Microsoft To Do, Insertis, Mon Suivi Social ou OneDrive ne sont connectés. La programmation réelle des notifications et des rappels professionnels exige une intégration Microsoft Graph officiellement autorisée et un backend privé.
- Les modèles administratifs et la qualité de suivi de la Métropole restent traités dans `38_CORRESPONDANCE_REFERENTIELS_METROPOLE.md` avec validation institutionnelle ; le plan de charge n'impose pas de quota arbitraire.

## Pour la suite du logiciel professionnel

1. Stocker tâches, estimations, rendez-vous, événements et créneaux dans PostgreSQL, avec identifiant technique stable, propriétaire, journal de création/modification, version et règles de confidentialité serveur.
2. Affecter automatiquement le temps d'un rendez-vous confirmé à la journée correspondante sans double comptage des imports Outlook.
3. Répartir visuellement les activités sur la plage de travail contractuelle et protéger les pauses, trajets, temps de préparation, interruptions et marges pour imprévus.
4. Produire une synthèse chaque matin uniquement à partir de données **réellement accessibles et autorisées** ; calculer séparément charge planifiée, réalisé et reste à faire.
5. Après consentement Microsoft 365 ARTAG, créer et mettre à jour les rappels en limitant le sujet à « Action de suivi professionnel », avec gestion des doublons, conflits et erreurs de synchronisation.
6. Vérifier la recette multi-professionnelle, l'accessibilité, les exceptions de calendrier, les périodes de congé et les jours non travaillés.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
