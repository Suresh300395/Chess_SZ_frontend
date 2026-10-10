import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    getCurrentUser,
    recordActivity,
    clearAuthSession,
    INACTIVITY_TIMEOUT_MS,
    LAST_ACTIVITY_KEY,
    USER_KEY
} from '../../utils/auth';

/**
 * InactivityTracker
 * Actively monitors user activity (mouse, keyboard, scroll, clicks).
 * Automatically expires the session after 15 minutes of inactivity,
 * shows a toast alert, and redirects away from protected routes.
 */
const InactivityTracker = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCheckingRef = useRef(false);

    useEffect(() => {
        // Initial session validation on mount / route change
        const user = getCurrentUser();
        const isProtectedRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user');

        if (!user && isProtectedRoute) {
            navigate('/', { replace: true });
        }

        const handleUserActivity = () => {
            recordActivity();
        };

        const checkExpiration = () => {
            if (isCheckingRef.current) return;
            isCheckingRef.current = true;

            const userStr = localStorage.getItem(USER_KEY);
            if (userStr) {
                const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
                const lastActivity = Number(lastActivityStr);
                const now = Date.now();

                if (!lastActivityStr || isNaN(lastActivity) || (now - lastActivity) >= INACTIVITY_TIMEOUT_MS) {
                    clearAuthSession(true);
                    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/user')) {
                        navigate('/', { replace: true });
                    }
                }
            }

            isCheckingRef.current = false;
        };

        // Events that demonstrate active user presence
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, handleUserActivity, { passive: true });
        });

        // Periodic check every 5 seconds
        const intervalId = setInterval(checkExpiration, 5000);

        // Immediate check when tab is focused or un-hidden (e.g. computer wakes up or tab switched back)
        const handleVisibilityOrFocus = () => {
            if (!document.hidden) {
                checkExpiration();
            }
        };

        // Multi-tab synchronization
        const handleStorageChange = (e) => {
            if (e.key === USER_KEY && !e.newValue) {
                if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/user')) {
                    navigate('/', { replace: true });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, handleUserActivity);
            });
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [navigate, location.pathname]);

    return null;
};

export default InactivityTracker;
