import { useEffect, useState } from 'react';
import {
    CheckCircle2,
    ThumbsUp,
    Flame,
    AlertCircle,
} from 'lucide-react';
import { GUESS_OVERLAY_CONFIG, type GuessOverlayTier } from '@/config/guessOverlayConfig';
import { Confetti } from './Confetti';
import { SecondaryEffects } from './SecondaryEffects';

interface GuessOverlayProps {
    distanceKm: number | null;
    isVisible: boolean;
    onComplete?: () => void;
}

const iconMap = {
    CheckCircle2,
    ThumbsUp,
    Flame,
    AlertCircle,
};


export function GuessOverlay({ distanceKm, isVisible, onComplete }: GuessOverlayProps) {
    const [tier, setTier] = useState<GuessOverlayTier | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        if (distanceKm === null || !isVisible) {
            setShowOverlay(false);
            return;
        }

        const currentTier = GUESS_OVERLAY_CONFIG.getTierByDistance(distanceKm);
        setTier(currentTier);
        setShowOverlay(true);

        const timer = setTimeout(() => {
            setShowOverlay(false);
            onComplete?.();
        }, GUESS_OVERLAY_CONFIG.duration.display + GUESS_OVERLAY_CONFIG.duration.fadeOut);

        return () => clearTimeout(timer);
    }, [distanceKm, isVisible, onComplete]);

    if (!showOverlay || !tier) return null;

    const Icon = iconMap[tier.icon];

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            {tier.effectType === 'confetti' && (
                <Confetti
                    isActive={showOverlay}
                    duration={GUESS_OVERLAY_CONFIG.duration.display}
                />
            )}

            {tier.effectType === 'pulse-ring' && (
                <SecondaryEffects
                    effectType={tier.effectType}
                    isActive={showOverlay}
                    duration={GUESS_OVERLAY_CONFIG.duration.display}
                />
            )}

            <div
                className={`
                    relative z-30
                    px-8 py-6 rounded-2xl
                    bg-gradient-to-br ${tier.bgGradient}
                    border ${tier.borderColor}
                    backdrop-blur-md
                    shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                    flex flex-col items-center gap-3
                    transition-all duration-300
                    ${showOverlay ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
                style={{
                    animation: showOverlay
                        ? `fadeOut ${GUESS_OVERLAY_CONFIG.duration.fadeOut}ms ease-out ${GUESS_OVERLAY_CONFIG.duration.display}ms forwards`
                        : 'none',
                }}
            >
                <Icon className={`w-12 h-12 ${tier.iconColor} animate-pulse`} />

                <h2
                    className={`
                        text-3xl sm:text-4xl font-black tracking-wider
                        ${tier.textColor}
                        drop-shadow-lg
                    `}
                >
                    {tier.message}
                </h2>
                {distanceKm !== null && (
                    <p className="text-xs sm:text-sm font-medium text-white/70 tracking-wide">
                        {distanceKm < 1
                            ? `${Math.round(distanceKm * 1000)}m away`
                            : `${distanceKm.toFixed(1)}km away`}
                    </p>
                )}
            </div>

            <style>{`
                @keyframes fadeOut {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                }
            `}</style>
        </div>
    );
}
