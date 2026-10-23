# Bureau privé : événements express et charge connue

**Recette fictive du 23 octobre 2026. Aucune donnée de bénéficiaire ni autorisation d'exploitation.**

## Ce que le code permet désormais

Le modèle `WorkEvent` en PostgreSQL prépare une **saisie rapide synchronisable entre postes**, sans dépendre de `localStorage`. Le formulaire ne permet pas de renseigner de nom, téléphone, numéro de dossier, récit, note réservée ou commentaire libre.

Les catégories autorisées sont : imprévu, appel, temps de rendez-vous, entretien, relance et administratif. Chaque repère contient seulement : un identifiant technique de requête, une date civile, un type, une durée estimée et un état (prévu, effectué, annulé). L'interface comporte trois raccourcis en un clic et un formulaire court pour les autres activités.

Les routes privées sont :
- `GET /api/mes-evenements?day=AAAA-MM-JJ&offset=0` — consultation paginée des repères **du seul compte connecté**, date par défaut définie en heure de Paris ;
- `POST /api/mes-evenements` — saisie à partir de champs exclusivement structurés ;
- `PATCH /api/mes-evenements/:eventId` — correction de durée, passage prévu/effectué ou annulation avec version contrôlée.

Toutes dépendent du verrou existant `ARTAG_ENABLE_WORK_TASKS`, d'une session serveur SSO active, des rôles habilités et du mécanisme CSRF pour les écritures. Chaque lecture et chaque écriture crée une trace d'audit transactionnelle, sans détail d'entretien ni contenu d'événement.

## Gestion des clics et du réseau

Une clé de requête UUID propre à chaque saisie est conservée lors d'un nouvel essai après une réponse incertaine. La contrainte unique `(ownerId, requestId)` côté base évite les doublons en cas de renvoi de **la même requête**. Si la clé est réutilisée avec un contenu différent, l'API refuse l'opération.

L'annulation ne supprime pas le repère et conserve la trace ; une modification concurrente renvoie un conflit HTTP 409, sans écraser la version déjà sauvée.

## Plan de charge

Le bureau privé affiche la charge **connue et partielle** :
- Temps des tâches ouvertes échues ou arrivant à échéance, seulement si une durée a été estimée ;
- Activités prévues et activités déjà effectuées, présentées séparément ;
- Avertissement si des tâches ne possèdent aucune estimation.

Il n'intègre **pas encore** les rendez-vous Outlook, déplacements, pauses, périodes de congé ou disponibilité contractuelle. Les repères de rendez-vous créés en un clic ne réservent aucun créneau d'agenda et peuvent éventuellement faire double emploi avec un futur calendrier : ne pas les considérer comme des réservations réelles.

Il n'y a pas de calcul officiel de productivité, de quota d'entretiens ni d'évaluation des bénéficiaires.

## Limites bloquantes avant usage réel

- Le serveur refuse toujours le déploiement `NODE_ENV=production`. La connexion institutionnelle SSO/Microsoft 365, un hébergement approuvé, les migrations, sauvegardes, contrôles SSI/RGPD et la recette métier n'ont pas été validés.
- Les anciennes pages métiers restent des prototypes locaux. **Seul le bureau sécurisé** dispose de ces repères PostgreSQL, et les données locales ne sont jamais importées silencieusement.
- Aucun événement n'est créé dans Outlook, Microsoft To Do, Insertis, Mon Suivi Social ou OneDrive ; les connecteurs restent fermés.
- Le dispositif de charge est une aide à l'organisation, pas une collecte automatisée de temps officiel.
- Les tests utilisent exclusivement une base PostgreSQL éphémère et des données fictives.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
