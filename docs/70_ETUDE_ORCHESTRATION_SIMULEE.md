# Note préparatoire — contrats d'orchestration simulée (6 novembre 2026)

> **Document d'étude, non normatif.** Il ne modifie ni les spécifications validées ni le comportement existant. Tout développement doit suivre `AGENTS.md`, `docs/23_ORDRE_DE_TRAVAIL.md`, `docs/48_PLAN_AGENT_DEVELOPPEMENT.md` et les arbitrages ARTAG.

## Problème à résoudre

Éviter un troisième lieu de ressaisie. Insertis reste l'outil métier institutionnel et Outlook l'outil de calendrier et de rappels ; l'application en cours ne doit pas devenir une copie parallèle de ces bases. L'automatisation envisagée doit être progressive, réversible, traçable et autorisée.

## État vérifié dans les spécifications

- `docs/68_ECRAN_ENTRETIENS_ET_SUITES.md` permet déjà l'enregistrement d'un entretien réalisé et d'une suite facultative dans une transaction unique, après décision explicite de la professionnelle.
- Ce même document interdit expressément la synchronisation Insertis ou Outlook dans le lot actuel.
- `docs/48_PLAN_AGENT_DEVELOPPEMENT.md` prévoit les **simulateurs et contrats** de connecteurs après les lots métier et la recette, puis toute connexion réelle seulement après autorisation.
- Le dépôt est public : aucune donnée personnelle, numéro de dossier réel, jeton, export ou contenu professionnel confidentiel ne doit y être versé.

## Contrat de simulation proposé — à valider avant implémentation

### Entrée fictive

```json
{
  "eventId": "evt-fiction-001",
  "source": "SIMULATEUR_INSERTIS",
  "type": "ENTRETIEN_TERMINE",
  "occurredAt": "2026-11-04T10:00:00+01:00",
  "fictionalCaseId": "case-fiction-001"
}
```

Cet exemple ne correspond à aucun identifiant, export ou champ confirmé d'Insertis. Il est **inventé uniquement comme fixture de simulation**, pas comme schéma officiel.

### Traitement attendu du simulateur

1. Recevoir un événement fictif et vérifier sa validité, son origine simulée et son identifiant anti-doublon.
2. Proposer, **sans les enregistrer automatiquement**, les suites de travail autorisées par le cahier des charges.
3. Exiger une confirmation explicite de la professionnelle pour toute création ou modification de tâche.
4. Simuler la création d'un rappel Outlook en sortie **sans appel réseau**, sans accès à un compte et sans envoyer de données.
5. Produire un résultat de recette minimal : succès/échec technique, identifiant fictif et horodatage ; jamais le contenu social dans les journaux.
6. Tester un même événement rejoué, une réponse perdue, un refus, une annulation, une erreur de connecteur et la révocation des droits.

### Frontière de sécurité

| Donnée ou opération | Simulation locale avec données fictives | Usage professionnel réel |
| --- | --- | --- |
| Événement d'entretien | Oui, fictif | À définir avec ARTAG et Insertis |
| Identité, numéro de dossier, note sociale | Non | Exclusivement dans l'environnement autorisé |
| Proposition de tâche | Oui, sans validation automatique | Après contrôle d'accès et décision métier |
| Échéance et rappel | Oui, fictifs | Selon habilitations et règles Outlook validées |
| Appel API Insertis / Outlook | **Non** | Bloqué jusqu'aux autorisations et contrôles SSI/RGPD |
| Synchronisation silencieuse | **Non** | Non présumée autorisée |

## Questions techniques à résoudre sans solliciter de données réelles

- Insertis expose-t-il officiellement des événements, exports ou API, et sous quelles habilitations ?
- Outlook professionnel permet-il un flux validé de tâches/calendrier via Microsoft Graph, un connecteur institutionnel ou un autre moyen autorisé ?
- Quelle application héberge l'orchestrateur, sous quel responsable de traitement, et avec quelle durée de conservation ?
- Quelles métadonnées peuvent être traitées sans créer un dossier parallèle ou un lien indirectement identifiant ?
- Comment auditer les confirmations et erreurs sans journaliser le contenu sensible ?

## Critères de sortie de l'étude

- Contrats de simulation et jeux de données exclusivement fictifs.
- Aucun appel externe, aucune écriture sur Outlook, aucun accès Insertis.
- Tests anti-doublon, refus d'accès, erreur réseau et absence de fuite de données.
- Pas de troisième base métier créée par défaut.
- Autorisation institutionnelle requise avant toute intégration réelle.

**Statut :** hypothèse d'architecture et plan de recette, non une fonctionnalité livrée.
