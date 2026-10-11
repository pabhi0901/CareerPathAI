import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization header if token is stored in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careerpath_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('careerpath_token');
      localStorage.removeItem('careerpath_user');
      // Redirect to login if unauthenticated on a protected page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
