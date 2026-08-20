import type { BilbobusRouteDetail, BilbobusRouteSummary } from "./types";

let routeListPromise: Promise<BilbobusRouteSummary[]> | null = null;

export function getRouteList(): Promise<BilbobusRouteSummary[]> {
  if (!routeListPromise) {
    routeListPromise = import("../../data/bilbobus/routes.json").then((mod) => mod.default as BilbobusRouteSummary[]);
  }
  return routeListPromise;
}

const routeDetailCache = new Map<string, Promise<BilbobusRouteDetail>>();

/** Each route is its own lazily-imported chunk - only the opened route's schedule is downloaded. */
export function getRouteDetail(routeId: string): Promise<BilbobusRouteDetail> {
  let cached = routeDetailCache.get(routeId);
  if (!cached) {
    cached = import(`../../data/bilbobus/routes/${routeId}.json`).then((mod) => mod.default as BilbobusRouteDetail);
    routeDetailCache.set(routeId, cached);
  }
  return cached;
}
