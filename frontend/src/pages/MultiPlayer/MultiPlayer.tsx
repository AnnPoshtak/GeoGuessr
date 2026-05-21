import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import Queue from './Queue';
import GameContent from './GameContent';
import { useEffect } from 'react';

function Multiplayer() {
    const { isJoined, setIsJoined, setGameKey } = useMultiplayerContext();

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

    return <>
        {isJoined ? <GameContent /> : <Queue players={[]} join={joinQueue} leave={leaveQueue} />}
    </>;
}

export default Multiplayer;
