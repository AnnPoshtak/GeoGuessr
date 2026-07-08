import type { MapLocation } from "./MapLocation";
import type { StreetViewLocationFromApi } from "./StreetViewLocationFromApi";
import type { Team } from "./Team";

export interface GameRoom {
    id: string;
    round: number;
    multiplier: number;
    target: StreetViewLocationFromApi;
    teams: Team[];
    autosubmit_seconds: number;
    guess: MapLocation | null;
}