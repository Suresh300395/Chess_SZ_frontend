import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import EastIcon from '@mui/icons-material/East';
import LoginIcon from '@mui/icons-material/Login';
import Authentication from '../Admin/Authentication';
import { getCurrentUser } from '../../utils/auth';
import ProfilePopover from './ProfilePopover';

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const user = getCurrentUser();
    const [currentUser, setCurrentUser] = useState(user);
    const lastScrollY = useRef(0);
    const location = useLocation();

    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');
    const isRegistrationPage = location.pathname.startsWith('/registration');

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
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                            <ProfilePopover />
                        </Box>
                    ) : (
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                            {!isRegistrationPage && (
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
                            )}

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
