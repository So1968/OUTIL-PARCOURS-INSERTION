# Avancement du projet — Outil ARTAG

## 2026-10-26 — Bloc identité minimal versionné

- **Décidé :** préparer les quatre champs validés Nom, Prénom, Numéro Insertis et Âge sur le même dossier serveur identifié, sans valeur inventée, rapprochement automatique ou accès par délégation de notes.
- **Créé :** état courant et révisions avant/après, API titularité/CSRF et historique paginé, écran de saisie motivée, liens depuis file/création/référence, tests de droits, concurrence, reprise et absence de diffusion aux autres API. Voir [le contrat et les limites](55_IDENTITE_MINIMALE_VERSIONNEE.md).
- **Modifié :** migration additive sans reprise d'identités ni modification des dossiers existants ; restauration fictive pour conserver les champs, la révision, les anciennes valeurs nulles et l'audit.
- **Conservé :** numérotation ARTAG, droits des autres espaces, noms/prénoms absents de la file générale, logo/thème, séparation du prototype localStorage et activation désactivée par défaut. Aucun âge calculé, date de naissance, compte ou connecteur ajouté.
- **Vérifications :** 185 tests frontend et 86 tests backend réussis localement ; 26 recettes PostgreSQL ignorées selon leurs verrous. Sur le commit de code/recette `dfe2e84` de la PR #48, la CI confirme **112 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migration additive/idempotence/dérive, restauration de l'identité fictive, confidentialité et CodeQL conformes. Client/schéma Prisma, lint, build et diff conformes. Chromium : conflit relu, réponse perdue retrouvée sans réécriture, retrait d'accès et affichage à 390 px avec numéro Insertis de 255 caractères sans débordement. La recette des refus d'une clé connue prépare désormais explicitement son dossier persistant et vérifie sa reconnaissance avant les refus, sans supposer le succès d'une création.
- **À poursuivre :** repères de parcours, statut/clôture et espaces métier, reprise autorisée des anciens dossiers ; cadrage institutionnel de conservation, plausibilité métier et accès élargis ; recette SSO et validation ARTAG.
- **Vigilances :** toute modification exige un motif et la version globale relue ; vider un champ ne purge pas ses versions anciennes. Aucun champ nominal n'est transmis automatiquement à un autre espace ou partenaire. Le lot dépend de la PR #47 encore ouverte ; aucune fusion ni mise en production.

## 2026-10-26 — Création contrôlée du dossier serveur

- **Décidé :** préparer la création prévue au cadrage ergonomique avec un numéro ARTAG déjà attribué, sans inventer de numérotation ou de rapprochement. La référente connectée devient titulaire du seul nouveau dossier.
- **Créé :** API de création transactionnelle, demande personnelle immuable, première révision de référence et audit ; formulaire depuis une file autorisée, vérification d'une réponse perdue avec la même demande et liens vers les notes/historique. Voir [le contrat et les limites](54_CREATION_DOSSIER_CONTROLEE.md).
- **Modifié :** migration additive sans reprise des anciens dossiers ; restauration fictive pour conserver aussi la demande initiale. Un refus de création efface la file et invalide une lecture antérieure encore en vol.
- **Conservé :** données existantes, contrôles de session/rôle/CSRF, séparation du prototype localStorage, thème/logo et activation désactivée par défaut. Aucun compte, nom/prénom ou connecteur créé ; aucun accès au dossier d'autrui par collision de référence.
- **Vérifications :** 165 tests frontend et 79 tests backend réussis localement ; 22 recettes PostgreSQL ignorées localement selon leurs verrous. Sur le commit de code `f91f207` de la PR #47, la CI confirme **101 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migration additive/idempotence/dérive, restauration de la demande et de l'audit fictifs, confidentialité et CodeQL conformes. Client et schéma Prisma, lint, build et diff conformes. Chromium : demande perdue retrouvée sans doublon, historique initial, notes et référence de 80 caractères à 390 px sans débordement.
- **À poursuivre :** identité minimale, reprise et identification fiable des anciens dossiers, règles de cycle des numéros ARTAG, statut/clôture et espaces métier ; recette SSO et validation ARTAG.
- **Vigilances :** une clé n'ouvre pas un dossier archivé/réaffecté ; aucune nouvelle création automatique après conflit. La clé reste en mémoire du composant, sans stockage navigateur : après rechargement, retrouver le dossier avant toute autre création en cas de doute. Le lot dépend de la PR #46 encore ouverte ; aucune fusion ni mise en production.

