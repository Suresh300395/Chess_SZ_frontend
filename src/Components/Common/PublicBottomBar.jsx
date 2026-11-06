import React, { useState, useEffect } from 'react';
import { Box, Typography, Drawer, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import Authentication from '../Admin/Authentication';
import { getCurrentUser, clearAuthSession } from '../../utils/auth';
import { SOCKET_URL } from '../../utils/api';
import { scrollToTabContainer } from '../../utils/scrollUtils';

const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
        return photoPath;
    }
    return `${SOCKET_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
};

// 3-squares Board Icon matching the design
const LiveBoardIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.8" />
        <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.8" />
        <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.8" />
    </svg>
);

// Route Map Pin on Map Icon matching the design
const RouteMapIcon = ({ size = 22, color = 'currentColor' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2a4.2 4.2 0 0 0-4.2 4.2c0 2.8 4.2 6.8 4.2 6.8s4.2-4 4.2-6.8a4.2 4.2 0 0 0-4.2-4.2z" />
        <circle cx="12" cy="6.2" r="1.5" />
        <path d="M4 16.8l5.2-2 5.6 2 5.2-2v4.2l-5.2 2-5.6-2-5.2 2v-4.2z" />
    </svg>
);

// Calendar Register Icon matching the design
const RegisterCalendarIcon = ({ size = 22, color = '#ffffff' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" />
        <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
        <line x1="8" y1="2" x2="8" y2="5" />
        <line x1="16" y1="2" x2="16" y2="5" />
    </svg>
);

// 3-dots More Icon
const MoreIcon = ({ size = 21, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <circle cx="5" cy="12" r="2.2" />
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="19" cy="12" r="2.2" />
    </svg>
);

// Login Icon matching the design
const AppLoginIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <polyline points="10 16 14 12 10 8" />
        <line x1="14" y1="12" x2="3" y2="12" />
    </svg>
);

const PublicBottomBar = ({ activeTab = 'Live Board', setActiveTab }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

    useEffect(() => {
        const handleAuthChange = () => {
            setCurrentUser(getCurrentUser());
        };
        window.addEventListener('authChange', handleAuthChange);
        window.addEventListener('storage', handleAuthChange);
        return () => {
            window.removeEventListener('authChange', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    const isHome = location.pathname === '/' || location.pathname === '';

    const handleTabClick = (tabName) => {
        if (!isHome) {
            navigate('/', { state: { targetTab: tabName } });
        } else {
            if (setActiveTab) {
                setActiveTab(tabName);
            }
            scrollToTabContainer();
        }
    };

    const handleRegisterClick = () => {
        navigate('/registration');
    };

    const handleProfileClick = (event) => {
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileClose = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setProfileMenuAnchor(null);
    };

    const handleLogout = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setProfileMenuAnchor(null);
        clearAuthSession(false);
        setCurrentUser(null);
        navigate('/');
    };

    const handleGoPath = (path) => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setProfileMenuAnchor(null);
        navigate(path);
    };

    const roleLower = (currentUser?.role || '').toLowerCase();
    const isAdminOrSuperAdmin = roleLower === 'admin' || roleLower === 'superadmin';
    const isUserOrPlayer = Boolean(currentUser) && !isAdminOrSuperAdmin;
    const isDashboardPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');

    const isAboutActive = isHome && activeTab === 'About';
    const isLiveBoardActive = isHome && activeTab === 'Live Board';
    const isRouteMapActive = isHome && activeTab === 'Route Map';
    const isCommitteeActive = isHome && activeTab === 'Organizing Committee';
    const isMoreActive = isCommitteeActive || isAboutActive;
    const isProfileActive = location.pathname.includes('/dashboard') || Boolean(profileMenuAnchor);

    const moreModules = [
        {
            id: 'about',
            name: 'About Tournament',
            icon: <InfoOutlinedIcon />,
            isActive: isAboutActive,
            onClick: () => {
                setIsMoreDrawerOpen(false);
                handleTabClick('About');
            }
        },
        {
            id: 'committee',
            name: 'Organizing Committee',
            icon: <GroupsOutlinedIcon />,
            isActive: isCommitteeActive,
            onClick: () => {
                setIsMoreDrawerOpen(false);
                handleTabClick('Organizing Committee');
            }
        }
    ];

    return (
        <>
            {/* Clean Floating Bottom Navigation Bar (Mobile only) */}
            <Box
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'fixed',
                    bottom: { xs: '12px', sm: '16px' },
                    left: { xs: '8px', sm: '16px' },
                    right: { xs: '8px', sm: '16px' },
                    maxWidth: '425px',
                    mx: 'auto',
                    zIndex: 1200,
                    bgcolor: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    px: { xs: 0.8, sm: 1.2 },
                    py: 0,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* 1. Live Board (Tab 1) */}
                <Box
                    onClick={() => handleTabClick('Live Board')}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        py: 0.4,
                        minHeight: '38px',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <LiveBoardIcon
                        size={isLiveBoardActive ? 23 : 20}
                        color={isLiveBoardActive ? '#0b5299' : '#64748b'}
                    />
                    {!isLiveBoardActive && (
                        <Typography
                            sx={{
                                fontSize: '10.5px',
                                fontWeight: 400,
                                color: '#64748b',
                                mt: 0.3,
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Live Board
                        </Typography>
                    )}
                </Box>

                {/* 2. Route Map (Tab 2) */}
                <Box
                    onClick={() => handleTabClick('Route Map')}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        py: 0.4,
                        minHeight: '38px',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <RouteMapIcon
                        size={isRouteMapActive ? 23 : 21}
                        color={isRouteMapActive ? '#0b5299' : '#64748b'}
                    />
                    {!isRouteMapActive && (
                        <Typography
                            sx={{
                                fontSize: '10.5px',
                                fontWeight: 400,
                                color: '#64748b',
                                mt: 0.3,
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Route Map
                        </Typography>
                    )}
                </Box>

                {/* 3. Center Raised Floating Register Button (Tab 3) */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        top: '-33px',
                        zIndex: 2,
                        flexShrink: 0,
                        mx: 0.4,
                    }}
                >
                    <Box
                        onClick={handleRegisterClick}
                        sx={{
                            width: '62px',
                            height: '62px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF6A00 0%, #EE5100 100%)',
                            border: '4.5px solid #ffffff',
                            boxShadow: '0 6px 18px rgba(238, 81, 0, 0.45)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 8px 24px rgba(238, 81, 0, 0.55)',
                            },
                            '&:active': {
                                transform: 'scale(0.95)',
                            },
                        }}
                    >
                        <RegisterCalendarIcon size={21} color="#ffffff" />
                        <Typography
                            sx={{
                                fontSize: '9.5px',
                                fontWeight: 300,
                                color: '#ffffff',
                                lineHeight: 1,
                                letterSpacing: '0.2px',
                                mt: 0.3,
                            }}
                        >
                            Register
                        </Typography>
                    </Box>
                </Box>

                {/* 4. More (Tab 4 with All Modules Drawer) */}
                <Box
                    onClick={() => setIsMoreDrawerOpen(true)}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        py: 0.4,
                        minHeight: '38px',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <MoreIcon
                        size={(isMoreActive || isMoreDrawerOpen) ? 23 : 21}
                        color={(isMoreActive || isMoreDrawerOpen) ? '#0b5299' : '#64748b'}
                    />
                    {!(isMoreActive || isMoreDrawerOpen) && (
                        <Typography
                            sx={{
                                fontSize: '10.5px',
                                fontWeight: 400,
                                color: '#64748b',
                                mt: 0.3,
                                textAlign: 'center',
                                lineHeight: 1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            More
                        </Typography>
                    )}
                </Box>

                {/* Divider Line between More and Profile/Login */}
                <Box
                    sx={{
                        width: '1px',
                        height: '24px',
                        bgcolor: '#E2E8F0',
                        mx: { xs: 0.2, sm: 0.4 },
                        flexShrink: 0,
                    }}
                />

                {/* 5. Profile Avatar (When Logged in) OR Login (When Logged out) */}
                {currentUser ? (
                    <Box
                        onClick={handleProfileClick}
                        sx={{
                            flex: 0.85,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            py: 0.4,
                            minHeight: '38px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Box
                            sx={{
                                width: isProfileActive ? 35 : 33,
                                height: isProfileActive ? 35 : 33,
                                borderRadius: '50%',
                                border: isProfileActive ? '2px solid #0b5299' : '2px solid #64748b',
                                p: '2px',
                                boxSizing: 'border-box',
                                bgcolor: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {currentUser?.photo ? (
                                <Avatar
                                    src={resolvePhotoUrl(currentUser.photo)}
                                    alt={currentUser.name || 'User'}
                                    sx={{
                                        width: isProfileActive ? 27 : 25,
                                        height: isProfileActive ? 27 : 25,
                                    }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        width: isProfileActive ? 27 : 25,
                                        height: isProfileActive ? 27 : 25,
                                        borderRadius: '50%',
                                        bgcolor: isProfileActive ? '#0b5299' : '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <PersonIcon
                                        sx={{
                                            fontSize: isProfileActive ? 20 : 18.5,
                                            color: '#ffffff',
                                            display: 'block',
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box
                        onClick={() => setIsLoginModalOpen(true)}
                        sx={{
                            flex: 0.85,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            py: 0.4,
                            minHeight: '38px',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <AppLoginIcon
                            size={isLoginModalOpen ? 23 : 20}
                            color={isLoginModalOpen ? '#0b5299' : '#64748b'}
                        />
                        {!isLoginModalOpen && (
                            <Typography
                                sx={{
                                    fontSize: '10.5px',
                                    fontWeight: 400,
                                    color: '#64748b',
                                    mt: 0.3,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1,
                                    transition: 'color 0.2s ease',
                                }}
                            >
                                Login
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* Profile Menu for Logged In User in PublicBottomBar */}
            {currentUser && (
                <Menu
                    anchorEl={profileMenuAnchor}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileClose}
                    disableRestoreFocus
                    autoFocus={false}
                    transitionDuration={{ enter: 200, exit: 0 }}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    slotProps={{
                        paper: {
                            elevation: 8,
                            sx: {
                                mb: 1.5,
                                borderRadius: '16px',
                                minWidth: '220px',
                                p: 1.2,
                                boxShadow: '0 -4px 24px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
                                border: '1px solid #e2e8f0',
                            }
                        },
                        list: {
                            autoFocusItem: false,
                            autoFocus: false,
                        }
                    }}
                >
                    {/* User Card Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            p: 1,
                            mb: 0.8,
                            bgcolor: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #edf2f7',
                        }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                border: '2px solid #0b5299',
                                p: '2px',
                                boxSizing: 'border-box',
                                bgcolor: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Avatar
                                src={resolvePhotoUrl(currentUser?.photo)}
                                sx={{ width: 34, height: 34, bgcolor: '#0b5299' }}
                            >
                                <PersonIcon sx={{ fontSize: 22, color: '#ffffff' }} />
                            </Avatar>
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2,
                                }}
                            >
                                {currentUser?.name || currentUser?.username || 'User'}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#64748b',
                                    textTransform: 'capitalize',
                                    lineHeight: 1.2,
                                    mt: 0.3,
                                }}
                            >
                                {currentUser?.role || 'Player'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Dynamic Navigation Option: If on dashboard -> show Home; If on home/public -> show Dashboard */}
                    {isDashboardPage ? (
                        <MenuItem
                            onClick={(e) => {
                                e.currentTarget.blur();
                                handleGoPath('/');
                            }}
                            sx={{
                                borderRadius: '8px',
                                py: 1,
                                px: 1.2,
                                gap: 1.2,
                                color: '#0b5299',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                mb: 0.5,
                            }}
                        >
                            <HomeIcon sx={{ fontSize: 19, color: '#0b5299' }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0b5299' }}>
                                Home
                            </Typography>
                        </MenuItem>
                    ) : (
                        <MenuItem
                            onClick={(e) => {
                                e.currentTarget.blur();
                                handleGoPath(isAdminOrSuperAdmin ? '/admin/dashboard' : '/user/dashboard');
                            }}
                            sx={{
                                borderRadius: '8px',
                                py: 1,
                                px: 1.2,
                                gap: 1.2,
                                color: '#0b5299',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                mb: 0.5,
                            }}
                        >
                            <DashboardIcon sx={{ fontSize: 19, color: '#0b5299' }} />
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0b5299' }}>
                                {isAdminOrSuperAdmin ? 'Dashboard' : 'User Dashboard'}
                            </Typography>
                        </MenuItem>
                    )}

                    {/* Logout Option */}
                    <MenuItem
                        onClick={(e) => {
                            e.currentTarget.blur();
                            handleLogout();
                        }}
                        sx={{
                            borderRadius: '8px',
                            py: 1,
                            px: 1.2,
                            gap: 1.2,
                            color: '#d32f2f',
                            bgcolor: '#fff5f5',
                            '&:hover': { bgcolor: '#ffebee' },
                            mt: 0.2,
                        }}
                    >
                        <LogoutIcon sx={{ fontSize: 19, color: '#d32f2f' }} />
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#d32f2f' }}>
                            Logout
                        </Typography>
                    </MenuItem>
                </Menu>
            )}

            {/* Bottom Sheet Drawer for All Modules (Matching Image 2) */}
            <Drawer
                anchor="bottom"
                open={isMoreDrawerOpen}
                onClose={() => {
                    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                    setIsMoreDrawerOpen(false);
                }}
                disableRestoreFocus
                transitionDuration={{ enter: 225, exit: 0 }}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: '18px 18px 0 0',
                            maxHeight: '85vh',
                            bgcolor: '#ffffff',
                            overflowX: 'hidden !important',
                            overflowY: 'auto',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
                            maxWidth: '520px',
                            mx: 'auto'
                        }
                    }
                }}
            >
                <Box
                    sx={{
                        p: { xs: 1.5, sm: 2.5 },
                        pb: { xs: 3.5, sm: 4 },
                        width: '100%',
                        boxSizing: 'border-box',
                        overflowX: 'hidden !important'
                    }}
                >
                    {/* Drag pill handle */}
                    <Box sx={{ width: 40, height: 4, bgcolor: '#cbd5e1', borderRadius: 2, mx: 'auto', mb: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0b5299', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                                All Modules
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '11px', sm: '12px' } }}>
                                Tap any module below to quickly navigate
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setIsMoreDrawerOpen(false)} size="small" sx={{ bgcolor: '#f1f5f9', flexShrink: 0 }}>
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Modules Grid - Strictly fits screen width with 2 columns */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: { xs: 1, sm: 1.25 },
                            overflowY: 'auto',
                            overflowX: 'hidden !important',
                            maxHeight: '60vh',
                            width: '100%',
                            boxSizing: 'border-box',
                            p: 0.25
                        }}
                    >
                        {moreModules.map((item) => {
                            const isSelected = item.isActive;
                            return (
                                <Box
                                    key={item.id}
                                    onClick={item.onClick}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: 0.9, sm: 1.1 },
                                        p: { xs: 0.9, sm: 1.2 },
                                        minWidth: 0,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        borderRadius: 1.5,
                                        bgcolor: isSelected ? 'rgba(208, 108, 56, 0.08)' : '#f8fafc',
                                        border: isSelected ? '1.5px solid #d06c38' : '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:active': { transform: 'scale(0.97)', bgcolor: 'rgba(208, 108, 56, 0.12)' }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: { xs: 32, sm: 36 },
                                            height: { xs: 32, sm: 36 },
                                            borderRadius: '8px',
                                            bgcolor: isSelected ? '#d06c38' : '#ffffff',
                                            color: isSelected ? '#ffffff' : '#0b5299',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                                            flexShrink: 0,
                                            '& svg': {
                                                fontSize: { xs: 18, sm: 20 }
                                            }
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontWeight: isSelected ? 700 : 600,
                                            color: isSelected ? '#d06c38' : '#334155',
                                            fontSize: { xs: '11px', sm: '12px' },
                                            lineHeight: 1.25,
                                            minWidth: 0,
                                            flex: 1,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Drawer>

            <Authentication open={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};

export default PublicBottomBar;
