import type { GameQueue } from "@/interfaces/GameQueue";
import { gameQueue } from "./wsClient";

const fetchQueue = () => {
    return new Promise<GameQueue | null>((resolve, reject) => gameQueue.emit('fetch_queue', (data: GameQueue | null) => {
        resolve(data ?? null);
    }));
};

export default fetchQueue;