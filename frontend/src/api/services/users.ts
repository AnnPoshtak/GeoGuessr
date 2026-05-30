import client from '../client';

export interface User {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data } = await client.get<User>('/users/me');
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};
