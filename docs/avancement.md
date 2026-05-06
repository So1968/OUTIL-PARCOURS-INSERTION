# Avancement du projet — Outil ARTAG

## État général
Projet en phase de structuration.
Base métier largement cadrée.
Objectif : construire une application web métier déployable sur serveur, accessible depuis navigateur, sans repartir de zéro et sans progression destructive.

## Décisions déjà prises
- Architecture cible : frontend + backend + base de données
- Stack recommandée :
  - frontend : React + Vite
  - backend : Node.js + Express
  - base : PostgreSQL
  - ORM : Prisma
- Méthode : progression incrémentale, non destructive
- Document d’avancement obligatoire
- Refus des solutions techniques exotiques sans autorisation préalable

## Cadrage métier validé
- dossier unique partagé
- espace professionnel réservé
- logique de parcours
- socle autonomie
- synthèse courte
- note de continuité
- modules principaux
- modules secondaires
- traçabilité
- historique des versions
- indicateurs direction
- mode démonstration sourcé

## Ordre de reconstruction validé
1. Architecture générale
2. Droits d’accès
3. Dossier unique partagé + espace professionnel réservé
4. Parcours visuels
5. Bloc Identité / repères de parcours
6. Socle autonomie
7. Bloc professionnel / relation d’aide
8. Synthèse courte + note de continuité
9. Modules spécifiques
10. Traçabilité automatique
11. Vue direction / secours
12. Sécurisation
13. Mode démonstration sourcé

## Points de vigilance
- Ne pas mélanger logique métier et habillage visuel
- Ne pas casser l’existant
- Ne pas afficher de score brut visible
- Préserver la dignité de la personne accompagnée
- Séparer clairement dossier partagé et espace réservé
- Concevoir pour le travail réel, la reprise rapide et la continuité

## Travail en cours
- préparation du socle technique
- préparation de l’architecture applicative
- préparation du modèle de données initial

