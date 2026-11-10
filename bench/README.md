# Banc de test de précision

Ce dossier sert à **prouver** les objectifs O1 à O5 du [CDCF](../docs/CDCF.md#14-objectifs-mesurables). Il mesure la version 2025-2026 (« v2 »), puis la v3, **avec le même protocole**. Le protocole complet est décrit dans le [CDCT §12](../docs/CDCT.md#12-protocole-de-validation-de-la-précision).

## Contenu

| Élément | Rôle | État |
|---|---|---|
| `corpus.json` | Liste des 30 pages de référence (10 sobres, 10 moyennes, 10 lourdes) et de la page de démonstration avant / après | Modèle à compléter (URL à choisir et figer au Sprint 2) |
| `results/` | Un fichier par campagne : `<version>-<AAAA-MM-JJ>.md` (tableau des indicateurs) et `.csv` (données brutes) | Vide |
| Scripts de mesure | Lancement automatisé des navigateurs avec le plugin, collecte HAR et mesures du plugin | À écrire au Sprint 2 |

## Protocole (résumé)

1. Profil de navigateur neuf, cache désactivé, plugin installé, pays = FR.
2. Chargement de la page, puis attente de 5 s sans activité réseau.
3. Collecte : mesure du plugin (octets, requêtes, couverture, gCO2e) et export **HAR** (vérité terrain des octets transférés).
4. 5 passages sans cache, puis 5 avec cache, sur Firefox et Chrome.
5. Calcul des indicateurs :

| Indicateur | Formule | Cible v3 |
|---|---|---|
| Erreur sur les octets (O1) | \|plugin − HAR\| ÷ HAR | médiane < 5 %, P90 < 15 % |
| Écart Firefox / Chrome (O2) | \|FF − Chrome\| ÷ moyenne | < 10 % |
| Reproductibilité (O3) | écart-type ÷ moyenne (5 passages) | < 10 % |
| Conformité du calcul (O4) | `calc/test-vectors.json` | écart nul (**atteint** : voir `calc/`) |
| Sensibilité au poids (O5) | gCO2e(après) ÷ gCO2e(avant) vs rapport des octets | proportionnel ±5 % |

## Règles

- Une page dont le contenu varie trop d'un passage à l'autre est **remplacée**. La raison est notée dans `corpus.json`.
- Les résultats bruts sont versionnés : on peut toujours recalculer un indicateur.
- Aucune donnée personnelle : profils de navigateur neufs, pas de compte connecté sur les sites mesurés.
