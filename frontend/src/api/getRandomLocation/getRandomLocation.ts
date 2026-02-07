import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import apiRequest from "../apiRequest/apiRequest";

async function getRandomLocation() {
    const data = await apiRequest<StreetViewLocationFromApi>('/game/random_location/', {
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
    });
    return data;
}

export default getRandomLocation;