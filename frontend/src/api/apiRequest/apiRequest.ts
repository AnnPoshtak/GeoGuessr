import config from "@/config";

async function apiRequest<T>(url: RequestInfo | URL, init?: RequestInit) {
    const resp = await fetch(config.backendUrl + url, init);
    if (!resp.ok) throw new Error(`An error occured while trying to complete an request: ${resp.statusText}`);
    return await resp.json() as T;
}

export default apiRequest;