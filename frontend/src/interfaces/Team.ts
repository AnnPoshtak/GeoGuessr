import type { Player, User } from "./Player";

export interface Team {
    players: User[],
    health: number,
    score: number,
    distance: number,
}