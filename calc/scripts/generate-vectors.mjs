// Génère calc/test-vectors.json : sorties de référence calculées avec CO2.js (SWDM v4).
// Notre implémentation (src/swdm.js) et, plus tard, celle du back-end Rust doivent les
// reproduire (tolérance 1e-9 g). Usage : npm run generate:vectors
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { co2 } from "@tgwf/co2";
import { co2jsVersion } from "./co2js-version.mjs";
import { MODEL_VERSION } from "../src/constants.js";

const require = createRequire(import.meta.url);
const countries = require("i18n-iso-countries");

const swd = new co2({ model: "swd", version: 4, rating: true, results: "segment" });
if (swd.model.version !== 4) throw new Error("CO2.js n'a pas chargé le SWDM v4");

/**
 * Référence CO2.js pour un volume et un pays (alpha-2, ou null = moyenne mondiale).
 * Fonctionnement réseau + terminal au pays ; data center et fabrication au mondial (défaut CO2.js v4).
 */
function reference(bytes, country) {
  const options = {};
  if (country) {
    const alpha3 = countries.alpha2ToAlpha3(country.toUpperCase());
    if (!alpha3) throw new Error(`Pays inconnu pour la référence : ${country}`);
    options.gridIntensity = { device: { country: alpha3 }, network: { country: alpha3 } };
  }
  const trace = swd.perByteTrace(bytes, false, options);
  // CO2.js renvoie 0 (et non un objet) quand bytes < 1.
  if (typeof trace.co2 === "number") {
    return { gco2e: trace.co2, rating: swd.model.ratingScale(trace.co2), segments: null };
  }
  const c = trace.co2;
  return {
    gco2e: c.total,
    rating: c.rating,
    segments: {
      operational: {
        dataCenter: c.dataCenterOperationalCO2e,
        network: c.networkOperationalCO2e,
        device: c.consumerDeviceOperationalCO2e,
      },
      embodied: {
        dataCenter: c.dataCenterEmbodiedCO2e,
        network: c.networkEmbodiedCO2e,
        device: c.consumerDeviceEmbodiedCO2e,
      },
    },
  };
}

const MIB = 1024 * 1024;
const definitions = [
  { name: "0 octet", bytes: 0, country: "FR" },
  { name: "1 octet, monde", bytes: 1, country: null },
  { name: "200 Ko, France", bytes: 200_000, country: "FR" },
  { name: "2 Mio, monde (exemple méthodologie §4)", bytes: 2 * MIB, country: null },
  { name: "2 Mio, France (exemple méthodologie §4)", bytes: 2 * MIB, country: "FR" },
  { name: "2 Mio, Allemagne", bytes: 2 * MIB, country: "DE" },
  { name: "2 Mio, Pologne", bytes: 2 * MIB, country: "PL" },
  { name: "2 Mio, États-Unis", bytes: 2 * MIB, country: "US" },
  { name: "2 Mio, Royaume-Uni", bytes: 2 * MIB, country: "GB" },
  { name: "10 Mo, France", bytes: 10_000_000, country: "FR" },
  { name: "1 Go, monde", bytes: 1e9, country: null },
  { name: "5 Mo, code pays en minuscules", bytes: 5_000_000, country: "fr", referenceCountry: "FR" },
  // CO2.js renvoie NaN pour un pays invalide : notre module retombe sur la moyenne mondiale,
  // la référence est donc calculée sans pays.
  { name: "5 Mo, pays inconnu → moyenne mondiale", bytes: 5_000_000, country: "XX", referenceCountry: null },
];

const cases = definitions.map(({ name, bytes, country, referenceCountry }) => {
  const ref = reference(bytes, referenceCountry === undefined ? country : referenceCountry);
  return { name, bytes, country, expected: ref };
});

const ratingProbes = [0, 0.02, 0.04, 0.0400001, 0.079, 0.0790001, 0.145, 0.1450001, 0.209, 0.2090001,
  0.278, 0.2780001, 0.359, 0.3590001, 1, 100];
const ratingCases = ratingProbes.map((gco2e) => ({ gco2e, expected: swd.model.ratingScale(gco2e) }));

const output = {
  description:
    "Vecteurs de référence du modèle GreenScore v3 (SWDM v4), générés avec CO2.js. Ne pas modifier à la main : npm run generate:vectors.",
  model_version: MODEL_VERSION,
  generated_with: `@tgwf/co2@${co2jsVersion}`,
  tolerance_gco2e: 1e-9,
  conventions: {
    bytes: "octets transférés, Go décimal (1e9)",
    country: "ISO 3166-1 alpha-2 ; null = moyenne mondiale (494 gCO2e/kWh)",
    grid: "fonctionnement réseau + terminal au pays ; data center et fabrication à 494 gCO2e/kWh",
  },
  cases,
  rating_cases: ratingCases,
};

writeFileSync(new URL("../test-vectors.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");
console.log(`${cases.length} cas de calcul et ${ratingCases.length} cas de notation écrits.`);
