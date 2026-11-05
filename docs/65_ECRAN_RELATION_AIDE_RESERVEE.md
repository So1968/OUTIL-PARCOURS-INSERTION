# 65 — Écran privé « Bloc professionnel — relation d’aide »

## Source du vocabulaire et périmètre
L'écran reprend exactement les six axes de `docs/10_BLOC_PRO_RELATION_AIDE.md`. Il est distinct de la synthèse courte, de la note de continuité et des notes partagées. Il ne comporte ni diagnostic automatique ni notation.

L'accès s'effectue depuis la file active ou l'identité du dossier identifié, uniquement dans le mode serveur professionnel sécurisé :
`/dossiers/:caseId/relation-aide`.

## Comportement
- Le chargement est **volontaire**. Les six rubriques et l'historique sont lus uniquement depuis l'API réservée `/api/dossiers/:caseId/reflexion-professionnelle`, jamais depuis localStorage.
- Les rubriques peuvent rester « Non renseigné ». Aucun contenu professionnel n'est fabriqué.
- Modifier nécessite un **motif** ; la correction conserve avant/après, autrice, date et version.
- En cas de conflit, l'écran garde le brouillon de la professionnelle, exige une recharge puis une **relecture explicite** avant toute nouvelle tentative. Jamais de double envoi automatique.
- En cas de refus d'accès, la vue actuelle et le brouillon sont effacés. La saisie est bloquée si le serveur signale un historique incohérent.
- L'historique est accessible par pages, contrôlé et sans duplication ni mélange d'autrices.
- Les champs sont adaptés au clavier, aux écrans étroits et à la saisie courte, sans notification intrusive.

## Confidentialité
La route de présentation n'ouvre aucun droit : le backend refuse l'accès hors session autorisée, hors titularité actuelle, hors autrice. Les notes réservées restent invisibles pour les relais, l'appui TNS, la direction, l'administration et la personne accompagnée. Le contenu n'est jamais envoyé vers Insertis, Outlook, OneDrive ni un service externe.

**Ce prototype n'est pas autorisé à recevoir des dossiers réels.** L'usage professionnel requiert la recette visuelle, la revue des habilitations, le contrôle RGPD/SSI et l'hébergement ARTAG validé.

## Recette
Tests unitaires de contrat JSON et des six rubriques ; tests React de chargement volontaire, absence de stockage local, correction historisée, résolution de conflit, perte d'accès et absence de fuite. Les cinq workflows CI doivent réussir avant fusion.
