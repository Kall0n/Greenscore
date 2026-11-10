// config.js et greenscore-calc.js sont chargés avant ce fichier (manifest.json, background.scripts).

// ============================================================================
// Mesure et calcul (v3)
//
// - Octets : vraie taille transférée de chaque requête (CDCT §4.4) :
//     réponse servie par le cache          → 0 octet
//     en-tête Content-Length présent        → Content-Length (taille compressée, sans division)
//     sinon                                 → taille lue dans la page par resource-timing.js
//                                             (PerformanceResourceTiming.transferSize)
//   Une requête sans aucune de ces informations n'est pas mesurée : elle compte dans
//   le nombre de requêtes, et le taux de couverture l'indique.
// - Calcul : Sustainable Web Design Model v4, intensité annuelle du pays (Ember),
//   embarqué dans greenscore-calc.js (généré depuis calc/). Plus aucun appel à une API
//   d'intensité ni de clé (constats A-01, A-05, A-06, S-02 ; ADR-0001, ADR-0005).
// - Une page vue = une mesure : envoyée une seule fois, quand on la quitte
//   (navigation, changement d'URL d'une application monopage, fermeture de l'onglet).
//   Plus de mesure quasi vide au début de chaque navigation (A-07), plus d'envoi
//   abandonné quand deux onglets envoient en même temps (A-08).
// ============================================================================

// Récupérer les données réseau pour chaque onglet
const tabNetworkData = new Map();

//Cache pour utilisateur
const USER_CACHE_TTL = 900000 // 15 minutes;
let userCache = {
  data: null,
  timestamp: 0
};

// Cache pour le pays
const COUNTRY_CACHE_TTL = 3600000; // 1 heure
let countryCache = {
  data: null,
  timestamp: 0
};

// Flag pour éviter de spammer la notification
let hasNotifiedExpiration = false;

function newPageState(url = null) {
  return {
    currentUrl: url,
    totalRequests: 0,
    measuredRequests: 0,
    totalTransferredSize: 0,
    totalResourceSize: 0,
    startTime: null,
    endTime: null,
    // requestId → { url, measured } pour les requêtes en cours ou sans taille connue
    requests: new Map(),
    // url → tailles Resource Timing reçues avant la fin de la requête correspondante
    timingByUrl: new Map(),
    // Dernières requêtes mesurées { start, bytes } : servent à rattacher à la bonne page
    // les requêtes d'une navigation monopage lancées juste avant le changement d'URL.
    recent: [],
    mainRequestId: null,
    sent: false,
  };
}

// Une application monopage (SvelteKit, Next.js, React Router…) télécharge souvent les
// données de la page suivante AVANT de changer l'URL (pushState). Les requêtes lancées
// dans cette fenêtre avant le changement d'URL sont rattachées à la nouvelle page.
const SPA_CARRY_MS = 3000;
const RECENT_MAX = 200;

function getTabData(tabId) {
  if (!tabNetworkData.has(tabId)) {
    tabNetworkData.set(tabId, { ...newPageState(), country: null, countryCode: null });
  }
  return tabNetworkData.get(tabId);
}

// Remet les compteurs à zéro pour une nouvelle page vue (le pays est conservé).
function startNewPage(tabId, url) {
  const tabData = getTabData(tabId);
  Object.assign(tabData, newPageState(url));
  return tabData;
}

function isLocalDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === "greenscore.alwaysdata.net"
    );
  } catch (error) {
    return false;
  }
}

function addMeasuredBytes(tabData, bytes, start = Date.now()) {
  tabData.measuredRequests++;
  tabData.totalTransferredSize += bytes;
  tabData.totalResourceSize += bytes;
  tabData.recent.push({ start, bytes });
  if (tabData.recent.length > RECENT_MAX) tabData.recent.shift();
}

