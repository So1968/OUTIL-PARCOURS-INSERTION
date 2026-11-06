# 75 — Audit d'intégration : d'où proviendra la mémoire de l'IA ?

**Constat sur le code au 06/11/2026.** Audit des services et du schéma existants, sans accès à une base ARTAG, à Insertis ni à un environnement de production. Document de réflexion, non autorisation de mise en œuvre.

## État réel du dossier sécurisé

| Source existante | Ce qu'elle contient | Peut-elle constituer une mémoire complète ? |
| --- | --- | --- |
| `CaseInterview`, `caseInterviewService.js` | Date d'entretien, provenance technique, éventuelle action de suivi | **Non.** Aucune transcription, aucun récit d'entretien, aucun diagnostic ni décision métier détaillée. |
| `SharedNote` / `SharedNoteRevision`, `sharedNoteService.js` | Notes partagées avec validations et corrections versionnées | **Partiellement.** Leur lecture dépend des droits SHARED_READ ; une note ne constitue pas automatiquement la chronologie exhaustive. |
| `CaseBrief` / `CaseBriefRevision`, `caseBriefService.js` | Synthèse courte et note de continuité aux champs limités, avec versions | **Partiellement.** Utile pour un résumé, insuffisant à lui seul pour reconstituer tous les entretiens. |
| `CaseProfessionalReflection` / ses révisions | Réflexion professionnelle réservée à son autrice, selon six axes | **Confidentielle.** Ne pas joindre par défaut à un contexte partageable ou transmissible. |
| `PrivateNote` | Notes privées modélisées | Ne présumer ni disponibilité d'une route ni permission d'export ; audit d'accès spécifique nécessaire. |
| `WorkTask` | Tâches personnelles, échéances et statuts | Source de suites à donner seulement ; une tâche n'est pas une preuve sociale et ne vaut pas compte rendu d'entretien. |
| `WorkEvent` | Événements de charge de travail | Ne pas assimiler aux événements sociaux d'une personne sans lien de dossier autorisé et confirmé. |
| `ExternalLink` | Correspondance externe pour certains systèmes, activable | Un lien technique n'est **pas** un connecteur Insertis actif ni une autorisation d'accès. |
| Insertis | Dossier institutionnel, fil et notes déjà existants d'après le besoin métier | **Non accessible par l'application actuelle.** Aucune synchronisation active ni autorisation de lecture établie. |

## Conséquence sur les promesses produit

Le logiciel ne peut pas aujourd'hui créer une synthèse fidèle de l'ensemble du fil Insertis, car il ne sait pas le lire. Il serait trompeur de présenter les traces d'entretien comme une mémoire professionnelle complète. Le prototype fictif ne prouve que les contrats techniques.

L'objectif reste : **un dialogue naturel et continu, directement dans OUTIL PARCOURS INSERTION, avec une IA réellement spécialisée en travail social, sans triplon de saisie**.

## Règles pour une future contextualisation autorisée

1. **Vérifier les droits à la source avant toute recherche**, pour chaque famille de données et à chaque utilisation. Ne pas se fier à un simple booléen passé par le navigateur.
2. **Ne jamais mélanger les permissions** des notes partagées, réflexions réservées, notes privées et tâches personnelles. Les transmissions doivent posséder leur propre consentement et autorisation.
3. **Ne pas mélanger statut factuel et conversation** : les anciens messages d'assistant restent des hypothèses tant qu'ils ne sont pas reliés à une source du dossier ou validés comme observation professionnelle.
4. **Dater et versionner les sources** : la synthèse doit indiquer quand une information était vraie, si elle est dépassée et si elle a été corrigée ; ne pas citer une version remplacée comme fait actuel.
5. **Éviter le triplon** : ne pas demander de recopier intégralement Insertis dans un troisième outil. Étudier seulement des flux institutionnellement autorisés ou des opérations ponctuelles réellement économes.
6. **Aucune génération depuis des données réelles sur fournisseur externe** sans approbation ARTAG, étude RGPD/SSI, gouvernance des accès, rétention et contrat adapté.

## Critère d'arbitrage à tester

Avant d'intégrer un véritable fournisseur IA, comparer sur un cas fictif : a) dialogue ici ; b) dialogue dans l'outil ; c) saisie/transfert réellement nécessaire et qualité des sources. Si la solution exige de recopier entièrement Insertis et de refaire la synthèse ailleurs, elle n'a pas démontré la plus-value annoncée.

## Suite technique possible sans autorisation institutionnelle

- Maintenir les modules isolés de contexte, dialogue, vérification de brouillon et recherche documentaire **sur données fictives**.
- Tester les erreurs, accès révoqués, contradictions de versions, documents anciens et hallucinations de citations.
- Préciser l'architecture d'accès serveur et les permissions propres à chaque source, **sans ouvrir de route réelle**.
- Reporter le branchement d'une IA et d'Insertis au choix d'hébergement, au budget approuvé et à la recette métier.

Liens techniques internes : `backend/src/caseInterviewService.js`, `backend/src/sharedNoteService.js`, `backend/src/caseBriefService.js`, `backend/src/professionalReflectionService.js`, `backend/src/workTaskService.js` et `backend/prisma/schema.prisma`.
