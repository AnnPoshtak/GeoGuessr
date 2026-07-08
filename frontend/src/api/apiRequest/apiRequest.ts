import client from '../client';

async function apiRequest<T>(url: string | URL | Request, _init?: RequestInit) {
    const response = await client.get<T>(String(url));
    return response.data;
}

export default apiRequest;