## 2026-10-26 — Écran Identité / références sur dossier identifié

- **Décidé :** relier la file active à la correction et à l'historique du numéro ARTAG existant. L'attribution initiale reste fermée depuis la liste des dossiers non identifiés.
- **Créé :** écran de référence, formulaire motivé, historique paginé contrôlé, reprise après conflit et réponse perdue, tests de navigation et d'isolation entre dossiers. Voir [le contrat du lot](53_ECRAN_REFERENCE_ARTAG.md).
- **Modifié :** client API CSRF commun ; liste serveur pour indiquer la titularité via un booléen et proposer le lien au bon périmètre. Chaque opération de référence revérifie ses droits serveur.
- **Conservé :** migrations et dépendances, intitulés métier, logo, notes et données existantes, séparation du prototype localStorage, activation désactivée par défaut et limites institutionnelles.
- **Vérifications :** 151 tests frontend et 72 tests backend réussis localement ; 17 recettes PostgreSQL ignorées localement selon leurs verrous. Sur le commit de code `b4f2ac3` de la PR #46, la CI confirme **89 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migrations/idempotence/dérive, restauration, confidentialité et CodeQL conformes. Schéma Prisma, lint, build et diff conformes. Chromium vérifie correction, historique, réponse perdue retrouvée sans doublon, notes actualisées et affichage à 390 px sans débordement.
- **À poursuivre :** parcours d'identification fiable et création contrôlée, identité minimale, statut/clôture et autres espaces selon les habilitations ; recette ARTAG et SSO autorisée.
- **Vigilances :** aucun droit déduit du rôle navigateur ni du booléen de lien ; aucune saisie transférée d'un dossier à l'autre. La branche dépend de la PR #45 encore ouverte ; aucune fusion ni mise en production.

## 2026-10-26 — Attribution et correction versionnées du numéro ARTAG

- **Décidé :** préparer l'identification du dossier existant avant toute création ou reprise. Limiter ce premier service à la référente titulaire ; une délégation de rédaction de notes n'élargit pas les droits d'identification.
- **Créé :** API de lecture/historique et de correction motivée, table de révisions additive, tests unitaires et PostgreSQL/HTTP. Voir [le contrat et les limites](52_REFERENCE_ARTAG_VERSIONNEE.md).
- **Modifié :** empreinte de restauration fictive pour inclure révision, auteur et ancienne valeur. Le contrôle de confidentialité autorise uniquement le chemin précis de cette nouvelle migration DDL.
- **Conservé :** dossiers et notes existants, version de dossier commune, audit atomique, restrictions SSO/HTTPS/CSRF et activation désactivée par défaut. Aucun rapprochement de personne, référence générée, import ou migration institutionnelle.
- **Vérifications :** 124 tests frontend et 72 tests backend réussis localement ; 17 recettes PostgreSQL ignorées localement selon leurs verrous. Sur le commit de code `b11864f` de la PR #45, la CI confirme **89 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migration additive, idempotence, absence de dérive, restauration de la révision fictive, confidentialité et CodeQL conformes. Schéma et client Prisma, lint, build et diff conformes. Vite lancé depuis `frontend/`, affichage de l'accueil existant vérifié dans Chromium ; aucun écran modifié.
- **À poursuivre :** parcours d'identification fiable, écran de correction/historique et création contrôlée ; identité minimale, statut/clôture et recette institutionnelle autorisée.
- **Vigilances :** aucun formulaire d'attribution depuis la liste des dossiers sans numéro, car plusieurs entrées peuvent y être confondues. Le service exige un dossier préalablement identifié. La PR est construite sur le lot #44 encore ouvert, sans fusionner les PR précédentes.

