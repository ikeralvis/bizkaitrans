export interface RenfeStation {
  code: string;
  name: string;
  municipality: string;
  lat: number;
  lon: number;
}

/** One stop-level arrival prediction, already filtered to Bilbao núcleo stations. */
export interface RenfeStopUpdate {
  stopId: string;
  lineId: string;
  /** Predicted arrival, unix seconds. */
  epochSeconds: number;
  delaySeconds: number;
}
