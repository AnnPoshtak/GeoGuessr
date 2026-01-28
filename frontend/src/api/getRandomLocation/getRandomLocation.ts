import type { StreetViewLocationFromApi } from "@/types/StreetViewLocationFromApi";
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