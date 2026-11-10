// Module de calcul partagé de GreenScore Web (plugin, outils, banc de test).
// Méthode : docs/methodologie-calcul.md — décision : docs/adr/0001-modele-de-calcul-swdm-v4.md
export {
  BYTES_PER_GB,
  GLOBAL_GRID_INTENSITY,
  MODEL_VERSION,
  RATING_THRESHOLDS,
  SWDM_V4,
} from "./constants.js";
export { rate } from "./rating.js";
export { countryIntensity, estimate, toMicrograms } from "./swdm.js";
export { default as gridIntensity } from "./grid-intensity.data.js";
