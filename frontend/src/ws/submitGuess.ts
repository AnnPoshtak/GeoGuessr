import type { MapLocation } from "@/interfaces/MapLocation";
import type { Socket } from "socket.io-client";

const submitGuess = (socket: Socket, location: MapLocation) => {
    socket.emit('submit', {
        guess: {
            lat: location.lat,
            lng: location.lng,
        },
    });
}

export default submitGuess;