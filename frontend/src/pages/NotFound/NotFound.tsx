import { Header } from "@/components/Header/Header";
import { useNavigate } from 'react-router-dom';
import { MapPinOff, Home, Compass } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between font-sans selection:bg-primary/30 bg-cover bg-center bg-no-repeat transition-all duration-700 bg-game-bg">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-black/20 dark:to-black/40 pointer-events-none z-0" />
            <div className="relative z-30 w-full">
                <Header />
            </div>
            <main className="relative z-10 flex-1 w-full max-w-3xl px-6 flex flex-col justify-center items-center my-auto">
                <div className="w-full bg-glass-bg border border-glass-border rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] text-center flex flex-col items-center gap-6 animate-fade-in">
                    <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 text-accent flex items-center justify-center shadow-inner">
                            <MapPinOff className="w-12 h-12 stroke-[2.2]" />
                        </div>
                    </div>
                    <div className="space-y-3 max-w-md">
                        <h1 className="text-4xl sm:text-5xl font-black text-dark uppercase tracking-tight">
                            Lost in <span className="text-accent">Coordinates</span>
                        </h1>
                        <p className="text-sm sm:text-base text-muted font-bold leading-relaxed">
                            You’ve ventured into uncharted territory. The location or page you are looking for has disappeared off the radar.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-2">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            <span>Back to Home</span>
                        </button>

                        <button
                            onClick={() => navigate('/single-game')}
                            className="flex-1 py-4 px-6 rounded-2xl bg-glass-bg border border-glass-border text-dark font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 hover:bg-glass-bg/80 hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                        >
                            <Compass className="w-4 h-4 text-accent" />
                            <span>Play Game</span>
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}