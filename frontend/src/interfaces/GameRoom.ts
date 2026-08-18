import type { MapLocation } from "./MapLocation";
import type { StreetViewLocationFromApi } from "./StreetViewLocationFromApi";
import type { Team } from "./Team";

export interface GameRoom {
    id: string;
    round: number;
    multiplier: number;
    target: StreetViewLocationFromApi;
    teams: Team[];
    current_cooldown: number;
    cooldown_message: string | null;
    guess: MapLocation | null;
}