// Navigation monopage : clôt la page en cours et ouvre la suivante, en y déplaçant les
// requêtes (mesurées ou non) lancées moins de SPA_CARRY_MS avant le changement d'URL.
function startSpaPage(tabId, url, timeStamp) {
  const previous = getTabData(tabId);
  const cutoff = timeStamp - SPA_CARRY_MS;

  const pending = [...previous.requests].filter(([, r]) => r.start >= cutoff);
  for (const [requestId] of pending) {
    previous.requests.delete(requestId);
    previous.totalRequests--;
  }
  const measured = previous.recent.filter((r) => r.start >= cutoff);
  for (const r of measured) {
    previous.totalRequests--;
    previous.measuredRequests--;
    previous.totalTransferredSize -= r.bytes;
    previous.totalResourceSize -= r.bytes;
  }
  // Tailles Resource Timing déjà reçues pour les requêtes déplacées (et seulement elles)
  const timing = new Map();
  for (const [, r] of pending) {
    if (previous.timingByUrl.has(r.url)) timing.set(r.url, previous.timingByUrl.get(r.url));
  }

  closeCurrentPage(tabId);
  const next = startNewPage(tabId, url);
  next.timingByUrl = timing;
  for (const [requestId, r] of pending) {
    next.requests.set(requestId, r);
    next.totalRequests++;
    next.startTime = next.startTime === null ? r.start : Math.min(next.startTime, r.start);
  }
  for (const r of measured) {
    next.totalRequests++;
    addMeasuredBytes(next, r.bytes, r.start);
    next.startTime = next.startTime === null ? r.start : Math.min(next.startTime, r.start);
  }
  for (const [, r] of pending) if (r.done) applyTimingToPending(next, r.url);
  return next;
}

// Associe une taille Resource Timing à une requête terminée sans taille connue.
function applyTimingToPending(tabData, url) {
  const sizes = tabData.timingByUrl.get(url);
  if (!sizes || sizes.length === 0) return false;
  for (const [requestId, request] of tabData.requests) {
    if (request.url === url && request.done && !request.measured) {
      addMeasuredBytes(tabData, sizes.shift(), request.start);
      tabData.requests.delete(requestId);
      if (sizes.length === 0) tabData.timingByUrl.delete(url);
      return true;
    }
  }
  return false;
}

function calculateCarbonEmissions(tabData) {
  const bytes = tabData.totalTransferredSize || 0;
  const result = GreenScoreCalc.estimate({ bytes, country: tabData.countryCode });
  const { operational, embodied } = result.breakdown;
  const coverage = tabData.totalRequests > 0 ? tabData.measuredRequests / tabData.totalRequests : 1;

  return {
    // Pas d'arrondi à 2 décimales : une page sobre ne vaut plus 0 (constat A-10).
    totalEmissions: Number(result.gco2e.toFixed(6)),
    rating: result.rating,
    modelVersion: result.modelVersion,
    coverage,
    breakdown: {
      dataCenter: operational.dataCenter + embodied.dataCenter,
      network: operational.network + embodied.network,
      device: operational.device + embodied.device,
    },
    metrics: {
      data: {
        bytesTransferred: bytes,
        requests: tabData.totalRequests || 0,
        measuredRequests: tabData.measuredRequests || 0,
        loadTimeMs: tabData.endTime && tabData.startTime ? tabData.endTime - tabData.startTime : 0,
        carbonIntensity: result.gridIntensity.gco2ePerKwh,
        intensityCountry: result.gridIntensity.country,
      },
    },
  };
}

