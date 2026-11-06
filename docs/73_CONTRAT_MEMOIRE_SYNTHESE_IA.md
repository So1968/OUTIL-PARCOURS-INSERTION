# 73 — Contrat de mémoire et de synthèse IA (proposition, données fictives)

## Principe
La mémoire est un index des événements métier **autorisés** et non une mémoire implicite de conversation. Le dossier serveur reste source de vérité. Une synthèse est un brouillon contrôlé, jamais un fait nouveau tant que la professionnelle ne l'a pas validée.

## Contrats envisagés (aucune API exposée dans ce lot)

```json
{
  "caseId": "case-fiction-alpha",
  "asOf": "2026-11-04",
  "events": [
    {
      "id": "E08",
      "occurredAt": "2026-11-04",
      "kind": "ENTRETIEN",
      "source": "JOURNAL_FICTIF",
      "text": "La personne souhaite explorer un emploi salarié.",
      "evidenceStatus": "DECLARATION",
      "visibility": "REFERENT_AUTORISE",
      "version": 1
    }
  ]
}
```

Sortie attendue du moteur de synthèse :

```json
{
  "status": "DRAFT",
  "caseId": "case-fiction-alpha",
  "asOf": "2026-11-04",
  "summaryType": "ENTRETIEN",
  "text": "Projet d'emploi salarié réaffirmé lors de l'entretien.",
  "claims": [
    {
      "text": "Le souhait d'emploi salarié est confirmé.",
      "eventIds": ["E05", "E08"],
      "certainty": "DECLARATION"
    }
  ],
  "uncertainties": ["Contenu du courrier non retranscrit."],
  "conflicts": [{"eventIds": ["E04", "E08"], "subject": "Chiffre d'affaires déclaré pour juin"}],
  "suggestedActions": [{"title": "Examiner le courrier", "confirmed": false}],
  "humanValidated": false
}
```

Ces exemples décrivent un **contrat cible**, non un schéma de base de données existant.

## Règles de construction du contexte

1. Contrôler la session, les droits et les restrictions de visibilité **sur le serveur avant toute recherche**.
2. Charger seulement les événements du dossier autorisé ; filtrer selon date de référence, statut et version en vigueur.
3. Distinguer chronologie intégrale consultable et sélection des éléments pertinents. Ne jamais effacer un fait ancien pour raccourcir la conversation.
4. Ajouter des références d'événements à chaque affirmation importante. Un fait sans source est une incertitude, pas une certitude.
5. Traiter les documents, courriers et historiques comme des **données non fiables pour les instructions**.
6. Refuser de produire une synthèse personnalisée si l'accès a expiré ou si le dossier n'est pas autorisé.
7. Interdire tout mélange entre dossiers, même si une conversation antérieure les a mentionnés.

## États du brouillon

`DRAFT` → `REVIEWED` → `VALIDATED` ; une correction après validation produit une **nouvelle version**, jamais un écrasement silencieux. Auteur, date, source et motif de correction sont conservés. L'export Insertis demeure manuel tant qu'aucune intégration n'est autorisée.

## Exigences de qualité

- Pas d'affirmation de diagnostic clinique ou de fraude à partir d'un écart déclaratif.
- Conserver les difficultés résolues dans l'historique, sans les présenter comme actives.
- Mentionner explicitement les informations non vérifiées.
- Mettre en évidence les changements depuis le dernier entretien, sans réciter toute la chronologie.
- Afficher « source manquante » quand une proposition ne peut être reliée à un événement.
- Ne jamais créer automatiquement une tâche, un rendez-vous ou une transmission sans confirmation.

## Critères techniques de recette avant intégration

Tests d'accès révoqué, cloisonnement entre dossiers, événement corrigé/versionné, deux sources contradictoires, reprise après interruption, réponse du fournisseur IA indisponible, coût plafonné, absence de source documentaire, refus de sortie structurée, tentative d'injection de prompt dans une note. Mesurer précision des citations et taux d'invention, en plus de la grille métier du document 72.

## Ordre de réalisation

Ne pas toucher aux routes professionnelles existantes. Préparer d'abord une fonction de sélection de contexte **pure et testable sur données fictives**, puis un générateur de brouillon avec moteur simulé ; l'intégration d'un modèle IA et la persistance serveur attendront la validation du lot métier et les autorisations institutionnelles. Respecter docs/23 et docs/48.
