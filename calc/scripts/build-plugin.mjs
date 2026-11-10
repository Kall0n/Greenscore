// Génère greenscore-calc.js, la version « script classique » du module de calcul,
// pour les plugins v2 (Chrome : importScripts dans le service worker ; Firefox :
// script d'arrière-plan). Les plugins n'ont pas de bundler : on assemble ici les
// sources ESM de calc/src en un seul fichier qui expose globalThis.GreenScoreCalc.
//
// Ne pas modifier les fichiers générés à la main : modifier calc/src puis lancer
//   npm run build:plugin
import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

/** Retire les import/export ESM d'un fichier source (formes utilisées dans calc/src). */
function stripModuleSyntax(source) {
  return source
    .replace(/^import[\s\S]*?;\s*$/gm, "")
    .replace(/^export (const|function) /gm, "$1 ")
    .replace(/^export default /m, "const gridIntensity = ");
}

const parts = [
  ["constants.js", read("../src/constants.js")],
  ["grid-intensity.data.js", read("../src/grid-intensity.data.js")],
  ["rating.js", read("../src/rating.js")],
  ["swdm.js", read("../src/swdm.js")],
];

const body = parts
  .map(([name, source]) => `// ---- calc/src/${name}\n${stripModuleSyntax(source).trim()}\n`)
  .join("\n");

const output = `// Fichier généré par calc/scripts/build-plugin.mjs — ne pas modifier à la main.
// Module de calcul GreenScore (SWDM v4, intensité annuelle par pays) pour le plugin.
// Méthode : docs/methodologie-calcul.md · Intensités : Ember (CC BY-SA 4.0), via CO2.js.
(function (root) {
"use strict";

${body}
root.GreenScoreCalc = Object.freeze({
  MODEL_VERSION,
  GLOBAL_GRID_INTENSITY,
  RATING_THRESHOLDS,
  estimate,
  rate,
  countryIntensity,
  toMicrograms,
});
})(typeof globalThis !== "undefined" ? globalThis : self);
`;

const targets = ["../../plugin/chrome/greenscore-calc.js", "../../plugin/firefox/src/greenscore-calc.js"];
for (const target of targets) writeFileSync(new URL(target, import.meta.url), output);

console.log(`greenscore-calc.js écrit pour ${targets.length} plugins.`);