// Envoyer les données au backend pour l'envoi en BD
async function sendDataToServer(data) {
  try {
    const response = await fetch(`${CONFIG.BACKEND.PLUGIN_BACKEND_URL}/save_monitored_website_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to send data to the server:", error);
  }
}

// Fonction pour extraire le domaine de l'URL
function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace("www.", "");
  } catch (error) {
    return null;
  }
}

function resolveAccountData(payload) {
  if (!payload || payload.success === false) {
    return null;
  }

  return payload.account || payload.user_full || payload.user || null;
}

function resolveUserId(accountData) {
  if (!accountData) {
    return null;
  }

  return accountData.id ?? accountData.user?.id ?? null;
}

async function getUserId() {
  try {
    const sessionCookie = await browser.cookies.get({
      url: `${CONFIG.BACKEND.BASE_URL}/`,
      name: "greenscoreweb_sessions",
    });

    if (!sessionCookie) {
      if (userCache.data !== null && !hasNotifiedExpiration) {
        showSessionExpiredNotification();
        hasNotifiedExpiration = true;
      }
      userCache.data = null;
      return null;
    }

    const now = Date.now();
    if (userCache.data && (now - userCache.timestamp < USER_CACHE_TTL)) {
      return userCache.data;
    }

    const response = await fetch(`${CONFIG.BACKEND.PLUGIN_BACKEND_URL}/get-account`, {
      credentials: "include",
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: `greenscoreweb_sessions=${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await response.json();
    const accountData = resolveAccountData(userData);
    const userId = resolveUserId(accountData);

    if (!accountData || !userId) {
      throw new Error("Invalid get-account payload");
    }

    userCache.data = accountData;
    userCache.timestamp = now;
    hasNotifiedExpiration = false; // Réinitialise si connexion réussie

    return accountData;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID:", error);
    if (userCache.data !== null && !hasNotifiedExpiration) {
      showSessionExpiredNotification();
      hasNotifiedExpiration = true;
    }
    userCache.data = null;
    return null;
  }
}

function showSessionExpiredNotification() {
  browser.notifications.create({
    type: "basic",
    title: "Session Expirée",
    message: "Votre session GreenScore a expiré. Veuillez vous reconnecter.",
    iconUrl: browser.runtime.getURL("assets/images/logo.png")
  });
}

async function getUserData() {
  try {
    const userData = await getUserId();
    const userId = resolveUserId(userData);

    return {
      isLoggedIn: !!userId,
      userId,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données utilisateur:",
      error
    );
    return { isLoggedIn: false, userId: null };
  }
}

// File d'envoi : les envois sont faits l'un après l'autre, aucun n'est abandonné (A-08).
let sendQueue = Promise.resolve();

// Envoie la page vue décrite par `page` (un instantané, pas l'état vivant de l'onglet).
function processAndSendData(page) {
  sendQueue = sendQueue.then(() => sendPage(page)).catch((error) => {
    console.error("Erreur dans processAndSendData:", error);
  });
  return sendQueue;
}

async function sendPage(page) {
  if (!page.currentUrl || isLocalDomain(page.currentUrl) || page.totalRequests === 0) return;

  let userId = resolveUserId(userCache.data);
  if (!userId) {
    ({ userId } = await getUserData());
  }
  if (!userId) return;

  const emissionsData = calculateCarbonEmissions(page);

  await sendDataToServer({
    id: 0,
    url_domain: extractDomain(page.currentUrl),
    user_id: userId,
    queries_quantity: page.totalRequests || 0,
    data_transferred: page.totalTransferredSize || 0,
    resources: page.totalResourceSize || 0,
    loading_time:
      page.startTime && page.endTime
        ? (page.endTime - page.startTime) / 1000
        : 0,
    carbon_footprint: emissionsData.totalEmissions || 0,
    url_full: page.currentUrl || "",
    country: page.country || "Unknown",
  });
}

// Clôt la page vue en cours de l'onglet : l'envoie si elle n'a pas déjà été envoyée.
function closeCurrentPage(tabId) {
  const tabData = tabNetworkData.get(tabId);
  if (!tabData || !tabData.currentUrl || tabData.sent) return;
  tabData.sent = true;
  processAndSendData({ ...tabData });
}

async function ensureCountry(tabData) {
  if (tabData.countryCode) return;
  const { country, countryCode } = await fetchCountry();
  tabData.country = country;
  tabData.countryCode = countryCode;
}

let listenersInitialized = false;

function initializeListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  // Une nouvelle navigation commence avec la requête du document (type « main_frame »,
  // dans onBeforeRequest plus bas). On ne s'appuie pas sur webNavigation.onBeforeNavigate :
  // dans le service worker, son ordre par rapport aux événements webRequest n'est pas
  // garanti, et la remise à zéro effaçait parfois la requête du document.

  // Application monopage (pushState/replaceState) : un changement d'URL = une nouvelle page vue.
  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    const tabData = getTabData(details.tabId);
    if (tabData.currentUrl === details.url) return;
    startSpaPage(details.tabId, details.url, details.timeStamp);
  });

  // Gère la fermeture des onglets
  browser.tabs.onRemoved.addListener((tabId) => {
    closeCurrentPage(tabId);
    tabNetworkData.delete(tabId);
  });
}

// Appelez cette fonction une seule fois au démarrage
initializeListeners();

// Récupérer le pays selon la géolocalisation
async function fetchCountry() {
  try {
    const now = Date.now();
    if (countryCache.data && (now - countryCache.timestamp < COUNTRY_CACHE_TTL)) {
      return countryCache.data;
    }

    const response = await fetch("https://ipwhois.app/json/");
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.success === false) {
      throw new Error(`API error: ${data.message}`);
    }

    const result = { country: data.country, countryCode: data.country_code };

    countryCache.data = result;
    countryCache.timestamp = now;

    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du pays:", error);
    // Pays inconnu : le calcul utilise la moyenne mondiale.
    return { country: "Unknown", countryCode: null };
  }
}