## 2026-10-26 — File active serveur et ouverture des notes

- **Décidé :** relier le bureau professionnel aux notes par une liste de dossiers serveur autorisés en rédaction. Ajouter le numéro ARTAG prévu par le cadrage sans inventer de référence pour les dossiers existants.
- **Créé :** liste serveur filtrée et auditée, pagination stable par curseur, écran de file active et liens de dossier, migration additive de `CaseFile.artagReference`, tests de droits et de navigation. Voir [le contrat du lot](51_FILE_ACTIVE_SERVEUR.md).
- **Modifié :** bureau, retour depuis les notes et rappel de numéro ARTAG ; recette de restauration pour vérifier la conservation d'une référence fictive. Le contrôle de confidentialité autorise uniquement le nouveau chemin précis de migration DDL.
- **Conservé :** données et droits existants, séparation des notes réservées, thème et intitulés ; mode institutionnel toujours désactivé par défaut. Aucun compte, rôle ni identifiant de dossier n'est repris du navigateur.
- **Vérifications :** 124 tests frontend et 64 tests backend réussis localement ; 12 recettes PostgreSQL ignorées localement selon leurs verrous. Sur le commit de code `6c3d116` de la PR #44, la CI confirme **76 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migration additive, absence de dérive de schéma, restauration du numéro fictif, confidentialité et CodeQL conformes. Client Prisma généré, schéma, lint et build conformes. Chromium : ouverture du bon dossier, référence manquante signalée et absence de débordement à 390 px.
- **À poursuivre :** provisionnement et création contrôlée des dossiers, identité minimale, statut/clôture et versionnement de leurs modifications ; autres vues selon les habilitations ; recette institutionnelle SSO et ARTAG.
- **Vigilances :** un dossier sans numéro reste conservé mais n'est pas ouvert depuis la liste ; aucune correspondance avec des fichiers locaux ou des noms de personnes. La migration n'est appliquée que dans la CI fictive. La PR dépend de #43 puis #42 et ne les fusionne pas.

## 2026-10-26 — Écran de notes partagées relié aux API de recette

- **Décidé :** préparer un écran de dossier utilisant les notes serveur versionnées du lot précédent, avec activation explicite, sans migrer les dossiers locaux ni activer les accès ARTAG.
- **Créé :** composant de rédaction/relecture/historique, route de dossier protégée par le mode de recette, drapeau frontend désactivé par défaut, liste serveur paginée et auditée, tests d'accès et de reprise après erreur. Voir [le contrat et les limites du lot](50_ECRAN_NOTES_PARTAGEES.md).
- **Modifié :** client API, sélection du mode professionnel et bureau pour permettre le module notes indépendamment des tâches. Le mode notes demandé en HTTP est bloqué sans retour au prototype.
- **Conservé :** intitulés métier, thème et logo ARTAG ; droits serveur, protection CSRF, historique et séparation des notes réservées. Aucun changement de schéma, de dépendance ni migration automatique des données.
- **Vérifications :** 111 tests frontend et 58 tests backend réussis localement ; 11 recettes PostgreSQL ignorées localement selon leurs verrous. Sur le commit de code `a523340` de la PR #43, la CI confirme **69 tests backend avec PostgreSQL, sans échec ni test ignoré**, frontend, migrations, absence de dérive de schéma, restauration, confidentialité et CodeQL conformes. Build et lint conformes. Contrôle Chromium sur données fictives : lecture, correction, validation et affichage mobile à 390 px sans débordement horizontal.
- **À poursuivre :** répertoire de dossiers professionnels, ouverture de ce module depuis la file active serveur, modèle dossier complet, continuité à lecture restreinte et recette institutionnelle SSO.
- **Vigilances :** perte d'accès = effacement des contenus affichés ; conflit = recharge, comparaison et reprise explicite ; réponse incertaine = aucune réémission automatique. Une saisie ne passe jamais d'un dossier à l'autre. La PR dépend du lot #42 encore ouvert et ne l'intègre pas automatiquement dans main.

