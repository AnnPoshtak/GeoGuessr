import type { MapLocation } from "@/interfaces/MapLocation";
import { gameApi } from "../index";

async function submitGuess(location: MapLocation) {
    return gameApi.submitGuess(location);
}

export default submitGuess;
