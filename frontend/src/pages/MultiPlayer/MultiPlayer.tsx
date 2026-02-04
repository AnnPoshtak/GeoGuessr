import { useEffect, useState } from 'react';
import { queue } from '@/ws/wsClient';

function Multiplayer() {
    const [players, setPlayers] = useState([]);
    useEffect(() => {
        queue.on('queue_joined', (data) => {
            console.log('Joined queue', data);
            setPlayers(JSON.parse(data['queue']));
        });
        queue.on('queue_left', (data) => {
            console.log('Left queue', data);
            setPlayers(JSON.parse(data['queue']));
        });


        return () => {
            queue.off('queue_joined');
            queue.off('queue_left');
        };
    }, []);
    const join = () => {
        queue.emit('join', {
            player_count: 3
        });
    };
    const leave = () => {
        queue.emit('leave');
    };
    return <div>
        <div>This is multiplayer page</div>
        <div>{players}</div>
        <button className='bg-green-600 rounded p-2' onClick={join}>Join!</button>
        <button className='bg-red-600 rounded p-2' onClick={leave}>Leave!</button>
    </div>;
}

export default Multiplayer;