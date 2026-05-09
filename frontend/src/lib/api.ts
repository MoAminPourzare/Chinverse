import axios from 'axios';

const DEFAULT_DEV_API_URL = 'http://localhost:8000/api/v1';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_DEV_API_URL).replace(/\/$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
