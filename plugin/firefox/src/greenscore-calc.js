// Fichier généré par calc/scripts/build-plugin.mjs — ne pas modifier à la main.
// Module de calcul GreenScore (SWDM v4, intensité annuelle par pays) pour le plugin.
// Méthode : docs/methodologie-calcul.md · Intensités : Ember (CC BY-SA 4.0), via CO2.js.
(function (root) {
"use strict";

// ---- calc/src/constants.js
// Constantes du modèle GreenScore v3 — voir docs/methodologie-calcul.md (§3.3 à §3.5).
// Toute modification d'une constante impose une nouvelle MODEL_VERSION (§6) et la
// régénération des vecteurs de test (npm run generate:vectors).

/** Identifiant de la version du modèle, stocké avec chaque mesure. */
const MODEL_VERSION = "swdm4-ember-v1";

/** Le SWDM raisonne en gigaoctets décimaux. */
const BYTES_PER_GB = 1e9;

/**
 * Intensités énergétiques du Sustainable Web Design Model v4 (kWh par Go transféré).
 * Source : sustainablewebdesign.org/estimating-digital-emissions (v4).
 */
const SWDM_V4 = Object.freeze({
  operational: Object.freeze({ dataCenter: 0.055, network: 0.059, device: 0.08 }),
  embodied: Object.freeze({ dataCenter: 0.012, network: 0.013, device: 0.081 }),
});

/** Intensité carbone mondiale retenue par le SWDM v4 (gCO2e/kWh, Ember). */
const GLOBAL_GRID_INTENSITY = 494;

/**
 * Échelle officielle « Digital Carbon Ratings » du SWDM v4 : borne haute incluse,
 * en gCO2e par page vue. Au-delà de la dernière borne : F.
 * Source : sustainablewebdesign.org/digital-carbon-ratings
 */
const RATING_THRESHOLDS = Object.freeze([
  Object.freeze({ rating: "A+", max: 0.04 }),
  Object.freeze({ rating: "A", max: 0.079 }),
  Object.freeze({ rating: "B", max: 0.145 }),
  Object.freeze({ rating: "C", max: 0.209 }),
  Object.freeze({ rating: "D", max: 0.278 }),
  Object.freeze({ rating: "E", max: 0.359 }),
]);

// ---- calc/src/grid-intensity.data.js
// Fichier généré par scripts/generate-grid-intensity.mjs — ne pas modifier à la main.
const gridIntensity = {
  "description": "Intensité carbone moyenne annuelle de l'électricité par pays (gCO2e/kWh), clé ISO 3166-1 alpha-2.",
  "unit": "gCO2e/kWh",
  "type": "average",
  "source": "Ember, via @tgwf/co2 (Green Web Foundation)",
  "sourcePackage": "@tgwf/co2@0.19.0",
  "referenceYear": null,
  "license": "CC BY-SA 4.0",
  "attribution": "Ember — Electricity Data Explorer, données republiées par la Green Web Foundation (CO2.js)",
  "regionalAggregatesSkipped": [
    "AFRICA",
    "ASEAN",
    "ASIA",
    "EU",
    "EUROPE",
    "G20",
    "G7",
    "LATIN AMERICA AND CARIBBEAN",
    "MIDDLE EAST",
    "NORTH AMERICA",
    "OCEANIA",
    "OECD",
    "WORLD",
    "XKX"
  ],
  "data": {
    "AE": 467.51,
    "AF": 123.71,
    "AG": 611.11,
    "AL": 24.42,
    "AM": 243.52,
    "AO": 167.22,
    "AR": 344.83,
    "AS": 647.06,
    "AT": 102.62,
    "AU": 553.76,
    "AW": 550,
    "AZ": 632.89,
    "BA": 638.05,
    "BB": 600,
    "BD": 694.63,
    "BE": 117.58,
    "BF": 554.91,
    "BG": 264.21,
    "BH": 902.41,
    "BI": 230.77,
    "BJ": 590,
    "BN": 892.67,
    "BO": 468.02,
    "BR": 106.06,
    "BS": 653.66,
    "BT": 24.19,
    "BW": 849.42,
    "BY": 323.63,
    "BZ": 155.56,
    "CA": 184.99,
    "CD": 27.04,
    "CF": 0,
    "CG": 713.73,
    "CH": 36.72,
    "CI": 393.53,
    "CK": 250,
    "CL": 265.52,
    "CM": 285.71,
    "CN": 557.5,
    "CO": 285.8,
    "CR": 63.01,
    "CU": 638.98,
    "CV": 480,
    "CY": 512.24,
    "CZ": 413.86,
    "DE": 342.06,
    "DJ": 450,
    "DK": 143.3,
    "DM": 600,
    "DO": 565.97,
    "DZ": 633.65,
    "EC": 209.7,
    "EE": 341.02,
    "EG": 574.5,
    "ER": 590.91,
    "ES": 146.15,
    "ET": 23.55,
    "FI": 72.25,
    "FJ": 278.26,
    "FK": 1000,
    "FO": 354.17,
    "FR": 44.18,
    "GA": 429.47,
    "GB": 215.79,
    "GD": 666.67,
    "GE": 143.06,
    "GF": 204.08,
    "GH": 452.86,
    "GL": 111.11,
    "GM": 666.67,
    "GN": 182.72,
    "GP": 493.9,
    "GQ": 605.1,
    "GR": 319.76,
    "GT": 272.66,
    "GU": 611.11,
    "GW": 625,
    "GY": 634.33,
    "HK": 681.99,
    "HN": 289.5,
    "HR": 174.48,
    "HT": 534.65,
    "HU": 182.82,
    "ID": 682.43,
    "IE": 279.79,
    "IL": 567.26,
    "IN": 708.96,
    "IQ": 689.4,
    "IR": 648.68,
    "IS": 28.33,
    "IT": 287.75,
    "JM": 561.25,
    "JO": 539.21,
    "JP": 483.73,
    "KE": 84.83,
    "KG": 152.65,
    "KH": 497.46,
    "KI": 500,
    "KM": 642.86,
    "KN": 636.36,
    "KP": 344.26,
    "KR": 415.65,
    "KW": 637.24,
    "KY": 642.86,
    "KZ": 801.79,
    "LA": 232.12,
    "LB": 369.47,
    "LC": 650,
    "LK": 509.78,
    "LR": 435.9,
    "LS": 20.83,
    "LT": 139.34,
    "LU": 134.62,
    "LV": 136.22,
    "LY": 830.53,
    "MA": 577.65,
    "MD": 629.56,
    "ME": 413.51,
    "MG": 477.27,
    "MK": 568.97,
    "ML": 394.5,
    "MM": 569.69,
    "MN": 784.01,
    "MO": 448.98,
    "MQ": 516.78,
    "MR": 481.71,
    "MS": 1000,
    "MT": 484.16,
    "MU": 633.03,
    "MV": 611.77,
    "MW": 54.65,
    "MX": 483.14,
    "MY": 604.43,
    "MZ": 127.81,
    "NA": 47.62,
    "NC": 585.76,
    "NE": 687.5,
    "NG": 507.85,
    "NI": 288.33,
    "NL": 252.7,
    "NO": 30.75,
    "NP": 23.36,
    "NR": 750,
    "NZ": 120.11,
    "OM": 545.33,
    "PA": 258.74,
    "PE": 263.27,
    "PF": 436.62,
    "PG": 513.74,
    "PH": 613.38,
    "PK": 398.61,
    "PL": 614.98,
    "PM": 600,
    "PR": 664.53,
    "PS": 460.78,
    "PT": 111.8,
    "PY": 24.86,
    "QA": 602.83,
    "RE": 525.22,
    "RO": 245.55,
    "RS": 670.8,
    "RU": 446.17,
    "RW": 301.89,
    "SA": 691.95,
    "SB": 636.36,
    "SC": 571.43,
    "SD": 214.33,
    "SE": 35.89,
    "SG": 498.74,
    "SI": 227.11,
    "SK": 96.49,
    "SL": 47.62,
    "SN": 535.4,
    "SO": 523.81,
    "SR": 383.18,
    "SS": 610.17,
    "ST": 555.56,
    "SV": 99.29,
    "SY": 682.27,
    "SZ": 142.86,
    "TC": 653.85,
    "TD": 615.39,
    "TG": 478.26,
    "TH": 555.43,
    "TJ": 98.7,
    "TM": 1306.3,
    "TN": 560.25,
    "TO": 571.43,
    "TR": 469.7,
    "TT": 682.11,
    "TW": 635.15,
    "TZ": 371.59,
    "UA": 250.47,
    "UG": 57.39,
    "US": 383.55,
    "UY": 96.7,
    "UZ": 1121.18,
    "VC": 600,
    "VE": 180.25,
    "VG": 647.06,
    "VI": 641.79,
    "VN": 486.13,
    "VU": 500,
    "WS": 400,
    "YE": 586.32,
    "ZA": 713.9,
    "ZM": 111,
    "ZW": 298.44
  }
};

// ---- calc/src/rating.js
/** @typedef {"A+" | "A" | "B" | "C" | "D" | "E" | "F"} Rating */

/**
 * Note SWDM v4 d'une empreinte par page vue (méthodologie §3.5).
 * Les bornes sont incluses : 0,040 g → A+, 0,0400001 g → A.
 *
 * @param {number} gco2ePerPageView empreinte en gCO2e par page vue (≥ 0)
 * @returns {Rating}
 */
function rate(gco2ePerPageView) {
  if (typeof gco2ePerPageView !== "number" || !Number.isFinite(gco2ePerPageView) || gco2ePerPageView < 0) {
    throw new RangeError(`Empreinte invalide : ${gco2ePerPageView} (nombre fini ≥ 0 attendu)`);
  }
  for (const { rating, max } of RATING_THRESHOLDS) {
    if (gco2ePerPageView <= max) return /** @type {Rating} */ (rating);
  }
  return "F";
}

// ---- calc/src/swdm.js
/** @typedef {import("./rating.js").Rating} Rating */

/**
 * @typedef {object} Measure
 * @property {number} bytes   octets réellement transférés (entier ≥ 0, cache exclu)
 * @property {string | null | undefined} country  code pays ISO 3166-1 alpha-2 (ex. "FR") ;
 *   absent ou inconnu → moyenne mondiale
 */

/**
 * @typedef {object} Segments
 * @property {number} dataCenter gCO2e
 * @property {number} network    gCO2e
 * @property {number} device     gCO2e
 */

/**
 * @typedef {object} Estimate
 * @property {number} gco2e  empreinte totale en gCO2e
 * @property {{ operational: Segments, embodied: Segments }} breakdown
 * @property {Rating} rating note SWDM v4 de la mesure (pertinente pour une page vue)
 * @property {{ country: string | null, gco2ePerKwh: number }} gridIntensity
 *   intensité appliquée au fonctionnement réseau + terminal (country = null : moyenne mondiale)
 * @property {string} modelVersion
 */

/**
 * Intensité carbone (gCO2e/kWh) du pays, ou null si le pays est absent ou inconnu.
 *
 * @param {string | null | undefined} country code ISO 3166-1 alpha-2
 * @returns {number | null}
 */
function countryIntensity(country) {
  if (typeof country !== "string") return null;
  const value = gridIntensity.data[country.trim().toUpperCase()];
  return typeof value === "number" ? value : null;
}

/**
 * Estime l'empreinte d'un volume transféré avec le SWDM v4 (méthodologie §3.3 et §3.4).
 *
 * - Fonctionnement réseau + terminal : intensité du pays de l'utilisateur.
 * - Fonctionnement data center : moyenne mondiale (localisation du serveur inconnue).
 * - Fabrication (tous segments) : moyenne mondiale.
 *
 * Fonction pure : aucun appel réseau, aucune horloge, aucun état partagé.
 *
 * @param {Measure} measure
 * @returns {Estimate}
 */
function estimate({ bytes, country }) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError(`Volume invalide : ${bytes} (nombre fini ≥ 0 attendu)`);
  }

  const local = countryIntensity(country);
  const userIntensity = local ?? GLOBAL_GRID_INTENSITY;
  const gb = bytes / BYTES_PER_GB;

  const operational = {
    dataCenter: gb * SWDM_V4.operational.dataCenter * GLOBAL_GRID_INTENSITY,
    network: gb * SWDM_V4.operational.network * userIntensity,
    device: gb * SWDM_V4.operational.device * userIntensity,
  };
  const embodied = {
    dataCenter: gb * SWDM_V4.embodied.dataCenter * GLOBAL_GRID_INTENSITY,
    network: gb * SWDM_V4.embodied.network * GLOBAL_GRID_INTENSITY,
    device: gb * SWDM_V4.embodied.device * GLOBAL_GRID_INTENSITY,
  };

  // Même ordre d'addition que CO2.js (data center, réseau, terminal ; fonctionnement + fabrication)
  // pour obtenir des flottants identiques aux vecteurs de référence.
  const gco2e =
    operational.dataCenter + embodied.dataCenter +
    (operational.network + embodied.network) +
    (operational.device + embodied.device);

  return {
    gco2e,
    breakdown: { operational, embodied },
    rating: rate(gco2e),
    gridIntensity: { country: local === null ? null : country.trim().toUpperCase(), gco2ePerKwh: userIntensity },
    modelVersion: MODEL_VERSION,
  };
}

/**
 * Convertit des gCO2e en microgrammes entiers, l'unité de stockage (CDCT §5.2).
 *
 * @param {number} gco2e
 * @returns {number}
 */
function toMicrograms(gco2e) {
  if (typeof gco2e !== "number" || !Number.isFinite(gco2e) || gco2e < 0) {
    throw new RangeError(`Empreinte invalide : ${gco2e}`);
  }
  return Math.round(gco2e * 1e6);
}

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
