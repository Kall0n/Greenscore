import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  GLOBAL_GRID_INTENSITY,
  MODEL_VERSION,
  countryIntensity,
  estimate,
  gridIntensity,
  rate,
  toMicrograms,
} from "../src/index.js";

const MIB = 1024 * 1024;

describe("estimate", () => {
  it("donne 0 g et A+ pour 0 octet", () => {
    const r = estimate({ bytes: 0, country: "FR" });
    assert.equal(r.gco2e, 0);
    assert.equal(r.rating, "A+");
  });

  it("reproduit l'exemple de la méthodologie §4 (2 Mio, moyenne mondiale ≈ 0,3108 g, note E)", () => {
    const r = estimate({ bytes: 2 * MIB, country: null });
    assert.ok(Math.abs(r.gco2e - 0.002097152 * 0.3 * 494) < 1e-12);
    assert.equal(r.rating, "E");
  });

  it("est proportionnelle au volume (CDCF O5 : poids ÷ 10 → empreinte ÷ 10)", () => {
    const before = estimate({ bytes: 2 * MIB, country: "FR" }).gco2e;
    const after = estimate({ bytes: (2 * MIB) / 10, country: "FR" }).gco2e;
    assert.ok(Math.abs(after / before - 0.1) < 1e-12);
  });

  it("applique le pays au seul fonctionnement réseau + terminal", () => {
    const fr = estimate({ bytes: 1e9, country: "FR" });
    const world = estimate({ bytes: 1e9, country: null });
    assert.equal(fr.breakdown.operational.dataCenter, world.breakdown.operational.dataCenter);
    assert.deepEqual(fr.breakdown.embodied, world.breakdown.embodied);
    assert.ok(Math.abs(fr.breakdown.operational.network - 0.059 * countryIntensity("FR")) < 1e-12);
    assert.ok(Math.abs(fr.breakdown.operational.device - 0.08 * countryIntensity("FR")) < 1e-12);
  });

  it("retombe sur la moyenne mondiale pour un pays absent ou inconnu", () => {
    for (const country of [null, undefined, "", "XX", "WORLD", 42]) {
      const r = estimate({ bytes: 1e9, country: /** @type {any} */ (country) });
      assert.equal(r.gridIntensity.country, null);
      assert.equal(r.gridIntensity.gco2ePerKwh, GLOBAL_GRID_INTENSITY);
      assert.ok(Math.abs(r.gco2e - 0.3 * 494) < 1e-9);
    }
  });

  it("normalise le code pays (casse, espaces)", () => {
    const a = estimate({ bytes: 5e6, country: " fr " });
    const b = estimate({ bytes: 5e6, country: "FR" });
    assert.equal(a.gco2e, b.gco2e);
    assert.equal(a.gridIntensity.country, "FR");
  });

  it("est déterministe et ne modifie pas son entrée (fonction pure)", () => {
    const input = Object.freeze({ bytes: 123456, country: "DE" });
    const first = estimate(input);
    const second = estimate(input);
    assert.deepEqual(first, second);
  });

  it("indique la version du modèle", () => {
    assert.equal(estimate({ bytes: 1, country: "FR" }).modelVersion, MODEL_VERSION);
  });

  it("refuse les volumes invalides", () => {
    for (const bytes of [-1, Number.NaN, Number.POSITIVE_INFINITY, "100", null, undefined]) {
      assert.throws(() => estimate({ bytes: /** @type {any} */ (bytes), country: "FR" }), RangeError);
    }
  });
});

describe("rate", () => {
  it("inclut les bornes de l'échelle SWDM v4", () => {
    assert.equal(rate(0.04), "A+");
    assert.equal(rate(0.079), "A");
    assert.equal(rate(0.145), "B");
    assert.equal(rate(0.209), "C");
    assert.equal(rate(0.278), "D");
    assert.equal(rate(0.359), "E");
    assert.equal(rate(0.36), "F");
  });

  it("refuse les empreintes invalides", () => {
    for (const v of [-0.001, Number.NaN, Number.POSITIVE_INFINITY, "0.1"]) {
      assert.throws(() => rate(/** @type {any} */ (v)), RangeError);
    }
  });
});

describe("toMicrograms", () => {
  it("convertit en microgrammes entiers (une page sobre ne vaut plus 0, constat A-10)", () => {
    assert.equal(toMicrograms(0.0042), 4200);
    assert.equal(toMicrograms(0), 0);
    assert.ok(Number.isInteger(toMicrograms(0.31079808)));
  });
});

describe("données d'intensité", () => {
  it("utilisent des codes alpha-2 et des valeurs finies ≥ 0", () => {
    for (const [code, value] of Object.entries(gridIntensity.data)) {
      assert.match(code, /^[A-Z]{2}$/);
      assert.ok(Number.isFinite(value) && value >= 0, `${code} = ${value}`);
    }
  });

  it("sont identiques dans grid-intensity.json et dans le module JS généré", () => {
    const json = JSON.parse(readFileSync(new URL("../grid-intensity.json", import.meta.url), "utf8"));
    assert.deepEqual(json, gridIntensity);
  });

  it("portent la source et la licence (attribution obligatoire)", () => {
    assert.equal(gridIntensity.license, "CC BY-SA 4.0");
    assert.match(gridIntensity.source, /Ember/);
  });
});
