import { BYTES_PER_GB, GLOBAL_GRID_INTENSITY, MODEL_VERSION, SWDM_V4 } from "./constants.js";
import gridIntensity from "./grid-intensity.data.js";
import { rate } from "./rating.js";

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
export function countryIntensity(country) {
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
export function estimate({ bytes, country }) {
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
export function toMicrograms(gco2e) {
  if (typeof gco2e !== "number" || !Number.isFinite(gco2e) || gco2e < 0) {
    throw new RangeError(`Empreinte invalide : ${gco2e}`);
  }
  return Math.round(gco2e * 1e6);
}
