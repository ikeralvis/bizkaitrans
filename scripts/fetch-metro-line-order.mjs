import fs from "node:fs";
import path from "node:path";

// Metro Bilbao's own network-status endpoint returns each line's stations
// already tagged with a global "weight" - that's the real physical stop
// order (branches included), unlike our stations.json which is alphabetical.
// L3 is excluded: its stations use placeholder codes (ZZA..ZZG) that 404 on
// the station-detail endpoint, meaning the line isn't actually live yet.
const LINES = [
  { line: "L1", slug: "l1", num: 1 },
  { line: "L2", slug: "l2", num: 2 },
];

const result = {};

for (const { line, slug, num } of LINES) {
  const url = `https://api.metrobilbao.eus/metro/line-with-issues/${slug}/${num}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`${line}: HTTP ${res.status}, skipping`);
    continue;
  }
  const data = await res.json();
  const stations = Object.values(data)
    .flatMap((segment) => segment.stations ?? [])
    .sort((a, b) => a.weight - b.weight)
    .map((s) => ({ code: s.code, name: s.name }));
  result[line] = stations;
  console.log(`${line}: ${stations.length} stations in real order`);
}

const outPath = path.join(process.cwd(), "src/data/metro/line-order.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Wrote ${outPath}`);