// Listener pour le début des requêtes
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId === -1) return;

    let tabData = getTabData(details.tabId);

    // Requête du document principal : début d'une nouvelle page vue (la page précédente
    // est close et envoyée). Une redirection du document garde le même requestId : c'est
    // la même page vue, seule son URL change.
    if (details.type === "main_frame") {
      if (tabData.mainRequestId === details.requestId) {
        tabData.currentUrl = details.url;
      } else {
        closeCurrentPage(details.tabId);
        tabData = startNewPage(details.tabId, details.url);
        tabData.mainRequestId = details.requestId;
        ensureCountry(tabData);
      }
    }

    if (isLocalDomain(details.url)) return; // Ignore les requêtes vers GreenScore

    tabData.totalRequests++;

    if (!tabData.startTime) {
      tabData.startTime = details.timeStamp;
    }

    tabData.requests.set(details.requestId, {
      url: details.url,
      start: details.timeStamp,
      contentLength: null,
      done: false,
      measured: false,
    });
  },
  { urls: ["<all_urls>"] }
);

// Listener pour les headers de réponse : Content-Length = taille transférée du corps
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId === -1 || isLocalDomain(details.url)) return;

    const request = getTabData(details.tabId).requests.get(details.requestId);
    if (!request) return;

    const contentLength = details.responseHeaders?.find(
      (header) => header.name.toLowerCase() === "content-length"
    );
    const size = contentLength ? parseInt(contentLength.value, 10) : NaN;
    request.contentLength = Number.isFinite(size) && size >= 0 ? size : null;
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Listener pour la fin des requêtes
browser.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId === -1 || isLocalDomain(details.url)) return;

    const tabData = getTabData(details.tabId);
    const request = tabData.requests.get(details.requestId);
    if (!request) return;

    tabData.endTime = details.timeStamp;
    request.done = true;

    if (details.fromCache) {
      // Servie par le cache du navigateur : rien n'a transité sur le réseau.
      addMeasuredBytes(tabData, 0, request.start);
      tabData.requests.delete(details.requestId);
    } else if (details.statusCode === 304) {
      // Revalidation : le serveur n'a renvoyé que des en-têtes, pas de corps.
      addMeasuredBytes(tabData, 0, request.start);
      tabData.requests.delete(details.requestId);
    } else if (request.contentLength !== null) {
      addMeasuredBytes(tabData, request.contentLength, request.start);
      tabData.requests.delete(details.requestId);
    } else {
      // Taille inconnue : on attend la mesure Resource Timing de la page.
      applyTimingToPending(tabData, request.url);
    }
  },
  { urls: ["<all_urls>"] }
);

// Redirection : la réponse ne contient que des en-têtes. L'étape compte comme une requête
// mesurée à 0 octet ; la requête suivante (même requestId) repasse par onBeforeRequest.
browser.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (details.tabId === -1 || isLocalDomain(details.url)) return;

    const tabData = getTabData(details.tabId);
    const request = tabData.requests.get(details.requestId);
    if (request && tabData.requests.delete(details.requestId)) addMeasuredBytes(tabData, 0, request.start);
  },
  { urls: ["<all_urls>"] }
);

// Listener pour les erreurs : la requête compte, avec 0 octet.
browser.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId === -1 || isLocalDomain(details.url)) return;

    const tabData = getTabData(details.tabId);
    const request = tabData.requests.get(details.requestId);
    if (request && tabData.requests.delete(details.requestId)) addMeasuredBytes(tabData, 0, request.start);
  },
  { urls: ["<all_urls>"] }
);

// Tailles Resource Timing envoyées par resource-timing.js
function handleResourceTiming(tabId, entries) {
  const tabData = tabNetworkData.get(tabId);
  if (!tabData || !Array.isArray(entries)) return;

  for (const { url, transferSize } of entries) {
    if (typeof url !== "string" || !(transferSize > 0)) continue;
    const sizes = tabData.timingByUrl.get(url) || [];
    sizes.push(transferSize);
    tabData.timingByUrl.set(url, sizes);
    applyTimingToPending(tabData, url);
  }
}

