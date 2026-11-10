// Enregistre un scénario dans Chromium avec les DEUX extensions installées en même temps :
//  - GreenScore 1.6.2 (Chrome Web Store, « avant »)
//  - GreenScore 1.7.0 (dépôt, plugin/chrome, « après »)
// Capture : vidéo de l'onglet (CDP screencast), vrais popups des deux extensions,
// vérité terrain réseau (CDP encodedDataLength) et état interne des deux extensions.
//
// Usage : node record.mjs <id>
import puppeteer from "puppeteer-core";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

// GS_WORK : dossier de travail (ext-v2/ = GreenScore 1.6.2 décompressé, rec/ = ces scripts)
const S = process.env.GS_WORK;
const CHROMIUM = process.env.CHROMIUM;
const EXT = { v2: `${S}/ext-v2`, v3: process.env.GS_V3 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const SCENARIOS = {
  image: {
    title: "Une photo JPEG de 14 Mo",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Paris_%2875004%29_Quai_aux_Fleurs.jpg",
  },
  wikipedia: {
    title: "Article Wikipédia « Centre de données »",
    url: "https://fr.wikipedia.org/wiki/Centre_de_donn%C3%A9es",
    scroll: true,
  },
  amazon: {
    title: "Amazon : recherche « gourde inox »",
    url: "https://www.amazon.fr/s?k=gourde+inox",
    scroll: true,
  },
  airbnb: {
    title: "Airbnb : page d'accueil",
    url: "https://www.airbnb.fr/",
    scroll: true,
  },
  pinterest: {
    title: "Pinterest : page « idées »",
    url: "https://www.pinterest.fr/ideas/",
    scroll: true,
  },
  youtube: {
    title: "YouTube : page d'accueil (sans compte)",
    url: "https://www.youtube.com/",
    scroll: true,
  },
  svelte: {
    title: "Application monopage : 5 pages de la doc Svelte",
    url: "https://svelte.dev/docs/svelte/overview",
    spa: ["/docs/svelte/getting-started", "/docs/svelte/svelte-files", "/docs/svelte/what-are-runes", "/docs/svelte/$state"],
  },
  example: {
    title: "Page très sobre : example.com",
    url: "https://example.com/",
  },
};

const id = process.argv[2];
const sc = SCENARIOS[id];
if (!sc) throw new Error(`Scénario inconnu : ${id}`);
const out = `${S}/rec/out/${id}`;
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/frames`, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROMIUM, headless: "new", pipe: true,
  enableExtensions: [EXT.v2, EXT.v3], defaultViewport: null,
  args: ["--window-size=1280,800", "--no-first-run", "--no-default-browser-check", "--lang=fr-FR"],
});
await wait(1500);

// Service workers des deux extensions
const workers = {};
for (const t of browser.targets().filter((t) => t.type() === "service_worker")) {
  const w = await t.worker();
  const v = await w.evaluate(() => chrome.runtime.getManifest().version);
  workers[v === "1.6.2" ? "v2" : "v3"] = { w, host: new URL(t.url()).host, version: v };
}
if (!workers.v2 || !workers.v3) throw new Error("Extensions non chargées");

// Trace de diagnostic (DEBUG=1) : requêtes du document et changements de page dans la v3
if (process.env.DEBUG) await workers.v3.w.evaluate(() => {
  globalThis.__dbg = []; const t0 = Date.now();
  const L = (s) => __dbg.push(`${String(Date.now() - t0).padStart(6)} ${s}`);
  chrome.webRequest.onBeforeRequest.addListener((d) => { if (d.type === "main_frame") L(`MAIN ${d.requestId} tab=${d.tabId} ${d.url.slice(0, 70)}`); }, { urls: ["<all_urls>"] });
  chrome.webRequest.onCompleted.addListener((d) => { if (d.type === "main_frame") L(`MAIN-DONE ${d.requestId} cache=${d.fromCache} ${d.statusCode} cl=${d.responseHeaders?.find((h) => h.name.toLowerCase() === "content-length")?.value}`); }, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  chrome.webNavigation.onHistoryStateUpdated.addListener((d) => L(`PUSH ${d.frameId} ${d.url.slice(0, 70)}`));
  chrome.webRequest.onHeadersReceived.addListener((d) => { if (d.type === "main_frame") { const s = tabNetworkData.get(d.tabId); L(`MAIN-HEAD ${d.requestId} connu=${!!s?.requests.get(d.requestId)} page=${s?.currentUrl?.slice(-25)}`); } }, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  const ort = globalThis.handleResourceTiming; globalThis.handleResourceTiming = (tabId, e) => { if (e.some((x) => x.url.includes("Centre_de_donn") && !x.url.includes("load.php"))) L(`RT-DOC ${e.filter((x) => x.url.includes("Centre_de_donn")).map((x) => x.transferSize)}`); return ort(tabId, e); };
  const oc = globalThis.closeCurrentPage;
  globalThis.closeCurrentPage = (tabId) => { const d = tabNetworkData.get(tabId); L(`CLOSE ${d?.currentUrl?.slice(0, 60)} req=${d?.totalRequests} bytes=${d?.totalTransferredSize}`); return oc(tabId); };
});

// Relevé des pages vues que la v3 clôt (sans rien changer à son comportement)
await workers.v3.w.evaluate(() => {
  globalThis.__closed = [];
  const original = globalThis.processAndSendData;
  globalThis.processAndSendData = (p) => {
    try {
      const e = calculateCarbonEmissions(p);
      __closed.push({ url: p.currentUrl, bytes: p.totalTransferredSize, requests: p.totalRequests,
        measured: p.measuredRequests, gco2e: e.totalEmissions, rating: e.rating });
    } catch (_) {}
    return original(p);
  };
});

const [page] = await browser.pages();
await page.setViewport({ width: 1280, height: 720 });
const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
await cdp.send("Network.clearBrowserCache");

// Vérité terrain : octets reçus par l'onglet (en-têtes compris) et nombre de requêtes
const truth = { bytes: 0, requests: 0 };
cdp.on("Network.requestWillBeSent", (e) => { if (!e.request.url.startsWith("data:")) truth.requests++; });
cdp.on("Network.loadingFinished", (e) => { truth.bytes += e.encodedDataLength; });

// Vidéo de l'onglet
const frames = [];
cdp.on("Page.screencastFrame", async (e) => {
  const n = frames.length;
  writeFileSync(`${out}/frames/${String(n).padStart(4, "0")}.jpg`, Buffer.from(e.data, "base64"));
  frames.push({ file: `${String(n).padStart(4, "0")}.jpg`, t: e.metadata.timestamp, bytes: truth.bytes, requests: truth.requests });
  cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => {});
});
await page.goto("about:blank");
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
await wait(400);

// Bandeau cookies : on clique UNIQUEMENT un bouton de refus (jamais « Accepter »).
async function rejectConsent() {
  for (const frame of page.frames()) {
    const clicked = await frame.evaluate(() => {
      const re = /^(tout refuser|refuser tout|refuser|refuser les cookies|refuser les cookies non essentiels|continuer sans accepter|reject all|decline|decline optional cookies|only allow essential cookies|n'autoriser que les cookies essentiels|uniquement les cookies nécessaires)$/i;
      const el = [...document.querySelectorAll("button, [role=button], a")].find((b) => re.test((b.innerText || b.getAttribute("aria-label") || "").trim()));
      if (!el) return null;
      el.click();
      return (el.innerText || el.getAttribute("aria-label")).trim();
    }).catch(() => null);
    if (clicked) return clicked;
  }
  return null;
}

const t0 = Date.now();
await page.goto(sc.url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForNetworkIdle({ idleTime: 1500, timeout: 20000 }).catch(() => {});
await wait(1500);
const consent = await rejectConsent();
if (consent) { console.warn("bandeau cookies :", consent); await wait(2500); }
if (sc.scroll) {
  for (let i = 0; i < 6; i++) { await page.mouse.wheel({ deltaY: 450 }); await wait(500); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(800);
}
const spaPages = [await page.title()];
if (sc.spa) {
  for (const href of sc.spa) {
    await wait(1800);
    const ok = await page.evaluate((h) => {
      const a = [...document.querySelectorAll("a")].find((x) => x.getAttribute("href") === h || x.pathname === h);
      if (!a) return false;
      a.click();
      return true;
    }, href);
    if (!ok) console.warn("lien introuvable", href);
    await wait(1500);
    spaPages.push(await page.title());
  }
}
await wait(3000);
await cdp.send("Page.stopScreencast");
const loadSeconds = (Date.now() - t0) / 1000;
await page.screenshot({ path: `${out}/page.png` });

// État interne des extensions (ce que chacune a mesuré pour cet onglet)
async function extState(w) {
  return w.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const d = tabNetworkData.get(tab.id);
    if (!d) return null;
    const e = calculateCarbonEmissions(d);
    return {
      url: d.currentUrl, requests: d.totalRequests, transferred: d.totalTransferredSize,
      measured: d.measuredRequests ?? null, gco2e: e.totalEmissions, rating: e.rating ?? null,
      intensity: d.carbonIntensity ?? e.metrics?.data?.carbonIntensity ?? null,
    };
  });
}
const state = { v2: await extState(workers.v2.w), v3: await extState(workers.v3.w) };
state.v3Closed = await workers.v3.w.evaluate(() => __closed);
if (process.env.DEBUG) console.error((await workers.v3.w.evaluate(() => __dbg)).join("\n"), "\nÉTAT", JSON.stringify(state.v3));

// Vrais popups
const popupText = {};
for (const key of ["v2", "v3"]) {
  const { w, host } = workers[key];
  await w.evaluate(() => chrome.action.openPopup());
  const target = await browser.waitForTarget((t) => t.url().includes(host) && t.url().endsWith("popup.html"), { timeout: 10000 });
  const p = await target.asPage();
  await wait(4000);
  await p.screenshot({ path: `${out}/popup-${key}.png` });
  popupText[key] = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
  await p.close();
  await wait(800);
}

// La v2 récupère son intensité carbone à l'ouverture du popup : on la relit ensuite.
state.v2After = await extState(workers.v2.w);

// 2e visite : rechargement de la page AVEC le cache du navigateur (rien n'est vidé)
const before = { ...truth };
let cachedHits = 0;
cdp.on("Network.responseReceived", (e) => { if (e.response.fromDiskCache || e.response.fromPrefetchCache) cachedHits++; });
cdp.on("Network.requestServedFromCache", () => { cachedHits++; });
await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForNetworkIdle({ idleTime: 1500, timeout: 20000 }).catch(() => {});
await wait(3000);
const truth2 = { bytes: truth.bytes - before.bytes, requests: truth.requests - before.requests, cached: cachedHits };
const state2 = { v2: await extState(workers.v2.w), v3: await extState(workers.v3.w) };
for (const key of ["v2", "v3"]) {
  const { w, host } = workers[key];
  await w.evaluate(() => chrome.action.openPopup());
  const target = await browser.waitForTarget((t) => t.url().includes(host) && t.url().endsWith("popup.html"), { timeout: 10000 });
  const p = await target.asPage();
  await wait(4000);
  await p.screenshot({ path: `${out}/popup-${key}-cache.png` });
  popupText[`${key}Cache`] = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
  await p.close();
  await wait(800);
}
state2.v2After = await extState(workers.v2.w);

const data = {
  id, title: sc.title, url: page.url(), recordedAt: new Date().toISOString(), consent,
  chromium: await browser.version(), versions: { v2: workers.v2.version, v3: workers.v3.version },
  truth: before, loadSeconds, spaPages, state, popupText, truth2, state2,
  frames: frames.map((f) => ({ ...f, t: f.t - frames[0].t })),
};
writeFileSync(`${out}/data.json`, JSON.stringify(data, null, 1));
console.log(JSON.stringify({ id, frames: frames.length, truth, truth2, v2cache: state2.v2After, v3cache: state2.v3 }, null, 1));
await browser.close();
