import type { MapLocation } from "./MapLocation";
import type { Team } from "./Team";

export interface RoundData {
    teams: Team[],
    target: MapLocation;
};