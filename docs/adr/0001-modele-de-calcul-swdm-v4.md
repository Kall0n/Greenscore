# ADR-0001 — Modèle de calcul : SWDM v4 via CO2.js, EcoIndex non intégré

- **Statut :** Proposé
- **Date :** 2026-10-16
- **Exigences concernées :** EF-PRE-2, EF-PRE-3, EF-PRE-4, ENF-PRE-4 ; constats A-01, A-09

## Contexte

Le modèle hérité n'est pas sourcé et donne 96 % du poids au nombre de requêtes (0,15 Wh par requête). Il ne récompense pas l'optimisation du poids des pages et ne permet aucune comparaison externe. La note A à G est présentée comme « EcoIndex », mais elle n'en est pas un. Le projet doit être publié en open source et pouvoir être utilisé par des organisations.

## Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| A. Garder le modèle v2 en corrigeant les bugs | Peu de travail | Toujours non sourcé ; impossible à défendre |
| B. **SWDM v4 via CO2.js** | Modèle public, constantes publiées, inclut la fabrication ; bibliothèque Apache-2.0 ; échelle de notes officielle ; comparable à Website Carbon Calculator, Ecograder… | Ne tient compte que du volume de données (pas des requêtes, pas du DOM) |
| C. EcoIndex | Référence française, connue des encadrants | Algorithme et résultats sous **CC BY-NC-ND** : pas d'usage commercial, pas de modification. Nécessite le DOM complet de chaque page |
| D. Modèle « 1byte » (The Shift Project) | Public | Moins maintenu ; pas d'échelle de notes |

## Décision

Option **B**. Le gCO2e et la note affichés reposent sur le SWDM v4, avec les intensités pays issues des données Ember fournies par CO2.js. Le nombre de requêtes et la taille du DOM restent affichés comme **indicateurs de diagnostic**, sans coefficient inventé. L'EcoIndex pourra être affiché **à titre indicatif** (Could), seulement après accord écrit sur la licence.

## Conséquences

- La méthodologie devient publiable et vérifiable par tous (page « Notre méthode »).
- Il faut maintenir deux implémentations (TypeScript et Rust), tenues alignées par des **vecteurs de test** communs.
- L'échelle passe de A–G à **A+–F**. Ce changement visible pour les utilisateurs doit être validé par le commanditaire.
- À vérifier : la version de CO2.js expose bien le SWDM v4 et la notation. Indicateur : vecteurs de test (O4).
