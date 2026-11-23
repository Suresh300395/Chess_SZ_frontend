import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Paper, CircularProgress } from '@mui/material';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { usePWA } from '../../hooks/usePWA';

/**
 * UpdateNotification
 * Polished, non-intrusive notification when a new service worker update is ready.
 * Never forces an abrupt reload without user consent, preventing lost form inputs.
 */
const UpdateNotification = () => {
    const { needRefresh, updateApp, dismissUpdate } = usePWA();
    const [updating, setUpdating] = useState(false);

    if (!needRefresh) {
        return null;
    }

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await updateApp();
        } catch (err) {
            console.error('[PWA] Failed to update service worker', err);
            setUpdating(false);
        }
    };

    return (
        <Paper
            elevation={6}
            sx={{
                position: 'fixed',
                bottom: { xs: 80, sm: 24 },
                right: { xs: 16, sm: 24 },
                left: { xs: 16, sm: 'auto' },
                maxWidth: { sm: 380 },
                zIndex: 9999,
                p: 2,
                borderRadius: '16px',
                bgcolor: '#ffffff',
                border: '1px solid rgba(208, 108, 56, 0.3)',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(208, 108, 56, 0.1)',
                animation: 'slideUpPWA 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: 'rgba(208, 108, 56, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <SystemUpdateAltRoundedIcon sx={{ color: '#d06c38', fontSize: 22 }} />
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0, pr: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a', lineHeight: 1.3 }}>
                        Update Available
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.4, lineHeight: 1.45 }}>
                        A new version of AUS Chess is available with improvements and fixes.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleUpdate}
                            disabled={updating}
                            sx={{
                                background: 'linear-gradient(90deg, #d06c38 0%, #db6c30 100%)',
                                color: '#ffffff',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '12.5px',
                                borderRadius: '8px',
                                px: 1.8,
                                py: 0.6,
                                height: '32px',
                                boxShadow: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #ba5d2d 0%, #c55d25 100%)',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            {updating ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                                    <span>Updating...</span>
                                </Box>
                            ) : (
                                'Update Now'
                            )}
                        </Button>

                        <Button
                            size="small"
                            onClick={dismissUpdate}
                            disabled={updating}
                            sx={{
                                color: '#64748b',
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '12.5px',
                                borderRadius: '8px',
                                height: '32px',
                                px: 1.5
                            }}
                        >
                            Later
                        </Button>
                    </Box>
                </Box>

                <IconButton
                    size="small"
                    onClick={dismissUpdate}
                    aria-label="Close update notification"
                    sx={{ color: '#94a3b8', mt: -0.5, mr: -0.5 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default UpdateNotification;
