// Monte les vidéos avant / après à partir des enregistrements Chromium (out/<id>).
// Usage : FFMPEG=... node render-rec.mjs [image,wikipedia,svelte,example] [--preview]
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";

// GS_WORK : dossier de travail (ext-v2/ = GreenScore 1.6.2 décompressé, rec/ = ces scripts)
const S = process.env.GS_WORK;
const CHROMIUM = process.env.CHROMIUM;
const FFMPEG = process.env.FFMPEG;
const OUT = process.env.GS_OUT;
const FPS = 30;
const ids = (process.argv[2] || "image,wikipedia,svelte,example,amazon,airbnb,youtube").split(",");
const preview = process.argv.includes("--preview");

const num = (s) => Number(String(s).replace(",", "."));
const fr = (n, d) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const shown = (text) => ({
  g: text.match(/consomme (\S+) gC0/)?.[1],
  avg: text.match(/C'est ?(.*?)à la moyenne/)?.[1]?.trim(),
  note: text.match(/Note (\S+)/)?.[1],
});
const mb = (b) => (b >= 1e6 ? `${fr(b / 1e6, 1)} Mo` : `${fr(b / 1e3, b < 1e4 ? 1 : 0)} Ko`);

function pagesOf(d) {
  const closed = d.state.v3Closed || [];
  return [...closed, { ...d.state.v3, bytes: d.state.v3.transferred }];
}

function texts(d) {
  const v2 = shown(d.popupText.v2), v3 = shown(d.popupText.v3);
  const g2 = num(v2.g);
  const pages = pagesOf(d);
  const v3Bytes = pages.reduce((a, p) => a + p.bytes, 0);
  const g3 = pages.reduce((a, p) => a + p.gco2e, 0);
  const pct = Math.round((v3Bytes / d.truth.bytes) * 100);
  const g3txt = g3 < 0.01 ? String(Number(g3.toPrecision(2))).replace(".", ",") : fr(g3, g3 < 0.1 ? 3 : 2);
  if (d.id === "svelte") {
    const list = pages.map((p, i) => `${d.spaPages[i]?.split(" •")[0] ?? "page"} : <b>${fr(p.gco2e, 3)} g</b> (${mb(p.bytes)})`).join("<br>");
    return [`La v2 met les 5 pages sur la dernière et compte 0 octet (${fr(g2, 2)} g). <em>La v3 découpe 5 pages vues et mesure ${mb(v3Bytes)} (${pct} %) : ${g3txt} g au total.</em>`,
      `<b>Pages vues par la v3</b><br>${list}`];
  }
  const avg = v2.avg ? `, « ${v2.avg} à la moyenne »` : "";
  return [`La v2 compte <em>0 octet</em> et affiche ${fr(g2, 2)} g${avg}. <em>La v3 mesure ${mb(v3Bytes)} (${pct} % du réel) : ${g3txt} g, note ${v3.note}.</em>`];
}

function gap(real, counted, unmeasured) {
  const g = real - counted;
  if (g < 0) return `+${mb(-g)} : Resource Timing ajoute 300 o d'en-têtes estimés par ressource`;
  let t = `−${mb(g)} : en-têtes HTTP (≈ 1 Ko par requête, invisibles pour une extension)`;
  if (unmeasured > 0) t += ` + ${unmeasured} requête${unmeasured > 1 ? "s" : ""} d'un autre domaine sans taille annoncée`;
  return t;
}

function detail(d) {
  const v2 = shown(d.popupText.v2), v3 = shown(d.popupText.v3);
  const s2 = d.state.v2After || d.state.v2;
  const pages = pagesOf(d);
  const v3Bytes = pages.reduce((a, p) => a + p.bytes, 0);
  const v3Req = pages.reduce((a, p) => a + p.requests, 0);
  const v3Mes = pages.reduce((a, p) => a + (p.measured ?? 0), 0);
  const g3 = pages.reduce((a, p) => a + p.gco2e, 0);
  const unmeasured = v3Req - v3Mes;
  const I = s2.intensity;
  const i2 = I > 0 && I !== 442 ? `${fr(I, 0)} g/kWh <small>(Electricity Maps, en direct : change d'heure en heure)</small>`
    : I < 0 ? `${I} <small>(API en échec : empreinte négative, constat A-05)</small>`
    : `442 g/kWh <small>(valeur par défaut : l'appel à l'API a échoué)</small>`;
  const rows = [
    ["Poids transféré", mb(d.truth.bytes), `0 Ko <small>(taille transférée jamais lue sur Chrome, constat A-02)</small>`,
      `${mb(v3Bytes)} <small>(Content-Length, sinon Resource Timing)</small>`],
    ["Requêtes", String(d.truth.requests), `${s2.requests} comptées`, `${v3Mes} / ${v3Req} pesées une à une`],
  ];
  if (d.id === "svelte") rows.push(["Pages vues", `${d.spaPages.length} (sans rechargement)`, `1 : tout est cumulé sur la dernière`, `${pages.length}, chacune remise à zéro`]);
  rows.push(
    ["Intensité carbone", "—", i2, `44 g/kWh <small>(moyenne annuelle France, Ember)</small>`],
    ["Formule", "—", `0,15 Wh par requête + 0,065 kWh/Go (data center) <small>; le réseau (0,519 kWh/Go) est multiplié par 0 octet</small>`,
      `Go × 0,30 kWh/Go <small>(SWDM v4 : data center, réseau, terminal, fabrication)</small>`],
    ["Résultat affiché", "—", `${v2.g} g${v2.avg ? ` <small>« ${v2.avg} à la moyenne »</small>` : ""}`,
      `${String(Number(g3.toPrecision(2))).replace(".", ",")} g · note ${v3.note}`],
    ["Écart restant", "—", "—", gap(d.truth.bytes, v3Bytes, unmeasured)],
  );
  let verdict2 = "";
  if (d.truth2) {
    const c2 = d.state2.v2After || d.state2.v2, c3 = d.state2.v3;
    const p2 = shown(d.popupText.v2Cache), p3 = shown(d.popupText.v3Cache);
    rows.splice(rows.length - 1, 0, ["2ᵉ visite (cache)",
      `${mb(d.truth2.bytes)} <small>(${d.truth2.cached} réponses du cache)</small>`,
      `${p2.g} g <small>(${c2.requests} requêtes recomptées, cache ignoré : A-04)</small>`,
      `${mb(c3.transferred)} · ${String(p3.g).replace(".", ",")} g <small>(cache = 0 octet)</small>`]);
    const g2a = num(shown(d.popupText.v2).g), g2b = num(p2.g);
    verdict2 = `Au rechargement, Chromium ne reçoit que ${mb(d.truth2.bytes)}. <em>La v3 suit : ${mb(c3.transferred)}, ${String(p3.g).replace(".", ",")} g.</em> ` +
      `La v2 affiche ${fr(g2b, 2)} g${Math.abs(g2b - g2a) < 0.05 ? ", comme à la 1re visite" : ""} : elle recompte les ${c2.requests} requêtes.`;
  }
  const fixes = [
    "Vrais octets : Content-Length sans division, sinon Resource Timing (A-02, A-03)",
    "Cache compté à 0 octet ; redirections et erreurs comptées (A-04)",
    "Calcul SWDM v4 sur le poids, au lieu de 0,15 Wh par requête (A-01)",
    "Intensité annuelle embarquée : plus d'API, plus de clé, plus de valeur négative (A-05, S-02)",
    "Une page vue = une mesure, y compris dans les applications monopages (A-07)",
    "Plus d'envoi perdu entre onglets, plus d'arrondi à 0,00 (A-08, A-10)",
  ];
  return { rows, fixes, verdict2 };
}

const NAMES = { image: "chromium-avant-apres-image-14Mo", wikipedia: "chromium-avant-apres-wikipedia",
  amazon: "chromium-avant-apres-amazon", airbnb: "chromium-avant-apres-airbnb", pinterest: "chromium-avant-apres-pinterest", youtube: "chromium-avant-apres-youtube",
  svelte: "chromium-avant-apres-application-monopage", example: "chromium-avant-apres-example-com" };

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROMIUM, headless: "new", pipe: true,
  args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

for (const id of ids) {
  const data = JSON.parse(readFileSync(`${S}/rec/out/${id}/data.json`, "utf8"));
  if (id === "amazon") data.mask = [{ x: 140, y: 6, w: 226, h: 48 }];
  const [verdict, pages] = texts(data);
  await page.goto(`file:///${S}/rec/compose.html`, { waitUntil: "load" });
  await page.evaluate((d, v, p, x) => window.setup(d, v, p, x), data, verdict, pages ?? "", detail(data));
  const duration = await page.evaluate(() => window.DURATION);
  if (preview) {
    for (const [name, t] of [["a", 3], ["b", duration - 12.2], ["c", duration - 0.1]]) {
      await page.evaluate((t) => window.renderFrame(t), t);
      await page.screenshot({ path: `${S}/rec/preview-${id}-${name}.png` });
    }
    console.log(id, "aperçu", duration.toFixed(1), "s");
    continue;
  }
  const frames = `${S}/rec/vframes-${id}/`;
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / FPS);
    await page.screenshot({ path: `${frames}${String(i).padStart(4, "0")}.png` });
  }
  const name = NAMES[id];
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}%04d.png`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", `${OUT}/${name}.mp4`]);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}%04d.png`,
    "-vf", "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
    `${OUT}/${name}.gif`]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`${name} : ${total} images, ${duration.toFixed(1)} s`);
}
await browser.close();
