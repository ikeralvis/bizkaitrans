import type { ArrivalEstimate } from "../shared/types";
import type { RenfeStopUpdate } from "./types";

/**
 * The feed gives no destination/headsign without also loading Renfe's national
 * (21MB) trips.txt to resolve trip -> route -> direction, so headsign is left
 * blank for v1 - the line badge is still shown.
 */
export function toArrivalEstimates(updates: RenfeStopUpdate[]): ArrivalEstimate[] {
  const nowMs = Date.now();
  return updates.map((u) => ({
    operator: "renfe" as const,
    lineId: u.lineId,
    headsign: u.delaySeconds > 60 ? `+${Math.round(u.delaySeconds / 60)} min retraso` : "",
    minutesLeft: Math.round((u.epochSeconds * 1000 - nowMs) / 60000),
  }));
}
