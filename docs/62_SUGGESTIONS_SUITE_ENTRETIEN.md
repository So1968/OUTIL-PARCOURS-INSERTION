# 62 — Suggestions d'actions après entretien

## Objectif
Réduire la frappe et les oublis après un échange avec une personne accompagnée, tout en conservant le jugement de la professionnelle.

Un bloc **dépliable** propose six exemples neutres : relance CAF, attestation, rendez-vous logement, partenaire, bilan, trace Insertis. Le choix remplit **uniquement le champ du titre d'une tâche** ; il ne crée ni dossier ni action, n'ajoute aucune date et ne transmet rien à un partenaire. La tâche ne peut être enregistrée qu'après validation explicite du formulaire existant. L'option de saisie libre reste toujours accessible sans utiliser les suggestions.

## Deux modes indépendants
- **Démonstration** : saisie dans le bureau local existant, sans autoriser les identités réelles.
- **Bureau sécurisé** : suggestion de libellé uniquement, création via l'API privée, anti-doublon et CSRF existants. Aucun accès au localStorage de démonstration.

La suggestion « Tracer l’entretien dans Insertis » est un **rappel de travail manuel**, pas une connexion Insertis. Aucun template n'est généré automatiquement à partir de notes sensibles ou des appréciations sur une personne.

## Recette
Vérifier que les suggestions restent masquées tant qu'elles ne sont pas sollicitées, que le clic ne déclenche aucune écriture, que le formulaire laisse modifier le titre et que l'action ne s'enregistre qu'à la validation. Contrôles CI et confidentialité habituels exigés.
