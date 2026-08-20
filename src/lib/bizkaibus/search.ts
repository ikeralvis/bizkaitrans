import type { BizkaibusStop } from "./types";

let stopsPromise: Promise<BizkaibusStop[]> | null = null;

/**
 * Lazily loads the ~2.3k-stop dataset as its own chunk, so it's only
 * downloaded once the Bizkaibus block actually mounts/is used.
 */
function loadStops(): Promise<BizkaibusStop[]> {
  if (!stopsPromise) {
    stopsPromise = import("../../data/bizkaibus/stops.json").then((mod) => mod.default as BizkaibusStop[]);
  }
  return stopsPromise;
}

export async function searchBizkaibusStops(query: string, limit = 8): Promise<BizkaibusStop[]> {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const stops = await loadStops();
  const results: BizkaibusStop[] = [];
  for (const stop of stops) {
    if (stop.name.toLowerCase().includes(q)) {
      results.push(stop);
      if (results.length >= limit) break;
    }
  }
  return results;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getNearbyBizkaibusStops(
  lat: number,
  lon: number,
  radiusMeters = 500,
  limit = 10
): Promise<(BizkaibusStop & { distanceMeters: number })[]> {
  const stops = await loadStops();
  return stops
    .map((stop) => ({ ...stop, distanceMeters: haversineMeters(lat, lon, stop.lat, stop.lon) }))
    .filter((stop) => stop.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
