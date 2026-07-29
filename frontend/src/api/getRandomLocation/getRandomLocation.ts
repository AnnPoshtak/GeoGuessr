import { gameApi } from "../index";

async function getRandomLocation() {
    return gameApi.getRandomLocation();
}

export default getRandomLocation;
