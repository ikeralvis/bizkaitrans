import type { ArrivalEstimate } from "../shared/types";
import type { MetroStation } from "./types";

function toEstimate(train: MetroStation["platforms"]["Platforms"][number][number]): ArrivalEstimate {
  return {
    operator: "metro",
    lineId: train.line,
    headsign: train.Destination,
    minutesLeft: train.Minutes,
    scheduledTime: train.Time,
  };
}

/** Flattens a station's two platform boards into the shared ArrivalEstimate shape. */
export function toArrivalEstimates(station: MetroStation): ArrivalEstimate[] {
  return station.platforms.Platforms.flat().map(toEstimate);
}

/** Keeps each platform's board separate - each platform generally serves one direction. */
export function toPlatformGroups(station: MetroStation): ArrivalEstimate[][] {
  return station.platforms.Platforms.map((platform) => platform.map(toEstimate));
}
