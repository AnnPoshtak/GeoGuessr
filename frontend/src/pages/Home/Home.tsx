import { Header } from "@/components/Header/Header";
import { useNavigate } from 'react-router-dom';
import EarthGlobe from "@/components/EarthGlobe/EarthGlobe";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center font-sans selection:bg-primary/30 bg-cover bg-center bg-no-repeat transition-all duration-700 bg-game-bg">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-black/20 dark:to-black/40 pointer-events-none z-0" />

            <div className="relative z-30 w-full">
                <Header />
            </div>

            <div className="relative z-10 flex-1 w-full max-w-7xl px-6 flex flex-col justify-center gap-12 md:flex-row md:items-center md:justify-between text-center md:text-left">
                
                <div className="flex-1 max-w-xl p-8 rounded-3xl bg-glass-bg backdrop-blur-md border border-glass-border shadow-[0_8px_32px_rgba(45,42,107,0.04)] select-none transition-all duration-300">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-dark leading-tight uppercase tracking-tight transition-colors">
                        Discover the <span className="text-accent transition-colors">unknown</span> world
                    </h2>
                    <p className="mt-4 text-muted text-sm md:text-base font-bold tracking-wide leading-relaxed transition-colors">
                        Test your intuition, guess the locations, and embark on an exciting journey across continents.
                    </p>
                </div>

                <div className="flex-1 flex justify-center items-center w-full">
                    <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[480px] md:h-[480px]">
                        <EarthGlobe />
                    </div>
                </div>
                
            </div>

            <div className="relative z-30 pb-16 w-full max-w-4xl px-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                
                <button
                    onClick={() => navigate("/single-game")}
                    className="w-full sm:w-80 p-5 rounded-2xl bg-primary text-white flex items-center justify-between shadow-lg hover:bg-primary-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Singleplayer</h3>
                        <p className="text-xs text-white/70 mt-0.5">Explore the world on your own</p>
                    </div>
                    <span className="bg-white/20 p-2 rounded-full">➔</span>
                </button>

                <button
                    onClick={() => navigate("/multiplayer")}
                    className="w-full sm:w-80 p-5 rounded-2xl bg-brand-bg text-dark border border-neutral-100/10 dark:border-white/5 flex items-center justify-between shadow-md hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Multiplayer</h3>
                        <p className="text-xs text-muted/70 mt-0.5">Compete with other players</p>
                    </div>
                    <span className="bg-primary text-white p-2 rounded-full">➔</span>
                </button>
                
            </div>
        </div>
    );
}