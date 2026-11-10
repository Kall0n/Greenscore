// Version installée de CO2.js (son package.json n'est pas exporté, on le lit directement).
import { readFileSync } from "node:fs";

export const co2jsVersion = JSON.parse(
  readFileSync(new URL("../node_modules/@tgwf/co2/package.json", import.meta.url), "utf8"),
).version;
