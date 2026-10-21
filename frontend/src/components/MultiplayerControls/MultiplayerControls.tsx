import React from "react";
import type { MapLocation } from "@/interfaces/MapLocation";

interface MultiplayerControlsProps {
    submit: () => void;
    guessLocation: MapLocation | null;
    isSubmitted: boolean;
    isAllReady: boolean;
}

export const MultiplayerControls: React.FC<MultiplayerControlsProps> = ({
    submit,
    guessLocation,
    isSubmitted,
    isAllReady,
}) => {
    const getStatusColor = () => {
        if (isAllReady) return 'text-stat-correct';
        if (guessLocation) return 'text-stat-close';
        return 'text-muted';
    };

    const getStatusText = () => {
        if (isAllReady) return 'All players ready!';
        if (isSubmitted) return 'Waiting for others...';
        return 'Waiting for your guess';
    };

    return (
        <div className="w-full pt-2 px-1 flex flex-col gap-1.5 z-40">
            <button
                onClick={submit}
                disabled={!guessLocation || isSubmitted}
                className="w-full rounded-xl bg-primary text-white font-bold p-2.5 text-xs uppercase tracking-wider shadow-md hover:bg-primary-hover transition-all duration-200 active:scale-[0.98] disabled:bg-black/20 dark:disabled:bg-white/10 disabled:text-muted disabled:cursor-not-allowed disabled:shadow-none"
            >
                {isSubmitted ? 'Guess Submitted!' : 'Submit Guess!'}
            </button>
            
            <div className="flex justify-between items-center text-[11px] px-1 font-bold h-4">
                <span className="text-muted uppercase tracking-wider">Status:</span>
                <span className={`transition-all duration-300 ${getStatusColor()}`}>
                    {getStatusText()}
                </span>
            </div>
        </div>
    );
};