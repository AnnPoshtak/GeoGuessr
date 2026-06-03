import type { Player } from "./Player";

export interface Team {
    players: Player[],
    health: number,
    score: number,
    distance: number,
}