# 60 — Ergonomie du bureau quotidien (premier lot)

## Objectif
Réduire la charge mentale liée aux interruptions, au grand nombre de tâches et à la difficulté de retrouver la prochaine action. Ne pas mesurer la performance de la professionnelle ni celle des personnes accompagnées.

## Changements
- **Mes 3 priorités** sont placées avant les tableaux détaillés. Chaque tâche offre quatre gestes directs : terminer (case à cocher), reporter, commencer, marquer ou retirer la priorité.
- **Commencer** conserve uniquement l'identifiant de la tâche fictive et active le mode Focus, comme avant.
- **Focus** conserve : les trois priorités, la tâche interrompue, la saisie express, les rappels et l'ajout rapide. Il masque la charge calculée, le détail des listes, la capacité et la liste longue des événements saisis.
- Les confirmations remontent immédiatement au-dessus du bureau ; un bouton permet d'annuler la **dernière modification d'une tâche** tant que la page reste ouverte.
- Contrastes lisibles, boutons et cases à cocher élargis, adaptation mobile, commandes clavier standard. Aucun chronomètre anxiogène ou notification intrusive.
- Le compteur distingue les rappels à traiter ce jour du total des tâches ouvertes : pas de « score de productivité ».
- L'ordre de priorité initial reste celui du métier : choix explicite, retard, échéance, autres.

## Confidentialité et limites
Ce lot modifie **uniquement le bureau de démonstration**, toujours stocké dans le navigateur. Il ne rapproche ni ne mélange les tâches locales avec celles du bureau sécurisé ARTAG. La préférence Focus locale ne contient aucun texte sensible. Il n'active pas Outlook/Insertis et n'autorise aucune donnée réelle.

L'adaptation distincte du bureau sécurisé devra reprendre ces principes en se fondant uniquement sur les tâches PostgreSQL de la session et sur le jour donné par le serveur, sans localStorage.

## Recette
Tests de priorité immédiatement visible, clavier et cibles d'action, démarrage/reprise, report, annulation d'une fin de tâche, affichage Focus, saisie express en un clic et absence d'invention de dates.
