import type { MapLocation } from "./MapLocation";

export interface RoundData {
    player_data: Record<number, {
        guess: MapLocation,
        health: number,
    }>;
    target: MapLocation;
};