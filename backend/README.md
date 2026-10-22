# Backend ARTAG — socle technique désactivé par défaut

Ce dossier introduit **Express + PostgreSQL/Prisma** conformément à `STACK_RECOMMANDEE.md` et `docs/27_ARCHITECTURE_APPLICATIVE.md`.

**État : développement seulement. Aucune donnée de bénéficiaire ne doit être utilisée.**
- Un serveur Express limité à `GET /healthz` ; toutes les routes `/api/*` répondent `503 METIER_NON_ACTIVE`.
- Écoute sur `127.0.0.1` uniquement ; refus explicite de démarrer si `NODE_ENV=production`.
- Cas de tests avec identités purement fictives : décisions d'accès par rôle, affectation, auteur de note et dérogation temporaire.
- Modèle Prisma de préparation : utilisateurs, dossiers, affectations, autorisations limitées, journal d'audit, notes partagées et réservées, références externes inactives par défaut.
- **Aucune session utilisateur, aucun mot de passe, aucune authentification réelle, aucun contrôle de dossier en base, aucune migration et aucun connecteur actif à ce stade.** Les tests de permissions sont un contrat pour l'implémentation future, pas une autorisation d'utiliser des données réelles.

## En environnement de développement isolé

```sh
npm ci --prefix backend
npm run backend:test
npm run backend:dev
```

Vérification *statique* du schéma Prisma (avec une URL fictive, sans connexion ni migration de base) :

```sh
DATABASE_URL='postgresql://demo:demo@127.0.0.1:5432/artag_demo?schema=public' npm --prefix backend run db:validate
```

Une future instance ARTAG devra obtenir validation du responsable de traitement, authentification nominative (sessions serveur), configuration chiffrée, sauvegardes testées et traçabilité conforme avant l'ouverture de la moindre route de dossier.

## Règles de conception

- Le rôle est une assertion issue d'une **session vérifiée côté serveur**, jamais la valeur du sélecteur React.
- Chaque accès au dossier doit vérifier **l'affectation effective au dossier** et la finalité professionnelle.
- Le profil technique et le CA ne lisent pas les notes individuelles. La direction lit les indicateurs agrégés ; une consultation ponctuelle du dossier nécessite une dérogation nominative et tracée.
- Les notes réservées ne sont jamais déduites d'un droit de lecture sur le dossier partagé.
- Les connecteurs Insertis, Mon Suivi Social, Outlook et OneDrive sont désactivés par défaut. Aucun secret dans Git ni dans le frontend.
