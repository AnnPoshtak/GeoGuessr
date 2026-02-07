import type { StreetViewLocationFromApi } from "./StreetViewLocationFromApi";

export interface GameRoom {
    round: number,
    location: StreetViewLocationFromApi,
    player_ids: number[],
}