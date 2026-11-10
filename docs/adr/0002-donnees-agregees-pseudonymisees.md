# ADR-0002 — Données agrégées par jour × domaine et pseudonymisées

- **Statut :** Proposé
- **Date :** 2026-10-16
- **Exigences concernées :** EF-VIE-1, EF-VIE-2, EF-VIE-5, EF-ODA-1, ENF-CAP-1 ; constats P-01, D-01, D-02

## Contexte

La v2 stocke une ligne par page vue, avec l'URL complète et l'identifiant du compte (≈ 22 Mo par utilisateur et par an). Elle conserve l'historique d'un compte même après sa suppression. L'hébergement offre 1 Go, base comprise. L'open data est un objectif du projet.

## Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| A. Garder une ligne par page et hacher `user_id` | Peu de changement | Le hachage d'un entier est réversible ; données toujours identifiantes ; quota saturé |
| B. **Agrégat jour × domaine, pseudonyme aléatoire, zones séparées** | ×27 moins de stockage ; plus d'URL ; suppression simple ; base saine pour l'open data k-anonyme | Plus de détail par page côté serveur (le détail reste disponible dans le plugin) |
| C. Ne rien stocker côté serveur | Respect maximal de la vie privée | Plus d'historique multi-appareils, plus d'organisation, plus d'open data : contraire au besoin |

## Décision

Option **B** :
- tables `daily_usage` et `monthly_usage` (après 13 mois), `browsing_session` et `session_domain` ;
- pseudonyme `subject_id` aléatoire, avec une table de correspondance dans la zone identité ;
- aucune clé étrangère de la zone mesures vers `user` ;
- open data calculé avec k ≥ 10.

## Conséquences

- Migration des données v2 nécessaire (CDCT §15). Les anciennes valeurs sont marquées `legacy-v2`.
- Les requêtes de l'organisation passent par la table de correspondance (jointure côté serveur) et appliquent les seuils de 5 et 10.
- À vérifier : taille réelle sur un jeu simulé de 1 000 utilisateurs × 1 an (O7).
