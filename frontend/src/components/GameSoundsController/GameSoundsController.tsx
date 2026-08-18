import { Volume2, VolumeX } from "lucide-react";
import { useGameContext } from "@/context/GameContext";

export const GameSoundsController = () => {
    const { isSoundOn, setIsSoundOn } = useGameContext();

    return (
        <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="w-full text-left rounded-xl bg-glass-bg border border-glass-border backdrop-blur-md text-dark font-medium p-3 cursor-pointer transition-all duration-200 hover:opacity-90 flex justify-between items-center shadow-sm group"
        >
            <div className="flex items-center gap-2.5">
                {isSoundOn ? (
                    <Volume2 size={18} className="text-stat-correct transition-transform duration-200 group-hover:scale-110 shrink-0" />
                ) : (
                    <VolumeX size={18} className="text-stat-missed transition-transform duration-200 group-hover:scale-110 shrink-0" />
                )}
                <span className="text-sm font-semibold select-none">Sound Effects</span>
            </div>
        </button>
    );
};