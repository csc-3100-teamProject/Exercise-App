// All pages use the same backend address.
export const API_URL = (import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000')
    .replace(/\/+$/, '')
