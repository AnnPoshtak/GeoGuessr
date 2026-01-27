import config from "@/config";
import type { MapLocation } from "@/types/MapLocation";

// TODO: fetching logic has to be rewritten in one base function
async function submitLocation(location: MapLocation) {
    try {
        const body = {
            guess: {
                lat: location.lat,
                lng: location.lng,
            }
        };
        const resp = await fetch(config.backendUrl + '/game/submit_location/', {
            headers: {
                "Content-Type": "application/json"
            },
            method: 'POST',
            credentials: "include",
            body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error("Failed to submit guess location!");
        return resp.json();
    } catch (e) {
        console.error((e as Error).message);
    }
}

export default submitLocation;