import type { GameRoom } from "@/interfaces/GameRoom";
import type { Socket } from "socket.io-client";

const fetchGame = (socket: Socket) => {
    return new Promise<GameRoom>((resolve, reject) => socket.emit('fetch_game', (data: Record<'game', GameRoom>) => {
        if (data) {
            const game: GameRoom = data.game;
            resolve(game);
        } else {
            reject();
        }

    }));
};

export default fetchGame;