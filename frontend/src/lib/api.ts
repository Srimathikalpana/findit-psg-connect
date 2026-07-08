// Central place for frontend to read the backend base URL.
// Vite injects VITE_API_URL at build time; fall back to localhost for dev.
export const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080';

export default API;
