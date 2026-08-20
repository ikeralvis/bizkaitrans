import type { ArrivalEstimate } from "../shared/types";
import type { MetroStation } from "./types";

/** Flattens a station's two platform boards into the shared ArrivalEstimate shape. */
export function toArrivalEstimates(station: MetroStation): ArrivalEstimate[] {
  return station.platforms.Platforms.flat().map((train) => ({
    operator: "metro" as const,
    lineId: train.line,
    headsign: train.Destination,
    minutesLeft: train.Minutes,
    scheduledTime: train.Time,
  }));
}
