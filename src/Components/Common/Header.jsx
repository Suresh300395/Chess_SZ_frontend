import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;

            // Add glassmorphism if scrolled down a bit
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

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <Box component="header" className={`main-header ${scrolled ? 'header-scrolled' : ''} ${hidden ? 'header-hidden' : ''}`}>
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
                    <Box component={Link} to="/registration" className="nav-link btn-nav">Register Team</Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Header;