import type { MapLocation } from "./MapLocation";

export interface GuessSubmitApiResponse {
    guess: MapLocation;
    target: MapLocation;
    distance: number;
    score: number;
};