# État de livraison et passage en recette — 22 octobre 2026

## Statut de référence

**Le logiciel n'est PAS prêt pour une exploitation avec les données réelles de bénéficiaires.** Le dépôt reste public. Les évolutions de cette journée sont des composants sécurisés **testés avec des données fictives** ; elles ne remplacent ni une homologation ni une mise en production ARTAG.

Signature : **Outil conçu par Sofia de los Rios dans le cadre de sa mission**.

## Livrables effectivement intégrés dans `main`

| Périmètre | Livré et vérifié | Ce qu'il ne faut PAS en déduire |
|---|---|---|
| Frontend métier | Écrans existants conservés ; tests Vitest, lint et build | Les dossiers et rôles du frontend restent du prototype et utilisent `localStorage` |
| API Express / Prisma | Schéma PostgreSQL et contrôles de permissions ; tests CI sur PostgreSQL éphémère | Pas de base ARTAG opérationnelle ni de migration de production |
| Métadonnées dossier | Lecture limitée avec session, droits de dossier et audit transactionnel | Ne donne ni identité du bénéficiaire, ni note professionnelle, ni dossier complet |
| Authentification | Adaptateur OpenID Connect avec PKCE, state, nonce, tenant dédié ; comptes pré-provisionnés `IdentityLink` | Aucun SSO ARTAG réel branché ni MFA institutionnel testé |
| Sessions | Jeton opaque conservé seulement sous empreinte, cookie Secure/HttpOnly, expiration et révocation | Ne garantit pas à lui seul le fonctionnement derrière le futur proxy TLS |
| Notes partagées | Brouillons non validés, droit `SHARED_WRITE`, verrouillage de version, transactions et audit | Les analyses réservées et la politique de conservation restent à spécifier et tester |
| Écriture HTTP | Origin HTTPS et anti-CSRF ; activable **uniquement sur configuration explicite en recette** | Par défaut le serveur ne l'active pas et **refuse toujours le mode production** |
| Droits Direction | Accès individuel ponctuel avec dérogation nominative non auto-approuvée ; tests | Processus métier de délégation et d'approbation à faire valider |
| Client API React | Fonctions `same-origin` testées ; aucun jeton en `localStorage` | **Non relié aux écrans existants** : aucune migration silencieuse de dossier |
| Documents Métropole | Grille provisoire `docs/38_...` avec sources publiques | Aucun seuil 2026 ou modèle « obligatoire » confirmé sans convention ARTAG |

## Préparation des tâches et rappels après entretien

- L'écran dossier comprend une liste structurée des tâches tirées des suites explicitement saisies après entretien, sans extraction de notes réservées ni action inventée.
- Chaque tâche possède un statut, une échéance propre et un choix de rappel J-7, J-2, J-1 ou le jour même. L'interface montre les retards, tâches du jour et tâches terminées.
- Cette première maquette enregistre localement ses tâches : **ce n'est pas un agenda opérationnel multi-professionnel**. Le futur stockage sera PostgreSQL, avec affectation, journal et permissions côté serveur.
- **Aucun rendez-vous ni rappel Outlook n'est actuellement créé.** Une prévisualisation générique « Action de suivi professionnel » évite toute transmission automatique d'informations sensibles.
- La synchronisation Outlook automatique envisagée requerra : accord ARTAG, authentification professionnelle vérifiée, autorisations Microsoft Graph minimales, tests de conflits/doublons, règles de fuseau horaire et politique de notifications. Les tâches doivent être confirmées par la professionnelle avant synchronisation.
- Les tâches issues d'un compte rendu ne doivent jamais partir du principe qu'un mot isolé signifie une action ni imposer une échéance arbitraire.

## Blocages institutionnels et techniques réels

