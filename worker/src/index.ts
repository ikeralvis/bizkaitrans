// Standalone Cloudflare Worker: proxies the two upstream transit feeds that
// send no CORS headers, so the (fully static) main site can't fetch them
// directly from the browser. Ported from the main app's
// src/lib/{bilbobus,renfe}/realtime.server.ts, which ran as Astro API routes
// before the site moved to plain static output for Cloudflare Pages.
import gtfsRealtimeBindings from "gtfs-realtime-bindings";
import routeIdToShortName from "./routeIdToShortName.json";
import renfeStopCodes from "./renfeStopCodes.json";

interface BilbobusVehicle {
  vehicleId: string;
  routeShortName: string | null;
  tripId: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  speedKmh: number | null;
  timestamp: number | null;
}

interface RenfeStopUpdate {
  stopId: string;
  lineId: string;
  epochSeconds: number;
  delaySeconds: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS },
  });
}

async function fetchBilbobusVehiclePositions(): Promise<BilbobusVehicle[]> {
  const res = await fetch("https://www.bilbao.eus/opendata/datos/bilbobus-gtfs-rt");
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

/** Cercanías line codes are the trailing segment of the trip id, e.g. "6030J26188C1" -> "C1". */
function extractLineId(tripId: string): string {
  const match = tripId.match(/C\d+A?$/);
  return match?.[0] ?? "?";
}

async function fetchRenfeBilbaoArrivals(): Promise<RenfeStopUpdate[]> {
  const res = await fetch("https://gtfsrt.renfe.com/trip_updates.json");
  if (!res.ok) throw new Error(`Renfe trip_updates fetch failed: ${res.status}`);
  const feed = (await res.json()) as {
    entity: {
      tripUpdate?: {
        trip?: { tripId?: string };
        stopTimeUpdate?: {
          stopId?: string;
          arrival?: { time?: string; delay?: number };
          departure?: { time?: string; delay?: number };
        }[];
      };
    }[];
  };

  const bilbaoStopIds = new Set(renfeStopCodes as string[]);
  const updates: RenfeStopUpdate[] = [];

  for (const entity of feed.entity) {
    const tripId = entity.tripUpdate?.trip?.tripId;
    if (!tripId) continue;
    const lineId = extractLineId(tripId);

    for (const stu of entity.tripUpdate?.stopTimeUpdate ?? []) {
      if (!stu.stopId || !bilbaoStopIds.has(stu.stopId)) continue;
      const prediction = stu.arrival ?? stu.departure;
      if (!prediction?.time) continue;
      updates.push({
        stopId: stu.stopId,
        lineId,
        epochSeconds: Number(prediction.time),
        delaySeconds: prediction.delay ?? 0,
      });
    }
  }
  return updates;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/bilbobus/vehicle-positions") {
        return json(await fetchBilbobusVehiclePositions());
      }
      if (pathname === "/renfe/arrivals") {
        return json(await fetchRenfeBilbaoArrivals());
      }
      return json({ error: "Not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return json({ error: message }, 502);
    }
  },
};
