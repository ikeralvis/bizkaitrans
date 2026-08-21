// Builds per-line stop sequences for Bizkaibus, and derives which lines call at
// each stop ("correspondencias") by cross-referencing every line's itinerary -
// the API has no direct "lines at this stop" endpoint, so this is computed here
// once at build time instead of on every page load.
//
// ~106 lines x 2 directions = ~200 requests to apli.bizkaia.net; run with modest
// concurrency to keep it polite and finish in a reasonable time.
//
// Usage: node scripts/fetch-bizkaibus-lines.mjs

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseLooseJson } from "./lib/parseLooseJson.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "bizkaibus");
const STOPS_PATH = path.join(OUT_DIR, "stops.json");
const CONCURRENCY = 8;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return parseLooseJson(await res.text());
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  console.log("Fetching line list...");
  const linesRes = await fetchJson(
    "https://apli.bizkaia.net/apps/danok/tqws/tq.asmx/GetLineas_JSON?callback=&iTipoConsulta=1&sCodigoLinea=&sNumeroRuta=&sSentido=&sDescripcionLinea=&sListaCodigosLineas="
  );
  const rawLines = linesRes.Consulta.Lineas;
  console.log(`Got ${rawLines.length} lines`);

  await mkdir(path.join(OUT_DIR, "lines"), { recursive: true });

  const lineSummaries = [];
  const stopToLines = new Map(); // stopCode -> Set(lineCode)

  await mapWithConcurrency(rawLines, CONCURRENCY, async (line) => {
    const code = line.IR_CLINEA;
    const routeNumber = line.IR_NMRORU || "001";
    const name = line.LN_DENOMI;

    const directions = {};
    for (const sentido of ["I", "V"]) {
      try {
        const url = `https://apli.bizkaia.net/apps/danok/tqws/tq.asmx/GetItinerarioLinea_JSON?callback=&sCodigoLinea=${code}&sNumeroRuta=${routeNumber}&sSentido=${sentido}`;
        const res = await fetchJson(url);
        if (res.STATUS !== "OK" || !res.Consulta?.Paradas) continue;
        const stops = res.Consulta.Paradas.map((p) => ({ code: p.PR_CODRED, name: p.PR_DENOMI })).filter(
          (s) => s.code
        );
        if (stops.length > 0) directions[sentido] = stops;
        for (const s of stops) {
          let set = stopToLines.get(s.code);
          if (!set) {
            set = new Set();
            stopToLines.set(s.code, set);
          }
          set.add(code);
        }
      } catch (err) {
        console.warn(`  ${code} (${sentido}) failed: ${err.message}`);
      }
    }

    if (Object.keys(directions).length === 0) return;
    lineSummaries.push({ code, routeNumber, name });
    await writeFile(path.join(OUT_DIR, "lines", `${code}.json`), JSON.stringify({ code, name, directions }));
  });

  // A line code can have more than one "ruta" (e.g. a main + a secondary route
  // variant); each was fetched and written to its own file, but the summary
  // list must have one entry per code or Svelte's keyed #each blows up.
  const dedupedSummaries = [...new Map(lineSummaries.map((l) => [l.code, l])).values()];
  dedupedSummaries.sort((a, b) => a.code.localeCompare(b.code));
  await writeFile(path.join(OUT_DIR, "lines.json"), JSON.stringify(dedupedSummaries));
  console.log(`Wrote ${dedupedSummaries.length} line summaries (${lineSummaries.length} route variants fetched)`);

  // Enrich the existing stops.json with a `lines` field.
  const stopsRaw = await readFile(STOPS_PATH, "utf8");
  const stops = JSON.parse(stopsRaw);
  const enriched = stops.map((s) => ({ ...s, lines: [...(stopToLines.get(s.code) ?? [])].sort() }));
  await writeFile(STOPS_PATH, JSON.stringify(enriched));
  console.log(`Enriched ${enriched.length} stops with line correspondences`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
