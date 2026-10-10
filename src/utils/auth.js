import { toast } from 'sonner';

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
export const USER_KEY = 'user';
export const LAST_ACTIVITY_KEY = 'lastActivity';

/**
 * Get the currently authenticated user if session is valid and active.
 * If expired (or missing lastActivity timestamp from previous session),
 * it clears the storage and returns null.
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;

        const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        const lastActivity = Number(lastActivityStr);
        const now = Date.now();

        // Expire if no lastActivity timestamp or elapsed time >= 15 minutes
        if (!lastActivityStr || isNaN(lastActivity) || (now - lastActivity) >= INACTIVITY_TIMEOUT_MS) {
            clearAuthSession(false); // Clean up stale session
            return null;
        }

        return JSON.parse(userStr);
    } catch (e) {
        clearAuthSession(false);
        return null;
    }
};

/**
 * Save user authentication data on successful login.
 */
export const saveAuthSession = (userData) => {
    const now = Date.now();
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    window.dispatchEvent(new Event('authChange'));
};

/**
 * Clear authentication session and notify app.
 * @param {boolean} notifyExpired - whether to show the inactivity expiration toast
 */
export const clearAuthSession = (notifyExpired = false) => {
    const hadUser = Boolean(localStorage.getItem(USER_KEY));
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    window.dispatchEvent(new CustomEvent('authChange', { detail: { expired: notifyExpired } }));

    if (notifyExpired && hadUser) {
        toast.warning('Session expired due to 15 minutes of inactivity. Please login again.', {
            id: 'session-expired-toast',
            duration: 5000,
        });
    }
};

/**
 * Throttled recording of user activity.
 * Updates lastActivity timestamp in localStorage.
 */
let lastThrottleTime = 0;
export const recordActivity = () => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return;

    const now = Date.now();
    // Throttle localStorage updates to at most once every 3 seconds
    if (now - lastThrottleTime >= 3000) {
        lastThrottleTime = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }
};

/**
 * Check if the active session is expired.
 */
export const isSessionExpired = () => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return false;

    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return true;

    const lastActivity = Number(lastActivityStr);
    if (isNaN(lastActivity)) return true;

    return (Date.now() - lastActivity) >= INACTIVITY_TIMEOUT_MS;
};

/**
 * Update current user session with partial data (e.g. photo update)
 */
export const updateUserSession = (partialData) => {
    try {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        const currentUser = JSON.parse(userStr);
        const updated = { ...currentUser, ...partialData };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('authChange'));
        return updated;
    } catch {
        return null;
    }
};
