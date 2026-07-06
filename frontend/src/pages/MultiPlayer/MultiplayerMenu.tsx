import { useNavigate } from 'react-router-dom';
import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
    import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usersApi } from '@/api';
import Queue from './Queue';
import { useQuery } from '@tanstack/react-query';
import type { GameQueue } from '@/interfaces/GameQueue';
import fetchQueue from '@/ws/fetchQueue';
import queryClient from '@/api/queryClient';
import type { User } from '@/interfaces/Player';

export default function MultiplayerMenu() {
    const navigate = useNavigate();
    const { setIsJoined } = useMultiplayerContext();
    
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
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
    
    const checkUserAuth = async () => {
        try {
            const userData = await usersApi.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Authentication error:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserAuth();
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/");
            toast.info("To play in multiplayer mode, you need to log in to your account");
        }
    }, [loading, user, navigate]);

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

    if (loading) {
        return (
            <div className="flex min-h-dvh w-full items-center justify-center bg-[#080f1a] text-white">
                <div className="tracking-widest uppercase animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (selectedMode) {
        return (
            <div className="relative app-shell flex flex-col items-center bg-[#080f1a] font-sans overflow-x-hidden text-white">
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `
                      radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.8) 0%, transparent 100%),
                      radial-gradient(1.5px 1.5px at 22% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
                      radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
                      radial-gradient(1px 1px at 80% 28%, rgba(255,255,255,0.5) 0%, transparent 100%),
                      radial-gradient(1px 1px at 45% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
                      radial-gradient(1px 1px at 5% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
                      radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
                      radial-gradient(1px 1px at 35% 88%, rgba(255,255,255,0.4) 0%, transparent 100%)
                    `
                }} />

                <button
                    onClick={handleBackClick}
                    className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-10 md:top-9 text-xs font-bold tracking-widest text-gray-400 uppercase hover:text-white transition-colors duration-150 flex items-center gap-1"
                >
                    ← Back
                </button>

                <header className="relative z-20 flex flex-col items-center pt-16 sm:pt-14 md:pt-16 px-4 sm:px-6 text-center select-none">
                    <h1
                        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] uppercase text-white"
                        style={{ textShadow: '0 0 40px rgba(79,195,247,0.3), 0 2px 4px rgba(0,0,0,0.8)' }}
                    >
                        {selectedMode === '1v1' ? '1 vs 1' : '2 vs 2'}
                    </h1>
                    <div
                        className="w-12 h-[2.5px] bg-cyan-400 mx-auto mt-3 rounded-full"
                        style={{ boxShadow: '0 0 12px #00e5ff' }}
                    />
                </header>

                <main className="relative z-20 flex-1 w-full max-w-4xl flex flex-col items-center justify-center px-4 sm:px-6 pb-10 sm:pb-12">
                    <div className="w-full max-w-xl bg-[#0c1524]/60 border border-white/10 rounded-2xl p-5 sm:p-6 md:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                        <Queue queue={queue} join={joinQueue} leave={leaveQueue}/>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="relative app-shell flex flex-col items-center bg-[#080f1a] font-sans overflow-x-hidden text-white">
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                  radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.8) 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 22% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
                  radial-gradient(1px 1px at 80% 28%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 45% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 5% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
                  radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 35% 88%, rgba(255,255,255,0.4) 0%, transparent 100%)
                `
            }} />

            <button
                onClick={handleBackClick}
                className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-10 md:top-9 text-xs font-bold tracking-widest text-gray-400 uppercase hover:text-white transition-colors duration-150 flex items-center gap-1"
            >
                ← Back
            </button>

            <header className="relative z-20 flex flex-col items-center pt-16 sm:pt-14 md:pt-16 px-4 sm:px-6 text-center select-none">
                <h1
                    className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] uppercase text-white"
                    style={{ textShadow: '0 0 40px rgba(79,195,247,0.3), 0 2px 4px rgba(0,0,0,0.8)' }}
                >
                    Multiplayer
                </h1>
                <div
                    className="w-12 h-[2.5px] bg-cyan-400 mx-auto mt-3 rounded-full"
                    style={{ boxShadow: '0 0 12px #00e5ff' }}
                />
            </header>

            <main className="relative z-20 flex-1 w-full max-w-4xl flex flex-col items-center justify-center px-4 sm:px-6 pb-10 sm:pb-12">
                <div className="w-full max-w-2xl">
                    <p className="text-center text-gray-300 text-sm md:text-base mb-8 sm:mb-10 md:mb-12 font-light tracking-wide">
                        Choose your game mode
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <button
                            onClick={() => handleSelectMode('1v1')}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-transparent to-cyan-400/0 group-hover:from-blue-400/10 group-hover:to-cyan-400/10 transition-all duration-300" />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="text-4xl sm:text-5xl font-bold text-cyan-300">1 vs 1</div>
                                <div className="h-1 w-12 bg-cyan-400 rounded-full group-hover:w-16 transition-all duration-300"
                                    style={{ boxShadow: '0 0 12px #00e5ff' }} />
                                <p className="text-gray-300 text-sm mt-2">
                                    One on one competition
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Head to head battle for the ultimate bragging rights
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleSelectMode('2v2')}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] transition-all duration-300 hover:border-purple-400/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-transparent to-pink-400/0 group-hover:from-purple-400/10 group-hover:to-pink-400/10 transition-all duration-300" />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="text-4xl sm:text-5xl font-bold text-purple-300">2 vs 2</div>
                                <div className="h-1 w-12 bg-purple-400 rounded-full group-hover:w-16 transition-all duration-300"
                                    style={{ boxShadow: '0 0 12px #a855f7' }} />
                                <p className="text-gray-300 text-sm mt-2">
                                    Team battle
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Collaborate with a teammate to outwit the opposing team
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}