// Conformité au modèle de référence (CDCF O4, ENF-PRE-4) : nos résultats doivent être
// identiques à ceux de CO2.js sur calc/test-vectors.json, à 1e-9 g près.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { MODEL_VERSION, estimate, rate } from "../src/index.js";

const vectors = JSON.parse(readFileSync(new URL("../test-vectors.json", import.meta.url), "utf8"));
const TOLERANCE = vectors.tolerance_gco2e;

describe("vecteurs de référence CO2.js", () => {
  it("correspondent à la version du modèle", () => {
    assert.equal(vectors.model_version, MODEL_VERSION);
  });

  for (const c of vectors.cases) {
    it(c.name, () => {
      const result = estimate({ bytes: c.bytes, country: c.country });
      assert.ok(
        Math.abs(result.gco2e - c.expected.gco2e) <= TOLERANCE,
        `total ${result.gco2e} ≠ ${c.expected.gco2e}`,
      );
      assert.equal(result.rating, c.expected.rating);

      if (c.expected.segments) {
        for (const phase of ["operational", "embodied"]) {
          for (const segment of ["dataCenter", "network", "device"]) {
            const actual = result.breakdown[phase][segment];
            const expected = c.expected.segments[phase][segment];
            assert.ok(Math.abs(actual - expected) <= TOLERANCE, `${phase}.${segment} ${actual} ≠ ${expected}`);
          }
        }
      }
    });
  }
});

describe("notation de référence CO2.js", () => {
  for (const { gco2e, expected } of vectors.rating_cases) {
    it(`${gco2e} g → ${expected}`, () => {
      assert.equal(rate(gco2e), expected);
    });
  }
});
