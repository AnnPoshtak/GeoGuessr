import { socket } from '@/ws/wsClient';
import { useEffect } from 'react';

function Multiplayer() {
    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected');
        });
        socket.on('disconnect', () => {
            console.log('Disconected!');
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
        };
    }, []);
    const sendMessage = () => {
        console.log('Message sent!');
        socket.send("Hello, world!");
    };
    return <div>
        <div>This is multiplayer page</div>
        <button className='bg-red-600 rounded p-2' onClick={sendMessage}>Send message!</button>
    </div>;
}

export default Multiplayer;