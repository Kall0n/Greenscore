// Le calcul embarqué dans les plugins (greenscore-calc.js, généré) doit donner exactement
// les mêmes résultats que le module calc/ : mêmes vecteurs CO2.js, mêmes notes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";
import { MODEL_VERSION } from "../src/index.js";

const vectors = JSON.parse(readFileSync(new URL("../test-vectors.json", import.meta.url), "utf8"));

const bundles = {
  chrome: new URL("../../plugin/chrome/greenscore-calc.js", import.meta.url),
  firefox: new URL("../../plugin/firefox/src/greenscore-calc.js", import.meta.url),
};

for (const [name, url] of Object.entries(bundles)) {
  describe(`greenscore-calc.js (${name})`, () => {
    const context = vm.createContext({});
    vm.runInContext(readFileSync(url, "utf8"), context);
    const calc = context.GreenScoreCalc;

    it("expose la même version de modèle", () => {
      assert.equal(calc.MODEL_VERSION, MODEL_VERSION);
    });

    it("reproduit les vecteurs CO2.js", () => {
      for (const c of vectors.cases) {
        const r = calc.estimate({ bytes: c.bytes, country: c.country });
        assert.ok(Math.abs(r.gco2e - c.expected.gco2e) <= vectors.tolerance_gco2e, `${c.name} : ${r.gco2e}`);
        assert.equal(r.rating, c.expected.rating, c.name);
      }
    });

    it("reproduit la notation", () => {
      for (const { gco2e, expected } of vectors.rating_cases) assert.equal(calc.rate(gco2e), expected);
    });
  });
}
