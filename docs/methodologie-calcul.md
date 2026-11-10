# GreenScore Web — Méthodologie de calcul de l'empreinte carbone

> **Statut :** proposition v3 (à valider par l'équipe et le commanditaire) — 16 octobre 2026
> **Documents liés :** [CDCF v3](CDCF.md) (exigences EF-PRE, ENF-PRE) · [CDCT](CDCT.md) (§5, implémentation) · [ADR-0001](adr/0001-modele-de-calcul-swdm-v4.md)
>
> Ce document est la **référence unique** des calculs. Il est destiné à l'équipe, aux encadrants **et au public** : il sera publié sur le site (page « Notre méthode ») et dans le dépôt open source. Toute modification du modèle donne lieu à un nouveau numéro de version du modèle (`model_version`, §6).

---

## 1. Principes

| Principe | Ce que cela veut dire concrètement |
|---|---|
| **Transparence** | Chaque constante est sourcée, datée et publiée. Pas de « valeur approximative selon plusieurs sources ». |
| **Reproductibilité** | Une même mesure (mêmes octets, même pays) donne **toujours** le même résultat, quel que soit le navigateur ou l'heure. |
| **Conformité à un modèle reconnu** | On n'invente pas de coefficients : on applique un modèle public, utilisé par d'autres outils, ce qui permet de **comparer nos résultats** à des références externes. |
| **Séparation mesure / modèle** | On stocke la **mesure brute** (octets, requêtes) et la **version du modèle** ; l'empreinte est recalculable si le modèle évolue. |
| **Honnêteté sur l'incertitude** | Un modèle reste une estimation. On l'affiche comme telle et on publie ses limites (§7). |

---

## 2. Le modèle hérité (v2, équipes 2024-2025 et 2025-2026)

### 2.1 Formule appliquée dans le code

Le calcul est fait dans le plugin (`plugin/firefox/src/background.js` et `plugin/chrome/background.js`, fonction `calculateCarbonEmissions`). Il est identique depuis la première version (2024-2025) : la refonte Rust/SvelteKit ne l'a pas modifié.

```
E (kWh) = Go_transférés × 0,519  +  Go_ressources × 0,065  +  nb_requêtes × 0,00015
gCO2e   = E × intensité_carbone        (intensité en gCO2e/kWh, défaut 442)
```

| Constante | Valeur | Source citée dans le code | Commentaire |
|---|---|---|---|
| `KWH_PER_GB_TRANSFER` | 0,519 kWh/Go | « The Shift Project 2023 » | Référence exacte introuvable ; à ne pas reprendre sans source. |
| `KWH_PER_GB_DATACENTER` | 0,065 kWh/Go | « Sustainable Web Design » | Proche des valeurs SWDM, mais sortie de son contexte (modèle mélangé). |
| `KWH_PER_REQUEST` | 0,00015 kWh (= 0,15 Wh) / requête | « Valeur approximative selon plusieurs sources » | **Aucune source.** Ce terme domine tout le calcul (§2.3). |
| Intensité par défaut | 442 gCO2e/kWh | — | Moyenne mondiale du **SWDM v3** (Ember 2021). Obsolète (v4 : 494). |
| Intensité « live » | API Electricity Maps | Pays de l'utilisateur, via géolocalisation IP (ipwhois.app) | Résultat variable selon l'heure ; clé d'API exposée dans le code. |

### 2.2 Note A à G (code `backend/src/green_score.rs`)

- **Page consultée** : seuils fixes de 0,25 g → A < 0,25 g ; B < 0,50 g ; … ; F < 1,50 g ; G ≥ 1,50 g. Ces seuils ne sont pas sourcés. **Ce n'est pas l'EcoIndex**, contrairement à ce qu'indiquait le CDCF v2.
- **Profil (« mes données ») et organisation** : note relative, calculée à partir de la moyenne et du minimum des **totaux cumulés depuis l'inscription**. Le calcul est incohérent :
  - `max = |min − moyenne| × 2` puis `échelle = |max − min| / 7`. Exemple : min = 2 g, moyenne = 10 g → max = 16, échelle = 2, seuils 4/6/8/10/12/14 → un utilisateur **exactement dans la moyenne obtient E**. Avec min = 8 g et moyenne = 10 g, ce même utilisateur moyen obtient D.
  - Pour les organisations, le « minimum » est une **somme** (organisation la moins consommatrice) alors que la « moyenne » est une **moyenne de moyennes** : les deux grandeurs ne sont pas comparables.
  - Un total cumulé pénalise mécaniquement les comptes les plus anciens et les utilisateurs les plus assidus.

### 2.3 Exemple chiffré : ce que donne le modèle v2

Page type : **2 Mio** transférés (compressés gzip, `Content-Length` présent), **80 requêtes**, utilisateur en France, Firefox.

| Terme | Calcul v2 | Énergie |
|---|---|---|
| Transfert | (2 Mio ÷ 3 « décompression ») = 0,000651 Gio × 0,519 | 0,000338 kWh |
| Data center | 0,001953 Gio × 0,065 | 0,000127 kWh |
| Requêtes | 80 × 0,00015 | **0,012000 kWh** |
| **Total** | | **0,012465 kWh** |

**Constat 1 — les requêtes représentent 96 % du résultat.** Le poids de la page n'a presque aucun effet :

| Optimisation réalisée par le développeur | Effet sur le résultat v2 |
|---|---|
| Diviser le poids de la page par 10 (2 Mio → 0,2 Mio) | **−3,4 %** seulement |
| Diviser le nombre de requêtes par 2 (80 → 40) | −48 % |

Le modèle v2 contredit donc les conseils d'éco-conception affichés par l'outil lui-même (« compressez vos images ») et ne permet pas à un développeur (persona Esteban) de mesurer ses gains.

**Constat 2 — le résultat dépend de l'état d'une API externe, pas de la page :**

| État de l'API Electricity Maps au moment du calcul | Intensité utilisée | Résultat pour la **même** page |
|---|---|---|
| Réponse obtenue (France, ex. 50 g/kWh) | 50 | 0,62 g |
| Pas encore de réponse (`carbonIntensity = 0` → défaut) | 442 | 5,51 g (×9) |
| Erreur d'API (la fonction renvoie `-1`, et `-1 \|\| 442` vaut `-1` en JavaScript) | −1 | **−0,01 g (négatif)** |

**Constat 3 — le volume transféré est faux :**
- Sur **Firefox**, l'en-tête `Content-Length` donne déjà la taille **compressée** ; le code la divise encore par 3 (gzip) ou 5 (brotli) → sous-estimation. Les réponses sans `Content-Length` (transfert « chunked », fréquent) comptent pour 0. Les ressources servies **depuis le cache** sont comptées comme si elles avaient été transférées.
- Sur **Chrome**, le code lit `details.responseSize`, une propriété **qui n'existe pas** dans l'API `chrome.webRequest` (documentation Chrome) → le volume transféré vaut **toujours 0**. La même page donne donc des résultats différents selon le navigateur.

**Constat 4 — arrondi :** le résultat est arrondi à 2 décimales (`toFixed(2)`), donc une page sobre (< 0,005 g) est enregistrée à **0 g**.

> Ces constats sont issus de la lecture du code (dépôt 2025-2026, commit `39e3a99` du 16/04/2026). Les constats 2 à 4 seront **confirmés par des tests reproductibles** lors de la mesure de référence (Sprint 2, voir CDCT §12).

---

## 3. Le modèle v3 proposé

### 3.1 Choix du modèle : Sustainable Web Design Model v4 (SWDM v4)

| Critère | SWDM v4 | EcoIndex | Modèle v2 « maison » |
|---|---|---|---|
| Public, documenté | Oui (sustainablewebdesign.org) | Oui (ecoindex.fr) | Non |
| Intègre la fabrication des équipements (embodied) | Oui | Oui (ACV) | Non |
| Données d'entrée | Octets transférés | Taille DOM, requêtes, poids | Octets, requêtes |
| Utilisable en continu, en arrière-plan, sur toute la navigation | Oui | Partiellement (score par page, nécessite le DOM) | Oui |
| Implémentation open source réutilisable | **CO2.js** (Green Web Foundation, licence **Apache-2.0**) | Bibliothèques existantes, mais **algorithme et résultats sous licence CC BY-NC-ND** (usage commercial interdit, pas de modification) | — |
| Échelle de notation officielle | Oui (A+ à F, en gCO2e/page vue) | Oui (A à G) | Non sourcée |
| Comparaison externe possible | Website Carbon Calculator, Digital Beacon, Ecograder… | ecoindex.fr, GreenIT-Analysis | Aucune |

**Décision proposée (ADR-0001) :** le **gCO2e** et la **note** affichés reposent sur le **SWDM v4**, via la bibliothèque **CO2.js**.
L'**EcoIndex** n'est pas intégré tant que sa licence (CC BY-NC-ND) n'a pas été clarifiée : elle est incompatible avec une publication open source qui autorise la modification, et avec l'usage par des organisations à but lucratif (persona Louis). Il pourra être présenté **à titre indicatif, avec citation**, si les ayants droit l'autorisent (Could).

### 3.2 Étape 1 — Mesurer le volume réellement transféré

Pour chaque requête d'un onglet, dans l'ordre de priorité :

1. Si la ressource vient du **cache** (`fromCache = true`) → **0 octet transféré** (on compte la requête, mais pas de transfert réseau).
2. Sinon, si l'en-tête `Content-Length` est présent → c'est la taille **encodée** (compressée) du corps : **on l'utilise telle quelle**, sans division.
3. Sinon (réponse « chunked »), on utilise la valeur `transferSize` de l'API **Resource Timing** (`PerformanceResourceTiming`), lue par un script de contenu, si elle est disponible (même origine, ou en-tête `Timing-Allow-Origin`).
4. Sinon, la requête est marquée **« non mesurée »**. On ne l'invente pas.

On calcule pour chaque page un **taux de couverture** : `requêtes mesurées / requêtes totales`. Il est stocké et affiché (« mesure complète à 97 % »). C'est un **indicateur de qualité** de la mesure, et donc de sa précision.

Le volume est exprimé en **Go décimaux** (1 Go = 10⁹ octets), comme dans le SWDM.

### 3.3 Étape 2 — Convertir en énergie (constantes SWDM v4)

| Segment | Fonctionnement (operational) kWh/Go | Fabrication (embodied) kWh/Go |
|---|---|---|
| Data centers | 0,055 | 0,012 |
| Réseaux | 0,059 | 0,013 |
| Terminaux utilisateurs | 0,080 | 0,081 |
| **Total** | **0,194** | **0,106** |

Source : Sustainable Web Design, *Estimating Digital Emissions*, version 4 (consultée le 16/10/2026).

### 3.4 Étape 3 — Convertir en émissions (intensité carbone)

```
gCO2e = Σ_segments  Go × intensité_énergétique_segment × intensité_carbone_segment
```

| Énergie | Intensité carbone appliquée | Justification |
|---|---|---|
| Fonctionnement **réseaux + terminaux** | Intensité **annuelle moyenne du pays de l'utilisateur** | L'utilisateur et son réseau d'accès sont dans son pays. |
| Fonctionnement **data centers** | Moyenne mondiale **494 gCO2e/kWh** | La localisation du serveur est inconnue ; recommandation du SWDM. |
| **Fabrication** (tous segments) | Moyenne mondiale **494 gCO2e/kWh** | Recommandation du SWDM v4 : les équipements sont fabriqués dans le monde entier. |

- **Source des intensités par pays :** données annuelles **Ember** fournies avec CO2.js (licence de données CC BY-SA 4.0 → attribution obligatoire dans l'application).
- **Pays de l'utilisateur :** choisi dans les options du plugin, **pré-rempli à partir du fuseau horaire** du navigateur. **Aucune géolocalisation IP** et **aucun appel à un service tiers** ne sont faits.
- **Pourquoi une moyenne annuelle et non une valeur « en direct » ?** Pour la **reproductibilité** : une même page doit avoir la même note le matin et le soir, sinon un développeur ne peut pas comparer « avant / après » ses optimisations. L'intensité en direct pourra être proposée comme **indicateur secondaire** (Could), via le back-end (la clé d'API restera alors côté serveur).

### 3.5 Étape 4 — Note de la page (échelle officielle SWDM v4)

| Note | gCO2e par page vue |
|---|---|
| A+ | ≤ 0,040 |
| A | ≤ 0,079 |
| B | ≤ 0,145 |
| C | ≤ 0,209 |
| D | ≤ 0,278 |
| E | ≤ 0,359 |
| F | > 0,359 |

Source : Sustainable Web Design, *Digital Carbon Ratings*. Comme cette échelle est officielle, **n'importe qui peut vérifier** notre note avec un autre outil qui utilise le même modèle.

> **Point à arbitrer avec le commanditaire :** cette échelle a 7 niveaux de A+ à F, alors que l'interface actuelle affiche A à G. Nous recommandons d'afficher l'échelle officielle telle quelle plutôt qu'une correspondance « maison », sinon la comparaison externe n'est plus possible.

### 3.6 Session multipage

| Indicateur | Calcul |
|---|---|
| Empreinte totale de la session | Σ gCO2e de toutes les pages vues pendant la session (tous onglets) |
| Volume total | Σ octets transférés |
| Pages vues, domaines distincts | Comptage |
| Empreinte moyenne par page | total ÷ pages vues |
| **Note de la session** | Note SWDM de l'**empreinte moyenne par page** (même échelle qu'une page, donc comparable) |
| Domaine le plus émetteur | Domaine avec la plus grande somme de gCO2e |

