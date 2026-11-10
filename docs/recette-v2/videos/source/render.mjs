// Rend chaque scène image par image (rendu déterministe), puis encode MP4 et GIF avec ffmpeg.
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Usage : CHROMIUM=<chemin de chrome.exe> FFMPEG=<chemin de ffmpeg> node render.mjs [T6,T1,T3,T7,SYN]
// (npm install puppeteer-core au préalable)
const CHROMIUM = process.env.CHROMIUM;
const FFMPEG = process.env.FFMPEG;
const OUT = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FPS = 30;
const SCENES = (process.argv[2] || "T6,T1,T3,T7,SYN").split(",");
const NAMES = {
  T6: "avant-apres-T6-image-14Mo", T1: "avant-apres-T1-wikipedia-596Ko", T3: "avant-apres-T3-parcours-amazon",
  T7: "avant-apres-T7-application-monopage", SYN: "avant-apres-synthese",
};
const html = pathToFileURL(new URL("./scene.html", import.meta.url).pathname.replace(/^\//, "")).href;

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROMIUM, headless: "new", pipe: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

for (const id of SCENES) {
  const frames = new URL(`./frames-${id}/`, import.meta.url).pathname.replace(/^\//, "");
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  await page.goto(`${html}?scene=${id}`, { waitUntil: "load" });
  const duration = await page.evaluate(() => window.DURATION);
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / FPS);
    await page.screenshot({ path: `${frames}${String(i).padStart(4, "0")}.png` });
  }
  const name = NAMES[id];
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}%04d.png`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", `${OUT}/${name}.mp4`]);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${frames}%04d.png`,
    "-vf", "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
    `${OUT}/${name}.gif`]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`${name} : ${total} images, ${duration} s`);
}
await browser.close();
