import React from 'react';
import { Box, Typography, Slide } from '@mui/material';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import { usePWA } from '../../hooks/usePWA';

/**
 * OfflineIndicator
 * Displays an elegant floating indicator when connectivity is lost,
 * and a brief restoration indicator when the device reconnects.
 */
const OfflineIndicator = () => {
    const { isOnline, showBackOnlinePill } = usePWA();

    const isVisible = !isOnline || showBackOnlinePill;

    if (!isVisible) {
        return null;
    }

    const isRestored = isOnline && showBackOnlinePill;

    return (
        <Slide direction="down" in={isVisible} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    top: { xs: 12, sm: 16 },
                    left: '50%',
                    transform: 'translateX(-50%) !important',
                    zIndex: 10000,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.8,
                    borderRadius: '24px',
                    bgcolor: isRestored ? '#15803d' : '#b45309',
                    color: '#ffffff',
                    boxShadow: isRestored
                        ? '0 8px 20px rgba(21, 128, 61, 0.35)'
                        : '0 8px 20px rgba(180, 83, 9, 0.35)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'none'
                }}
            >
                {isRestored ? (
                    <>
                        <WifiRoundedIcon sx={{ fontSize: 17 }} />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.2px' }}>
                            Back online
                        </Typography>
                    </>
                ) : (
                    <>
                        <WifiOffRoundedIcon sx={{ fontSize: 17 }} />
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.2px' }}>
                            You are offline • Using cached content
                        </Typography>
                    </>
                )}
            </Box>
        </Slide>
    );
};

export default OfflineIndicator;
