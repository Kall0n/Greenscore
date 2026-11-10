# GreenScore Web

> 🇫🇷 Mesurez l'impact de votre activité sur le web. · 🇬🇧 Measure the impact of your web browsing.

GreenScore Web est un **plugin de navigateur** (Firefox, Chrome) et une **application web**. Ils estiment l'empreinte carbone des pages et des sessions de navigation, la rendent compréhensible (note, équivalents concrets), et permettent à des membres et à des organisations de la suivre dans le temps, dans le respect de la vie privée.

Projet de BUT Informatique 3ᵉ année (SAÉ S5.01 & S6.01), IUT de Bayonne et du Pays Basque, 2026-2027. Groupe 2 : PIETRERA-FERRANDINI Jeanne, PINSOLLE Romain, RIOUX Baptiste, ROCHE--RODRIGUEZ Killian. Commanditaire : Philippe ROOSE.

## État du dépôt

🚧 **Début du Sprint 2.** Le dépôt contient :
- la documentation de conception ;
- le **module de calcul v3**, implémenté et testé ;
- le squelette du banc de test de précision ;
- le **code de la version 2025-2026** (plugin, API Rust, application SvelteKit), point de départ de la v3.

Le code 2025-2026 provient du commit `39e3a99` (16/04/2026) de [GreenScorePlugin-Rust-Svelte](https://github.com/green-score-plugin/GreenScorePlugin-Rust-Svelte). Il a été importé **sans son historique**, et nettoyé (voir [CDCT §14](docs/CDCT.md#14-publication-open-source)) :
- la clé d'API Electricity Maps (S-02) a été retirée des deux plugins. **Elle reste visible dans l'historique du dépôt d'origine et doit être révoquée** ;
- l'export de base `db/greenscoreweb_database.sql`, qui contenait des comptes réels (S-03), n'a pas été repris. Le schéma et les données de test fictives sont dans `backend/migrations/`.

L'accord des auteurs précédents sur la licence reste à obtenir avant toute publication sous licence libre.

| Dossier | Contenu | État |
|---|---|---|
| [`backend/`](backend/) | API Rust (Axum, SQLx, MySQL) | Code v2 importé, à corriger (CDCT §2) |
| [`frontend/`](frontend/) | Application web SvelteKit | Code v2 importé |
| [`plugin/`](plugin/) | Extensions Firefox et Chrome (deux copies, à unifier : ADR-0003) | 1.7.0 : vrais octets transférés + calcul SWDM v4 ([contrôle Chrome](bench/results/plugin-v2-corrige-chrome-2026-11-10.md)) ; reste à corriger : sécurité, vie privée, synchronisation |
| [`calc/`](calc/) | Module de calcul partagé : SWDM v4, intensité par pays (Ember), note A+–F | ✅ 45 tests, écart nul avec CO2.js (`cd calc && npm ci && npm test`) |
| [`bench/`](bench/) | Banc de test de précision (avant / après) : protocole et modèle de corpus | 🚧 Corpus et scripts à écrire au Sprint 2 |
| [`docs/`](docs/) | CDCF, CDCT, méthodologie, ADR | ✅ Version de cadrage |

## Documentation

| Document | Contenu |
|---|---|
| [Cahier des charges fonctionnel (CDCF)](docs/CDCF.md) | Analyse du besoin, objectifs mesurables avant / après, exigences, anonymisation, dimensionnement, stratégie de preuve |
| [Cahier des charges technique (CDCT)](docs/CDCT.md) | Audit du code existant, architecture, plugin, données, API, sécurité, tests, déploiement |
| [Modifications du code de l'estimation](docs/modifications-estimation.md) | Avant / après du plugin 1.6.2 → 1.7.0 : chaque correction, son code et sa preuve |
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
