# GreenScore Web

> 🇫🇷 Mesurez l'impact de votre activité sur le web. · 🇬🇧 Measure the impact of your web browsing.

GreenScore Web est un **plugin de navigateur** (Firefox, Chrome) et une **application web**. Ils estiment l'empreinte carbone des pages et des sessions de navigation, la rendent compréhensible (note, équivalents concrets), et permettent à des membres et à des organisations de la suivre dans le temps, dans le respect de la vie privée.

Projet de BUT Informatique 3ᵉ année (SAÉ S5.01 & S6.01), IUT de Bayonne et du Pays Basque, 2026-2027. Groupe 2 : PIETRERA-FERRANDINI Jeanne, PINSOLLE Romain, RIOUX Baptiste, ROCHE--RODRIGUEZ Killian. Commanditaire : Philippe ROOSE.

## État du dépôt

🚧 **Phase de cadrage.** Le dépôt contient :
- la documentation de conception ;
- le **module de calcul v3**, implémenté et testé ;
- le squelette du banc de test de précision.

Le code de l'application (plugin, API Rust, application SvelteKit) sera importé à partir de la version 2025-2026 **après nettoyage** : retrait des secrets et des données personnelles, et accord des auteurs précédents sur la licence (voir [CDCT §14](docs/CDCT.md#14-publication-open-source)).

| Dossier | Contenu | État |
|---|---|---|
| [`calc/`](calc/) | Module de calcul partagé : SWDM v4, intensité par pays (Ember), note A+–F | ✅ 45 tests, écart nul avec CO2.js (`cd calc && npm ci && npm test`) |
| [`bench/`](bench/) | Banc de test de précision (avant / après) : protocole et modèle de corpus | 🚧 Corpus et scripts à écrire au Sprint 2 |
| [`docs/`](docs/) | CDCF, CDCT, méthodologie, ADR | ✅ Version de cadrage |

## Documentation

| Document | Contenu |
|---|---|
| [Cahier des charges fonctionnel (CDCF)](docs/CDCF.md) | Analyse du besoin, objectifs mesurables avant / après, exigences, anonymisation, dimensionnement, stratégie de preuve |
| [Cahier des charges technique (CDCT)](docs/CDCT.md) | Audit du code existant, architecture, plugin, données, API, sécurité, tests, déploiement |
| [Méthodologie de calcul](docs/methodologie-calcul.md) | Formules, constantes et sources de l'estimation de l'empreinte carbone (modèle v2 hérité et modèle v3) |
| [Décisions d'architecture (ADR)](docs/adr/) | Décisions tracées et leur justification |
| [Module de calcul](calc/README.md) | Utilisation, fichiers générés, tests et limites connues du module `calc/` |
| [Banc de test](bench/README.md) | Protocole de mesure de la précision (objectifs O1 à O5) |

## Historique du projet

| Année | Dépôt |
|---|---|
| 2024-2025 | https://github.com/GreenScoreWebPlugin/GreenScorePlugin |
| 2025-2026 | https://github.com/green-score-plugin/GreenScorePlugin-Rust-Svelte |
| 2026-2027 | Ce dépôt |

## Licence

**À définir** (décision en cours avec le commanditaire et les auteurs des versions précédentes). Tant qu'aucune licence n'est publiée, aucune réutilisation n'est autorisée par défaut.

---

### English summary

GreenScore Web is a browser extension and web application that estimates the carbon footprint of web pages and multi-page browsing sessions. It uses the public **Sustainable Web Design Model v4** (via CO2.js), with privacy by design (no full URLs, pseudonymised daily aggregates, k-anonymous open data). Design documents are currently in French; English versions will follow before the open source release.
