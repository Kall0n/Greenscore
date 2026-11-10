# Modifications du code de l'estimation (plugin 1.6.2 → 1.7.0)

Ce document liste **toutes les modifications** apportées au code qui mesure une page et estime son empreinte carbone, entre la version 2025-2026 (plugin **1.6.2**, celle du Chrome Web Store) et la version actuelle (plugin **1.7.0**).

Pour chaque modification : le problème dans la v2, le code **avant / après**, le constat de l'audit qu'elle corrige ([CDCT §2.3](CDCT.md#23-constats-détaillés)) et la preuve mesurée.

| | |
|---|---|
| **Commits** | [`b8f890c`](https://github.com/Kall0n/Greenscore/commit/b8f890c) plugin 1.7.0 (vrais octets + SWDM v4) · [`85ee7c2`](https://github.com/Kall0n/Greenscore/commit/85ee7c2) correctif des applications monopages |
| **Fichiers du plugin** | `plugin/chrome/background.js`, `plugin/chrome/popup.js`, `plugin/chrome/manifest.json`, `plugin/chrome/config.js` (et leurs équivalents dans `plugin/firefox/src/`) |
| **Fichiers ajoutés** | `resource-timing.js` (script de contenu), `greenscore-calc.js` (calcul généré), `calc/scripts/build-plugin.mjs`, `calc/test/plugin-bundle.test.js` |
| **Preuves** | [contrôle Chrome du 10/11](../bench/results/plugin-v2-corrige-chrome-2026-11-10.md) · [vidéos filmées dans Chromium](recette-v2/resultats-v2.md#vidéos-avant--après-filmées-dans-chromium) |

## Résumé

| # | Problème dans la v2 | Correction dans la v3 | Constat |
|---|---|---|---|
| 1 | Le résultat dépend surtout du **nombre de requêtes** (0,15 Wh chacune, valeur non sourcée) | Modèle public **SWDM v4** : l'empreinte suit le **poids transféré** | A-01, A-09 |
| 2 | Sur Chrome, le poids transféré vaut **toujours 0** (propriété inexistante) | Poids lu dans l'en-tête `Content-Length` | A-02 |
| 3 | Sur Firefox, le poids est **divisé par 3 ou 5** à tort | `Content-Length` utilisé tel quel | A-03 |
| 4 | Les réponses servies par le **cache** sont comptées comme téléchargées | Cache et revalidations (304) = **0 octet** | A-04 |
| 5 | Les réponses sans `Content-Length` comptent pour 0 | Taille réelle lue dans la page (**Resource Timing**) + taux de couverture | A-04 |
| 6 | Intensité carbone **en direct** par API : clé exposée, valeur **négative** en cas d'erreur, appliquée au mauvais onglet | Intensité **annuelle par pays embarquée** (Ember) : aucun appel réseau, aucune clé | A-05, A-06, S-02 |
| 7 | Arrondi à 2 décimales : une page sobre vaut **0,00 g** | Plus d'arrondi (6 décimales) | A-10 |
| 8 | Une **mesure quasi vide** envoyée au début de chaque page ; applications monopages **cumulées** | **Une page vue = une mesure**, remise à zéro à chaque page, y compris en monopage | A-07 |
| 9 | Deux onglets qui envoient en même temps : le second envoi est **abandonné** | **File d'envoi** : rien n'est perdu | A-08 |
| 10 | Popup : comparaison à une « moyenne » de 0,74 g et couleurs calibrées sur l'ancien modèle | **Note officielle SWDM v4** (A+ à F) et couleurs alignées | — |
| 11 | Calcul codé à la main dans chaque plugin (deux copies) | **Un seul calcul**, généré depuis `calc/` et testé contre la bibliothèque de référence CO2.js | X-01 (en partie) |

---

## 1. La formule de calcul : des requêtes au poids (A-01)

**Problème.** La v2 additionne trois termes, dont un « 0,15 Wh par requête » sans source. Ce terme pèse environ 96 % du résultat. Comme, sur Chrome, le poids transféré vaut 0 (§2), le score ne dépend presque que du nombre de requêtes. Une photo de 14 Mo (1 requête) obtient alors un meilleur résultat qu'un article Wikipédia de 700 Ko (46 requêtes).

**Avant** (`plugin/chrome/background.js`, v2) :

```js
const CARBON_CONSTANTS = {
  KWH_PER_GB_TRANSFER: 0.519,   // Valeur donnée selon The Shift Project 2023
  KWH_PER_GB_DATACENTER: 0.065, // Valeur donnée selon Sustainable Web Design
  KWH_PER_REQUEST: 0.00015,     // Valeur approximative selon plusieurs sources
  BYTES_TO_GB: 1 / (1024 * 1024 * 1024),
};

function calculateCarbonEmissions(tabData) {
  const bytesTransferred = tabData.totalTransferredSize || 0;
  const bytesResources = tabData.totalResourceSize || 0;
  const requests = tabData.totalRequests || 0;
  const carbonIntensity = tabData.carbonIntensity || 442;
  const transferEnergy = gbTransferred * CARBON_CONSTANTS.KWH_PER_GB_TRANSFER;
  const datacenterEnergy = gbResources * CARBON_CONSTANTS.KWH_PER_GB_DATACENTER;
  const requestEnergy = requests * CARBON_CONSTANTS.KWH_PER_REQUEST;
  const emissions = (transferEnergy + datacenterEnergy + requestEnergy) * carbonIntensity;
  return { totalEmissions: Number(emissions.toFixed(2)), /* … */ };
}
```

**Après** (`plugin/chrome/background.js`, v3) : le calcul est délégué au modèle **Sustainable Web Design v4** (SWDM v4), embarqué dans `greenscore-calc.js` (§11).

```js
function calculateCarbonEmissions(tabData) {
  const bytes = tabData.totalTransferredSize || 0;
  const result = GreenScoreCalc.estimate({ bytes, country: tabData.countryCode });
  const coverage = tabData.totalRequests > 0 ? tabData.measuredRequests / tabData.totalRequests : 1;
  return {
    totalEmissions: Number(result.gco2e.toFixed(6)),
    rating: result.rating,            // A+ à F, échelle officielle SWDM v4
    modelVersion: result.modelVersion, // "swdm4-ember-v1"
    coverage,                          // part des requêtes dont la taille est connue
    /* … détail data center / réseau / terminal … */
  };
}
```

Le SWDM v4 compte **0,30 kWh par Go transféré**, répartis entre data center, réseau, terminal et fabrication ([méthodologie §3](methodologie-calcul.md#3-le-modèle-v3-proposé), [ADR-0001](adr/0001-modele-de-calcul-swdm-v4.md)) :

| Segment | Fonctionnement (kWh/Go) | Fabrication (kWh/Go) | Intensité appliquée |
|---|---|---|---|
| Data center | 0,055 | 0,012 | moyenne mondiale (494 g/kWh) |
| Réseau | 0,059 | 0,013 | pays de l'utilisateur (fonctionnement) |
| Terminal | 0,080 | 0,081 | pays de l'utilisateur (fonctionnement) |

**Preuve.** Mêmes chargements, les deux extensions installées ensemble :

| Page | Poids réel | v2 | v3 |
|---|---|---|---|
| Photo JPEG | 14,04 Mo | 0,07 g, « 10,57x inférieur à la moyenne » | 1,20 g · **F** |
| Wikipédia « Centre de données » | 706 Ko | 0,50 g | 0,055 g · **A** |

## 2. Le poids transféré sur Chrome (A-02)

**Problème.** La v2 lit `details.responseSize`. Cette propriété **n'existe pas** dans l'API `chrome.webRequest` : le poids transféré vaut donc toujours 0 sur Chrome.

**Avant** :

```js
chrome.webRequest.onCompleted.addListener((details) => {
  // …
  let transferredSize = details.responseSize || 0;   // toujours undefined → 0
  requestData.transferredSize = transferredSize;
  // …
});
```

**Après** : la taille est lue dans l'en-tête `Content-Length` à la réception de la réponse, puis comptée quand la requête se termine.

```js
chrome.webRequest.onHeadersReceived.addListener((details) => {
  const request = getTabData(details.tabId).requests.get(details.requestId);
  if (!request) return;
  const contentLength = details.responseHeaders?.find(
    (header) => header.name.toLowerCase() === "content-length");
  const size = contentLength ? parseInt(contentLength.value, 10) : NaN;
  request.contentLength = Number.isFinite(size) && size >= 0 ? size : null;
}, { urls: ["<all_urls>"] }, ["responseHeaders"]);
```

**Preuve.** Sur les 7 sites filmés, la v2 compte **0 octet transféré** partout. La v3 compte de 78 % à 106 % des octets réellement reçus par Chromium (91 % sur Wikipédia, 97 % sur Airbnb, 100 % sur la photo).

## 3. La division par 3 ou 5 sur Firefox (A-03)

**Problème.** La v2 Firefox divise le `Content-Length` par 3 (gzip) ou par 5 (brotli), en pensant obtenir la taille compressée. Or `Content-Length` est **déjà** la taille compressée : le poids est sous-estimé 3 à 5 fois.

**Avant** (`plugin/firefox/src/background.js`, v2) :

```js
let resourceSize = requestData.resourceSize || 0;
let transferredSize = resourceSize;
if (requestData.encoding && resourceSize > 0) {
  switch (requestData.encoding) {
    case "gzip":
    case "deflate":
      transferredSize = Math.round(resourceSize / 3);
      break;
    case "br":
      transferredSize = Math.round(resourceSize / 5);
      break;
  }
}
```

**Après** : Chrome et Firefox partagent exactement la même règle (§4). `Content-Length` est utilisé tel quel. Le fichier Firefox est désormais généré à partir du fichier Chrome (seul `chrome.` devient `browser.`) : les deux copies ne peuvent plus diverger.

## 4. Le cache, les revalidations, les redirections et les erreurs (A-04)

**Problème.** La v2 ignore `fromCache` : une ressource servie par le cache du navigateur est comptée comme si elle avait été téléchargée. Les redirections et les erreurs ne sont pas traitées.

**Après** : chaque fin de requête est classée.

```js
chrome.webRequest.onCompleted.addListener((details) => {
  // …
  if (details.fromCache) {
    // Servie par le cache du navigateur : rien n'a transité sur le réseau.
    addMeasuredBytes(tabData, 0, request.start);
  } else if (details.statusCode === 304) {
    // Revalidation : le serveur n'a renvoyé que des en-têtes, pas de corps.
    addMeasuredBytes(tabData, 0, request.start);
  } else if (request.contentLength !== null) {
    addMeasuredBytes(tabData, request.contentLength, request.start);
  } else {
    // Taille inconnue : on attend la mesure Resource Timing de la page (§5).
    applyTimingToPending(tabData, request.url);
  }
});
// Redirections (onBeforeRedirect) et erreurs (onErrorOccurred) : la requête compte, avec 0 octet.
```

**Preuve.** 2e visite (rechargement avec le cache conservé) :

| Page | Reçu par Chromium | v2 | v3 |
|---|---|---|---|
| Amazon | 54 Ko (107 réponses du cache) | **1,31 g** (120 requêtes recomptées) | 0,0023 g |
| Airbnb | 80 Ko (129 réponses du cache) | **1,66 g** | 0,0006 g |
| Photo JPEG | 1,6 Ko | 0,08 g | **0 g** |

## 5. Les réponses sans `Content-Length` : Resource Timing

**Problème.** Beaucoup de réponses n'annoncent pas leur taille : pages HTML générées à la volée, réponses « chunked », fichiers compressés en HTTP/2. La v2 les comptait pour 0.

**Après** : un nouveau **script de contenu**, `resource-timing.js`, lit dans la page la taille réellement transférée de chaque ressource (`PerformanceResourceTiming.transferSize`). Il l'envoie au plugin, qui l'associe aux requêtes encore sans taille.

```js
// plugin/chrome/resource-timing.js (extrait)
function collect(list) {
  for (const entry of list.getEntries()) {
    if (entry.transferSize > 0) {
      pending.push({ url: entry.name, transferSize: entry.transferSize });
    }
  }
  if (pending.length > 0 && timer === null) timer = setTimeout(flush, FLUSH_DELAY_MS);
}
new PerformanceObserver(collect).observe({ type: "navigation", buffered: true });
new PerformanceObserver(collect).observe({ type: "resource", buffered: true });
```

Le plugin calcule aussi un **taux de couverture** : la part des requêtes dont la taille est connue. Le popup l'affiche quand il passe sous 90 %.

**Limite connue.** Pour une ressource venant d'un autre domaine qui n'annonce pas sa taille et n'envoie pas l'en-tête `Timing-Allow-Origin`, le navigateur ne donne la taille à **aucune** extension. Exemples : 2 requêtes sur 166 sur Amazon, 2 sur 163 sur Airbnb, 2 sur 139 sur YouTube.

## 6. L'intensité carbone : plus d'API, plus de clé (A-05, A-06, S-02)

**Problème.** La v2 interroge Electricity Maps à chaque page, avec une **clé d'API écrite en clair** dans le plugin publié. Trois défauts en découlent :
- en cas d'erreur, la fonction renvoie `-1`, et `-1 || 442` vaut `-1` en JavaScript : l'**empreinte devient négative** et réduit le total de l'utilisateur ;
- la valeur reçue est rangée dans l'**onglet actif**, pas forcément dans l'onglet mesuré ;
- le résultat d'une même page change d'une heure à l'autre (≈ 72 g/kWh ou 442 g/kWh pendant nos enregistrements).

**Avant** :

```js
const token = CONFIG.BACKEND.ELECTRICITY_MAP_API_KEY;   // clé publiée dans le plugin
async function getLatestCarbonIntensity(countryCode) {
  try {
    const response = await fetch(`${carbonIntensityUrl}?zone=${countryCode}`,
      { headers: { "auth-token": token } });
    // …
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      getTabData(tabs[0].id).carbonIntensity = data.carbonIntensity;  // onglet actif
    });
    return data.carbonIntensity;
  } catch (error) {
    return -1;                                           // → empreinte négative
  }
}
// …
const carbonIntensity = tabData.carbonIntensity || 442;  // -1 || 442 === -1
```

**Après** : la fonction et la clé sont supprimées. L'intensité **annuelle moyenne de chaque pays** (données Ember, 208 pays) est embarquée dans `greenscore-calc.js` ([ADR-0005](adr/0005-intensite-carbone-embarquee.md)). Pour la France, c'est 44,18 gCO2e/kWh. Un pays inconnu donne la moyenne mondiale (494 g/kWh) : jamais de valeur négative, aucun appel réseau, aucune clé.

```js
// config.js
// Plus de clé Electricity Maps : l'intensité carbone annuelle par pays est embarquée
// dans greenscore-calc.js (ADR-0005). L'ancienne clé (S-02) doit être révoquée.
```

> ⚠️ L'ancienne clé est encore visible dans l'historique du dépôt 2025-2026 d'origine : elle doit être **révoquée** chez Electricity Maps.

## 7. L'arrondi à 0,00 g (A-10)

**Avant** : `totalEmissions: Number(emissions.toFixed(2))`. Toute page sous 0,005 g est enregistrée à **0**.

**Après** : `totalEmissions: Number(result.gco2e.toFixed(6))`. Le popup affiche deux chiffres significatifs pour les petites valeurs (`0.0002`) au lieu de `0.00`.

## 8. Une page vue = une mesure (A-07)

**Problèmes dans la v2.**
- Au **début** de chaque navigation, la v2 envoie une mesure quasi vide pour la nouvelle URL (`handleUrlChange` → `processAndSendData`). Cela fait deux lignes par page en base.
- Dans une **application monopage** (navigation sans rechargement), les compteurs ne sont jamais remis à zéro. Chaque changement d'URL renvoie le **cumul**, et le popup attribue toutes les pages à la dernière.

**Avant** :

```js
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    const tabData = getTabData(details.tabId);
    if (tabData.currentUrl && tabData.currentUrl !== details.url) {
      processAndSendData(details.tabId, tabData, true).then(() => {
        resetTabData(details.tabId);
        handleUrlChange(details.tabId, details.url);   // envoie aussitôt une mesure quasi vide
      });
    } // …
  }
});
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) {
    handleUrlChange(details.tabId, details.url);       // pas de remise à zéro : cumul
  }
});
```

**Après**, en trois points.

**a) Une page vue commence avec la requête du document.** Elle n'est envoyée qu'une fois, quand on la quitte : navigation, changement d'URL ou fermeture de l'onglet.

```js
// Dans onBeforeRequest
if (details.type === "main_frame") {
  if (tabData.mainRequestId === details.requestId) {
    tabData.currentUrl = details.url;            // redirection : même page vue
  } else {
    closeCurrentPage(details.tabId);             // envoie la page précédente, une seule fois
    tabData = startNewPage(details.tabId, details.url);
    tabData.mainRequestId = details.requestId;
  }
}
```

**b) Pourquoi la requête du document et pas `onBeforeNavigate` ?** Dans le service worker de Chrome, l'événement de navigation arrive parfois **après** la requête du document. La remise à zéro effaçait alors le document HTML, avec jusqu'à −45 % d'octets sur une page Wikipédia, de façon aléatoire. Les événements `webRequest`, eux, arrivent toujours dans l'ordre. *(Bug trouvé et corrigé pendant le contrôle du 10/11.)*

**c) Les applications monopages téléchargent la page suivante avant de changer d'URL.** C'est le cas de SvelteKit, Next.js ou React Router : la requête de données part au clic, et le changement d'URL (`pushState`) n'arrive qu'après. La v3 rangeait cette requête dans l'ancienne page, puis la perdait. Désormais, les requêtes lancées moins de 3 s avant le changement d'URL sont rattachées à la nouvelle page :

```js
const SPA_CARRY_MS = 3000;

function startSpaPage(tabId, url, timeStamp) {
  const previous = getTabData(tabId);
  const cutoff = timeStamp - SPA_CARRY_MS;
  // requêtes en cours ou déjà mesurées depuis `cutoff` : retirées de la page précédente…
  const pending = [...previous.requests].filter(([, r]) => r.start >= cutoff);
  const measured = previous.recent.filter((r) => r.start >= cutoff);
  // … puis la page précédente est close, et elles sont ajoutées à la nouvelle.
  closeCurrentPage(tabId);
  const next = startNewPage(tabId, url);
  // …
}
```

**Preuve** (doc Svelte, 5 pages sans rechargement) :

| Page | Reçu par Chromium | v3 avant le correctif (c) | v3 après |
|---|---|---|---|
| Overview | ≈ 238 Ko | 256 Ko | 256 Ko |
| Getting started | 12,4 Ko | **0 Ko** | 12,5 Ko |
| .svelte files | 13,0 Ko | **0 Ko** | 13,1 Ko |
| What are runes? | 12,2 Ko | **0 Ko** | 12,3 Ko |
| $state | 24,8 Ko | **0 Ko** | 24,9 Ko |

La v2, elle, affiche 0,58 g pour la seule page « $state », avec les 53 requêtes des 5 pages cumulées.

## 9. Plus d'envoi perdu (A-08)

**Avant** : un verrou global abandonne l'envoi si un autre est en cours, ou si le précédent date de moins d'une seconde.

```js
let sendInProgress = false;
async function processAndSendData(tabId, tabData, isFinal = false) {
  if (sendInProgress || (!isFinal && now - lastSendTime < SEND_COOLDOWN)) {
    console.log("Skipping data send: cooldown in effect or send in progress.");
    return;                                         // mesure perdue
  }
  // …
}
```

**Après** : une file d'envoi. Les envois partent l'un après l'autre et aucun n'est abandonné. Chaque envoi porte sur un **instantané** de la page, qui ne change plus pendant l'envoi.

```js
let sendQueue = Promise.resolve();
function processAndSendData(page) {
  sendQueue = sendQueue.then(() => sendPage(page)).catch((error) => {
    console.error("Erreur dans processAndSendData:", error);
  });
  return sendQueue;
}
```

## 10. Le popup

**Avant** :
- la valeur est comparée à une « moyenne » de **0,74 g**, calibrée sur l'ancien modèle ;
- les couleurs utilisent les seuils 0,3 / 0,7 / 1 g ;
- la valeur est arrondie à 2 décimales.

**Après** :
- le popup affiche la **note officielle SWDM v4**, par exemple « Note A (échelle SWDM v4) », et la part des requêtes mesurées quand elle passe sous 90 % ;
- les couleurs suivent l'échelle : A+/A vert (≤ 0,079 g), B/C jaune (≤ 0,209 g), D/E orange (≤ 0,359 g), F rouge ;
- les petites valeurs restent lisibles (`0.0002` au lieu de `0.00`).

```js
function updateRating(rating, coverage) {
  // …
  let text = fr ? `Note ${rating} (échelle SWDM v4)` : `Rating ${rating} (SWDM v4 scale)`;
  if (typeof coverage === "number" && coverage < 0.9) {
    text += fr ? ` · ${pct} % des requêtes mesurées` : ` · ${pct}% of requests measured`;
  }
  line.textContent = text;
}
```

## 11. Un seul calcul, testé contre la référence

**Avant** : la formule est écrite à la main, deux fois (Chrome et Firefox), sans aucun test.

**Après** :
- **`calc/`** est le module de calcul unique. Il a 45 tests. Ses résultats sont **identiques** à ceux de la bibliothèque de référence CO2.js : écart mesuré de 0 sur les vecteurs de test.
- **`calc/scripts/build-plugin.mjs`** (`npm run build:plugin`) génère `greenscore-calc.js` pour les deux plugins, qui n'ont pas d'outil de compilation.
- **`calc/test/plugin-bundle.test.js`** vérifie que le fichier embarqué dans chaque plugin donne exactement les mêmes résultats que `calc/` (6 tests de plus, **51 au total**).
- **La CI GitHub** (`.github/workflows/calc.yml`) régénère le fichier et échoue s'il diffère de celui du dépôt : le calcul du plugin ne peut pas dériver du calcul de référence.

```bash
cd calc; npm ci; npm test
```

---

## Ce qui n'a pas changé (limites et suite)

- **En-têtes HTTP** : une extension ne voit pas leur taille, environ 1 Ko par requête. C'est l'essentiel de l'écart négatif restant (−9 % sur Wikipédia). Une constante moyenne pourra être ajoutée si le banc de test du Sprint 2 confirme un biais systématique ([CDCT §4.4](CDCT.md#44-mesure-des-octets-corrige-a-02-a-03-a-04)).
- **Pays** : il est toujours déduit de l'adresse IP via `ipwhois.app` (constat P-02, vie privée). La v3 prévoit un pays choisi par l'utilisateur.
- **Back-end et site** : leurs notes (A à G, constat A-09), la faille d'écriture S-01 et le stockage des URL complètes (P-01) ne sont pas encore corrigés.
- **Firefox** : le code est identique à celui de Chrome, mais il n'a **pas encore été testé** dans Firefox.
- **Point à surveiller** : juste après un redémarrage, sur un réseau très lent, deux enregistrements de Wikipédia ont perdu le document HTML (−160 Ko). Le problème ne s'est pas reproduit sur 4 essais. Il est à vérifier avec le banc de test.
