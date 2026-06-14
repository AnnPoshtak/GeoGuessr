export interface GuessOverlayTier {
    name: 'excellent' | 'good' | 'average' | 'poor';
    maxDistance: number;
    message: string;
    soundPath: string;
    textColor: string;
    bgGradient: string;
    borderColor: string;
    iconColor: string;
    icon: 'CheckCircle2' | 'ThumbsUp' | 'Flame' | 'AlertCircle';
    effectType: 'confetti' | 'pulse-ring' | 'none';
}

export const GUESS_OVERLAY_CONFIG = {
    duration: {
        display: 2500, 
        fadeOut: 600, 
    },

    thresholds: {
        excellent: 100,  
        good: 600,       
    },

    tiers: [
        {
            name: 'excellent',
            maxDistance: 100,
            message: 'Correct!',
            soundPath: '/sound/correct.mp3',
            textColor: 'text-emerald-300',
            bgGradient: 'from-emerald-600/90 to-teal-600/80',
            borderColor: 'border-emerald-400/50',
            iconColor: 'text-emerald-200',
            icon: 'CheckCircle2',
            effectType: 'confetti',
        } as GuessOverlayTier,
        {
            name: 'good',
            maxDistance: 600,
            message: 'Very Close!',
            soundPath: '/sound/ok.mp3',
            textColor: 'text-blue-300',
            bgGradient: 'from-blue-600/90 to-cyan-600/80',
            borderColor: 'border-blue-400/50',
            iconColor: 'text-blue-200',
            icon: 'ThumbsUp',
            effectType: 'pulse-ring',
        } as GuessOverlayTier,
        {
            name: 'poor',
            maxDistance: Infinity,
            message: 'Way Off!',
            soundPath: '/sound/wrong.mp3',
            textColor: 'text-rose-300',
            bgGradient: 'from-rose-600/90 to-red-600/80',
            borderColor: 'border-rose-400/50',
            iconColor: 'text-rose-200',
            icon: 'AlertCircle',
            effectType: 'none',
        } as GuessOverlayTier,
    ] as GuessOverlayTier[],


    getTierByDistance(distanceKm: number): GuessOverlayTier {
        const tier = this.tiers.find(t => distanceKm <= t.maxDistance);
        return tier || this.tiers[this.tiers.length - 1]; 
    },
};
