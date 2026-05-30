import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import { gameApi } from "../index";

/**
 * @deprecated Use gameApi.getRandomLocation() instead
 * Import: import { gameApi } from '@/api'
 */
async function getRandomLocation() {
    return gameApi.getRandomLocation();
}

export default getRandomLocation;
