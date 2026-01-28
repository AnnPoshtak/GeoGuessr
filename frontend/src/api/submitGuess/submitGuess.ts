import type { MapLocation } from "@/types/MapLocation";
import apiRequest from "../apiRequest/apiRequest";
import type { GuessSubmitApiResponse } from "@/types/GuessSubmitInfo";

async function submitGuess(location: MapLocation) {
    const body = {
        guess: {
            lat: location.lat,
            lng: location.lng,
        }
    };
    const data = await apiRequest<GuessSubmitApiResponse>('/game/submit_location/', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body),
    });
    return data;
}

export default submitGuess;