// Centralized API base URL - change this for production
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3003';


// Get auth token from localStorage
const getToken = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.token || null;
    } catch {
        return null;
    }
};

// Build headers with optional auth
const buildHeaders = (auth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Generic fetch wrapper with error handling
const apiFetch = async (path, options = {}, auth = false) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...buildHeaders(auth),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401 || res.status === 403) {
        // Token expired or unauthorized — force logout
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChange'));
        throw new Error('Session expired. Please login again.');
    }

    return res;
};

// Auth APIs
export const authAPI = {
    login: (username, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    registerAdmin: (data) =>
        apiFetch('/auth/register-admin', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    getAdmins: () => apiFetch('/auth/admins', {}, true),

    updateAdmin: (id, data) =>
        apiFetch(`/auth/admins/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    deleteAdmin: (id) =>
        apiFetch(`/auth/admins/${id}`, { method: 'DELETE' }, true),

    checkMobile: (mobile) =>
        apiFetch('/auth/check-mobile', {
            method: 'POST',
            body: JSON.stringify({ mobile }),
        }),

    getDashboard: () => apiFetch('/auth/dashboard', {}, true),
    getAccommodationDetails: () => apiFetch('/auth/accommodation-details', {}, true),
};

// Registration APIs
export const registrationAPI = {
    submit: (payload) =>
        apiFetch('/registration', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    getAll: () => apiFetch('/registration', {}, true),
};

// Committee APIs
export const committeeAPI = {
    getAll: () => apiFetch('/committee', {}, true),
    create: (data) =>
        apiFetch('/committee', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    update: (id, data) =>
        apiFetch(`/committee/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),
    delete: (id) =>
        apiFetch(`/committee/${id}`, { method: 'DELETE' }, true),
};

export default apiFetch;
