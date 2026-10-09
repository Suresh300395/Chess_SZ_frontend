import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Box, Menu, MenuItem, Avatar, IconButton, Divider, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Authentication from '../Admin/Authentication';

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const lastScrollY = useRef(0);
    const navigate = useNavigate();
    const location = useLocation();

    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChange'));
        setUser(null);
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
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) { }
            } else {
                setUser(null);
            }
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
                <Box className="header-logos-wrapper">
                    <Box component={Link} to="/" className="header-logo">
                        <Box component="img" src="/Circle_logo.svg?v=3" alt="Aditya Logo Mobile" className="logo-img mobile-only-logo" />
                        <Box component="img" src="/ADITYA LOGO2.png" alt="Aditya Logo" className="logo-img desktop-only-logo" />
                    </Box>
                    <Box className="header-vr"></Box>
                    <Box component="img" src="/Golden Chess.svg" alt="Golden Chess Logo" className="logo-img chess-logo" />
                </Box>

                <Box component="nav" className="header-nav">
                    {user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5, transition: 'opacity 0.2s', '&:hover': { opacity: 0.8 } }} onClick={handleMenuOpen}>
                                <Box sx={{ p: 0.5, bgcolor: '#e3f2fd', border: '2px solid #fff', boxShadow: '0 0 0 2px #e3f2fd', borderRadius: '50%' }}>
                                    <Avatar sx={{ bgcolor: '#0b5299', width: 35, height: 35 }}>
                                        <PersonIcon />
                                    </Avatar>
                                </Box>
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Typography sx={{ fontSize: '15px', color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                                        {user.name || user.username}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#64748b', fontWeight: 500, lineHeight: 1.2, mt: 0.3, textTransform: 'capitalize' }}>
                                        {user.role || 'Player'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
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
                                {/* <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight="600" color="#0b5299">
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {user.name || user.username}
                                    </Typography>

                                </Box> */}
                                {/* <Divider sx={{ my: 1 }} /> */}
                                <MenuItem onClick={() => {
                                    handleMenuClose();
                                    if (isDashboard) {
                                        navigate('/');
                                    } else {
                                        navigate(user.role === 'player' ? '/user/dashboard' : '/admin/dashboard');
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
                        <Box onClick={() => setIsLoginModalOpen(true)} className="nav-link btn-nav" sx={{ cursor: 'pointer' }}>Login</Box>
                    )}
                </Box>
            </Box>

            <Authentication open={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </Box>
    );
};

export default Header;