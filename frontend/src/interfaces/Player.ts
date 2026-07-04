import type { MapLocation } from "./MapLocation";

export interface User {
    id: number;
    username: string;
}

export interface Player extends User {
    guess: MapLocation,
    is_connected: boolean;
}

