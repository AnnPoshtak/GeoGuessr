import type { MapLocation } from "./MapLocation";

export interface GuessSubmitInfoFromApi {
    guess: MapLocation;
    target: MapLocation;
    distance: number;
    score: number;
};