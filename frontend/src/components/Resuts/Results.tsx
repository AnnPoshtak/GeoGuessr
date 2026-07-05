import { Trophy, Target, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ScoreBoardProps {
    score: number;
    totalGuesses: number;
    correctGuesses: number;
    closeGuesses: number;
    missedGuesses: number; 
}

export default function ScoreBoard({ 
    score = 0, 
    totalGuesses = 0, 
    correctGuesses = 0, 
    closeGuesses = 0, 
    missedGuesses = 0 
}: ScoreBoardProps) {
    return (
        <div className="w-full bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] col-span-2 sm:col-span-1">
                    <div className="absolute top-2 right-2 text-indigo-500/30">
                        <Trophy size={16} />
                    </div>
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase font-bold text-indigo-300 mb-1">
                        Current Score
                    </span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm">
                        {score}
                    </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-800/30 border border-neutral-800/60 hover:border-neutral-700/60 transition-colors">
                    <div className="absolute top-2 right-2 text-neutral-500">
                        <Target size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold text-neutral-400 mb-1">
                        Total Guesses
                    </span>
                    <span className="text-2xl font-bold text-neutral-100">
                        {totalGuesses}
                    </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                    <div className="absolute top-2 right-2 text-emerald-500/40">
                        <CheckCircle2 size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold text-emerald-400/80 mb-1">
                        Correct
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                        {correctGuesses}
                    </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/20 transition-colors">
                    <div className="absolute top-2 right-2 text-amber-500/40">
                        <AlertCircle size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold text-amber-400/80 mb-1">
                        Close
                    </span>
                    <span className="text-2xl font-bold text-amber-400">
                        {closeGuesses}
                    </span>
                </div>

                <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-colors">
                    <div className="absolute top-2 right-2 text-rose-500/40">
                        <XCircle size={14} />
                    </div>
                    <span className="text-[10px] sm:text-xs tracking-wider uppercase font-semibold text-rose-400/80 mb-1">
                        Missed
                    </span>
                    <span className="text-2xl font-bold text-rose-400">
                        {missedGuesses}
                    </span>
                </div>

            </div>
        </div>
    );
}