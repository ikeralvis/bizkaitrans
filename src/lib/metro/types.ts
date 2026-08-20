import type { StopExit } from "../shared/types";

export interface MetroPlatformTrain {
  Destination: string;
  Direction: string | number;
  Length: number;
  Minutes: number;
  Time: string;
  line: string;
}

export interface MetroStation {
  id: number;
  name: string;
  code: string;
  line: string[];
  exits: StopExit[];
  platforms: {
    Station: string;
    StationId: string;
    Platforms: MetroPlatformTrain[][];
  };
  issues: unknown[];
  img: string;
}

export interface MetroTripTrain {
  wagons: number;
  estimated: number;
  direction: string;
  time: string;
  timeRounded: string;
}

export interface MetroTrip {
  trains: MetroTripTrain[];
  trip: {
    fromStation: { code: string; name: string };
    toStation: { code: string; name: string };
    duration: number;
    line: string;
    transfer: boolean;
  };
  exits: {
    origin: StopExit[];
    destiny: StopExit[];
  };
}
