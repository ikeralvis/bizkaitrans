// Server-only: parses the Bilbobus GTFS-RT protobuf feed. bilbao.eus doesn't send
// CORS headers on this endpoint, so it can't be fetched from the browser directly -
// this runs behind src/pages/api/bilbobus/vehicle-positions.ts today, and is meant
// to be lifted into a Cloudflare Worker verbatim once this ships (see
// astro.config.mjs notes / DOCUMENTATION.md architecture decision).
import gtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { BilbobusVehicle } from "./types";
import routeIdToShortName from "../../data/bilbobus/routeIdToShortName.json";

const FEED_URL = "https://www.bilbao.eus/opendata/datos/bilbobus-gtfs-rt";

export async function fetchBilbobusVehiclePositions(): Promise<BilbobusVehicle[]> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Bilbobus GTFS-RT fetch failed: ${res.status}`);
  const buffer = new Uint8Array(await res.arrayBuffer());
  if (buffer.length === 0) return [];

  const feed = gtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
  const routeMap = routeIdToShortName as Record<string, string>;

  const vehicles: BilbobusVehicle[] = [];
  for (const entity of feed.entity) {
    const v = entity.vehicle;
    if (!v?.position) continue;
    vehicles.push({
      vehicleId: v.vehicle?.id ?? entity.id,
      routeShortName: v.trip?.routeId ? (routeMap[v.trip.routeId] ?? v.trip.routeId) : null,
      tripId: v.trip?.tripId ?? null,
      lat: v.position.latitude,
      lon: v.position.longitude,
      bearing: v.position.bearing ?? null,
      speedKmh: v.position.speed != null ? v.position.speed * 3.6 : null,
      timestamp: v.timestamp != null ? Number(v.timestamp) : null,
    });
  }
  return vehicles;
}
