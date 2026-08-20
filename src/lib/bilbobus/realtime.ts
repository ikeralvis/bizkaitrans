import type { BilbobusVehicle } from "./types";

/** Talks to our own proxy (see realtime.server.ts) - never calls bilbao.eus directly from the browser. */
export async function getVehiclePositions(): Promise<BilbobusVehicle[]> {
  const res = await fetch("/api/bilbobus/vehicle-positions");
  if (!res.ok) throw new Error(`vehicle-positions proxy failed: ${res.status}`);
  return res.json();
}

export function filterByRoute(vehicles: BilbobusVehicle[], routeShortName: string): BilbobusVehicle[] {
  return vehicles.filter((v) => v.routeShortName === routeShortName);
}
