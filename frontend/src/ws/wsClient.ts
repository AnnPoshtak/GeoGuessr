import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? undefined : import.meta.env.VITE_SOCKETIO_SERVER_URL;
export const game = io(URL + 'game', { withCredentials: true, });
export const queue = io(URL + 'queue', { withCredentials: true, });