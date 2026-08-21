import type { BilbobusVehicle } from "./types";
import { PROXY_BASE } from "../shared/proxyBase";

/** Talks to the standalone worker proxy (see worker/) - never calls bilbao.eus directly from the browser. */
export async function getVehiclePositions(): Promise<BilbobusVehicle[]> {
  const res = await fetch(`${PROXY_BASE}/bilbobus/vehicle-positions`);
  if (!res.ok) throw new Error(`vehicle-positions proxy failed: ${res.status}`);
  return res.json();
}

export function filterByRoute(vehicles: BilbobusVehicle[], routeShortName: string): BilbobusVehicle[] {
  return vehicles.filter((v) => v.routeShortName === routeShortName);
}
