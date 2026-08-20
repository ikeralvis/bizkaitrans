export type Operator = "metro" | "bilbobus" | "bizkaibus" | "renfe";

/** Normalized shape every operator adapter must produce. */
export interface ArrivalEstimate {
  operator: Operator;
  lineId: string;
  headsign: string;
  minutesLeft: number;
  scheduledTime?: string;
}

export interface StopExit {
  id: number;
  name: string;
  address: string;
  elevator: boolean;
  nocturnal: boolean;
  wheelchairAccessible: boolean;
  latitude: string;
  longitude: string;
}

export interface StationIssue {
  title: string;
  description: string;
}