## 2026-10-25 — Corrections et validations versionnées des notes partagées

- **Décidé :** compléter le cycle du brouillon partagé existant sans modifier les parcours validés ni activer la recette institutionnelle. Une correction exige un motif et retire la validation ; la relecture est validée séparément.
- **Créé :** services et routes protégées de correction, validation et historique paginé ; tests de transitions, de refus d'accès, de concurrence et de rollback ; [contrat technique et limites](49_NOTES_PARTAGEES_VERSIONNEES.md).
- **Modifié :** le service des notes réutilise les révisions existantes et vérifie la session dans sa transaction ; le client API prépare les trois opérations ; les conflits PostgreSQL sont retournés explicitement.
- **Conservé :** versions précédentes, auteur, date, motif, audit sans contenu libre et séparation des notes réservées. Aucun changement de schéma, de dépendance, d'intitulé, d'interface ni de stockage local.
- **Vérifications :** lint, build, contrôle de confidentialité et schéma Prisma conformes ; 83 tests frontend et 57 tests backend réussis localement, 10 tests PostgreSQL ignorés localement par leurs verrous. Sur le commit de code `09403b3`, la CI de la PR #42 a exécuté les **67 tests backend avec PostgreSQL, sans échec ni test ignoré** ; migrations, idempotence, dérive de schéma, restauration, frontend et CodeQL conformes. La CI conserve TAP et publie les assertions échouées dans les contrôles de PR.
- **À poursuivre :** dossier métier complet, synthèses validées de continuité à lecture restreinte, migration progressive des écrans, conservation des informations et reprise autorisée des notes sans historique.
- **Vigilances et dette :** l'historique incomplet bloque les corrections plutôt que d'inventer une provenance ; les droits de rédaction ne sont pas élargis. SSO, hébergement, recette métier et validations SSI/RGPD ARTAG restent des prérequis institutionnels. Aucune donnée réelle ni connexion externe.

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

## Accueil — bureau quotidien

Décision validée :
- L’accueil devient un bureau quotidien professionnel, et non une page vitrine.
- Chaque professionnelle doit retrouver son espace de travail : dossiers à reprendre, alertes, actions, brouillons.
- La continuité de service devient une fonction métier centrale.
- La Direction / CA reste un accès séparé.
- Le logo ARTAG doit rester visible et lisible.
- L’interface doit être adaptée au confort visuel de l’utilisatrice.

État actuel :
- HomePage refondue en bureau quotidien.
- Trois blocs principaux posés : Mon bureau, Mes accès métier, Continuité de service.
- Bouton central : Reprendre un dossier.
- Direction / CA déplacée en bas à droite.
- Lisibilité augmentée sur l’accueil.

Point de vigilance :
- Ne pas transformer l’accueil en tableau administratif froid.
- Garder une logique de travail quotidien : quoi reprendre, quoi suivre, quoi sécuriser.
- Adapter plus tard le contenu selon le profil connecté et les droits réels.


## Continuité de service

Décision validée :
- La continuité de service devient une fonction métier centrale de l’outil.
- Elle permet de reprendre temporairement les dossiers d’une collègue ou d’un collègue sans rupture pour la personne accompagnée.
- Elle ne donne pas accès automatiquement à tout l’espace professionnel privé de la collègue.
- Elle doit afficher uniquement les éléments nécessaires à la continuité : synthèse courte, note de continuité, prochaine action, échéances, documents attendus, relais mobilisés.

État actuel :
- Une page `ContinuiteServicePage.jsx` a été créée.
- La route `/continuite-service` a été ajoutée.
- L’accueil contient un bouton vers la continuité de service.
- Les données affichées sont fictives et servent uniquement à valider le modèle fonctionnel.

