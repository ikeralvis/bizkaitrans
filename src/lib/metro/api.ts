import type { MetroFaresResponse, MetroIncidentsResponse, MetroStation, MetroTrip } from "./types";

const BASE = "https://api.metrobilbao.eus";

export type Lang = "es" | "eu" | "en";

/** Station info + real-time boards for both platforms. */
export async function getStation(stationCode: string, lang: Lang = "es"): Promise<MetroStation> {
  const res = await fetch(`${BASE}/api/stations/${stationCode}?lang=${lang}`);
  if (!res.ok) throw new Error(`Metro getStation(${stationCode}) failed: ${res.status}`);
  return res.json();
}

/** Real-time trains for a specific origin->destination trip. */
export async function getRealTimeTrip(origin: string, destination: string): Promise<MetroTrip> {
  const res = await fetch(`${BASE}/metro/real-time/${origin}/${destination}`);
  if (!res.ok) throw new Error(`Metro getRealTimeTrip(${origin},${destination}) failed: ${res.status}`);
  return res.json();
}

export async function getIncidents(lang: Lang = "es"): Promise<MetroIncidentsResponse> {
  const path = lang === "eu" ? "eu/abisuak" : "es/avisos";
  const res = await fetch(`${BASE}/metro_page/${path}`);
  if (!res.ok) throw new Error(`Metro getIncidents failed: ${res.status}`);
  return res.json();
}

export async function getFares(lang: Lang = "es"): Promise<MetroFaresResponse> {
  const path = lang === "eu" ? "eu/tarifa-guztiak" : "es/todas-las-tarifas";
  const res = await fetch(`${BASE}/metro_page/${path}`);
  if (!res.ok) throw new Error(`Metro getFares failed: ${res.status}`);
  return res.json();
}

/** date must be DD-MM-YYYY, hourStart/hourEnd are 0-23 */
export async function getSchedule(
  origin: string,
  destination: string,
  date: string,
  hourStart: number,
  hourEnd: number,
  lang: Lang = "es"
): Promise<unknown> {
  const res = await fetch(
    `${BASE}/metro/obtain-schedule-of-trip/${origin}/${destination}/${hourStart}/${hourEnd}/${date}/${lang}`
  );
  if (!res.ok) throw new Error(`Metro getSchedule failed: ${res.status}`);
  return res.json();
}