## Étape réalisée — socle frontend exécutable minimal
- création d'une base frontend autonome dans `frontend/`
- ajout d'un `package.json` frontend avec React, React DOM, React Router et Vite
- ajout des fichiers indispensables au démarrage :
  - `frontend/index.html`
  - `frontend/vite.config.js`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/styles.css`
- création d'un routing minimal pour :
  - accueil
  - parcours social / socio-professionnel
  - appui TNS
  - direction
- conservation et remise en forme du visuel d'accueil déjà amorcé
- correction du raccordement du logo ARTAG via `public/logo-artag.png`
- maintien d'un périmètre strictement frontend, sans ajout de logique métier sensible

## Validation de l'étape 1
- application frontend démarrée correctement en local
- pages principales accessibles
- routing validé
- build frontend validé
- logo ARTAG correctement raccordé et servi depuis `public/logo-artag.png`

## Clôture de l'étape 1
- étape 1 clôturée et considérée comme conforme

## Validation de l'étape 2
- source de vérité du logo conforme : `public/logo-artag.png`
- emplacement du fichier conforme
- usage réel du logo conforme dans le frontend
- suppression de l’asset parasite `src/logo-artag.png`
- étape 2 validée et conforme

## Validation de l'étape 3
- structure frontend simple de rôles en place
- séparation visuelle claire des 3 accès
- protection frontend minimale des routes en place
- redirection vers l’accueil en cas d’accès non autorisé
- absence de backend, d’authentification réelle, de session et de stockage persistant
- étape 3 validée et conforme

## Laissé inchangé volontairement
- aucun backend Express à ce stade
- aucune base PostgreSQL à ce stade
- aucun schéma Prisma à ce stade
- aucune authentification réelle à ce stade
- aucun module métier, aucun socle autonomie métier, aucune traçabilité serveur

## Points de vigilance immédiats
- les pages parcours, TNS et direction restent des points d'entrée techniques minimaux, pas encore des écrans métier finalisés

## Prochaine étape logique
Créer l’ossature technique du projet :
- frontend
- backend
- base PostgreSQL
- Prisma
- rôles utilisateurs
- premiers modèles métier

## Dette technique actuelle
- pas encore de socle backend propre
- pas encore de modèle de données implémenté
- pas encore d’authentification réelle
- pas encore de stratégie de déploiement codée

## Hypothèses ouvertes
- choix exact du mode d’authentification : session sécurisée côté serveur par défaut
- forme exacte du stockage de certains modules métier : tables dédiées vs JSON structurés
- niveau de granularité initial des permissions par bloc

## 2026-05-05 — Ajout contrôlé des Repères d’autonomie

### Décidé
- Le nom visible dans l’interface est “Repères d’autonomie”.
- Le nom technique interne reste `SocleAutonomiePage.jsx`.
- Les 8 questions validées du socle autonomie sont conservées sans reformulation libre.
- Les repères ne remplacent pas l’approfondissement ; ils le préparent.

### Créé
- `frontend/src/pages/SocleAutonomiePage.jsx`

### Modifié
- `frontend/src/App.jsx` : ajout de la route `/parcours-social-socio-professionnel/socle`.
- `frontend/src/pages/DossierPage.jsx` : libellés visibles ajustés vers “Repères d’autonomie”.
- `frontend/src/styles.css` : ajout CSS ciblé préfixé `socle-`.

### Laissé inchangé
- Accueil
- Parcours principal
- Appui TNS
- Direction
- Logique métier validée
- Quarantaine non réinjectée

### Points de vigilance
- Stockage encore provisoire en localStorage.
- Pas encore de backend, pas de traçabilité serveur, pas d’historique de versions.
- Les niveaux restent une lecture professionnelle interne, pas un score usager.

## Ajustement Repères d’autonomie — synthèse professionnelle
- La synthèse automatique ne doit pas être un simple reporting des réponses.
- Elle doit produire des phrases sobres, professionnelles et utiles à la continuité du parcours.
- Elle reste ajustable par la professionnelle avant enregistrement.
- Elle ne doit pas poser de diagnostic, ni transformer les réponses en score.
- Les décisions d’ouverture de module restent à traiter dans l’espace professionnel réservé.

## Ajustement Repères d’autonomie — règle de calcul de l’autonomie
- La définition retenue de l’autonomie est : comprendre / choisir, décider, puis passer à l’action avec ou sans appui.
- Cette définition s’appuie sur le référentiel parcours socio-professionnel 2026 et sur le cadrage ARTAG autour de l’accès aux droits, de la facilitation et de l’autonomie administrative.
- Les réponses simples visibles pendant l’échange sont traduites en lecture interne : plutôt stabilisé, à surveiller, fragile, très fragile.
- Aucun score brut n’est affiché à la personne.
- La synthèse doit produire une analyse professionnelle claire, pas un reporting des réponses.
- Les modules recommandés à valider découlent de cette lecture interne, sans ouverture automatique.

## Ajustement Repères d’autonomie — séparation écran usager et analyse professionnelle
- La page Repères d’autonomie est une page pouvant être partagée avec la personne.
- La synthèse professionnelle, la lecture interne de l’autonomie et les modules recommandés à valider sont retirés de cette page.
- La page Repères affiche uniquement les questions, les réponses simples, les éléments recueillis et un retour positif.
- Un mode partage avec la personne permet de masquer le retour vers le dossier professionnel.
- La synthèse professionnelle et les modules recommandés à valider sont déplacés dans le dossier parcours.
- Cette séparation respecte la distinction entre échange avec la personne, analyse professionnelle et décision.

## Ajustement Repères d’autonomie — synthèse transférable vers Insertis
- La page professionnelle doit comporter une synthèse courte destinée à être copiée dans Insertis.
- Cette synthèse ne doit pas reprendre toutes les réponses de la personne.
- Elle doit formuler une lecture professionnelle sobre, utile à la continuité du parcours.
- Elle doit rester modifiable par la professionnelle avant transfert.
- Elle ne doit contenir ni score visible, ni diagnostic, ni information inutilement intime.
- Elle doit permettre de tracer les besoins repérés, les appuis envisagés et les modules éventuellement proposés.
- La synthèse est une aide à la rédaction et doit être relue avant transfert dans Insertis.

## Ajustement Repères d’autonomie — dignité et écriture professionnelle
- La synthèse transférable vers Insertis doit préserver la dignité de la personne.
- Les formulations doivent éviter de qualifier directement la personne comme fragile ou déficiente.
- L’écriture doit porter sur les besoins repérés, les points à consolider, les conditions d’appui et la sécurisation du parcours.
- Les éléments produits restent une lecture professionnelle prudente, non diagnostique et ajustable.
- Les formulations doivent rester compatibles avec les attendus institutionnels, les référentiels de parcours et les bonnes pratiques d’accompagnement.
