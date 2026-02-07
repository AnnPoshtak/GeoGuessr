import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? undefined : import.meta.env.VITE_SOCKETIO_SERVER_URL;
export const gameRoom = io(URL + 'game', { withCredentials: true, });
export const gameQueue = io(URL + 'queue', { withCredentials: true, });