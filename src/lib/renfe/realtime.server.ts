// Server-only: gtfsrt.renfe.com sends no CORS headers, so this runs behind
// src/pages/api/renfe/arrivals.ts instead of being fetched from the browser -
// same pattern as src/lib/bilbobus/realtime.server.ts, and meant to move to the
// same Cloudflare Worker at deploy time.
//
// Unlike Bilbobus, Renfe's feed already gives per-stop arrival predictions
// (trip_updates.json), not just raw vehicle GPS - it's plain JSON too, no
// protobuf decoding needed.
import type { RenfeStopUpdate } from "./types";
import stations from "../../data/renfe/stations.json";

const TRIP_UPDATES_URL = "https://gtfsrt.renfe.com/trip_updates.json";

interface RenfeTripUpdateEntity {
  tripUpdate?: {
    trip?: { tripId?: string };
    stopTimeUpdate?: {
      stopId?: string;
      arrival?: { time?: string; delay?: number };
      departure?: { time?: string; delay?: number };
    }[];
  };
}

interface RenfeFeedMessage {
  entity: RenfeTripUpdateEntity[];
}

/** Cercanías line codes are the trailing segment of the trip id, e.g. "6030J26188C1" -> "C1". */
function extractLineId(tripId: string): string {
  const match = tripId.match(/C\d+A?$/);
  return match?.[0] ?? "?";
}

export async function fetchRenfeBilbaoArrivals(): Promise<RenfeStopUpdate[]> {
  const res = await fetch(TRIP_UPDATES_URL);
  if (!res.ok) throw new Error(`Renfe trip_updates fetch failed: ${res.status}`);
  const feed: RenfeFeedMessage = await res.json();

  const bilbaoStopIds = new Set(stations.map((s) => s.code));
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
