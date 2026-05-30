import type { MapLocation } from "@/interfaces/MapLocation";
import { gameApi } from "../index";
import type { GuessSubmitApiResponse } from "@/interfaces/GuessSubmitApiResponse";

/**
 * @deprecated Use gameApi.submitGuess() instead
 * Import: import { gameApi } from '@/api'
 */
async function submitGuess(location: MapLocation) {
    return gameApi.submitGuess(location);
}

export default submitGuess;
