import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  // Retrieves the token from local storage
  const token = localStorage.getItem('@pbl360:token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Intercepts 401 Unauthorized errors to handle session expiration globally
    if (error.response?.status === 401) {
      localStorage.removeItem('@pbl360:token');
      // A full reload or redirection logic can be triggered here if necessary
    }

    return Promise.reject(error);
  },
);
