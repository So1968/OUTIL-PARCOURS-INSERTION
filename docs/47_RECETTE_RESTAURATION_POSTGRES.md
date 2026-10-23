# Recette de sauvegarde et restauration PostgreSQL — environnement fictif

**État au 23 octobre 2026 : exercice technique automatisé, pas sauvegarde institutionnelle.**

## Ce qui est réellement vérifié

Le workflow GitHub Actions `.github/workflows/postgres-recovery.yml` exécute sur une machine éphémère :

1. Démarrage d'un conteneur PostgreSQL 16 de test, entièrement fictif, distinct de tout environnement ARTAG.
2. Validation du schéma Prisma, génération du client puis **application de la migration versionnée** avec `prisma migrate deploy` sur la base éphémère de CI, et vérification de l'historique et de la dérive.
3. Création d'un compte de recette fictif, de deux tâches, d'un événement express et d'une trace d'audit non nominative.
4. Sauvegarde personnalisée `pg_dump --format custom` avec `--no-owner --no-acl`.
5. Création d'une **seconde base de test vide**, `artag_ci_restore`, et restauration `pg_restore --single-transaction --exit-on-error`.
6. Lecture des deux bases par Prisma, vérification des références et comparaison d'une empreinte SHA-256 des données fictives attendues.

Le test échoue si la restauration n'est pas conforme, si une relation est manquante, si des données fictives attendues disparaissent ou si les utilitaires PostgreSQL renvoient une erreur.

Le fichier de sauvegarde temporaire reste sur le runner CI et est détruit à la fin du test. **Aucun artefact GitHub, aucun document, aucune sauvegarde et aucune donnée de bénéficiaire ne sont publiés.**

## Verrous de sécurité

Le programme `backend/scripts/recoveryFixture.mjs` exige simultanément `ARTAG_DB_INTEGRATION_TEST=1` et `ARTAG_RECOVERY_REHEARSAL=1`, refuse le mode production et n'accepte que `127.0.0.1:5432` ou `localhost:5432` avec les bases `artag_ci_demo` et `artag_ci_restore`. Les données fictives sont injectées **uniquement** dans `artag_ci_demo`.

Les tests unitaires contrôlent le refus des autres bases et des environnements de production. Les diagnostics du programme ne révèlent pas l'URL, le mot de passe ou le contenu des données.

Ce script **n'est pas un outil de sauvegarde réelle** : il ne doit pas être relié à un serveur professionnel, ni exécuté sur un dossier de bénéficiaire. Il n'autorise aucune opération de restauration dans un environnement ARTAG.

## Ce qui manque pour l'exploitation institutionnelle

- Une base PostgreSQL **privée, inventoriée, administrée et validée** par l'ARTAG ; le dépôt GitHub reste public.
- Un **plan institutionnel de migrations Prisma versionnées** relues et de retour arrière. La CI teste désormais la migration initiale sur base fictive, mais ne valide aucune application sur des bases ARTAG existantes.
- Une stratégie de sauvegardes réelle : choix du lieu chiffré, fréquence, politique de conservation, clés et rotation, contrôle d'accès, duplication géographique selon le besoin, supervision et alertes.
- La définition par l'ARTAG du **RPO** (perte de données tolérée) et du **RTO** (délai maximal de reprise), puis des tests mesurés attestant de ces objectifs.
- Une procédure de restauration approuvée, exécutée sur un site **isolé et sans flux sortants**, avec une personne responsable, une validation de l'intégrité et la journalisation des opérations.
- Après une restauration de production, décider et tester la **révocation des anciennes sessions**, la réinitialisation ou rotation des secrets concernés, la fermeture des connecteurs pendant l'incident et leur reprise contrôlée ; ce travail n'est pas automatisé ici.
- Des tests complémentaires de restauration physique/PITR (WAL) si les exigences d'ARTAG le demandent. `pg_dump` et `pg_restore` seuls ne démontrent pas une récupération à un instant précis.
- L'accord sécurité, RGPD et direction avant tout stockage de données de bénéficiaires.

## Checklist de validation institutionnelle (non remplie)

- [ ] Environnement privé et responsable technique identifiés et autorisés.
- [ ] Données fictives de recette, comptes SSO de test, aucun compte de bénéficiaire réel.
- [ ] Migrations rejouées sur une base vierge, avec revue des modifications de schéma.
- [ ] Sauvegarde chiffrée conservée **hors dépôt Git** et restaurée par une deuxième personne habilitée.
- [ ] Résultat de restauration documenté (date, durée, empreinte ou contrôles d'intégrité, problèmes, corrections).
- [ ] Reprise avec tous les jetons/sessions historiques invalidés conformément au plan incident.
- [ ] Tests de cloisonnement par profil, traçabilité et suppression maîtrisée.
- [ ] Dossier de décision de mise en service signé par les responsables compétents.

Ce document ne doit pas servir de preuve d'homologation. La réussite d'un test GitHub Actions sur une base fictive démontre seulement que **la mécanique de sauvegarde/restauration des modèles testés** fonctionne dans cet environnement.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*

## Évolution d'octobre 2026 : migrations CI versionnées

Le test de restauration emploie désormais une migration versionnée Prisma, vérifie le registre `_prisma_migrations` et contrôle la dérive du schéma restauré. Voir [la notice des migrations](48_MIGRATIONS_PRISMA_VERSIONNEES.md). Ces contrôles restent limités aux bases fictives du runner.
