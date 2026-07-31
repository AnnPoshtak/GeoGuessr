import type { User } from '@/interfaces/Player';
import client from '../client';

export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const { data } = await client.get<User | null>("/users/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};
