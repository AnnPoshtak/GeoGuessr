import type { MapLocation } from "./MapLocation";

export interface GuessSubmitInfoFromApi {
    guess: MapLocation;
    target_location: MapLocation;
    distance: number;
    score: number;
};