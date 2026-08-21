import type { BizkaibusLineDetail, BizkaibusLineSummary } from "./types";

let lineListPromise: Promise<BizkaibusLineSummary[]> | null = null;

export function getLineList(): Promise<BizkaibusLineSummary[]> {
  if (!lineListPromise) {
    lineListPromise = import("../../data/bizkaibus/lines.json").then((mod) => mod.default as BizkaibusLineSummary[]);
  }
  return lineListPromise;
}

const lineDetailCache = new Map<string, Promise<BizkaibusLineDetail>>();

export function getLineDetail(code: string): Promise<BizkaibusLineDetail> {
  let cached = lineDetailCache.get(code);
  if (!cached) {
    cached = import(`../../data/bizkaibus/lines/${code}.json`).then((mod) => mod.default as BizkaibusLineDetail);
    lineDetailCache.set(code, cached);
  }
  return cached;
}
