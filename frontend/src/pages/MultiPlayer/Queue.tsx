import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useEffect, useState, type MouseEventHandler } from "react";

interface QueueProps {
    players: number[];
    join: MouseEventHandler<HTMLButtonElement>;
    leave: MouseEventHandler<HTMLButtonElement>;
}

const Queue = ({join, leave}: QueueProps) => {
    const [players, setPlayers] = useState([]);
    const {setGameKey} = useMultiplayerContext();

    useEffect(() => {
        gameQueue.on('queue_joined', (data) => {
            console.log('Joined queue');
            setPlayers(JSON.parse(data['queue']));
        });
        gameQueue.on('queue_left', (data) => {
            console.log('Left queue');
            setPlayers(JSON.parse(data['queue']));
        });

        gameQueue.on('game_started', (data) => {
            setGameKey(data.game_key);
            setPlayers([]);
            gameRoom.emit('join', {
                'game_key': data.game_key
            })
        });

        return () => {
            gameQueue.off('queue_joined');  
            gameQueue.off('queue_left');
            gameQueue.off('game_started');
            gameQueue.off('message');
        }
    })
    return <div>
        <div>This is multiplayer page</div>
        <div>{players}</div>
        <button className='bg-green-600 rounded p-2' onClick={join}>Join!</button>
        <button className='bg-red-600 rounded p-2' onClick={leave}>Leave!</button>
    </div>;
}
 
export default Queue;