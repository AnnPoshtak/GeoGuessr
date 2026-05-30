import axios from 'axios';

const client = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace('./', ''),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default client;
