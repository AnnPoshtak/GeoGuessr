import { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';

interface SecondaryEffectsProps {
    effectType: 'pulse-ring' | 'none';
    isActive: boolean;
    duration?: number;
}


export function SecondaryEffects({ effectType, isActive, duration = 2000 }: SecondaryEffectsProps) {
    const [rings, setRings] = useState<number[]>([]);

    useEffect(() => {
        if (!isActive || effectType === 'none') return;

        const intervalId = setInterval(() => {
            setRings(prev => [...prev.slice(-2), Date.now()]);
        }, 400);

        const timeoutId = setTimeout(() => {
            setRings([]);
        }, duration);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [isActive, effectType, duration]);

    if (!isActive) return null;

    if (effectType === 'pulse-ring') {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative z-20">
                    <ThumbsUp className="w-12 h-12 text-blue-300 animate-bounce" />
                </div>
                {rings.map((ringId) => {
                    const age = Date.now() - ringId;
                    const progress = Math.min(age / duration, 1);
                    const scale = 1 + progress * 2;
                    const opacity = Math.max(0, 1 - progress);

                    return (
                        <div
                            key={ringId}
                            className="absolute rounded-full border-2 border-blue-400"
                            style={{
                                width: '60px',
                                height: '60px',
                                transform: `scale(${scale})`,
                                opacity: opacity,
                                transition: 'none',
                            }}
                        />
                    );
                })}
            </div>
        );
    }

    return null;
}
