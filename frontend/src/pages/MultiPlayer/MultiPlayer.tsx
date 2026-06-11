import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import Queue from './Queue';
import GameContent from './GameContent';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Multiplayer() {
    const { isJoined, setIsJoined, setGameKey } = useMultiplayerContext();
    const navigate = useNavigate();

    const joinQueue = () => {
        gameQueue.emit('join', {
            player_count: 2
        });
    };

    const leaveQueue = () => {
        gameQueue.emit('leave');
        setIsJoined(false);
        setGameKey(null);
    };

    const handleJoinGame = () => {
        setIsJoined(true);
    };

    useEffect(() => {
        gameRoom.on('game_joined', () => {
            handleJoinGame();
        });

        gameQueue.on('game_joined', () => {
            handleJoinGame();
        });
    }, []);

    if (isJoined) {
        return (
            <div className="w-screen h-screen fixed inset-0 z-50 bg-[#080f1a]">
                <GameContent />
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen flex flex-col items-center bg-[#080f1a] font-sans overflow-hidden text-white">
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
                onClick={() => { leaveQueue(); navigate('/'); }}
                className="absolute left-10 top-0 md:top-9 text-xs font-bold tracking-widest text-gray-400 uppercase hover:text-white transition-colors duration-150 flex items-center gap-1"
            >
                ← Back
            </button>
            <header className="relative z-20 flex flex-col items-center pt-10 md:pt-14 px-4 text-center select-none">


                <h1
                    className="text-4xl md:text-5xl font-black tracking-[0.25em] uppercase text-white"
                    style={{ textShadow: '0 0 40px rgba(79,195,247,0.3), 0 2px 4px rgba(0,0,0,0.8)' }}
                >
                    Multiplayer
                </h1>
                <div
                    className="w-12 h-[2.5px] bg-cyan-400 mx-auto mt-3 rounded-full"
                    style={{ boxShadow: '0 0 12px #00e5ff' }}
                />
            </header>

            <main className="relative z-20 flex-1 w-full max-w-4xl flex flex-col items-center justify-center px-4 pb-12">
                <div className="w-full max-w-md bg-[#0c1524]/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                    <Queue join={joinQueue} leave={leaveQueue} />
                </div>
            </main>
        </div>
    );
}

export default Multiplayer;