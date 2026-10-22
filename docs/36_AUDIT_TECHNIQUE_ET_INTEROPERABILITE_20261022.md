# Audit technique et interopérabilité — 22 octobre 2026

> Document de constat et de préparation technique. Il complète sans remplacer les spécifications métier, en particulier `00_BOUSSOLE_PROJET_ARTAG.md`, `30_PROFILS_DROITS_TRACABILITE.md` et `34_STABILISATION_ARCHITECTURE_APPLICATION.md`.
>
> **Ne pas engager de données réelles dans le prototype ou dans GitHub.** Les évolutions ci-dessous utilisent uniquement des cas fictifs.

## 1. État du logiciel réellement vérifié dans `main`

- Interface React/Vite, navigation et plusieurs espaces de travail opérationnels en mode prototype.
- File active, actions, rendez-vous, notes d'entretien, repères d'autonomie, journal de dossier, hub documentaire et préparation de textes pour Insertis et Mon Suivi Social.
- **Pas de backend applicatif, de base de données métier ou d'authentification serveur** dans le dépôt actuel.
- Rôles sélectionnables dans `frontend/src/auth/PrototypeProfileBanner.jsx` et mémorisés dans le navigateur par `RoleContext.jsx` ; ils simulent des droits, sans fournir de protection côté serveur.
- `frontend/src/lib/storage.js` utilise `localStorage` et renvoie `false` en cas d'échec d'écriture. Des pages affichent néanmoins un succès sans contrôler ce retour.
- Les exports CSV Insertis et les chemins Windows/OneDrive sont traités **localement**. La préparation d'une note Mon Suivi Social se limite à une génération de texte/copie ; aucune synchronisation avec le service n'a été validée.
- Les contrôles lint, tests, build et privacy check constituent un filet de sécurité de développement, **pas** une homologation de l'application métier.

## 2. Risques classés

| Réf. | Criticité | Constat précis | Suite attendue |
|---|---|---|---|
| SEC-01 | Bloquant | Changement de rôle libre, contrôle en frontend uniquement | Authentification nominative et autorisations serveur dossier par dossier |
| DATA-01 | Bloquant | Stockage `localStorage`, erreurs d'écriture non remontées aux écrans | API + PostgreSQL + transactions, état explicite de sauvegarde |
| DATA-02 | Élevée | Import CSV remplaçant la file active ; risques d'actions devenues orphelines et d'identifiants non uniques | Prévisualisation, dédoublonnage, rapprochement, transaction et annulation |
| DOC-01 | Élevée | Appariement de documents : la sous-chaîne d'un identifiant pouvait correspondre à un numéro plus long | Correspondance sur limites d'identifiant et tests de non-régression |
| RDV-01 | Élevée | Accord de rappel prérempli sur « Oui » ; liens d'envoi accessibles même sans accord confirmé | Valeur « À demander » par défaut et ouverture conditionnée à « Oui » |
| METIER-01 | Élevée | La note générée « Mon Suivi Social » inclut actuellement l'analyse professionnelle et des éléments d'autonomie | Vérifier nécessité, base légale, destinataires et séparation des notes avant toute transmission |
| DOC-02 | Élevée | Index de chemins et métadonnées locales non contrôlés par des droits serveur | Stockage et autorisations centralisés ; pas de copie des documents hors espaces autorisés |
| TECH-01 | Moyenne | CSV lu explicitement en `windows-1252` ; fichiers UTF-8 possibles | Tester et détecter l'encodage avant import réel |
| TECH-02 | Moyenne | Génération d'identifiants de repli basés sur le rang des lignes | Identifiants stables, indépendants des réimports |
| UX-01 | Moyenne | Certaines copies vers le presse-papiers annoncent la réussite avant confirmation | Vérifier les promesses rejetées et afficher l'échec |

### Corrections de sécurité proposées dans la même livraison

- `frontend/src/lib/documentMatching.js` : ne plus rapprocher un numéro par sous-chaîne ; refuser l'identifiant de repli calculé à partir du rang comme preuve d'identité.
- `frontend/src/pages/RendezVousSuiviPage.jsx` : « À demander » par défaut pour l'accord de rappel ; les liens d'envoi n'apparaissent qu'après sélection explicite de « Oui ».
- Ajouter les tests associés. Ces mesures améliorent un **prototype** et ne constituent pas une validation d'usage avec des données réelles.

## 3. Connexions demandées

