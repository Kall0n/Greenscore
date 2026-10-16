# @greenscore/calc — module de calcul

Implémentation du modèle GreenScore v3 : **Sustainable Web Design Model v4**, avec l'intensité carbone par pays (données Ember). La méthode complète est décrite dans [docs/methodologie-calcul.md](../docs/methodologie-calcul.md), et la décision dans [ADR-0001](../docs/adr/0001-modele-de-calcul-swdm-v4.md).

Le module est écrit en **JavaScript ESM avec types JSDoc**. Ce format est utilisable tel quel par le plugin (bundler) et par Node 20, qui n'exécute pas TypeScript nativement.

## Utilisation

```js
import { estimate, rate } from "@greenscore/calc";

const r = estimate({ bytes: 2_097_152, country: "FR" });
// r.gco2e ≈ 0.1797, r.rating === "C", r.breakdown.{operational,embodied}.{dataCenter,network,device}
rate(0.079); // "A" (bornes incluses)
```

- `estimate({ bytes, country })` est une **fonction pure**. `country` est un code ISO 3166-1 alpha-2. Un pays absent ou inconnu donne la moyenne mondiale (494 gCO2e/kWh).
- `toMicrograms(gco2e)` donne l'unité de stockage (entier), pour qu'une page sobre ne soit plus arrondie à 0.

## Fichiers générés (ne pas modifier à la main)

| Fichier | Script | Contenu |
|---|---|---|
| `grid-intensity.json`, `src/grid-intensity.data.js` | `npm run generate:intensity` | Intensités moyennes annuelles par pays, extraites de CO2.js (Ember, **CC BY-SA 4.0** : attribution obligatoire) |
| `test-vectors.json` | `npm run generate:vectors` | Sorties de référence calculées avec **CO2.js** (`model: "swd", version: 4`) |

La CI régénère ces fichiers et échoue s'ils diffèrent de ceux qui sont versionnés.

## Tests

```bash
npm ci && npm test
```

Les tests vérifient :
- l'écart avec les vecteurs CO2.js, tolérance 1e-9 g (écart mesuré : 0) ;
- les bornes de l'échelle A+–F ;
- la proportionnalité au volume ;
- le repli sur la moyenne mondiale ;
- le caractère pur de la fonction ;
- la cohérence des données d'intensité.

## Limites connues

- **Année des intensités inconnue :** CO2.js 0.19.0 ne publie pas l'année de référence de ses moyennes annuelles (`referenceYear: null`). À renseigner avant de publier le modèle `swdm4-ember-v1`.
- **Moyenne mondiale :** le SWDM v4 retient 494 gCO2e/kWh. Le jeu de données Ember de CO2.js indique 472,94 pour `WORLD`. Nous suivons le SWDM (494), comme CO2.js en v4.
- **Pays invalide dans CO2.js :** CO2.js renvoie `NaN` au lieu de la moyenne mondiale. Notre module gère ce cas lui-même ; le vecteur correspondant est calculé sans pays.
- **Kosovo** (`XKX`) et les agrégats régionaux n'ont pas de code alpha-2 ISO : ils sont ignorés.
- L'implémentation Rust du back-end (CDCT §5) n'existe pas encore. Elle devra passer les mêmes `test-vectors.json`.
