# Audit indépendant Grok — plan de correction vérifié

Date : 23 octobre 2026. Source : rapport fourni, confronté au code actuel de `main`.

## Corrections mises en œuvre

### 1. Séparation de l'espace de démonstration et du futur bureau sécurisé

- `BureauTravailRoute` choisit **un seul mode avant de monter les composants** : si `VITE_ARTAG_SECURE_TASKS=1` et si le site est HTTPS, le volet serveur est affiché ; sinon le bureau local existant est monté.
- Le mode serveur ne consulte pas le `localStorage` du tableau quotidien et **ne migre pas silencieusement** les tâches du prototype.
- Une erreur de session ou de base privée ne déclenche **aucun retour automatique à la démonstration** : l'utilisateur reçoit un message d'erreur. Les autres pages historiques demeurent cependant des prototypes locaux et ne doivent pas être utilisées avec des données réelles.
- Le flag frontend ne confère aucun droit : permissions, rôle et identité continuent d'être vérifiés dans PostgreSQL côté serveur.

### 2. Trois priorités et mode Focus

- Le bureau de démonstration affiche jusqu'à trois tâches ouvertes : priorité explicitement marquée, retards, échéances du jour, puis prochaines actions.
- Mode Focus : masque les tableaux de charge et le détail des tâches, **mais conserve la saisie express, les rappels et la création rapide**.
- La préférence de présentation est conservée localement dans le mode démonstration uniquement. Aucune donnée de bénéficiaire ni score individuel n'est calculé.
- Les tâches demeurent récupérables même après changement de vue ; les dates et durées ne sont jamais inventées.

### 3. Désactivation de compte et révocation atomique

- `backend/src/accountLifecycleService.js` est **un service interne non exposé via HTTP**.
- Il vérifie la session serveur d'un administrateur technique actif, refuse l'auto-désactivation et exige une référence d'approbation ; la validation de cette approbation institutionnelle devra être réalisée dans un futur circuit autorisé.
- Le service désactive le compte, révoque toutes ses sessions encore actives et consigne l'événement dans une même transaction PostgreSQL sérialisable.
- L'état `enabled` était déjà revérifié à chaque résolution de session ; le rapport Grok était donc trop général en parlant d'une absence de protection.
- Aucun écran d'administration et aucun nouveau droit de lecture des dossiers ne sont créés.

## Points du rapport restant à traiter

- **Outlook / Microsoft Graph** : aucun jeton ou autorisation Microsoft 365 n'a été fourni ni confirmé ; les connecteurs restent désactivés.
- **Production** : hébergement, SSO institutionnel réel, sauvegardes, rétention, contrôle RGPD/SSI et vérification des approbations restent indispensables.
- **Bascule de toutes les pages** : seul le bureau quotidien dispose d'une séparation explicite des modes. Il faudra migrer les écrans métier un par un et fournir une stratégie de reprise manuelle validée des éventuelles données de démonstration avant toute exploitation.
- Le rate limiting actuel demeure mono-processus ; un proxy institutionnel doit fournir une protection distribuée avant toute exposition.
- **Référentiels Métropole** : les seuils ne sont pas garantis tant que la convention applicable à ARTAG n'est pas vérifiée.

Aucun secret, identifiant de bénéficiaire ni données professionnelles réelles n'est nécessaire dans ce dépôt public.

*Outil conçu par Sofia de los Rios dans le cadre de sa mission.*