Point de vigilance :
- Ne pas mélanger continuité de service et surveillance.
- Ne pas ouvrir automatiquement les brouillons personnels, hypothèses sensibles ou notes privées.
- Plus tard, relier cette page aux droits réels, aux rôles et aux dossiers effectivement rattachés aux professionnelles.


## Continuité de service

Décision validée :
- La continuité de service devient une fonction métier centrale de l’outil.
- Elle permet de reprendre temporairement les dossiers d’une collègue ou d’un collègue sans rupture pour la personne accompagnée.
- Elle ne donne pas accès automatiquement à tout l’espace professionnel privé de la collègue.
- Elle doit afficher uniquement les éléments nécessaires à la continuité : synthèse courte, note de continuité, prochaine action, échéances, documents attendus, relais mobilisés.

État actuel :
- Une page `ContinuiteServicePage.jsx` a été créée.
- La route `/continuite-service` a été ajoutée.
- L’accueil contient un bouton vers la continuité de service.
- Les données affichées sont fictives et servent uniquement à valider le modèle fonctionnel.

Point de vigilance :
- Ne pas mélanger continuité de service et surveillance.
- Ne pas ouvrir automatiquement les brouillons personnels, hypothèses sensibles ou notes privées.
- Plus tard, relier cette page aux droits réels, aux rôles et aux dossiers effectivement rattachés aux professionnelles.


## Vue limitée — continuité de service

Décision validée :
- La continuité de service ne doit pas ouvrir le dossier complet.
- Une route spécifique permet d’ouvrir une vue limitée du dossier : `/parcours-social-socio-professionnel/dossier/continuite`.
- Cette vue masque les espaces professionnels réservés, les brouillons, les hypothèses sensibles, les modules internes à valider et la synthèse transférable Insertis.
- Elle affiche uniquement les éléments nécessaires à la reprise temporaire du suivi.

État actuel :
- Rôle prototype rendu persistant via le navigateur.
- Bouton “Reprendre les éléments utiles” relié à la vue limitée.
- Dossier complet conservé pour la professionnelle référente.
- Vue relais limitée ajoutée dans la colonne latérale du dossier en mode continuité.

Point de vigilance :
- La vue limitée doit rester un outil de continuité, pas un outil de contrôle ou de surveillance.
- Les éléments visibles doivent rester nécessaires, proportionnés et utiles à la reprise du parcours.


## Modèle de suivi partagé — continuité

Décision validée :
- La page Continuité de service et le dossier partagé doivent utiliser les mêmes repères métier.
- Les éléments visibles en reprise doivent être structurés autour de champs simples et opérationnels :
  - dernière action connue ;
  - prochaine action utile ;
  - document attendu ;
  - relais mobilisé ;
  - niveau de vigilance ;
  - date de mise à jour.

État actuel :
- La page Continuité de service affiche désormais ces champs dans les dossiers fictifs.
- La vue limitée du dossier conserve la logique : accès uniquement aux éléments utiles à la reprise.
- Les espaces professionnels réservés restent masqués en mode continuité.

Point de vigilance :
- Ce modèle devra ensuite devenir une source commune, pour éviter de dupliquer les mêmes champs entre plusieurs pages.
- À terme, ces champs devront être reliés aux vraies données du dossier et non rester saisis en dur dans les composants.


## Mise au propre des sources communes — continuité

Décision validée :
- Les champs métier de continuité ne doivent pas être dupliqués dans plusieurs composants.
- Les dossiers fictifs de continuité ne doivent pas rester enfermés directement dans la page Continuité de service.
- Le dossier parcours et la page Continuité de service doivent s’appuyer progressivement sur des sources communes.

État actuel :
- Le fichier `frontend/src/data/continuiteModele.js` contient la liste commune des champs de suivi :
  - dernière action connue ;
  - prochaine action utile ;
  - document attendu ;
  - relais mobilisé ;
  - niveau de vigilance ;
  - date de mise à jour.
