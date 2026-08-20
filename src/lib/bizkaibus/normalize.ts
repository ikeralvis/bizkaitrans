import type { ArrivalEstimate } from "../shared/types";
import type { BizkaibusRawArrival, BizkaibusStopArrivals } from "./types";

function textOf(parent: Element, tag: string): string {
  return parent.querySelector(tag)?.textContent?.trim() ?? "";
}

function minutesOf(parent: Element, tag: string): number | null {
  const raw = textOf(parent, tag);
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/** Parses the <GetPasoParadaResult> XML embedded in the wrapper response. */
export function parsePasoParadaXml(xml: string): BizkaibusStopArrivals {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const stopName = doc.querySelector("DenominacionParada")?.textContent?.trim() ?? "";

  const arrivals: BizkaibusRawArrival[] = Array.from(doc.querySelectorAll("PasoParada")).map((node) => ({
    linea: textOf(node, "linea"),
    ruta: textOf(node, "ruta"),
    minutosE1: minutesOf(node, "e1 minutos"),
    minutosE2: minutesOf(node, "e2 minutos"),
  }));

  return { stopName, arrivals };
}

/** One PasoParada can carry two upcoming passes (e1, e2); each becomes its own estimate. */
export function toArrivalEstimates(stop: BizkaibusStopArrivals): ArrivalEstimate[] {
  const estimates: ArrivalEstimate[] = [];
  for (const a of stop.arrivals) {
    if (a.minutosE1 !== null) {
      estimates.push({ operator: "bizkaibus", lineId: a.linea, headsign: a.ruta, minutesLeft: a.minutosE1 });
    }
    if (a.minutosE2 !== null) {
      estimates.push({ operator: "bizkaibus", lineId: a.linea, headsign: a.ruta, minutesLeft: a.minutosE2 });
    }
  }
  return estimates;
}
