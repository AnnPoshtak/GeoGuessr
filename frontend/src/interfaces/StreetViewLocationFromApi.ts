import type { MapLocation } from "./MapLocation";

export interface StreetViewLocationFromApi extends MapLocation {
    heading: number;
}