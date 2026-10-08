import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - guards routes based on auth and role
 * @param {string|string[]} allowedRoles - roles that can access this route
 * @param {React.ReactNode} children
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();

    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        user = userStr ? JSON.parse(userStr) : null;
    } catch {
        user = null;
    }

    // Not logged in → redirect to home (login modal will open)
    if (!user || !user.token) {
        return <Navigate to="/" state={{ from: location, requireLogin: true }} replace />;
    }

    // Role check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard
        const redirectTo = user.role === 'player' ? '/user/dashboard' : '/admin/dashboard';
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