- Le fichier `frontend/src/data/continuiteDossiersFictifs.js` contient les données fictives de continuité.
- `DossierPage.jsx` utilise le modèle commun de continuité.
- `ContinuiteServicePage.jsx` utilise le modèle commun et les données fictives communes.

Point de vigilance :
- Les données restent fictives pour le moment.
- L’objectif suivant sera de transformer ces champs en vrai modèle de suivi exploitable, puis de préparer leur future connexion à des données réelles.


## Niveaux de vigilance — continuité

Décision validée :
- Le niveau de vigilance ne doit plus être un texte libre isolé.
- Il est structuré dans le modèle commun de continuité.
- Chaque niveau possède :
  - un identifiant technique ;
  - un libellé lisible ;
  - une description ;
  - une conséquence métier.

Niveaux retenus :
- Faible : suivi à planifier, sans risque immédiat repéré.
- Moyen : échéance proche, document attendu ou action à ne pas laisser tomber.
- Fort : risque de rupture du parcours, situation sensible ou absence de relais clair.
- Urgent : risque immédiat, échéance critique ou situation nécessitant une action rapide.

Règle d’usage :
- Le niveau de vigilance sert à aider la reprise du suivi.
- Il ne doit pas servir à étiqueter la personne.
- Il indique le degré d’attention nécessaire pour éviter une rupture de parcours.

État actuel :
- Les niveaux sont définis dans `frontend/src/data/continuiteModele.js`.
- Les dossiers fictifs utilisent maintenant des identifiants structurés : `faible`, `moyen`, `fort`, `urgent`.
- La page Continuité de service affiche le niveau et sa conséquence métier.


## Relances de continuité

Décision validée :
- La continuité de service doit permettre de voir rapidement ce qui doit être repris, quand, et avec quel niveau de priorité.
- Les relances ne doivent pas remplacer le jugement professionnel.
- Elles servent à éviter qu’un dossier reste sans suite pendant une absence, un relais ponctuel ou une période de flou.

Champs ajoutés aux dossiers fictifs :
- échéance de reprise ;
- fréquence de relance ;
- statut de relance ;
- prochaine relance.

Référentiels communs :
- Les statuts de relance sont définis dans `frontend/src/data/continuiteModele.js`.
- Les fréquences de relance sont définies dans `frontend/src/data/continuiteModele.js`.
- Les dossiers fictifs utilisent maintenant ces identifiants dans `frontend/src/data/continuiteDossiersFictifs.js`.

Règle métier :
- Une relance indique une action à ne pas perdre.
- Elle ne doit pas devenir un outil de pression sur la personne accompagnée.
- Elle sert à organiser la continuité entre professionnelles, avec une transmission proportionnée et utile.

État actuel :
- La page Continuité de service affiche les informations de relance dans chaque carte dossier.
- Les champs sont encore fictifs.
- Prochaine étape possible : préparer une lecture plus synthétique des dossiers à reprendre, par priorité.


## Tri des dossiers de continuité par priorité

Décision validée :
- Les dossiers à reprendre ne doivent pas seulement être affichés dans l’ordre des données.
- Ils doivent être triés selon une priorité métier pour aider la professionnelle à savoir quoi reprendre en premier.

Logique actuelle :
- Le tri combine le niveau de vigilance et le statut de relance.
- Les niveaux de vigilance les plus élevés remontent en priorité.
- Les relances en retard ou à planifier remontent également.

Objectif métier :
- Repérer rapidement les dossiers à reprendre en premier.
- Éviter qu’un dossier sensible reste noyé dans une liste.
- Aider à organiser la continuité de service sans remplacer l’analyse professionnelle.

État actuel :
- La page Continuité de service calcule un ordre de priorité pour les dossiers affichés.
- Les données restent fictives.
- Cette logique devra ensuite être reliée aux vraies données de suivi.


## Dossiers à reprendre en premier