1. **Validation ARTAG (direction, métier, sécurité/RGPD)** : choix d'un responsable de traitement, périmètre, gestion des habilitations, politiques de conservation, exploitation et hébergement ; données réelles interdites avant décision.
2. **Authentification professionnelle réelle** : tenant Microsoft Entra ou autre fournisseur autorisé, inscription de l'application, URL HTTPS validée, MFA, procédure de provisionnement `IdentityLink`, fermeture des comptes et test SSO avec une identité fictive ou dédiée de recette.
3. **PostgreSQL de recette puis production** : migrations versionnées avec relecture, sauvegardes chiffrées, restauration vérifiée, surveillance, maintenance et journal d'audit maîtrisé.
4. **Modèle métier complet** : références Insertis, dossiers, actions, rendez-vous, notes partagées, notes réservées, continuité, Appui TNS, échéances et pièces ; aucune correspondance automatique sur simple nom ou prénom.
5. **Raccordement frontend** : remplacer l'usage métier de `localStorage` par des API authentifiées, faire disparaître le sélecteur de rôle de démonstration en mode sécurisé, vérifier chaque écran et chaque tentative de partage.
6. **Protection des notes professionnelles** : grille d'habilitations validée, chiffrement et traçabilité selon les besoins ; ne jamais élargir les droits d'un espace réservé par défaut.
7. **Insertis** : modalités d'export/import ou d'API officiellement autorisées par la Métropole ; aucune synchronisation confirmée.
8. **Mon Suivi Social** : obtenir une réponse officielle sur l'interopérabilité ; le code source public ne vaut pas autorisation d'accès ou d'écriture.
9. **Outlook/OneDrive ARTAG** : autorisations Microsoft 365 administrées par ARTAG, usage de Microsoft Graph et permissions minimales, droits documentaires préservés ; aucun compte de service ni secret n'est fourni.
10. **Référentiels Métropole** : récupérer la convention ARTAG 2026 et annexes, vérifier les trames officielles du parcours social, socio-professionnel et de l'Appui TNS avant tout contrôle de qualité automatisé.
11. **Recette et sécurité** : tests complets rendez-vous → entretien → action → bilan → Insertis, tests de refus inter-profils, sauvegarde/restauration, rupture réseau, audit et revue de sécurité indépendants.

## Conditions d'acceptation de la future version professionnelle

- [ ] Accès nominatif SSO officiel : émetteur, sujet et droits attestés ; aucun utilisateur ne s'auto-attribue un rôle.
- [ ] Tous les dossiers d'essai sont fictifs et cloisonnés par habilitation ; aucun rôle technique ou de gouvernance ne lit le dossier complet.
- [ ] Toutes les opérations métier enregistrent un auteur, une date, une version et un audit proportionné ; test de conflit réussi.
- [ ] Aucune entrée métier réelle ne subsiste dans le stockage navigateur ni dans le dépôt GitHub.
- [ ] Restauration PostgreSQL testée par une autre personne et journalisée ; incident et sortie de service prévus.
- [ ] La Direction utilise les indicateurs agrégés, et les exceptions de lecture sont tracées et révoquées.
- [ ] Les pièces et modèles Métropole sont associés à des références institutionnelles précises, datées, validées ARTAG.
- [ ] Chaque connecteur externe est activé indépendamment après approbation ; tests d'idempotence, confidentialité et non-écrasement.
- [ ] Contrôle RGPD/SSI, correctifs et décision de mise en service enregistrés.

**Ne pas confondre réussite de la CI GitHub et autorisation d'utiliser des données de personnes.**

## Références projet

- [Cadrage métier](00_BOUSSOLE_PROJET_ARTAG.md)
- [Profils, droits, traçabilité](30_PROFILS_DROITS_TRACABILITE.md)
- [Audit technique](36_AUDIT_TECHNIQUE_ET_INTEROPERABILITE_20261022.md)
- [Backend et habilitations](37_SOCLE_BACKEND_ET_HABILITATIONS.md)
- [Référentiels Métropole](38_CORRESPONDANCE_REFERENTIELS_METROPOLE.md)

Le développement ne doit pas être présenté comme terminé tant que ces conditions ne sont pas satisfaites.
