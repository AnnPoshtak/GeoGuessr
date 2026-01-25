import config from "@/config";

async function getRandomLocation() {
    try {
        const resp = await fetch(config.backendUrl + '/game/get_random_location/', {
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!resp.ok) throw new Error("Failed to fetch random location!");
        return resp;
    } catch (e) {
        console.error((e as Error).message);
    }
}

export default getRandomLocation;