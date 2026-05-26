import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useEffect, useState, type MouseEventHandler } from "react";
import { toast } from "sonner";

interface QueueProps {
    players: number[];
    join: MouseEventHandler<HTMLButtonElement>;
    leave: MouseEventHandler<HTMLButtonElement>;
}

const Queue = ({join, leave}: QueueProps) => {
    const [players, setPlayers] = useState([]);
    const [inQueue, setInQueue] = useState(false);
    const {setGameKey} = useMultiplayerContext();

    const messageCallback = (message: string) => {
        toast.error(message);
    }; 

    useEffect(() => {
        gameQueue.on('message', messageCallback);
        gameQueue.on('queue_joined', (data) => {
            console.log('Joined queue');
            setPlayers(JSON.parse(data['queue']));
            setInQueue(true);
        });
        gameQueue.on('queue_left', (data) => {
            console.log('Left queue');
            setPlayers(JSON.parse(data['queue']));
            setInQueue(false);
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
        <div>Multiplayer lobby</div>
        
        {inQueue ? <>
        <div>There are {players.length} players waiting for the game to start</div>
        <button className='bg-red-600 rounded p-2' onClick={leave}>Leave!</button>
        </> : <button className='bg-green-600 rounded p-2' onClick={join}>Join!</button>}
    </div>;
}
 
export default Queue;