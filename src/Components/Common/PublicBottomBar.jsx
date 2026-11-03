import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Authentication from '../Admin/Authentication';
import { getCurrentUser } from '../../utils/auth';

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
    const user = getCurrentUser();

    const isHome = location.pathname === '/' || location.pathname === '';

    const handleTabClick = (tabName) => {
        if (!isHome) {
            navigate('/', { state: { targetTab: tabName } });
        } else {
            if (setActiveTab) {
                setActiveTab(tabName);
            }
            window.scrollTo({ top: 380, behavior: 'smooth' });
        }
    };

    const handleRegisterClick = () => {
        navigate('/registration');
    };

    const handleLoginClick = () => {
        if (user) {
            navigate(user.role === 'player' ? '/user/dashboard' : '/admin/dashboard');
        } else {
            setIsLoginModalOpen(true);
        }
    };

    const isLiveBoardActive = isHome && activeTab === 'Live Board';
    const isRouteMapActive = isHome && activeTab === 'Route Map';
    const isCommitteeActive = isHome && activeTab === 'Organizing Committee';

    return (
        <>
            {/* Clean Floating Bottom Navigation Bar */}
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
                    py: 0.8,
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
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 0.6,
                            py: 0.4,
                            bgcolor: 'transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <LiveBoardIcon size={20} color={isLiveBoardActive ? '#d06c38' : '#0b3558'} />
                        <Typography
                            sx={{
                                fontSize: '10.5px',
                                fontWeight: isLiveBoardActive ? 800 : 600,
                                color: isLiveBoardActive ? '#d06c38' : '#0b3558',
                                mt: 0.3,
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Live Board
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: '22px',
                            height: '3px',
                            bgcolor: isLiveBoardActive ? '#d06c38' : 'transparent',
                            borderRadius: '2px',
                            mt: 0.3,
                            transition: 'background-color 0.2s ease',
                        }}
                    />
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
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 0.6,
                            py: 0.4,
                            bgcolor: 'transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <RouteMapIcon size={21} color={isRouteMapActive ? '#d06c38' : '#0b3558'} />
                        <Typography
                            sx={{
                                fontSize: '10.5px',
                                fontWeight: isRouteMapActive ? 800 : 600,
                                color: isRouteMapActive ? '#d06c38' : '#0b3558',
                                mt: 0.3,
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Route Map
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: '22px',
                            height: '3px',
                            bgcolor: isRouteMapActive ? '#d06c38' : 'transparent',
                            borderRadius: '2px',
                            mt: 0.3,
                            transition: 'background-color 0.2s ease',
                        }}
                    />
                </Box>

                {/* 3. Center Raised Floating Register Button (Tab 3) */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        top: '-18px',
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
                                fontWeight: 800,
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

                {/* 4. Organizing Committee (Tab 4) */}
                <Box
                    onClick={() => handleTabClick('Organizing Committee')}
                    sx={{
                        flex: 1.15,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 0.4,
                            py: 0.4,
                            bgcolor: 'transparent',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                        }}
                    >
                        <GroupsOutlinedIcon sx={{ fontSize: '22px', color: isCommitteeActive ? '#d06c38' : '#0b3558' }} />
                        <Typography
                            sx={{
                                fontSize: '9.5px',
                                fontWeight: isCommitteeActive ? 800 : 600,
                                color: isCommitteeActive ? '#d06c38' : '#0b3558',
                                mt: 0.2,
                                textAlign: 'center',
                                lineHeight: 1.1,
                                transition: 'color 0.2s ease',
                            }}
                        >
                            Organizing<br />Committee
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: '22px',
                            height: '3px',
                            bgcolor: isCommitteeActive ? '#d06c38' : 'transparent',
                            borderRadius: '2px',
                            mt: 0.3,
                            transition: 'background-color 0.2s ease',
                        }}
                    />
                </Box>

                {/* Divider Line between Committee and Login */}
                <Box
                    sx={{
                        width: '1px',
                        height: '24px',
                        bgcolor: '#E2E8F0',
                        mx: { xs: 0.2, sm: 0.4 },
                        flexShrink: 0,
                    }}
                />

                {/* 5. Login / Dashboard (Tab 5) */}
                <Box
                    onClick={handleLoginClick}
                    sx={{
                        flex: 0.85,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        py: 0.4,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: 0.4,
                            py: 0.4,
                        }}
                    >
                        {user ? (
                            <>
                                <DashboardIcon sx={{ fontSize: '21px', color: '#0b3558' }} />
                                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#0b3558', mt: 0.3, whiteSpace: 'nowrap', lineHeight: 1 }}>
                                    Dashboard
                                </Typography>
                            </>
                        ) : (
                            <>
                                <AppLoginIcon size={20} color="#0b3558" />
                                <Typography sx={{ fontSize: '10.5px', fontWeight: 600, color: '#0b3558', mt: 0.3, whiteSpace: 'nowrap', lineHeight: 1 }}>
                                    Login
                                </Typography>
                            </>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: '22px',
                            height: '3px',
                            bgcolor: 'transparent',
                            borderRadius: '2px',
                            mt: 0.3,
                        }}
                    />
                </Box>
            </Box>

            <Authentication open={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};

export default PublicBottomBar;
