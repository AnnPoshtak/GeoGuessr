import type { Player, TeamPlayer } from "./Player";

export interface Team {
    players: TeamPlayer[],
    health: number,
    score: number,
    distance: number,
}

export interface ApiTeam {
    players: Player[],
    health: number,
    score: number,
    distance: number,
}