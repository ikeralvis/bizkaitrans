// Pulls Renfe's official small station list for the Bilbao Cercanías núcleo (60).
// Small enough (~45 stations) to bundle directly, unlike Bizkaibus/Bilbobus.
//
// Usage: node scripts/fetch-renfe-stations.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCsv } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "src", "data", "renfe", "stations.json");
const SOURCE_URL =
  "https://data.renfe.com/dataset/0356d125-ddd2-4db2-9f10-3083c91f3e2a/resource/3254a1ed-a2b7-4fd1-9e9e-23eefe35f162/download/listado-estaciones-cercanias-bilbao.csv";

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Renfe stations download failed: ${res.status}`);
  const text = await res.text();

  const rows = parseCsv(text.trim(), ";");
  const stations = rows
    .filter((r) => r["CÓDIGO"] && r.LATITUD && r.LONGITUD)
    .map((r) => ({
      code: r["CÓDIGO"].trim(),
      name: r.DESCRIPCION.trim(),
      municipality: r.POBLACION.trim(),
      lat: Number(r.LATITUD),
      lon: Number(r.LONGITUD),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Writing ${stations.length} stations to ${OUT_PATH}`);
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(stations));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
