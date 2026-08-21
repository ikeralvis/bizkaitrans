/** One raw <PasoParada> arrival, already extracted from the wrapper XML. */
export interface BizkaibusRawArrival {
  linea: string;
  ruta: string;
  minutosE1: number | null;
  minutosE2: number | null;
}

export interface BizkaibusStopArrivals {
  stopName: string;
  arrivals: BizkaibusRawArrival[];
}

/** One entry of the local stops dataset built by scripts/fetch-bizkaibus-stops.mjs */
export interface BizkaibusStop {
  /** 4-digit code used by the real-time endpoint (CODIGOREDUCIDOPARADA) */
  code: string;
  name: string;
  municipality: string;
  lat: number;
  lon: number;
  /** Other line codes calling at this stop, derived by scripts/fetch-bizkaibus-lines.mjs */
  lines?: string[];
}

export interface BizkaibusLineSummary {
  code: string;
  routeNumber: string;
  name: string;
}

export interface BizkaibusLineStop {
  code: string;
  name: string;
}

export interface BizkaibusLineDetail {
  code: string;
  name: string;
  /** "I" (ida) | "V" (vuelta) -> ordered stops */
  directions: Record<string, BizkaibusLineStop[]>;
}
