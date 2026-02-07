import type { GameRoom } from "@/interfaces/GameRoom";
import { gameRoom } from "./wsClient";

const fetchGame = () => {
    return new Promise<GameRoom>((resolve, reject) => gameRoom.emit('fetch_game', (data: Record<any, any>) => {
        if (data) {
            const game: GameRoom = {
                location: JSON.parse(data['game']['location']),
                round: JSON.parse(data['game']['round']),
                player_ids: JSON.parse(data['game']['player_ids']),
            }
            resolve(game);
        } else {
            reject();
        }

    }));
};

export default fetchGame;