import client from '../client';

/**
 * @deprecated Use the specific API service functions from @/api/services instead
 * For example: import { gameApi } from '@/api'
 */
async function apiRequest<T>(url: string | URL | Request, init?: RequestInit) {
    const response = await client.get<T>(String(url));
    return response.data;
}

export default apiRequest;