**Règle anti-double comptage :** une requête est rattachée à **une seule** « vue de page » (identifiant de navigation propre à l'onglet). Une navigation interne d'une application monopage (`history.pushState`) ouvre une nouvelle vue **après remise à zéro** des compteurs. Le code v2 renvoyait au contraire les totaux cumulés à chaque changement d'URL.

### 3.7 Indicateurs « mes données » et « organisation »

Les totaux cumulés depuis l'inscription sont remplacés par des indicateurs **normalisés**, qui ne dépendent ni de l'ancienneté du compte ni des autres utilisateurs :

| Indicateur | Définition |
|---|---|
| Empreinte sur la période | Σ gCO2e sur la période choisie (7 j, 30 j, 12 mois) |
| Empreinte moyenne par page vue | Σ gCO2e ÷ pages vues sur la période → **note SWDM** (même échelle que les pages) |
| Empreinte moyenne par jour actif | Σ gCO2e ÷ jours avec au moins une page vue |
| Position par rapport aux autres utilisateurs | Rang centile de l'empreinte moyenne par page vue (« vous faites mieux que 62 % des utilisateurs »). Affiché **seulement si au moins 20 utilisateurs** sont actifs sur la période. |
| Organisation | Mêmes indicateurs calculés sur les membres actifs. La vue par membre ou par service n'est affichée que si le groupe compte **au moins 5 membres** (anonymat, voir CDCF §7). |

### 3.8 Équivalents vulgarisés

Valeurs actuelles (table `equivalent`, facteur en « unités par kg CO2e ») :

| Équivalent | Facteur actuel | Soit, par unité | Statut |
|---|---|---|---|
| Voiture (km) | 4,54 / kg | 220 g/km | Ordre de grandeur cohérent ; **source à documenter** |
| Moto (km) | 4,54 / kg | 220 g/km | **Identique à la voiture : à vérifier** |
| Bus (km) | 36 / kg | 28 g/km | Source à documenter |
| Trajet Lille-Marseille (voiture) | 0,004 / kg | 250 kg/trajet | Source à documenter |
| Paris-Londres (train) | 0,73 / kg | 1,37 kg/trajet | Source à documenter |
| Paris-New York (avion) | 0,0007 / kg | 1 429 kg/vol | Source à documenter |
| E-mails | 2 000 / kg | 0,5 g/e-mail | Source à documenter |
| Recherches web | 5 000 / kg | 0,2 g/recherche | Source à documenter |
| Streaming vidéo (h) | 17,86 / kg | 56 g/h | Source à documenter |
| Eau du robinet (L) | 7 692 / kg | 0,13 g/L | Source à documenter |

**Proposition :** reprendre tous les facteurs depuis les données publiques de l'ADEME (**Impact CO2**, impactco2.fr). Chaque facteur aura alors une source, une date et une licence, stockées en base (`source_url`, `source_date`). Conditions d'utilisation de l'API et de la licence à vérifier.

---

## 4. Même exemple, modèle v3

Même page : 2 Mio = 2 097 152 octets = **0,002097 Go**, France, ressources non issues du cache.

| Segment | Énergie (kWh) | Intensité (g/kWh) | gCO2e |
|---|---|---|---|
| Fonctionnement data center | 0,002097 × 0,055 = 0,0001153 | 494 (mondial) | 0,0570 |
| Fonctionnement réseau + terminal | 0,002097 × 0,139 = 0,0002915 | France, ex. 50* | 0,0146 |
| Fabrication (tous segments) | 0,002097 × 0,106 = 0,0002223 | 494 (mondial) | 0,1098 |
| **Total** | **0,0006291** | | **≈ 0,18 g → note C** |

\* valeur illustrative ; la valeur réelle sera celle des données Ember embarquées (version datée).

| Optimisation | Effet v2 | Effet v3 |
|---|---|---|
| Poids ÷ 10 | −3,4 % | **−90 %** (0,018 g → A+) |
| Requêtes ÷ 2 (même poids) | −48 % | 0 % (le nombre de requêtes reste affiché comme **indicateur de diagnostic**, sans coefficient inventé) |
| Même page, Firefox vs Chrome | Résultats différents | **Identiques** (même règle de mesure) |
| Même page, à 8 h et à 20 h | Jusqu'à ×9 d'écart, voire négatif | **Identique** |

---

## 5. Vérification de l'implémentation

- **Vecteurs de test de référence** (`calc/test-vectors.json`) : une liste d'entrées (octets, pays) avec les sorties attendues, calculées avec CO2.js. Les implémentations du plugin **et** du back-end Rust doivent les reproduire à 10⁻⁹ près. Ces tests sont exécutés en intégration continue.
- **Recalcul serveur :** le back-end **recalcule** l'empreinte à partir des octets reçus. Il ne fait pas confiance à une valeur gCO2e envoyée par le client, et refuse les valeurs aberrantes.
- **Protocole de comparaison** avec des références externes : CDCT §12.

## 6. Versionnement du modèle

- Chaque mesure stockée porte `model_version` (ex. `swdm4-ember2024-v1`).
- Un changement de constante ou de jeu de données entraîne une **nouvelle version** du modèle, une entrée dans le journal des modifications ci-dessous et la mise à jour des vecteurs de test.
- Les octets bruts étant conservés, les historiques peuvent être **recalculés** avec la nouvelle version.

| Version du modèle | Date | Changement |
|---|---|---|
| `legacy-v2` | 2024-2026 | Modèle hérité (§2), conservé seulement pour la comparaison avant/après |
| `swdm4-ember-v1` | à définir (Sprint 3) | Modèle v3 (§3) |

## 7. Limites (à afficher aux utilisateurs)

- Le SWDM estime l'impact **à partir du volume de données**. Il ne voit pas le calcul réalisé côté serveur (requêtes en base, IA, encodage vidéo) ni la consommation propre du terminal liée au rendu (JavaScript lourd, animations).
- Les intensités énergétiques sont des **moyennes mondiales** : l'écart avec la réalité d'un site donné peut atteindre un facteur 2 ou plus. **GreenScore est un outil de sensibilisation et de comparaison, pas un bilan carbone réglementaire.**
- Une partie des ressources tierces ne fournit pas sa taille (couverture < 100 %) : la valeur affichée est alors une **borne basse**, et l'interface l'indique.
- La « précision » revendiquée par GreenScore v3 porte sur :
  1. la **fidélité de la mesure** (octets réellement transférés, vérifiés contre l'outil réseau du navigateur) ;
  2. la **conformité** à un modèle public reconnu ;
  3. la **reproductibilité**.

  Elle ne porte pas sur la valeur « vraie » des émissions, qu'aucun outil de ce type ne peut connaître.

## 8. Références

- Sustainable Web Design — *Estimating Digital Emissions* (SWDM v4) : https://sustainablewebdesign.org/estimating-digital-emissions/
- Sustainable Web Design — *Digital Carbon Ratings* : https://sustainablewebdesign.org/digital-carbon-ratings/
- Green Web Foundation — CO2.js (Apache-2.0) : https://github.com/thegreenwebfoundation/co2.js
- Ember — données d'intensité carbone de l'électricité (CC BY-SA 4.0), via CO2.js
- EcoIndex — méthode et licence (CC BY-NC-ND 2.0 FR) : https://www.ecoindex.fr/comment-ca-marche/
- MDN — `webRequest.onCompleted` : https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onCompleted
- Chrome — `chrome.webRequest` : https://developer.chrome.com/docs/extensions/reference/api/webRequest
- MDN — `PerformanceResourceTiming.transferSize` : https://developer.mozilla.org/docs/Web/API/PerformanceResourceTiming/transferSize
- ADEME — Impact CO2 : https://impactco2.fr
- ADEME / Arcep — Évaluation de l'impact environnemental du numérique en France (2025, données 2022)
