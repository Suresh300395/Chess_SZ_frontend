import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import Header from './Header';
import Layout from './Layout';
import MobileBottomBar from './MobileBottomBar';
import { AnimatedPage } from '../../animations';
import { getMenusByRole } from './RolesNav';
import { getCurrentUser, updateUserSession } from '../../../utils/auth';
import { authAPI, SOCKET_URL } from '../../../utils/api';

const Main_layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(getCurrentUser() || { role: 'admin' });

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(getCurrentUser() || { role: 'admin' });
        };
        window.addEventListener('authChange', handleAuthChange);

        // Listen for real-time permission updates
        const socket = io(SOCKET_URL);
        socket.on('admins_updated', async () => {
            try {
                const currentUser = getCurrentUser();
                if (currentUser?.token && currentUser.role !== 'superadmin') {
                    const res = await authAPI.getMe();
                    if (res.ok) {
                        const fresh = await res.json();
                        updateUserSession({ allowedModules: fresh.allowedModules });
                        setUser(prev => ({ ...prev, allowedModules: fresh.allowedModules }));
                    }
                }
            } catch (err) {
                console.error('Error refreshing admin permissions:', err);
            }
        });

        return () => {
            window.removeEventListener('authChange', handleAuthChange);
            socket.disconnect();
        };
    }, []);

    const menus = getMenusByRole(user?.role, user?.allowedModules);

    // Route guard for sub-admins with mapped modules
    useEffect(() => {
        if (user?.role === 'admin' && Array.isArray(user?.allowedModules)) {
            const isAllowed = menus.some(m => m.path === location.pathname);
            if (!isAllowed && menus.length > 0) {
                toast.warning('You do not have permission to access this module', { id: 'module-denied' });
                navigate(menus[0].path, { replace: true });
            }
        }
    }, [location.pathname, user?.role, user?.allowedModules, menus, navigate]);

    const hasNoModules = user?.role === 'admin' && Array.isArray(user?.allowedModules) && user?.allowedModules.length === 0;

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#FAF6F3' }}>
            {/* Desktop Permanent Sidebar - Hidden on mobile (< lg) */}
            <Box sx={{ display: { xs: 'none', lg: 'block' }, flexShrink: 0, height: '100vh' }}>
                <Sidebar />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
                <Header title="Dashboard Overview" />
                
                {/* Scrollable Content Area with bottom clearance for MobileBottomBar on mobile */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: { xs: 1, sm: 1.5, md: 2 },
                        pb: { xs: '90px', lg: 2 },
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Layout>
                        {hasNoModules ? (
                            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', maxWidth: 450, borderRadius: 3, border: '1px solid #fee2e2', bgcolor: '#fff5f5' }}>
                                    <BlockIcon sx={{ fontSize: 50, color: '#ef4444', mb: 1.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#991b1b', mb: 1 }}>
                                        No Modules Assigned
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
                                        Your admin account does not have access to any modules yet. Please contact the Super Admin to map modules to your account.
                                    </Typography>
                                </Paper>
                            </Box>
                        ) : (
                            <AnimatedPage key={location.pathname}>
                                <Outlet />
                            </AnimatedPage>
                        )}
                    </Layout>
                </Box>
            </Box>

            {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet < lg) */}
            <MobileBottomBar />
        </Box>
    );
};

export default Main_layout;