function emptyEmissions() {
  return {
    gCO2e: 0,
    rating: GreenScoreCalc.rate(0),
    coverage: 0,
    breakdown: { dataCenter: 0, network: 0, device: 0 },
    metrics: { data: { bytesTransferred: 0, requests: 0, measuredRequests: 0, loadTimeMs: 0, carbonIntensity: 0 } },
  };
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Mesures envoyées par le script de contenu de l'onglet
  if (message.type === "resourceTiming") {
    if (sender.tab && sender.frameId === 0) handleResourceTiming(sender.tab.id, message.entries);
    return false;
  }

  const handleNonLocalhost = async (activeTab, message) => {
    // Gestion des messages pour les sites non-localhost
    if (message.type === "getCountryAndUrl") {
      const tabUrl = sender.tab?.url || activeTab.url;
      try {
        const { country } = await fetchCountry();
        return { country, url: extractDomain(tabUrl) };
      } catch (error) {
        console.error("Erreur lors de la récupération du pays :", error);
        return { country: "Unknown", url: extractDomain(tabUrl) };
      }
    }

    if (message.type === "sendDataToDB") {
      // Le bouton « Plus de détails » enregistre la page en cours tout de suite ;
      // elle ne sera pas renvoyée quand on la quittera.
      const tabData = getTabData(activeTab.id);
      if (!tabData.currentUrl) tabData.currentUrl = activeTab.url;
      if (tabData.sent) {
        return { success: false, message: "URL already sent" };
      }
      await ensureCountry(tabData);
      tabData.sent = true;
      await processAndSendData({ ...tabData });
      return { success: true };
    }

    if (message.type === "getgCO2e") {
      const tabData = getTabData(activeTab.id);

      try {
        await ensureCountry(tabData);
        const emissionsData = calculateCarbonEmissions(tabData);

        return {
          gCO2e: emissionsData.totalEmissions,
          rating: emissionsData.rating,
          coverage: emissionsData.coverage,
          modelVersion: emissionsData.modelVersion,
          breakdown: emissionsData.breakdown,
          metrics: emissionsData.metrics,
        };
      } catch (error) {
        console.error("Erreur dans le calcul des émissions :", error);
        return emptyEmissions();
      }
    }

    if (message.type === "getFullDetails") {
      const tabData = getTabData(activeTab.id);
      return {
        country: tabData.country || "Unknown",
        countryCode: tabData.countryCode || "Unknown",
        urlDomain: extractDomain(tabData.currentUrl || activeTab.url),
        urlFull: tabData.currentUrl || activeTab.url,
        totalTransferredSize: tabData.totalTransferredSize || 0,
        totalRequests: tabData.totalRequests || 0,
        totalResourceSize: tabData.totalResourceSize || 0,
        loadTime: (tabData.endTime - tabData.startTime) / 1000 || 0,
      };
    }

    if (message.type === "checkLoginStatus") {
      return await getUserData();
    }

    if (message.type === "getEquivalent") {
      const tabData = getTabData(activeTab.id);
      const emissions = calculateCarbonEmissions(tabData);
      const gCO2 = emissions.totalEmissions;
      const count = message.count || 3;

      try {
        const response = await fetch(
          `${CONFIG.BACKEND.PLUGIN_BACKEND_URL}/equivalent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ gCO2, count })
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur API RUST : ${response.status}`);
        }

        const jsonResponse = await response.json();
        const equivalents = jsonResponse.data;
        return {
          success: true,
          equivalents: equivalents.map((eq) => ({
            image: "assets/images/equivalents/" + eq.icon,
            value: parseFloat(eq.value).toFixed(1),
            name: eq.name,
          })),
        };
      } catch (error) {
        console.error("Erreur dans getEquivalent:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }
  };

  // Point d'entrée principal du listener
  const handleMessage = async () => {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs.length === 0) {
      return { error: "Aucun onglet actif trouvé." };
    }

    const activeTab = tabs[0];

    // Vérification localhost
    // `checkLoginStatus` doit rester disponible même sur GreenScore pour déclencher get-account.
    if (message.type !== "checkLoginStatus" && isLocalDomain(activeTab.url)) {
      await browser.runtime.sendMessage({
        type: "localhostDetected",
        message: "Vous êtes bien arrivé sur notre site ;)",
      });
      return { localhostDetected: true };
    }

    // Si ce n'est pas localhost, traiter les autres messages
    return handleNonLocalhost(activeTab, message);
  };

  // Gestion correcte de la réponse asynchrone
  handleMessage()
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error("Erreur dans le message handler:", error);
      sendResponse({ error: error.message });
    });

  return true; // Indique que sendResponse sera appelé de manière asynchrone
});
