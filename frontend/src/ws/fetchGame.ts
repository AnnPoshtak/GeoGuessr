import type { GameRoom } from "@/interfaces/GameRoom";
import { gameRoom } from "./wsClient";

const fetchGame = () => {
    return new Promise<GameRoom>((resolve, reject) => gameRoom.emit('fetch_game', (data: Record<'game', GameRoom>) => {
        if (data) {
            const game: GameRoom = data.game;
            resolve(game);
        } else {
            reject();
        }

    }));
};

export default fetchGame;