# Correspondance suivi ARTAG ↔ référentiels de la Métropole — repérage initial

**État au 22 octobre 2026 — document de travail NON normatif.**

Objectif limité : guider la future préparation des pièces, entretiens et traces utiles sans transformer l'outil en dispositif de contrôle automatique ni détourner le chantier prioritaire de sécurité/backend.

## Sources externes institutionnelles retrouvées

1. **Métropole de Lyon, PMI’e 2022-2026** (page mise à jour en janvier 2026) : les axes incluent l'accès aux droits, les parcours personnalisés sans rupture et la participation des personnes. Source : https://www.grandlyon.com/actions/le-plan-metropolitain-dinsertion-pour-lemploi
2. **Métropole pour l'emploi, appel à projets « Parcours socio-professionnel et social 2024 »** : distingue la référence de parcours social, la référence socio-professionnelle et les parcours thématiques. La page référence les téléchargements « Cadre Parcours social 2024 » et « Cadre Parcours socioprofessionnel ». Source : https://metemploi.grandlyon.com/actualites/detail/124
3. **Métropole de Lyon, démarche RSA** : le bénéficiaire est accompagné par un référent et son parcours est formalisé dans un contrat d'engagement ; la page mentionne les évolutions depuis le 1er janvier 2025. Source : https://www.grandlyon.com/mes-services-au-quotidien/etre-accompagne-vers-lemploi/demander-le-revenu-de-solidarite-active-rsa

**Limite cruciale :** ces pages publiques ne fournissent pas à elles seules le contrat ARTAG-Métropole applicable en 2026 ni le référentiel opérationnel complet d'Insertis. Les seuils d'entretiens et de temps collectifs inscrits dans `frontend/src/data/referentielMetropoleLyon.js` doivent être confrontés au cahier des charges et à la convention ARTAG en vigueur, **avant tout calcul d'alerte de conformité**.

## Grille de correspondance provisoire — à valider avec ARTAG

| Parcours / intervention | Informations structurées à préparer dans l'outil | Sortie documentaire / trace proposée | Statut de l'exigence |
|---|---|---|---|
| **Tronc commun RSA** | Orientation, référent, diagnostic initial, objectifs co-construits, actions et échéances, points de bilan | Aide à la préparation du contrat d'engagement, historique des entretiens et prochaines étapes | Contrat d'engagement confirmé par la page officielle RSA ; modèle, circuit de signature et champs exacts à confirmer |
| **Référence de parcours social** | Accès aux droits, freins repérés, démarches engagées, points d'appui, relais autorisés, rendez-vous | Synthèse factuelle de situation, note de continuité limitée, étapes suivantes | Parcours social confirmé par appel à projets 2024 ; pièces exactes et fréquence 2026 à confirmer |
| **Référence de parcours socio-professionnel** | Diagnostic social/professionnel, projet d'activité, actions emploi/formation, étapes entreprise, bilan des progrès | Plan d'action de parcours, compte rendu d'entretien, bilan périodique, trace Insertis relue | Parcours socio-professionnel confirmé par appel à projets 2024 ; seuils et trame obligatoire 2026 à confirmer |
| **Appui TNS — activité indépendante** | Diagnostic de l'activité, immatriculation, chiffre d'affaires et viabilité *si nécessaires*, besoins d'appui, partenaires, échéances | Fiche Appui TNS, prochaines démarches, synthèse courte destinée au référent/Insertis | Cadrage métier ARTAG existant ; obligation métropolitaine spécifique non vérifiée à ce stade |
| **Relais social ou logement** | Objet limité du relais, destinataire habilité, action demandée, consentements/informations nécessaires | Fiche relais proportionnée ; jamais la note interne complète par défaut | À caler sur les protocoles ARTAG et droits de chaque professionnelle |
| **Bilan / réorientation** | Objectifs initiaux, actions réalisées, résultats observables, souhaits exprimés par la personne, suite proposée | Bilan partagé à relire avec la personne ; proposition de poursuite ou réorientation | Recommandation de conception à confirmer dans les cadres contractuels applicables |

## Règles d'implémentation différée

- **Aucune nouvelle page ou automatisation de conformité maintenant**. Le chantier backend/sécurité reste prioritaire.
- Plus tard, chaque modèle documentaire sera décrit par : type de parcours, version du référentiel, source exacte (document/page), statut `CONFIRME` ou `A_VALIDER`, champs minimaux, destinataire, droits d'accès, conservation.
- **Ne jamais afficher « document obligatoire »** sans référence confirmée à une règle applicable en 2026.
- Distinguer les *faits partageables* de l'*analyse professionnelle réservée* ; ne jamais envoyer l'ensemble des notes à Insertis ou à Mon Suivi Social par défaut.
- Les documents doivent être produits comme **brouillons relus par la professionnelle**, pas comme jugement automatique sur la qualité de suivi ou la personne accompagnée.
- Conserver les textes et intitulés du projet déjà approuvés. Une évolution métier ne peut pas être imposée par un simple algorithme.

## Vérifications ciblées pour une phase ultérieure

1. Obtenir la **convention ARTAG / Métropole** et ses annexes applicables en 2026, notamment pour l'Appui TNS.
2. Comparer les **Cadres Parcours social 2024 / Parcours socioprofessionnel** avec les éventuels avenants 2025-2026.
3. Vérifier auprès de la Métropole la trame contractuelle en vigueur, les pièces, échéances et champs réellement attendus dans Insertis.
4. Attribuer à chaque règle d'interface une source datée, une validation ARTAG et un responsable.

Cette note ne contient aucun dossier réel ni document professionnel interne.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
