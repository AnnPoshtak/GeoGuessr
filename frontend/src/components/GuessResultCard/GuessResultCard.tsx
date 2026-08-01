import type { GuessSubmitApiResponse } from "@/interfaces/GuessSubmitApiResponse";
import { RiPinDistanceFill } from "react-icons/ri";

interface GuessResultCardProps {
    response: GuessSubmitApiResponse;
}

export const GuessResultCard = ({ response }: GuessResultCardProps) => {
    const getDistanceLabel = (distanceInMeters: number) => {
        const distanceKm = distanceInMeters / 1000;

        if (distanceKm <= 100) {
            return { text: "Excellent", className: "text-emerald-400" };
        } else if (distanceKm > 100 && distanceKm <= 600) {
            return { text: "Good", className: "text-amber-400" };
        } else {
            return { text: "Bad", className: "text-rose-400" };
        }
    };

    const labelInfo = getDistanceLabel(response.distance);

    return (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center w-[calc(100%-1.5rem)] max-w-[220px] p-3 rounded-2xl bg-glass-bg backdrop-blur-md border border-glass-border shadow-xl animate-fade-in text-dark select-none">
            
            {/* Заголовок */}
            <div className="flex items-center gap-1.5 text-accent font-bold text-[11px] uppercase tracking-wider">
                <RiPinDistanceFill size={16} className="animate-pulse shrink-0" />
                <span>Result</span>
            </div>

            {/* Відстань */}
            <div className="text-base font-black mt-0.5 tracking-tight text-dark">
                {response.distance > 1000
                    ? `${Math.floor(response.distance / 1000)} km`
                    : `${Math.floor(response.distance)} m`}
            </div>

            {/* Оцінка (Excellent / Good / Bad) */}
            <div className={`text-xs font-black uppercase tracking-wide mt-0.5 ${labelInfo.className}`}>
                {labelInfo.text}
            </div>

            {/* Замінено points на Score */}
            <div className="text-[11px] text-muted font-bold tracking-wide mt-0.5">
                +{response.score} Score
            </div>
        </div>
    );
};