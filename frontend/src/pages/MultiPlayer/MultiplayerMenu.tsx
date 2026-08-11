import { useNavigate } from 'react-router-dom';
import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext.tsx';
import Queue from './Queue';
import { useQuery } from '@tanstack/react-query';
import type { GameQueue } from '@/interfaces/GameQueue';
import fetchQueue from '@/ws/fetchQueue';
import queryClient from '@/api/queryClient';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Header } from "@/components/Header/Header";
import { WifiOff, User, Users, ArrowLeft, ChevronRight } from 'lucide-react';

export default function MultiplayerMenu() {
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const { setIsJoined } = useMultiplayerContext();

    const { user } = useUser();
    const [selectedMode, setSelectedMode] = useState<'1v1' | '2v2' | null>(null);

    const { data: queue } = useQuery<GameQueue | null>({
        queryKey: ['queue'],
        queryFn: async () => {
            const data = await fetchQueue();
            return data;
        },
        enabled: !!user,
        retry: false,
        staleTime: Infinity
    });

    useEffect(() => {
        if (queue) {
            setSelectedMode(queue.player_count === 2 ? '1v1' : '2v2');
        }
    }, [queue]);

    useEffect(() => {
        if (user === null) {
            navigate('/');
            toast.info('To play in multiplayer mode, you need to log in to your account');
        }
    }, [user, navigate]);

    const handleSelectMode = (mode: '1v1' | '2v2') => {
        setSelectedMode(mode);
    };

    const handleJoinGame = () => {
        setIsJoined(true);
        navigate('/multiplayer-game');
    };

    const joinQueue = () => {
        if (!selectedMode) return;
        const playerCount = selectedMode === '1v1' ? 2 : 4;
        gameQueue.emit('join', {
            player_count: playerCount,
        });
    };

    const leaveQueue = () => {
        gameQueue.emit('leave');
        queryClient.invalidateQueries({ queryKey: ['queue'] });
        setSelectedMode(null);
    };

    const handleBackClick = () => {
        leaveQueue();
        navigate('/');
    };

    useEffect(() => {
        gameRoom.on('game_joined', handleJoinGame);
        gameQueue.on('game_joined', handleJoinGame);

        return () => {
            gameRoom.off('game_joined', handleJoinGame);
            gameQueue.off('game_joined', handleJoinGame);
        };
    }, []);

    if (user === undefined) {
        return (
            <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans bg-cover bg-center bg-no-repeat bg-game-bg">
                <div className="text-muted tracking-widest uppercase font-extrabold animate-pulse">
                    Loading...
                </div>
            </div>
        );
    }

    if (user === null) return null;

    return (
        <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between font-sans selection:bg-primary/30 bg-cover bg-center bg-no-repeat transition-all duration-700 bg-game-bg">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-black/20 dark:to-black/40 pointer-events-none z-0" />
            <div className="relative z-30 w-full">
                <Header />
            </div>

            {!isOnline && (
                <div className="absolute top-20 right-6 z-50 flex items-center gap-2 bg-glass-bg border border-glass-border px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md animate-pulse">
                    <WifiOff className="h-4 w-4 text-stat-missed" />
                    <span className="text-xs text-dark font-bold">Offline</span>
                </div>
            )}

            <main className="relative z-10 flex-1 w-full max-w-3xl px-6 flex flex-col justify-center items-center my-auto">
                
                {selectedMode ? (
                    <div className="w-full max-w-lg flex flex-col gap-4">
                        <button
                            onClick={handleBackClick}
                            className="self-start group flex items-center gap-2 text-xs font-bold tracking-widest text-muted uppercase hover:text-dark transition-colors duration-200 bg-glass-bg border border-glass-border px-4 py-2 rounded-xl backdrop-blur-md shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Change Mode</span>
                        </button>

                        <div className="w-full bg-glass-bg border border-glass-border rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] text-dark">
                            <Queue queue={queue} join={joinQueue} leave={leaveQueue} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-6">
                        <button
                            onClick={handleBackClick}
                            className="self-start group flex items-center gap-2 text-xs font-bold tracking-widest text-muted uppercase hover:text-dark transition-colors duration-200 bg-glass-bg border border-glass-border px-4 py-2 rounded-xl backdrop-blur-md shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Menu</span>
                        </button>

                        <div className="p-8 rounded-3xl bg-glass-bg backdrop-blur-md border border-glass-border shadow-[0_8px_32px_rgba(45,42,107,0.04)] select-none">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark uppercase tracking-tight">
                                Select <span className="text-accent">Multiplayer Mode</span>
                            </h2>
                            <p className="mt-2 text-muted text-sm md:text-base font-bold tracking-wide">
                                Prove your geo-skills against players around the globe.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4">
                            
                            {/* 1 vs 1 */}
                            <button
                                onClick={() => handleSelectMode('1v1')}
                                className="group w-full p-6 sm:p-7 rounded-3xl bg-glass-bg backdrop-blur-md border border-glass-border flex items-center justify-between shadow-md hover:bg-glass-bg/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                                        <User className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-xl sm:text-2xl text-dark uppercase tracking-wide">1 vs 1</h3>
                                            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-accent border border-primary/20">
                                                Duel
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted font-bold mt-1">
                                            Face off head-to-head in a classic location guessing battle.
                                        </p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary text-accent group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0 ml-4">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>

                            {/* 2 vs 2 */}
                            <button
                                onClick={() => handleSelectMode('2v2')}
                                className="group w-full p-6 sm:p-7 rounded-3xl bg-glass-bg backdrop-blur-md border border-glass-border flex items-center justify-between shadow-md hover:bg-glass-bg/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-xl sm:text-2xl text-dark uppercase tracking-wide">2 vs 2</h3>
                                            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                                Team
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted font-bold mt-1">
                                            Teammate co-op mode. Combine your knowledge to win together.
                                        </p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-accent/10 group-hover:bg-accent text-accent group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0 ml-4">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>

                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}