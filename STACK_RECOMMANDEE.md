STACK_RECOMMANDEE.md

# STACK RECOMMANDÉE

## Frontend
- React
- Vite
- React Router
- CSS simple au départ
- Tailwind seulement plus tard si un besoin clair apparaît, mais pas comme obligation initiale

## Backend
- Node.js
- Express

## Base de données
- PostgreSQL

## ORM
- Prisma

## Authentification
- authentification par session sécurisée côté serveur par défaut
- mots de passe hashés avec bcrypt
- gestion des rôles côté serveur
- JWT uniquement si une contrainte d’architecture l’impose explicitement plus tard
- ne pas complexifier inutilement l’authentification au démarrage

## Déploiement
- frontend buildé et servi proprement
- backend derrière Apache ou Nginx en reverse proxy
- PostgreSQL sur serveur dédié ou sur la même machine selon le contexte réel de déploiement
- configuration par variables d’environnement
- séparation claire entre développement, test et production

## Principe
Ne pas surcharger la stack.
Rester standard, maintenable, lisible.
Privilégier les choix les plus robustes et les plus simples à maintenir pour une application web métier interne multi-utilisatrices.
