# Numéro ARTAG — attribution et correction versionnées côté serveur

**26 octobre 2026 — préparation de recette privée, suite de la file active serveur.**

Le cadrage du dossier unique prévoit le numéro ARTAG et la traçabilité des modifications. Ce lot prépare son attribution et sa correction sur un **dossier serveur existant, préalablement identifié**. Il ne crée aucun dossier, ne génère aucun numéro et n'effectue aucun rapprochement entre personnes, fichiers locaux ou outils institutionnels.

## Périmètre et habilitations

Les deux routes sont enregistrées derrière le verrou existant des écritures partagées : PostgreSQL privé, OIDC configuré, origine HTTPS fixe, secret CSRF et activation explicite. Aucun nouveau drapeau ni compte n'est créé ; les réglages par défaut restent fermés.

Dans une transaction sérialisable, le serveur résout la session, vérifie le compte actif et relit le dossier non archivé. Cette première préparation est limitée à sa **référente titulaire**, conformément à son périmètre de dossier complet. Une affectation de rédaction de notes, même active, ne donne pas la possibilité de modifier l'identification. Les profils TNS, accueil, relais, direction, gouvernance et administration technique ne reçoivent aucun nouveau droit. Une future délégation d'identification nécessite un cadrage explicite.

Un dossier inexistant, étranger, archivé ou une session invalide reçoit le même `404 DOSSIER_INDISPONIBLE`. Aucun rôle ou identifiant d'auteur du navigateur n'est accepté.

## API

`GET /api/dossiers/:caseId/reference-artag` renvoie uniquement :

- `caseId`, `artagReference` nullable, `dossierVersion` ;
- `history` : au plus 50 révisions, par version de dossier décroissante ;
- `nextBeforeVersion` : version de la dernière ligne si une page supplémentaire existe, sinon `null`.

Chaque révision contient `dossierVersion`, `previousReference`, `artagReference`, `actorId`, `reason`, `createdAt`. Le seul paramètre admis est `beforeVersion`, entier strictement positif borné au type PostgreSQL. Les modifications de notes peuvent laisser des intervalles entre versions de référence : les deux services utilisent le même compteur de dossier. Une nouvelle correction en tête ne déplace pas les pages antérieures.

La consultation exige son événement `CASE_REFERENCE_READ` dans la même transaction ; une panne d'audit ne livre pas les données. Les réponses sont `Cache-Control: no-store`. Aucun texte de note, nom, courriel ou autre identité n'est renvoyé.

`PATCH /api/dossiers/:caseId/reference-artag` exige une origine autorisée et un jeton CSRF lié à la session. Le corps JSON comporte exactement :

```json
{
  "expectedVersion": 0,
  "artagReference": "ARTAG-RECETTE-FICTIVE",
  "reason": "Attribution après vérification fictive du dossier"
}
```

Les paramètres de requête et champs supplémentaires sont refusés. La référence comporte 1 à 80 caractères Unicode valides, sans caractères de contrôle ni espaces en début/fin. Le serveur ne change ni casse, ni ponctuation, ni forme Unicode ; il n'invente pas de format institutionnel. L'unicité existante est celle de PostgreSQL, sans rapprochement approximatif. Le motif est obligatoire, limité à 200 unités UTF-16 et sans caractères de contrôle. Les chaînes Unicode malformées sont refusées. Une référence identique, nulle ou vide est invalide : aucun effacement par cette route.

La réponse confirmée contient `caseId`, `artagReference`, `dossierVersion`. Il n'existe aucune réémission automatique. Après perte de réponse, relire la référence et son historique avant de décider d'une nouvelle opération ; rejouer l'ancienne version provoque un conflit, sans révision supplémentaire.

## Atomicité et conservation

Le changement de référence, l'incrément de version, la révision et l'audit `CASE_REFERENCE_UPDATED` sont atomiques. Le journal technique utilise une finalité fixe, sans référence ni motif libre. Le contenu métier reste dans la table dédiée `CaseReferenceRevision`.

Une révision conserve la valeur effectivement lue avant la modification, y compris `null`, ainsi que l'auteur serveur, la date PostgreSQL, le motif et la nouvelle valeur. L'historique est immuable par le service : aucune route de remplacement ou de suppression. Les notes existantes ne sont pas modifiées. Les relations suivent les mêmes contraintes de conservation que les révisions de notes ; la politique institutionnelle de rétention reste à valider, sans nouvelle purge dans ce lot.

Pour les dossiers sans historique, la première attribution/correction conserve la valeur actuelle comme valeur antérieure. Elle ne prétend pas connaître son ancien auteur ni sa date. Si une révision existe et que sa dernière référence ne correspond plus à la valeur du dossier, lecture et correction sont bloquées par `409 HISTORIQUE_REFERENCE_INDISPONIBLE`. Une reprise hors service doit être examinée, pas transformée en historique inventé.

Une version attendue dépassée, une modification concurrente ou un conflit sérialisable donne `409 DOSSIER_MODIFIE_ENTRE_TEMPS`. L'unicité est imposée par l'index PostgreSQL existant. Une collision renvoie seulement `409 REFERENCE_INDISPONIBLE`, sans rechercher ni révéler l'autre dossier. Aucun succès partiel n'est possible en cas de panne d'audit ou de révision.

## Migration et recette

La migration Prisma `20261026_case_reference_revisions` ajoute uniquement la table de révisions, son index unique dossier/version et ses clés étrangères. Elle ne remplit pas les dossiers existants et ne copie aucun contenu. Le contrôle de confidentialité autorise ce chemin DDL précis, sans autoriser d'exports SQL. Aucun déploiement sur une base institutionnelle n'est effectué.

Les tests couvrent attribution, correction, valeur antérieure, droits réels par session, délégation insuffisante, CSRF, corps strict, unicité, concurrence sur un dossier et entre dossiers, pagination malgré une correction intercalaire, révocation, expiration, dérive hors service et annulation transactionnelle en cas de panne. La recette de restauration vérifie aussi l'auteur et la révision d'une référence strictement fictive.

## Limites et suite

Ce lot est une API de préparation sécurisée, **sans nouveau formulaire utilisateur**. Plusieurs dossiers sans numéro peuvent être indistinguables dans la liste actuelle. L'attribution ne doit donc pas être proposée en aveugle à partir de leur rang ou de leur date. Le parcours d'identification devra permettre de vérifier de façon fiable quel dossier existant est concerné, dans un processus ARTAG autorisé.

Restent la création contrôlée des dossiers, le cadrage de leur identité minimale et de son rapprochement, l'écran de correction/historique, le statut/clôture et les autres espaces du parcours. Les données de démonstration ne valent pas validation institutionnelle. Les PR précédentes restent à intégrer dans l'ordre ; aucune fusion ni activation de production n'est effectuée ici.
