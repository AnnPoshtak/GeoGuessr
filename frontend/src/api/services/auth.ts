import client from '../client';

export const logout = async () => {
  await client.get('/auth/logout');
};

export const getOAuthUrl = (provider: string) => {
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
    .trim()
    .replace('./', '');
  return `${backendUrl}/oauth/authorize/${provider}/`;
};
