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

export interface MetroCo2Comparison {
  co2metro: string;
  co2Car: string;
  co2DistanceMetro: number;
  co2DistanceCar: number;
  diff: string;
  metroDistance: number;
  googleDistance: number;
}

export interface MetroTrip {
  trains: MetroTripTrain[];
  co2Metro?: MetroCo2Comparison;
  messages?: string[];
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

export interface MetroIncident {
  title: string;
  description: string;
  createdAt: string;
  station: { code: string; name: string } | null;
  exit?: string | null;
  line?: string[];
  type: string;
}

export interface MetroIncidentsResponse {
  configuration: {
    incidences: {
      service_issue: MetroIncident[];
      installation_issue: MetroIncident[];
      issue_special_service: MetroIncident[];
    };
  };
}

export interface MetroFareItem {
  code: string;
  name: string;
  subTitle: string;
  personal: string;
  terms: string;
}

export interface MetroFaresResponse {
  configuration: {
    slider: MetroFareItem[];
  };
}
