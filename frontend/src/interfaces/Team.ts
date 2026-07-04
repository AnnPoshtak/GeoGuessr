import type { Player } from "./Player";

export interface Team {
    name: string,
    players: Player[],
    health: number,
    score: number,
    distance: number,
}