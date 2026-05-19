# Avancement du projet â€” Outil ARTAG

## Ã‰tat gÃ©nÃ©ral
Projet en phase de structuration.
Base mÃ©tier largement cadrÃ©e.
Objectif : construire une application web mÃ©tier dÃ©ployable sur serveur, accessible depuis navigateur, sans repartir de zÃ©ro et sans progression destructive.

## DÃ©cisions dÃ©jÃ  prises
- Architecture cible : frontend + backend + base de donnÃ©es
- Stack recommandÃ©e :
  - frontend : React + Vite
  - backend : Node.js + Express
  - base : PostgreSQL
  - ORM : Prisma
- MÃ©thode : progression incrÃ©mentale, non destructive
- Document dâ€™avancement obligatoire
- Refus des solutions techniques exotiques sans autorisation prÃ©alable

## Cadrage mÃ©tier validÃ©
- dossier unique partagÃ©
- espace professionnel rÃ©servÃ©
- logique de parcours
- socle autonomie
- synthÃ¨se courte
- note de continuitÃ©
- modules principaux
- modules secondaires
- traÃ§abilitÃ©
- historique des versions
- indicateurs direction
- mode dÃ©monstration sourcÃ©

## Ordre de reconstruction validÃ©
1. Architecture gÃ©nÃ©rale
2. Droits dâ€™accÃ¨s
3. Dossier unique partagÃ© + espace professionnel rÃ©servÃ©
4. Parcours visuels
5. Bloc IdentitÃ© / repÃ¨res de parcours
6. Socle autonomie
7. Bloc professionnel / relation dâ€™aide
8. SynthÃ¨se courte + note de continuitÃ©
9. Modules spÃ©cifiques
10. TraÃ§abilitÃ© automatique
11. Vue direction / secours
12. SÃ©curisation
13. Mode dÃ©monstration sourcÃ©

## Points de vigilance
- Ne pas mÃ©langer logique mÃ©tier et habillage visuel
- Ne pas casser lâ€™existant
- Ne pas afficher de score brut visible
- PrÃ©server la dignitÃ© de la personne accompagnÃ©e
- SÃ©parer clairement dossier partagÃ© et espace rÃ©servÃ©
- Concevoir pour le travail rÃ©el, la reprise rapide et la continuitÃ©

## Travail en cours
- prÃ©paration du socle technique
- prÃ©paration de lâ€™architecture applicative
- prÃ©paration du modÃ¨le de donnÃ©es initial

