# 67 — Trace minimale des entretiens et suite confirmée (socle PostgreSQL)

## Périmètre
Le dossier unique accueille une **trace d'entretien réalisé**, avec une date explicitement saisie par la professionnelle et, si elle le décide, **une seule action de suivi facultative** créée dans la même transaction. Ce lot ne copie aucune note libre, élément médical, analyse relationnelle ni jugement.

La trace ne prétend pas remplacer le compte rendu d'entretien ou la note Insertis. Un jour d'entretien ne doit pas être inventé : il est requis, validé comme date civile et ne peut pas être postérieur au jour métier calculé par le serveur en Europe/Paris.

## Contrat
- `GET /api/dossiers/:caseId/entretiens?offset=N` : dates des entretiens de la référente titulaire, paginées par 100, avec l'action de suivi propre à chaque trace lorsqu'elle existe.
- `POST /api/dossiers/:caseId/entretiens` : `{requestId, interviewDay, followUp}`.
- `followUp` peut être `null` ou contenir un titre court, une éventuelle échéance, un rappel J0/J1/J2/J7 et une durée estimée. Aucun champ libre de diagnostic ou texte de situation n'est accepté.
- Le même `requestId` ne peut jamais créer un second entretien ni une seconde tâche. Le réessai avec des données différentes est refusé. Le statut de la tâche peut ensuite évoluer via les routes privées existantes.

## Confidentialité et droits
- L'API reste inactive tant que les **deux** modules sécurisés dossiers et tâches ne sont pas explicitement activés, avec SSO, HTTPS et secret CSRF.
- La session doit correspondre à la **référente titulaire** du dossier actuel, ouvert et identifié par une référence ARTAG. Un appui TNS avec affectation `SHARED_READ` ne peut ni lire ni enregistrer cette trace.
- Les entretiens sont stockés par couple dossier/autrice. Une nouvelle référente ne récupère pas les traces de l'ancienne dans cet espace réservé, et l'ancienne perd l'accès après transfert. Le fonctionnement de la continuité partagée relève d'un futur circuit institutionnel distinct.
- L'enregistrement entretien + tâche s'effectue dans une transaction PostgreSQL sérialisable ; une erreur empêche toute création partielle. L'audit conserve le type d'événement et l'auteur, sans titre d'action ou note personnelle.
- La tâche est rattachée à l'entretien par une relation unique, et au même dossier que la trace. Son rappel est calculé par le système privé existant ; aucune notification externe n'est envoyée.

## Limites
- L'interface dédiée constitue le lot suivant.
- Une trace enregistrée n'est pas une preuve institutionnelle validée d'entretien, et une simple action de suivi ne prouve pas qu'un entretien a eu lieu.
- Les décisions détaillées, plusieurs suites pour un même entretien, les corrections versionnées d'un compte rendu, la transmission Insertis et les règles de partage de continuité restent à définir/implémenter, sans extrapoler une autorisation.
- L'utilisation avec des personnes réellement accompagnées reste **interdite** sans validation ARTAG, SSI/RGPD, hébergement et recette métier.

## Tests
Recette en PostgreSQL entièrement fictive : CSRF, accès référente, refus Appui TNS / autre dossier, rejet dates futures/impossibles, absence de champs inattendus, écriture atomique de la tâche, réessai idempotent, lecture paginée, transfert de dossier, absence de texte privé dans les journaux. Exiger cinq contrôles CI verts avant fusion.
