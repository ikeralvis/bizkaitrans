// Pulls the full Bizkaibus stop list and slims it down to what the app needs
// for search + real-time lookups. Run manually with `npm run data:bizkaibus`,
// meant to later run nightly from a GitHub Action.
//
// Usage: node scripts/fetch-bizkaibus-stops.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseLooseJson } from "./lib/parseLooseJson.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "src", "data", "bizkaibus", "stops.json");
const SOURCE_URL = "https://apli.bizkaia.net/apps/danok/tqws/tq.asmx/GetParadas_JSON?callback=";

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`GetParadas_JSON failed: ${res.status}`);
  const text = await res.text();

  const data = parseLooseJson(text);
  if (data.STATUS !== "OK") throw new Error(`Unexpected STATUS: ${data.STATUS}`);

  const rawStops = data.Consulta.Paradas;
  console.log(`Got ${rawStops.length} raw stops`);

  const stops = rawStops
    .filter((s) => s.CODIGOREDUCIDOPARADA && s.LATITUD && s.LONGITUD)
    .map((s) => ({
      code: s.CODIGOREDUCIDOPARADA,
      name: s.DENOMINACION,
      municipality: s.DESCRIPCION_MUNICIPIO,
      lat: Number(s.LATITUD),
      lon: Number(s.LONGITUD),
    }));

  // Dedupe by reduced code: the source occasionally lists the same physical
  // stop twice (e.g. both directions sharing a marker).
  const byCode = new Map(stops.map((s) => [s.code, s]));
  const deduped = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Writing ${deduped.length} stops to ${OUT_PATH}`);
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(deduped));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
