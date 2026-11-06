# 71 — Cadrage du moteur conversationnel spécialisé en travail social

> Proposition de cadrage à valider ; ne modifie pas les spécifications métier existantes ni les autorisations ARTAG.

## Finalité et critère de valeur

OUTIL PARCOURS INSERTION doit être le lieu de dialogue, d'analyse et de génération des synthèses, et non un troisième logiciel de ressaisie. Une IA spécialisée accompagne la professionnelle dans son raisonnement, sans se présenter comme assistante de service social diplômée ni décider à sa place. Si la professionnelle doit quitter l'outil pour obtenir une analyse satisfaisante, le moteur n'atteint pas son objectif.

## Expérience cible

- Dossier autorisé → conversation contextualisée par l'historique du parcours → synthèse d'entretien, synthèse évolutive ou préparation d'orientation.
- Distinguer faits sourcés et datés, propos rapportés, observations, hypothèses et informations manquantes.
- Identifier changements depuis l'entretien précédent, problèmes résolus, difficultés persistantes, décisions et tâches ouvertes ; éviter les répétitions.
- Afficher les références des événements et passages documentaires mobilisés ; permettre de revenir à la source.
- Proposer une synthèse modifiable puis une validation humaine explicite, avec historique des versions et provenance.
- Aucune écriture dans Insertis ou Outlook sans connecteur autorisé, habilitations et confirmation explicite.

## Socle documentaire social

Catalogue de sources à qualifier avant ingestion : textes légaux et réglementaires en vigueur (RSA, CASF, Code du travail, domiciliation, logement, FSL, MDPH, protection sociale, microentreprise), référentiels d'évaluation sociale et d'insertion, guides HAS pertinents selon leur champ d'application, procédures territoriales et internes ARTAG si diffusion autorisée. Pour chaque source : éditeur, URL, date de consultation, version, champ territorial, statut juridique, licence, date de validité et propriétaire de mise à jour.

Ne pas traiter un guide méthodologique comme une règle juridique. Citer les sources, signaler les conflits de versions et l'absence de preuve. Pas d'aspiration automatique de documents confidentiels.

## Architecture envisagée (non implémentée)

1. Moteur de conversation paramétrable, avec fournisseur d'IA interchangeable ; pas d'engagement payant par défaut.
2. Recherche documentaire avec passages et citations vérifiables, filtrage par date et territoire.
3. Mémoire de parcours côté serveur : événements, provenance, autorisations, versions, corrections ; aucune mémoire transversale entre dossiers.
4. Génération de brouillons avec validation humaine, journal d'audit et règles de conservation.
5. Garde-fous : contrôle d'accès serveur avant récupération documentaire, minimisation des données, protections contre injection de consignes contenues dans les documents, aucune action externe automatique.

## Conditions bloquantes pour données réelles

Validation ARTAG, analyse RGPD/SSI et contractualisation du fournisseur/hébergement, gestion des habilitations, rétention, transferts éventuels, sauvegardes et tests. Aucun dossier réel ni donnée personnelle dans GitHub, CI, maquettes ou API externe non autorisée.

## Prototype et recette sur données fictives uniquement

Construire une chronologie fictive de 6 à 10 entretiens avec une difficulté résolue, une information contradictoire, un changement d'objectif et une action en retard. Comparer : (a) synthèse rédigée en conversation de référence ; (b) synthèse produite dans l'outil. Grille d'évaluation : exactitude des faits, références, continuité, nuances, absence d'invention, non-répétition, actions pertinentes, temps de correction et coût par dossier. Prévoir tests de fuite entre dossiers, accès révoqué et consigne malveillante dans une source.

## Budget

Développement du socle sans appels IA payants ; toute expérimentation API nécessite consentement explicite, plafond de dépense et données fictives. Mesurer les tokens et les coûts réels avant choix d'un fournisseur. Un abonnement ChatGPT Plus ne finance pas automatiquement les appels API.

## Articulation avec l'existant

Respecter AGENTS.md, docs/23_ORDRE_DE_TRAVAIL.md, docs/48_PLAN_AGENT_DEVELOPPEMENT.md et docs/68_ECRAN_ENTRETIENS_ET_SUITES.md. La trace d'entretien existante n'est pas une synthèse générée. Ne pas modifier les écrans ni activer de connecteurs avant une décision métier et les étapes préalables validées. Ce document est un cadrage exploratoire, non une livraison fonctionnelle.
