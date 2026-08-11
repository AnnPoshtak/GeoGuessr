import React from "react";
import { Clock, User, AlertCircle, Swords } from "lucide-react";
import config from "@/config";
import type { Team } from "@/interfaces/Team";
import type { GameRoom } from "@/interfaces/GameRoom";

interface MultiplayerScorebarProps {
    teams: Team[];
    game: GameRoom | null;
    defeatTeamName: string | null;
    autosubmitSeconds: number;
    currentUserId?: string; 
}

export const MultiplayerScorebar: React.FC<MultiplayerScorebarProps> = ({
    teams,
    game,
    defeatTeamName,
    autosubmitSeconds,
    currentUserId,
}) => {
    const myTeam = teams.find((t) =>
        t.players?.some((p) => p.id === currentUserId)
    ) || teams[0];

    const opponentTeam = teams.find((t) => t.name !== myTeam?.name) || teams[1];

    const getHealthColorClass = (percent: number) => {
        if (percent > 60) return "bg-stat-correct";
        if (percent > 25) return "bg-stat-close";
        return "bg-stat-missed animate-pulse";
    };

    const renderTeamCard = (team: Team | undefined, isRight: boolean = false, isMyTeam: boolean = false) => {
        if (!team) return null;

        const maxHealth = config.startingPlayerHealth * (team.players?.length || 1);
        const currentHealth = Math.max(0, team.health ?? 0);
        const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
        const isDefeated = defeatTeamName === team.name;

        return (
            <div className={`flex flex-col gap-1.5 min-w-0 flex-1 ${isRight ? "items-end text-right" : "items-start text-left"}`}>
                <div className={`flex items-center gap-2 max-w-full ${isRight ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm font-black uppercase tracking-wider text-dark truncate">
                        {team.name}
                    </span>
                    {isMyTeam && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent text-white shadow-sm shrink-0">
                            You
                        </span>
                    )}
                </div>
                <div className={`flex items-center gap-2.5 w-full ${isRight ? "flex-row-reverse" : ""}`}>
                    <div className="text-xs font-mono font-black text-dark shrink-0 min-w-[60px]">
                        {currentHealth} <span className="text-[10px] font-normal text-muted">/ {maxHealth}</span>
                    </div>

                    <div className="h-2.5 flex-1 min-w-0 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-glass-border">
                        <div 
                            className={`h-full transition-all duration-500 ease-out rounded-full ${getHealthColorClass(healthPercent)}`} 
                            style={{ width: `${healthPercent}%` }}
                        />
                    </div>
                </div>

                {team.players && team.players.length > 0 && (
                    <div className={`flex flex-wrap items-center gap-1.5 w-full ${isRight ? "justify-end" : "justify-start"}`}>
                        {team.players.map((player, idx) => {
                            const username = player.username || player.name || player.email || "Гравець";

                            return (
                                <div 
                                    key={player.id || idx}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-muted bg-black/5 dark:bg-white/5 border border-glass-border px-2 py-0.5 rounded-md whitespace-nowrap"
                                >
                                    <User className="w-3 h-3 text-accent shrink-0" />
                                    <span>{username}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {isDefeated && (
                    <div className={`flex items-center gap-1 text-[10px] font-extrabold text-stat-missed animate-bounce ${isRight ? "flex-row-reverse" : ""}`}>
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Defeat in {autosubmitSeconds}s</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="absolute top-4 left-4 right-4 z-40 max-w-5xl mx-auto rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-md px-5 py-3 shadow-2xl transition-all duration-300">
            <div className="flex justify-center -mt-5 mb-1">
                <div className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-md border border-white/20">
                    GeoGuessr
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 w-full">
                {renderTeamCard(myTeam, false, true)}
                <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border shrink-0 min-w-[95px] shadow-inner self-start">
                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted">
                        <Swords className="w-3 h-3 text-accent" />
                        <span>Round {game?.round || 1}</span>
                    </div>

                    <div className="text-xs font-black text-accent my-0.5 bg-primary/10 px-2 py-0.5 rounded-md">
                        x{game?.multiplier || 1}
                    </div>

                    {autosubmitSeconds >= 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-stat-close animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>{autosubmitSeconds}s</span>
                        </div>
                    )}
                </div>

                {renderTeamCard(opponentTeam, true, false)}
            </div>
        </div>
    );
};