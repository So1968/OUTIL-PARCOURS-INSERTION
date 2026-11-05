# 63 — Créer une tâche et ses repères de suivi en une seule saisie

## Contexte métier
Les suites d'entretien, les relances et les démarches ponctuelles doivent être saisies sans obliger la professionnelle à créer une tâche puis ouvrir une seconde fois son formulaire pour y ajouter une échéance. Le bureau doit minimiser la charge de mémoire de travail, les interruptions et les oublis.

## Utilisation
Le formulaire **Nouvelle tâche personnelle** garde un champ de titre et le bouton **Créer sur le serveur**. Une section facultative et repliable permet d'ajouter, avant de confirmer la création :
- une échéance explicite, ou aucune si elle reste à fixer ;
- un rappel J0/J1/J2/J7, à afficher **dans le bureau sécurisé à l'ouverture** quand l'échéance est connue ;
- une durée estimée (ou la mention « Non estimée »).

Si rien n'est précisé, la création garde uniquement le titre : **aucune échéance n'est inventée**. Les trois paramètres sont envoyés dans **le même POST idempotent** que le titre et la clé technique de requête. Aucune requête PATCH supplémentaire n'est nécessaire pour compléter les options connues à la création.

En cas de réponse réseau incertaine, le réessai garde **strictement la même clé et les mêmes paramètres**. L'écran de saisie ne recrée pas la tâche sous une nouvelle identité. Une création confirmée remet à zéro le titre et les options pour éviter de reprendre accidentellement une ancienne échéance.

## Protection
- Les validations de calendrier, rappel autorisé et durée sont exécutées côté interface, puis à nouveau côté serveur.
- Les tâches restent personnelles, soumises aux droits serveur, à la session active et au CSRF. Pas de rattachement automatique à un dossier, de transmission de note privée ni d'accès à la liste d'une autre personne.
- L'interface professionnelle utilise exclusivement PostgreSQL, jamais les tâches de démonstration en localStorage.
- Rappel affiché dans le bureau **seulement** : aucune notification externe, SMS, Outlook ou Microsoft To Do n'est activé.
- Les suggestions post-entretien sont toujours facultatives et ne créent rien sans validation humaine.

## Recette
Vérifier l'option sans date, la création avec date/rappel/durée dans une requête, le refus des dates impossibles et paramètres non autorisés, la conservation des valeurs lors d'un réessai, le retour à une saisie vide après succès, les tests métiers HTTP PostgreSQL existants et les cinq contrôles CI.

**Pas de données réelles ni d'exploitation ARTAG sans validation institutionnelle et recette visuelle.**
