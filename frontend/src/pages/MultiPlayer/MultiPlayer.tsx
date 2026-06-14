import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import GameContent from './GameContent';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MultiplayerGame() {
    const { isJoined, setIsJoined } = useMultiplayerContext();
    const navigate = useNavigate();

    const handleJoinGame = () => {
        setIsJoined(true);
    };

    const leaveGame = () => {
        navigate('/multiplayer');
    };

    useEffect(() => {
        gameRoom.on('game_joined', () => {
            handleJoinGame();
        });

        gameQueue.on('game_joined', () => {
            handleJoinGame();
        });

        return () => {
            gameRoom.off('game_joined');
            gameQueue.off('game_joined');
        };
    }, []);

    if (!isJoined) {
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
                <div className="relative z-20 flex flex-col items-center justify-center h-full gap-4 text-center">
                    <p className="text-gray-300">Loading game...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen fixed inset-0 z-50 bg-[#080f1a]">
            <GameContent />
        </div>
    );
}

export default MultiplayerGame;