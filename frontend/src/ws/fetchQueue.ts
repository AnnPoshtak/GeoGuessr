import type { GameQueue } from "@/interfaces/GameQueue";
import type { Socket } from "socket.io-client";

const fetchQueue = (socket: Socket) => {
    return new Promise<GameQueue | null>((resolve, _reject) => socket.emit('fetch_queue', (data: GameQueue | null) => {
        resolve(data ?? null);
    }));
};

export default fetchQueue;