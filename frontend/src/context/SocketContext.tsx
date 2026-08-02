import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '@/firebase';
import { type User as FirebaseUser } from 'firebase/auth';

interface SocketContextProps {
  gameQueue: Socket | null;
  gameRoom: Socket | null;
  
}

const SocketContext = createContext<SocketContextProps>({
    gameQueue: null,
    gameRoom: null
});

export const SocketContextProvider = ({ children }: { children: ReactNode }) => {
    const [gameQueue, setGameQueue] = useState<Socket | null>(null);
    const [gameRoom, setGameRoom] = useState<Socket | null>(null);

    const URL = import.meta.env.VITE_SOCKETIO_SERVER_URL || window.location.origin;

    useEffect(() => {
        let isMounted = true;

        const disconnectSockets = () => {
            gameQueue?.disconnect();
            gameRoom?.disconnect();
        };

        const unsubscribeIdTokenObserver = auth.onIdTokenChanged(async (u: FirebaseUser | null) => {
            disconnectSockets();
            if (!u) {
                if (isMounted) {
                    setGameQueue(null);
                    setGameRoom(null);
                }
                return;
            }

            try {
                const token = await u.getIdToken();
                if (!isMounted) return;

                const socketConfig = {
                    withCredentials: true,
                    transports: ['websocket'],
                    auth: { token },
                    upgrade: false,
                };

                const queueSocket = io(`${URL}/queue`, socketConfig);
                const roomSocket = io(`${URL}/game`, socketConfig);

                setGameQueue(queueSocket);
                setGameRoom(roomSocket);
            } catch (error) {
                console.error('Failed to create socket connections', error);
            }
        });

        return () => {
            isMounted = false;
            unsubscribeIdTokenObserver();
            disconnectSockets();
        };
    }, [URL]);

  return (
    <SocketContext.Provider value={{ gameQueue, gameRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSockets = () => useContext(SocketContext);

export default SocketContext;
