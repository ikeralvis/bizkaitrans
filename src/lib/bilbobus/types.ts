export interface BilbobusRouteSummary {
  id: string; // route_short_name, e.g. "01"
  longName: string;
  color: string | null;
}

export interface BilbobusScheduleDate {
  /** YYYYMMDD */
  date: string;
  /** Short Spanish weekday label, e.g. "Jue" */
  weekday: string;
}

export interface BilbobusRouteStop {
  code: string;
  name: string;
  lat: number;
  lon: number;
  /** date (YYYYMMDD) -> sorted departure times (HH:MM:SS) */
  times: Record<string, string[]>;
}

export interface BilbobusRouteDetail {
  id: string;
  longName: string;
  dates: BilbobusScheduleDate[];
  /** direction_id ("0" | "1") -> ordered stop list for that direction */
  directions: Record<string, BilbobusRouteStop[]>;
}

/** Normalized live vehicle position, resolved from the GTFS-RT feed server-side. */
export interface BilbobusVehicle {
  vehicleId: string;
  routeShortName: string | null;
  tripId: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  speedKmh: number | null;
  timestamp: number | null;
}