| Service | Usage souhaité | État vérifié | Condition préalable à l'échange de données |
|---|---|---|---|
| **Insertis** | File active, rendez-vous, étapes, traces | CSV local et préparation de textes uniquement | Interface officielle, autorisation Métropole/ARTAG, règles de synchronisation |
| **Mon Suivi Social** | Dossier/entretiens et note de suivi | Note préparée dans le frontend ; aucune synchronisation | Accord de la structure, accès technique documenté par l'éditeur, droits et finalités précises |
| **Outlook / Microsoft 365** | Rendez-vous, calendrier, rappels | Non connecté | Tenant et consentements Microsoft 365 administrés par ARTAG ; autorisations minimales |
| **OneDrive / SharePoint ARTAG** | Index de documents, chemins et ouverture contrôlée | Stockage de références textuelles locales uniquement | Accès organisationnel autorisé ; références sécurisées et sans duplication des pièces |

**Mon Suivi Social** est un service public de l'ANCT pour les structures d'accompagnement social, y compris les associations. L'accès aux comptes utilise **ProConnect**. Le [dépôt GitHub historique](https://github.com/inclusion-numerique/mon-suivi-social) a été **archivé le 1er octobre 2026** ; il ne doit pas être considéré comme la seule référence technique actuelle. Le [projet « Mon Suivi Social - v2 » sur GitLab](https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-v2) constitue une piste de référence plus récente. Un [ancien serveur API Directus sur GitLab](https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-api) est lui aussi archivé ; la présence d'une API dans ce code historique ne prouve pas l'existence d'une API partenaire active ou autorisée. **Aucune API d'échange officielle accessible à ARTAG n'est confirmée au 22/10/2026.**

Références publiques :
- [Présentation officielle Mon Suivi Social](https://monsuivisocial.incubateur.anct.gouv.fr/)
- [Connexion et support Mon Suivi Social](https://monsuivisocial.incubateur.anct.gouv.fr/se-connecter-%C3%A0-son-espace-de-travail/)
- [Dépôt GitLab Mon Suivi Social – v2](https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-v2)
- [Ancien code GitHub, archivé le 01/10/2026](https://github.com/inclusion-numerique/mon-suivi-social)
- [Ancien dépôt API Directus (archivé)](https://gitlab.com/incubateur-territoires/startups/monsuivisocial/monsuivisocial-api)

## 4. Frontière fonctionnelle obligatoire

- **ARTAG insertion / Appui TNS** : actions, autonomie, étapes, dates, préparations et informations nécessaires au suivi d'insertion.
- **Suivi social et espace professionnel réservé** : informations accessibles exclusivement aux professionnelles habilitées, selon les finalités définies par ARTAG.
- **Direction / gouvernance** : vues selon habilitations ; aucune exposition nominative par simple changement de profil.
- **Insertis** : outil officiel destinataire des éléments validés, pas un miroir automatiquement écrasé.
- **Mon Suivi Social** : une note préparée ne doit jamais être envoyée automatiquement ; la sélection des champs autorisés et des destinataires doit être définie avant activation.
- **OneDrive / SharePoint** : conserver les droits des espaces professionnels, ne pas déplacer ni importer massivement des fichiers depuis le prototype.

## 5. Architecture de mise en service

1. **Socle privé** : backend Node/Express conformément à la roadmap existante, PostgreSQL/Prisma, sessions sécurisées, autorisations serveur, journal d'accès, sauvegarde/restauration testées.
2. **Modèle métier** : identifiant technique stable, référentiel de source (`insertis`, `mon-suivi-social`, `local`), auteur/date, version, statut et périmètre de confidentialité. Aucune fusion automatique sur homonymie.
3. **Connecteurs isolés** : un adaptateur par service, **désactivé par défaut**. Aucune clé dans le frontend ou GitHub. Transferts limités aux champs autorisés, avec traçabilité.
4. **Contrats d'échange** : définir la lecture/écriture autorisée avec les responsables de chaque service ; interdire les écrasements silencieux ; prévoir les conflits, rejets, reprises et doublons.
5. **Mise en production** : tests fonctionnels avec données fictives, tests de refus d'accès inter-profils, revues RGPD et SSI ARTAG, validation des responsables de traitement.

### Conditions de réception d'une future connexion Mon Suivi Social

- Documentation technique / accord d'interopérabilité du service confirmé.
- Habilitation nominative et compte de service autorisé si prévu contractuellement ; **pas de récupération de session utilisateur par contournement**.
- Périmètre de dossiers et de champs validé, notamment pour l'analyse professionnelle.
- Sens du flux défini (consultation, préparation, écriture), source de vérité désignée.
- Test de non-divulgation, d'absence de doublons et de non-écrasement réussi en environnement de test.
- Journal d'export et de consultation, stratégie de réversibilité et de suppression conformes aux règles ARTAG.

**Statut au 22 octobre 2026 :** audit et préparation ; **aucune connexion réelle aux quatre services n'est créée par ce document**.

---

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
