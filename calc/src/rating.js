import { RATING_THRESHOLDS } from "./constants.js";

/** @typedef {"A+" | "A" | "B" | "C" | "D" | "E" | "F"} Rating */

/**
 * Note SWDM v4 d'une empreinte par page vue (méthodologie §3.5).
 * Les bornes sont incluses : 0,040 g → A+, 0,0400001 g → A.
 *
 * @param {number} gco2ePerPageView empreinte en gCO2e par page vue (≥ 0)
 * @returns {Rating}
 */
export function rate(gco2ePerPageView) {
  if (typeof gco2ePerPageView !== "number" || !Number.isFinite(gco2ePerPageView) || gco2ePerPageView < 0) {
    throw new RangeError(`Empreinte invalide : ${gco2ePerPageView} (nombre fini ≥ 0 attendu)`);
  }
  for (const { rating, max } of RATING_THRESHOLDS) {
    if (gco2ePerPageView <= max) return /** @type {Rating} */ (rating);
  }
  return "F";
}
