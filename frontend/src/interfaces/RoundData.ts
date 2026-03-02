import type { MapLocation } from "./MapLocation";
import type { NewRoundTeam } from "./NewRoundTeam";

export interface RoundData {
    teams: NewRoundTeam[],
    target: MapLocation;
};