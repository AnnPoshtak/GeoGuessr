import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? undefined : import.meta.env.VITE_SOCKETIO_SERVER_URL;

const socketConfig = {
    withCredentials: true,
    transports: ['websocket'],
    upgrade: false, 
};

export const gameRoom = io(`${URL}/game`, socketConfig);
export const gameQueue = io(`${URL}/queue`, socketConfig);