import { getCurrentUser, clearAuthSession, recordActivity } from './auth';

// Centralized API base URL - change this for production
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3003';

// Get auth token from current active session
const getToken = () => {
    try {
        const user = getCurrentUser();
        return user?.token || null;
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
    if (auth) {
        recordActivity();
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...buildHeaders(auth),
            ...(options.headers || {}),
        },
    });

    if (auth && (res.status === 401 || res.status === 403)) {
        // Token expired or unauthorized on protected requests — force logout
        clearAuthSession(true);
        throw new Error('Session expired. Please login again.');
    }

    if (auth && res.ok) {
        recordActivity();
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

    getMe: () => apiFetch('/auth/me', {}, true),

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

    forgotPassword: (identifier) =>
        apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ identifier }),
        }),

    verifyResetOtp: (identifier, otp) =>
        apiFetch('/auth/verify-reset-otp', {
            method: 'POST',
            body: JSON.stringify({ identifier, otp }),
        }),

    resetPassword: (resetToken, newPassword, confirmPassword) =>
        apiFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
        }),

    resendResetOtp: (identifier) =>
        apiFetch('/auth/resend-reset-otp', {
            method: 'POST',
            body: JSON.stringify({ identifier }),
        }),

    getDashboard: () => apiFetch('/auth/dashboard', {}, true),
    updateProfilePhoto: (photo) =>
        apiFetch('/auth/profile-photo', {
            method: 'PUT',
            body: JSON.stringify({ photo }),
        }, true),
    getAccommodationDetails: () => apiFetch('/auth/accommodation-details', {}, true),
    getFoodTokenDetails: () => apiFetch('/auth/food-token-details', {}, true),
};

