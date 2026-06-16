import type { StreetViewLocationFromApi } from "./StreetViewLocationFromApi";
import type { Team } from "./Team";

export interface GameRoom {
    round: number,
    multiplier: number,
    location: StreetViewLocationFromApi,
    teams: Team[],
}