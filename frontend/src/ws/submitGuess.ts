import type { MapLocation } from "@/interfaces/MapLocation";
import { gameRoom } from "./wsClient";

const submitGuess = (location: MapLocation) => {
    gameRoom.emit('submit', {
        guess: {
            lat: location.lat,
            lng: location.lng,
        },
    });
}

export default submitGuess;