// Registration APIs
export const registrationAPI = {
    submit: (payload) =>
        apiFetch('/registration', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    searchUniversities: (query, signal) =>
        apiFetch(`/registration/search-universities?q=${encodeURIComponent(query)}`, { signal }),

    getUniversityById: (id) =>
        apiFetch(`/registration/university/${encodeURIComponent(id)}`),

    getAll: () => apiFetch('/registration', {}, true),

    assignRoom: (data) =>
        apiFetch('/registration/assign-room', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    bulkAssignRoom: (data) =>
        apiFetch('/registration/bulk-assign-room', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    unassignRoom: (data) =>
        apiFetch('/registration/unassign-room', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    payCautionDeposit: (data) =>
        apiFetch('/registration/caution-deposit', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    sendCautionDepositRefundOtp: (data) =>
        apiFetch('/registration/caution-deposit/send-refund-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    refundCautionDeposit: (data) =>
        apiFetch('/registration/caution-deposit/refund', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    resetCautionDeposit: (data) =>
        apiFetch('/registration/caution-deposit', {
            method: 'DELETE',
            body: JSON.stringify(data),
        }, true),
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
    updateOrder: (id, order) =>
        apiFetch(`/committee/${id}/order`, {
            method: 'PUT',
            body: JSON.stringify({ order }),
        }, true),
    delete: (id) =>
        apiFetch(`/committee/${id}`, { method: 'DELETE' }, true),
};

// Food Token APIs
export const foodTokenAPI = {
    searchPeople: (search = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        return apiFetch(`/food-tokens/people?${params.toString()}`, {}, true);
    },
    issue: (data) =>
        apiFetch('/food-tokens/issue', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    issueBulk: (data) =>
        apiFetch('/food-tokens/issue-bulk', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    issueDay: (data) =>
        apiFetch('/food-tokens/issue-day', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    reprint: (id) =>
        apiFetch(`/food-tokens/${id}/reprint`, {
            method: 'POST',
        }, true),
    cancel: (id, reason) =>
        apiFetch(`/food-tokens/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }, true),
    verify: (code) =>
        apiFetch('/food-tokens/verify', {
            method: 'POST',
            body: JSON.stringify({ code }),
        }, true),
    redeem: (code) =>
        apiFetch('/food-tokens/redeem', {
            method: 'POST',
            body: JSON.stringify({ code }),
        }, true),
    getAll: (params = {}) => {
        const cleanParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleanParams.append(k, v);
            }
        });
        return apiFetch(`/food-tokens?${cleanParams.toString()}`, {}, true);
    },
    getStats: (params = {}) => {
        const cleanParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleanParams.append(k, v);
            }
        });
        const query = cleanParams.toString();
        return apiFetch(`/food-tokens/stats${query ? `?${query}` : ''}`, {}, true);
    },
    getMissingDeparture: () => apiFetch('/food-tokens/missing-departure', {}, true),
    updateDeparture: (payload) =>
        apiFetch('/food-tokens/update-departure', {
            method: 'PUT',
            body: JSON.stringify(payload)
        }, true),
};

// Route Map APIs
export const routeMapAPI = {
    get: () => apiFetch('/route-map'),
    update: (data) =>
        apiFetch('/route-map', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),
    deleteImage: () =>
        apiFetch('/route-map', {
            method: 'DELETE',
        }, true),
};

// Live Board APIs
export const liveBoardAPI = {
    get: () => apiFetch('/live-board'),
    update: (data) =>
        apiFetch('/live-board', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),
};

// Blocks & Hostel APIs
export const blocksAPI = {
    getAll: () => apiFetch('/blocks'),
    create: (data) => apiFetch('/blocks', { method: 'POST', body: JSON.stringify(data) }, true),
    update: (id, data) => apiFetch(`/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),
    delete: (id) => apiFetch(`/blocks/${id}`, { method: 'DELETE' }, true),
    getCategories: () => apiFetch('/blocks/categories'),
    createCategory: (data) => apiFetch('/blocks/categories', { method: 'POST', body: JSON.stringify(data) }, true),
    deleteCategory: (id) => apiFetch(`/blocks/categories/${id}`, { method: 'DELETE' }, true),
    getGuidelines: () => apiFetch('/blocks/guidelines'),
    updateGuidelines: (points) => apiFetch('/blocks/guidelines', { method: 'PUT', body: JSON.stringify({ points }) }, true),
};

// University Master APIs
export const universityMasterAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.q) query.append('q', params.q);
        if (params.status) query.append('status', params.status);
        if (params.state) query.append('state', params.state);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        const qs = query.toString();
        return apiFetch(`/universities${qs ? `?${qs}` : ''}`, {}, true);
    },

    getStats: () => apiFetch('/universities/stats', {}, true),

    searchActive: (q, signal) =>
        apiFetch(`/universities/search-active?q=${encodeURIComponent(q)}`, { signal }),

    checkDuplicate: (params = {}) => {
        const query = new URLSearchParams();
        if (params.name) query.append('name', params.name);
        if (params.shortCode) query.append('shortCode', params.shortCode);
        if (params.aliases) query.append('aliases', params.aliases);
        if (params.excludeId) query.append('excludeId', params.excludeId);
        return apiFetch(`/universities/check-duplicate?${query.toString()}`, {}, true);
    },

    create: (data) =>
        apiFetch('/universities', {
            method: 'POST',
            body: JSON.stringify(data)
        }, true),

    update: (id, data) =>
        apiFetch(`/universities/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, true),

    toggleStatus: (id) =>
        apiFetch(`/universities/${encodeURIComponent(id)}/status`, {
            method: 'PATCH'
        }, true),

    delete: (id) =>
        apiFetch(`/universities/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        }, true),

    bulkImport: (payload) =>
        apiFetch('/universities/bulk-import', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, true),

    getTemplateUrl: () => `${API_BASE}/universities/template`,
    getExportUrl: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status && params.status !== 'ALL') query.append('status', params.status);
        const token = getToken();
        if (token) query.append('token', token);
        const qs = query.toString();
        return `${API_BASE}/universities/export${qs ? `?${qs}` : ''}`;
    },
    exportExcel: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status && params.status !== 'ALL') query.append('status', params.status);
        const qs = query.toString();
        return apiFetch(`/universities/export${qs ? `?${qs}` : ''}`, {}, true);
    }
};

export default apiFetch;