Décision validée :
- La page Continuité de service ne doit pas seulement afficher une liste de dossiers.
- Elle doit aider à repérer immédiatement les dossiers à reprendre en priorité.
- Un bloc “À reprendre en premier” remonte les dossiers les plus sensibles.

Logique actuelle :
- Le score de priorité combine :
  - le niveau de vigilance ;
  - le statut de relance.
- Les dossiers avec vigilance forte ou urgente remontent en priorité.
- Les dossiers avec relance en retard ou à planifier remontent également.

Objectif métier :
- Aider la professionnelle à commencer par les situations les plus importantes.
- Éviter qu’un dossier à risque soit noyé dans la liste complète.
- Soutenir la continuité de service sans remplacer l’analyse professionnelle.

État actuel :
- La page Continuité de service calcule les dossiers à reprendre en premier.
- Les données restent fictives.
- La logique pourra ensuite être reliée à de vraies données de suivi.


## 2026-09-19 — Consolidation et fiabilisation technique

### Décidé
- Conserver `main` comme branche de référence unique.
- Rattacher à son historique la branche `reprise-propre-pilotage-actions`, dont le contenu était strictement identique à une reprise déjà intégrée dans `main`.
- Ne pas modifier les intitulés métier ni les règles d’accompagnement validées.
- Réactiver les pages existantes par une navigation et des droits centralisés, sans recréer de fonctionnalités parallèles.

### Créé
- Commandes communes à la racine : développement, build, lint et tests.
- Règles d’encodage UTF-8 et de fins de ligne.
- Contrôle continu GitHub Actions pour le frontend.
- Contrôle ESLint sans avertissement toléré.
- Tests Vitest et Testing Library pour le stockage, l’import CSV, la navigation et les droits du prototype.
- Utilitaire commun de stockage local résistant aux données invalides et aux erreurs d’écriture.
- Matrice centralisée des profils autorisés.
- Pages explicites d’accès refusé et de chemin introuvable.

### Modifié
- Mise à jour de Vite, React Router et des dépendances de contrôle.
- Chargement différé des pages pour alléger le JavaScript initial.
- Navigation principale adaptée au profil actif.
- Sélecteur de profil clairement identifié comme simulation du prototype.
- Raccordement des parcours, du dossier, du tronc commun, de la continuité et des vues Direction déjà présentes.
- Conservation des anciennes URL Appui TNS par redirection vers les nouvelles routes.
- Centralisation et sécurisation des lectures et écritures du stockage local.
- Réparation de la documentation qui contenait un encodage non UTF-8.

### Supprimé sans perte d’historique
- Fichier de règle absolue vide en doublon.
- Deux composants de page devenus des doublons non utilisés.
- Feuilles de style devenues inaccessibles et non importées.
- Fichiers d’attente vides dans les dossiers `src/` et `public/` de la racine.

### Vérifications
- audit npm : aucune vulnérabilité connue ;
- lint : conforme ;
- tests automatisés : conformes ;
- build de production : conforme ;
- serveur Vite : démarrage et réponse HTTP conformes.

### Laissé inchangé volontairement
- Les contenus métier et les questions validées.
- Les données fictives de démonstration.
- Le caractère frontend du prototype actuel.
- La séparation entre éléments partagés, continuité et espace professionnel réservé.

### Reste à faire avant production
- Backend Express et API métier.
- Base PostgreSQL et schéma Prisma.
- Authentification nominative, sessions serveur et récupération de mot de passe.
- Autorisations contrôlées côté serveur, journal d’audit et historique versionné.
- Remplacement du stockage local et des données fictives par des données persistantes sécurisées.
- Stratégie de migration, sauvegarde, hébergement privé ARTAG et interfaçage Insertis.

### Limite de vérification
- Le contrôle visuel automatisé par navigateur n’a pas pu être exécuté dans l’environnement de travail : aucun binaire Chrome n’était présent et son téléchargement était bloqué par le certificat réseau. Les tests DOM, le build et les réponses HTTP ont été utilisés comme contrôles de repli.
