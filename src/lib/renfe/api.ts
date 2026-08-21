import type { RenfeStopUpdate } from "./types";
import { PROXY_BASE } from "../shared/proxyBase";

/** Talks to the standalone worker proxy (see worker/) - gtfsrt.renfe.com has no CORS. */
export async function getBilbaoArrivals(): Promise<RenfeStopUpdate[]> {
  const res = await fetch(`${PROXY_BASE}/renfe/arrivals`);
  if (!res.ok) throw new Error(`Renfe arrivals proxy failed: ${res.status}`);
  return res.json();
}

export function filterByStop(updates: RenfeStopUpdate[], stopCode: string): RenfeStopUpdate[] {
  return updates.filter((u) => u.stopId === stopCode);
}
