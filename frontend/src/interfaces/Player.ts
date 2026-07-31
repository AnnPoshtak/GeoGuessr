import type { MapLocation } from "./MapLocation";

export interface User {
    firebase_uid: string;
    username: string;
    stats: UserStats;
};

export interface UserStats {
    total_score: number;
    user_id: string;
}

export interface Player extends User {
    guess: MapLocation | null,
    is_connected: boolean;
};
