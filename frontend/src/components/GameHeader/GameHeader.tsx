import { Trophy, Target, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { GameSoundsController } from "../GameSoundsController/GameSoundsController";

interface GameHeaderProps {
    score?: number;
    totalGuesses?: number;
    correctGuesses?: number;
    closeGuesses?: number;
    missedGuesses?: number;
}

export const GameHeader = ({
    score = 0,
    totalGuesses = 0,
    correctGuesses = 0,
    closeGuesses = 0,
    missedGuesses = 0,
}: GameHeaderProps) => {
    const navigate = useNavigate();

    return (
        <div className="absolute top-0 left-0 right-0 z-50 w-full px-4 pt-4 sm:px-6 md:px-8 font-sans pointer-events-none">
            <header className="pointer-events-auto bg-glass-bg backdrop-blur-md max-w-7xl mx-auto py-2.5 px-4 sm:px-6 rounded-2xl shadow-xl border border-glass-border transition-all duration-300">
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                    
                    <h1 
                        className="text-lg sm:text-xl font-black uppercase tracking-[0.15em] text-dark select-none cursor-pointer transition-colors hover:opacity-80 shrink-0" 
                        onClick={() => navigate("/")}
                    >
                        GeoGuessr
                    </h1>

                    <div className="flex flex-row items-center gap-3 sm:gap-4.5 bg-black/5 dark:bg-white/10 px-3.5 py-1.5 rounded-xl border border-black/5 dark:border-white/15 backdrop-blur-sm">
                        
                        <div className="flex items-center gap-1.5">
                            <Trophy size={16} className="text-stat-score shrink-0" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-stat-score hidden sm:inline">Score</span>
                                <span className="text-xs sm:text-sm font-black text-stat-score leading-none">
                                    {score}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Target size={15} className="text-muted shrink-0" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-muted hidden sm:inline">Total</span>
                                <span className="text-xs sm:text-sm font-bold text-dark leading-none">
                                    {totalGuesses}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-stat-correct shrink-0" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-stat-correct hidden sm:inline">Correct</span>
                                <span className="text-xs sm:text-sm font-bold text-stat-correct leading-none">
                                    {correctGuesses}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <AlertCircle size={15} className="text-stat-close shrink-0" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-stat-close hidden sm:inline">Close</span>
                                <span className="text-xs sm:text-sm font-bold text-stat-close leading-none">
                                    {closeGuesses}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <XCircle size={15} className="text-stat-missed shrink-0" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-stat-missed hidden sm:inline">Missed</span>
                                <span className="text-xs sm:text-sm font-bold text-stat-missed leading-none">
                                    {missedGuesses}
                                </span>
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-row items-center gap-2 shrink-0">
                        <ThemeToggle />
                        <GameSoundsController />
                    </div>

                </div>
            </header>
        </div>
    );
};