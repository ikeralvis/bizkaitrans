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
}
