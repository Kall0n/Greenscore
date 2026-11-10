// Génère les intensités carbone moyennes annuelles par pays (données Ember fournies par CO2.js).
// Sorties :
//   - calc/grid-intensity.json          (référence, lue par le back-end Rust à la compilation)
//   - calc/src/grid-intensity.data.js   (même contenu, module ES pour le plugin et les tests)
// Usage : npm run generate:intensity
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { averageIntensity } from "@tgwf/co2/data";
import { co2jsVersion as co2Version } from "./co2js-version.mjs";

const require = createRequire(import.meta.url);
const countries = require("i18n-iso-countries");

const data = {};
const skipped = [];
for (const [alpha3, value] of Object.entries(averageIntensity.data)) {
  const alpha2 = countries.alpha3ToAlpha2(alpha3);
  if (!alpha2) {
    // Agrégats régionaux (WORLD, EU, AFRICA…) : pas de code pays ISO alpha-2.
    skipped.push(alpha3);
    continue;
  }
  const intensity = Number(value);
  if (!Number.isFinite(intensity) || intensity < 0) {
    throw new Error(`Intensité invalide pour ${alpha3} : ${value}`);
  }
  data[alpha2] = intensity;
}

const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));

const output = {
  description:
    "Intensité carbone moyenne annuelle de l'électricité par pays (gCO2e/kWh), clé ISO 3166-1 alpha-2.",
  unit: "gCO2e/kWh",
  type: averageIntensity.type,
  source: "Ember, via @tgwf/co2 (Green Web Foundation)",
  sourcePackage: `@tgwf/co2@${co2Version}`,
  // CO2.js ne publie pas l'année de référence dans ce jeu de données : à renseigner
  // à partir de la documentation CO2.js / Ember au moment de la publication du modèle.
  referenceYear: null,
  license: "CC BY-SA 4.0",
  attribution: "Ember — Electricity Data Explorer, données republiées par la Green Web Foundation (CO2.js)",
  regionalAggregatesSkipped: skipped.sort(),
  data: sorted,
};

const json = JSON.stringify(output, null, 2) + "\n";
writeFileSync(new URL("../grid-intensity.json", import.meta.url), json);
writeFileSync(
  new URL("../src/grid-intensity.data.js", import.meta.url),
  "// Fichier généré par scripts/generate-grid-intensity.mjs — ne pas modifier à la main.\n" +
    `export default ${JSON.stringify(output, null, 2)};\n`,
);

console.log(`${Object.keys(sorted).length} pays écrits, ${skipped.length} agrégats régionaux ignorés.`);
