import config from "@/config";
import type { Team } from "@/interfaces/Team";
import { useEffect, useState } from "react";
import { RiSignalWifiErrorLine, RiUser2Fill } from "react-icons/ri";

interface TeamBarProps {
    team: Team;
    rtl: boolean;
    defeatTeamName: string | null;
}

const TeamBar = ({ team, rtl, defeatTeamName }: TeamBarProps) => {
    const maxHealth = config.startingPlayerHealth * team.players.length;
    const healthPercentage = Math.max(0, Math.min(100, (team.health / maxHealth) * 100));
    const [seconds, setSeconds] = useState<number>(config.defeatTeamInterval);

    useEffect(() => {
        if (!defeatTeamName) return;
        if (seconds <= 0) return;
        const interval = setInterval(() => {
            setSeconds((p) => p -= 1);
        }, 1000);
        return () => {
            clearInterval(interval)
        }
    }, [defeatTeamName, seconds]);

    return (
        <div 
            className={`flex flex-col w-full max-w-72 md:w-72 bg-[#0c1524]/85 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                rtl ? "md:mr-16" : ""
            }`}
        >
            <div className="w-full flex flex-col gap-2.5 mb-3">
                {team.players.map((p) => (
                    <div 
                        key={p.id || p.username}
                        className={`flex items-center gap-3 ${
                            rtl ? "flex-row-reverse text-right" : "flex-row text-left"
                        } ${!p.is_connected ? "opacity-40" : ""}`}
                    >
                        <div className={`p-2 rounded-full border shrink-0 ${
                            p.is_connected 
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' 
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                        }`}>
                            <RiUser2Fill size={16} />
                        </div>
                        
                        <div className="min-w-0 flex flex-col justify-center">
                            <span className="text-sm font-bold text-white truncate block max-w-[160px]">
                                {p.username}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider block mt-0.5 ${
                                p.is_connected ? "text-cyan-400/90" : "text-rose-400 animate-pulse"
                            }`}>
                                {p.is_connected ? "Online" : "Disconnected"}
                            </span>
                        </div>

                        {!p.is_connected && (
                            <RiSignalWifiErrorLine size={14} className="text-rose-400 animate-pulse shrink-0 ml-auto" />
                        )}
                    </div>
                ))}
            </div>

            <div className="w-full pt-2.5 border-t border-white/10">
                <div className={`flex items-baseline justify-between text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ${
                    rtl ? "flex-row-reverse" : ""
                }`}>
                    <span>Team HP</span>
                    <span className="font-mono text-xs tracking-normal">
                        <span className="text-rose-400 font-bold">{team.health}</span>
                        <span className="text-gray-500">/{maxHealth}</span>
                    </span>
                </div>
                
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-500 ease-out" 
                        style={{ 
                            width: `${healthPercentage}%`,
                            boxShadow: healthPercentage > 0 ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none'
                        }}
                    />
                </div>
            </div>
            {defeatTeamName == team.name && <div className={seconds <= 3 ? 'text-2xl text-red-500': ''}>
                Defeat in {seconds}
            </div>}
        </div>
    );
};

export default TeamBar;