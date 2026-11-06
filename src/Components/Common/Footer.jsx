import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const Footer = ({ hasBottomBar: propHasBottomBar }) => {
    const location = useLocation();

    // Pages that have PublicBottomBar on mobile (Home & User Dashboard)
    const hasBottomBar = propHasBottomBar !== undefined
        ? propHasBottomBar
        : (location.pathname === '/' || location.pathname.startsWith('/user/dashboard'));

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#061d3a',
                color: 'rgba(255, 255, 255, 0.75)',
                pt: { xs: 3, sm: 2.5, md: 2.5 },
                pb: {
                    xs: hasBottomBar ? '135px' : 3,
                    sm: hasBottomBar ? '140px' : 2.5,
                    md: 2.5,
                },
                px: { xs: 2, sm: 4, md: 6 },
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                width: '100%',
                boxSizing: 'border-box',
                mt: 'auto',
                transition: 'padding-bottom 0.25s ease'
            }}
        >
            <Box
                sx={{
                    maxWidth: '1440px',
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: { xs: 1.5, md: 2 },
                    fontSize: { xs: '12px', sm: '13px' },
                    textAlign: { xs: 'center', md: 'left' }
                }}
            >
                {/* Left section: Copyright notice */}
                <Typography
                    variant="body2"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: 'inherit',
                        fontWeight: 400
                    }}
                >
                    © 2026 <Box component="span" sx={{ fontWeight: 700, color: '#ffffff' }}>Aditya University</Box>. All Rights Reserved.
                </Typography>

                {/* Right section: Credits */}
                <Typography
                    variant="body2"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: 'inherit',
                        fontWeight: 400
                    }}
                >
                    Designed & Developed with <Box component="span" sx={{ color: '#ef4444', mx: 0.25 }}>❤️</Box> by{' '}
                    <Box component="span" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        IT Applications
                    </Box>
                </Typography>
            </Box>
        </Box>
    );
};

export default Footer;
