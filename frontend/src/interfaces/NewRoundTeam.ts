import type { Team } from "./Team";

export interface NewRoundTeam extends Team {
    distance: number,
    score: number,
};