## Ã‰tape rÃ©alisÃ©e â€” socle frontend exÃ©cutable minimal
- crÃ©ation d'une base frontend autonome dans `frontend/`
- ajout d'un `package.json` frontend avec React, React DOM, React Router et Vite
- ajout des fichiers indispensables au dÃ©marrage :
  - `frontend/index.html`
  - `frontend/vite.config.js`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/styles.css`
- crÃ©ation d'un routing minimal pour :
  - accueil
  - parcours social / socio-professionnel
  - appui TNS
  - direction
- conservation et remise en forme du visuel d'accueil dÃ©jÃ  amorcÃ©
- correction du raccordement du logo ARTAG via `public/logo-artag.png`
- maintien d'un pÃ©rimÃ¨tre strictement frontend, sans ajout de logique mÃ©tier sensible

## Validation de l'Ã©tape 1
- application frontend dÃ©marrÃ©e correctement en local
- pages principales accessibles
- routing validÃ©
- build frontend validÃ©
- logo ARTAG correctement raccordÃ© et servi depuis `public/logo-artag.png`

## ClÃ´ture de l'Ã©tape 1
- Ã©tape 1 clÃ´turÃ©e et considÃ©rÃ©e comme conforme

## Validation de l'Ã©tape 2
- source de vÃ©ritÃ© du logo conforme : `public/logo-artag.png`
- emplacement du fichier conforme
- usage rÃ©el du logo conforme dans le frontend
- suppression de lâ€™asset parasite `src/logo-artag.png`
- Ã©tape 2 validÃ©e et conforme

## Validation de l'Ã©tape 3
- structure frontend simple de rÃ´les en place
- sÃ©paration visuelle claire des 3 accÃ¨s
- protection frontend minimale des routes en place
- redirection vers lâ€™accueil en cas dâ€™accÃ¨s non autorisÃ©
- absence de backend, dâ€™authentification rÃ©elle, de session et de stockage persistant
- Ã©tape 3 validÃ©e et conforme

## LaissÃ© inchangÃ© volontairement
- aucun backend Express Ã  ce stade
- aucune base PostgreSQL Ã  ce stade
- aucun schÃ©ma Prisma Ã  ce stade
- aucune authentification rÃ©elle Ã  ce stade
- aucun module mÃ©tier, aucun socle autonomie mÃ©tier, aucune traÃ§abilitÃ© serveur

## Points de vigilance immÃ©diats
- les pages parcours, TNS et direction restent des points d'entrÃ©e techniques minimaux, pas encore des Ã©crans mÃ©tier finalisÃ©s

## Prochaine Ã©tape logique
CrÃ©er lâ€™ossature technique du projet :
- frontend
- backend
- base PostgreSQL
- Prisma
- rÃ´les utilisateurs
- premiers modÃ¨les mÃ©tier

## Dette technique actuelle
- pas encore de socle backend propre
- pas encore de modÃ¨le de donnÃ©es implÃ©mentÃ©
- pas encore dâ€™authentification rÃ©elle
- pas encore de stratÃ©gie de dÃ©ploiement codÃ©e

## HypothÃ¨ses ouvertes
- choix exact du mode dâ€™authentification : session sÃ©curisÃ©e cÃ´tÃ© serveur par dÃ©faut
- forme exacte du stockage de certains modules mÃ©tier : tables dÃ©diÃ©es vs JSON structurÃ©s
- niveau de granularitÃ© initial des permissions par bloc

## 2026-05-05 â€” Ajout contrÃ´lÃ© des RepÃ¨res dâ€™autonomie

### DÃ©cidÃ©
- Le nom visible dans lâ€™interface est â€œRepÃ¨res dâ€™autonomieâ€.
- Le nom technique interne reste `SocleAutonomiePage.jsx`.
- Les 8 questions validÃ©es du socle autonomie sont conservÃ©es sans reformulation libre.
- Les repÃ¨res ne remplacent pas lâ€™approfondissement ; ils le prÃ©parent.

### CrÃ©Ã©
- `frontend/src/pages/SocleAutonomiePage.jsx`

### ModifiÃ©
- `frontend/src/App.jsx` : ajout de la route `/parcours-social-socio-professionnel/socle`.
- `frontend/src/pages/DossierPage.jsx` : libellÃ©s visibles ajustÃ©s vers â€œRepÃ¨res dâ€™autonomieâ€.
- `frontend/src/styles.css` : ajout CSS ciblÃ© prÃ©fixÃ© `socle-`.

### LaissÃ© inchangÃ©
- Accueil
- Parcours principal
- Appui TNS
- Direction
- Logique mÃ©tier validÃ©e
- Quarantaine non rÃ©injectÃ©e

### Points de vigilance
- Stockage encore provisoire en localStorage.
- Pas encore de backend, pas de traÃ§abilitÃ© serveur, pas dâ€™historique de versions.
- Les niveaux restent une lecture professionnelle interne, pas un score usager.

## Ajustement RepÃ¨res dâ€™autonomie â€” synthÃ¨se professionnelle
- La synthÃ¨se automatique ne doit pas Ãªtre un simple reporting des rÃ©ponses.
- Elle doit produire des phrases sobres, professionnelles et utiles Ã  la continuitÃ© du parcours.
- Elle reste ajustable par la professionnelle avant enregistrement.
- Elle ne doit pas poser de diagnostic, ni transformer les rÃ©ponses en score.
- Les dÃ©cisions dâ€™ouverture de module restent Ã  traiter dans lâ€™espace professionnel rÃ©servÃ©.

## Ajustement RepÃ¨res dâ€™autonomie â€” rÃ¨gle de calcul de lâ€™autonomie
- La dÃ©finition retenue de lâ€™autonomie est : comprendre / choisir, dÃ©cider, puis passer Ã  lâ€™action avec ou sans appui.
- Cette dÃ©finition sâ€™appuie sur le rÃ©fÃ©rentiel parcours socio-professionnel 2026 et sur le cadrage ARTAG autour de lâ€™accÃ¨s aux droits, de la facilitation et de lâ€™autonomie administrative.
- Les rÃ©ponses simples visibles pendant lâ€™Ã©change sont traduites en lecture interne : plutÃ´t stabilisÃ©, Ã  surveiller, fragile, trÃ¨s fragile.
- Aucun score brut nâ€™est affichÃ© Ã  la personne.
- La synthÃ¨se doit produire une analyse professionnelle claire, pas un reporting des rÃ©ponses.
- Les modules recommandÃ©s Ã  valider dÃ©coulent de cette lecture interne, sans ouverture automatique.

## Ajustement RepÃ¨res dâ€™autonomie â€” sÃ©paration Ã©cran usager et analyse professionnelle
- La page RepÃ¨res dâ€™autonomie est une page pouvant Ãªtre partagÃ©e avec la personne.
- La synthÃ¨se professionnelle, la lecture interne de lâ€™autonomie et les modules recommandÃ©s Ã  valider sont retirÃ©s de cette page.
- La page RepÃ¨res affiche uniquement les questions, les rÃ©ponses simples, les Ã©lÃ©ments recueillis et un retour positif.
- Un mode partage avec la personne permet de masquer le retour vers le dossier professionnel.
- La synthÃ¨se professionnelle et les modules recommandÃ©s Ã  valider sont dÃ©placÃ©s dans le dossier parcours.
- Cette sÃ©paration respecte la distinction entre Ã©change avec la personne, analyse professionnelle et dÃ©cision.

## Ajustement RepÃ¨res dâ€™autonomie â€” synthÃ¨se transfÃ©rable vers Insertis
- La page professionnelle doit comporter une synthÃ¨se courte destinÃ©e Ã  Ãªtre copiÃ©e dans Insertis.
- Cette synthÃ¨se ne doit pas reprendre toutes les rÃ©ponses de la personne.
- Elle doit formuler une lecture professionnelle sobre, utile Ã  la continuitÃ© du parcours.
- Elle doit rester modifiable par la professionnelle avant transfert.
- Elle ne doit contenir ni score visible, ni diagnostic, ni information inutilement intime.
- Elle doit permettre de tracer les besoins repÃ©rÃ©s, les appuis envisagÃ©s et les modules Ã©ventuellement proposÃ©s.
- La synthÃ¨se est une aide Ã  la rÃ©daction et doit Ãªtre relue avant transfert dans Insertis.

## Ajustement RepÃ¨res dâ€™autonomie â€” dignitÃ© et Ã©criture professionnelle
- La synthÃ¨se transfÃ©rable vers Insertis doit prÃ©server la dignitÃ© de la personne.
- Les formulations doivent Ã©viter de qualifier directement la personne comme fragile ou dÃ©ficiente.
- Lâ€™Ã©criture doit porter sur les besoins repÃ©rÃ©s, les points Ã  consolider, les conditions dâ€™appui et la sÃ©curisation du parcours.
- Les Ã©lÃ©ments produits restent une lecture professionnelle prudente, non diagnostique et ajustable.
- Les formulations doivent rester compatibles avec les attendus institutionnels, les rÃ©fÃ©rentiels de parcours et les bonnes pratiques dâ€™accompagnement.

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

