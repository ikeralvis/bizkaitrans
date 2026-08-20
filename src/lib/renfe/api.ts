import type { RenfeStopUpdate } from "./types";

/** Talks to our own proxy (see realtime.server.ts) - gtfsrt.renfe.com has no CORS. */
export async function getBilbaoArrivals(): Promise<RenfeStopUpdate[]> {
  const res = await fetch("/api/renfe/arrivals");
  if (!res.ok) throw new Error(`Renfe arrivals proxy failed: ${res.status}`);
  return res.json();
}

export function filterByStop(updates: RenfeStopUpdate[], stopCode: string): RenfeStopUpdate[] {
  return updates.filter((u) => u.stopId === stopCode);
}
