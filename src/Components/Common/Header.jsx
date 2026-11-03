import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Menu, MenuItem, Avatar, IconButton, Divider, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import EastIcon from '@mui/icons-material/East';
import LoginIcon from '@mui/icons-material/Login';
import Authentication from '../Admin/Authentication';
import { getCurrentUser, clearAuthSession } from '../../utils/auth';
import { SOCKET_URL } from '../../utils/api';

const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
        return photoPath;
    }
    return `${SOCKET_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
};

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const user = getCurrentUser();
    const [currentUser, setCurrentUser] = useState(user);
    const [anchorEl, setAnchorEl] = useState(null);
    const lastScrollY = useRef(0);
    const navigate = useNavigate();
    const location = useLocation();

    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setAnchorEl(null);
    };

    const handleLogout = () => {
        clearAuthSession(false);
        setCurrentUser(null);
        handleMenuClose();
        navigate('/');
    };

    useEffect(() => {
        const handleScroll = (e) => {
            let currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

            if (e && e.target && e.target.scrollTop) {
                currentScrollY = Math.max(currentScrollY, e.target.scrollTop);
            }

            // Add solid color if scrolled down a bit
            if (currentScrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            // Hide header on scroll down, show on scroll up
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setHidden(true);
            } else {
                setHidden(false);
            }

            lastScrollY.current = currentScrollY;
        };

        const checkUser = () => {
            const current = getCurrentUser();
            setCurrentUser(current);
        };

        checkUser();
        // Listen for storage events (e.g. login/logout in other tabs) or custom dispatch
        window.addEventListener('storage', checkUser);
        window.addEventListener('authChange', checkUser);

        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('storage', checkUser);
            window.removeEventListener('authChange', checkUser);
        };
    }, []);

    return (
        <Box component="header" className={`main-header ${scrolled ? 'header-scrolled' : ''} ${hidden ? 'header-hidden' : ''} ${isDashboard ? 'header-dashboard' : ''}`}>
            <Box className="header-container">
                <Box className="header-logos-wrapper" sx={{ width: { xs: '100%', md: 'auto' }, display: 'flex', alignItems: 'center' }}>
                    <Box component={Link} to="/" className="header-logo">
                        <Box component="img" src="/ADITYA LOGO2.png" alt="Aditya Logo" className="logo-img" />
                    </Box>

                    {/* Vertical Divider Line between Aditya Logo and AIU Logo on Desktop */}
                    <Box className="header-vr" sx={{ display: { xs: 'none', md: 'block' } }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, md: 1.5 }, ml: { xs: 'auto', md: 0 } }}>
                        <Box component="img" src="/Association_of_Indian_Universities_Logo.svg" alt="Association of Indian Universities Logo" className="logo-img chess-logo aiu-logo" />
                    </Box>
                </Box>

                <Box component="nav" className="header-nav">
                    {currentUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5, transition: 'opacity 0.2s', '&:hover': { opacity: 0.8 } }} onClick={handleMenuOpen}>
                                <Box sx={{ p: 0.5, bgcolor: '#e3f2fd', border: '2px solid #fff', boxShadow: '0 0 0 2px #e3f2fd', borderRadius: '50%' }}>
                                    <Avatar sx={{ bgcolor: '#0b5299', width: 35, height: 35 }} src={resolvePhotoUrl(currentUser?.photo)}>
                                        <PersonIcon />
                                    </Avatar>
                                </Box>
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Typography sx={{ fontSize: '15px', color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                                        {currentUser.name || currentUser.username}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#64748b', fontWeight: 500, lineHeight: 1.2, mt: 0.3, textTransform: 'capitalize' }}>
                                        {currentUser.role || 'Player'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                disableRestoreFocus
                                disableAutoFocusItem
                                autoFocus={false}
                                slotProps={{
                                    paper: {
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.1))',
                                            mt: 1.5,
                                            borderRadius: 3,
                                            minWidth: 300,
                                            p: 2,
                                            '&:before': {
                                                content: '""',
                                                display: 'block',
                                                position: 'absolute',
                                                top: 0,
                                                right: 14,
                                                width: 10,
                                                height: 10,
                                                bgcolor: 'background.paper',
                                                transform: 'translateY(-50%) rotate(45deg)',
                                                zIndex: 0,
                                            },
                                        },
                                    }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={() => {
                                    handleMenuClose();
                                    if (isDashboard) {
                                        navigate('/');
                                    } else {
                                        navigate(currentUser.role === 'player' ? '/user/dashboard' : '/admin/dashboard');
                                    }
                                }} sx={{ borderRadius: 1, py: 1.5, mx: 2, mb: 0.5 }}>
                                    {isDashboard ? (
                                        <HomeIcon sx={{ mr: 2, color: '#0b5299' }} />
                                    ) : (
                                        <DashboardIcon sx={{ mr: 2, color: '#0b5299' }} />
                                    )}
                                    <Typography fontWeight="500" color="#0b5299">
                                        {isDashboard ? 'Home' : 'Dashboard'}
                                    </Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, py: 1.5, mx: 2, mb: 1, bgcolor: '#fff5f5', '&:hover': { bgcolor: '#ffebee' } }}>
                                    <LogoutIcon sx={{ mr: 2, color: '#d32f2f' }} />
                                    <Typography fontWeight="600" color="#d32f2f">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                            <Button
                                component={Link}
                                to="/registration"
                                sx={{
                                    background: 'linear-gradient(90deg, #d06c38 0%, #db6c30ff 100%)',
                                    color: '#ffffff !important',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 400,
                                    fontSize: { xs: '13px', sm: '15px' },
                                    letterSpacing: '0.2px',
                                    px: { xs: 1.4, sm: 2.4 },
                                    py: { xs: 0.6, sm: 0.9 },
                                    height: { xs: '36px', sm: '42px' },
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: { xs: 0.8, sm: 1.1 },
                                    transition: 'all 0.25s ease',
                                    textDecoration: 'none !important',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #FF7B1A 0%, #FF5A0D 100%)',
                                    }
                                }}
                            >
                                <PersonAddAlt1OutlinedIcon sx={{ fontSize: { xs: '18px', sm: '21px' }, color: '#ffffff' }} />
                                <Box sx={{ width: '1.5px', height: { xs: '14px', sm: '18px' }, bgcolor: 'rgba(255, 255, 255, 0.45)' }} />
                                <Typography component="span" sx={{ fontWeight: 700, fontSize: { xs: '13px', sm: '15px' }, color: '#ffffff', lineHeight: 1 }}>
                                    Register Now
                                </Typography>
                                <EastIcon sx={{ fontSize: { xs: '17px', sm: '20px' }, color: '#ffffff', ml: 0.2 }} />
                            </Button>

                            <Button
                                onClick={() => setIsLoginModalOpen(true)}
                                sx={{
                                    bgcolor: 'transparent',
                                    color: '#be9337 !important',
                                    border: '2px solid #be9337',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: { xs: '13px', sm: '15px' },
                                    letterSpacing: '0.2px',
                                    px: { xs: 1.4, sm: 2.2 },
                                    py: { xs: 0.6, sm: 0.9 },
                                    height: { xs: '36px', sm: '42px' },
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: { xs: 0.8, sm: 1.1 },
                                    transition: 'all 0.25s ease',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        bgcolor: '#fdf8ee',
                                        borderColor: '#ab812b',
                                        color: '#ab812b !important',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 3px 10px rgba(190, 147, 55, 0.2)'
                                    }
                                }}
                            >
                                <LoginIcon sx={{ fontSize: { xs: '18px', sm: '21px' }, color: 'inherit' }} />
                                <Box sx={{ width: '1.5px', height: { xs: '14px', sm: '18px' }, bgcolor: 'rgba(190, 147, 55, 0.45)' }} />
                                <Typography component="span" sx={{ fontWeight: 700, fontSize: { xs: '13px', sm: '15px' }, color: 'inherit', lineHeight: 1 }}>
                                    Login
                                </Typography>
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>

            <Authentication open={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </Box>
    );
};

export default Header;
