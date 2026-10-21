import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import GameContent from './GameContent';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function MultiplayerGame() {
    const { isJoined, setIsJoined } = useMultiplayerContext();

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

        return () => {
            gameRoom.off('game_joined');
            gameQueue.off('game_joined');
        };
    }, []);

    if (!isJoined) {
        return (
            <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center font-sans bg-cover bg-center bg-no-repeat bg-game-bg">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-black/20 dark:to-black/40 pointer-events-none z-0" />

                <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-2xl gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <div className="text-xs font-black uppercase tracking-widest text-muted animate-pulse">
                        Loading game session...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen fixed inset-0 z-50 bg-game-bg">
            <GameContent />
        </div>
    );
}

export default MultiplayerGame;