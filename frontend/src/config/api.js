// Centralized API Configuration
// All API URLs are controlled by environment variables (.env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

export { API_BASE_URL, SOCKET_URL, AI_URL };
