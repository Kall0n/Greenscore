// Constantes du modèle GreenScore v3 — voir docs/methodologie-calcul.md (§3.3 à §3.5).
// Toute modification d'une constante impose une nouvelle MODEL_VERSION (§6) et la
// régénération des vecteurs de test (npm run generate:vectors).

/** Identifiant de la version du modèle, stocké avec chaque mesure. */
export const MODEL_VERSION = "swdm4-ember-v1";

/** Le SWDM raisonne en gigaoctets décimaux. */
export const BYTES_PER_GB = 1e9;

/**
 * Intensités énergétiques du Sustainable Web Design Model v4 (kWh par Go transféré).
 * Source : sustainablewebdesign.org/estimating-digital-emissions (v4).
 */
export const SWDM_V4 = Object.freeze({
  operational: Object.freeze({ dataCenter: 0.055, network: 0.059, device: 0.08 }),
  embodied: Object.freeze({ dataCenter: 0.012, network: 0.013, device: 0.081 }),
});

/** Intensité carbone mondiale retenue par le SWDM v4 (gCO2e/kWh, Ember). */
export const GLOBAL_GRID_INTENSITY = 494;

/**
 * Échelle officielle « Digital Carbon Ratings » du SWDM v4 : borne haute incluse,
 * en gCO2e par page vue. Au-delà de la dernière borne : F.
 * Source : sustainablewebdesign.org/digital-carbon-ratings
 */
export const RATING_THRESHOLDS = Object.freeze([
  Object.freeze({ rating: "A+", max: 0.04 }),
  Object.freeze({ rating: "A", max: 0.079 }),
  Object.freeze({ rating: "B", max: 0.145 }),
  Object.freeze({ rating: "C", max: 0.209 }),
  Object.freeze({ rating: "D", max: 0.278 }),
  Object.freeze({ rating: "E", max: 0.359 }),
]);
