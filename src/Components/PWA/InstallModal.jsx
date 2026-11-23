import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GetAppRoundedIcon from '@mui/icons-material/GetAppRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import { usePWA } from '../../hooks/usePWA';
import { getAssetUrl } from '../../utils/assetHelper';

const InstallModal = () => {
    const { showInstallModal, setShowInstallModal, canInstall, installApp, platform } = usePWA();
    const { isIOS } = platform;

    const handleClose = () => {
        setShowInstallModal(false);
    };

    const handleNativeInstall = async () => {
        await installApp();
    };

    return (
        <Dialog
            open={showInstallModal}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    p: { xs: 1, sm: 1.5 },
                    overflow: 'hidden',
                    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                }
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        component="img"
                        src={getAssetUrl('ADITYA LOGO2.png')}
                        alt="AUS Chess"
                        sx={{
                            width: 38,
                            height: 38,
                            objectFit: 'contain',
                            borderRadius: '10px',
                            p: 0.5,
                            bgcolor: '#FAF6F3',
                            border: '1px solid rgba(208, 108, 56, 0.2)'
                        }}
                    />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '16px', color: '#0f172a', lineHeight: 1.2 }}>
                            Install AUS Chess
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                            South Zone Chess Tournament
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8' }}>
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 2, pt: 2, pb: 1 }}>
                {isIOS ? (
                    /* iOS Specific Installation Guidance */
                    <Box>
                        <Box
                            sx={{
                                p: 1.8,
                                mb: 2,
                                borderRadius: '12px',
                                bgcolor: '#f8fafc',
                                border: '1px dashed #cbd5e1'
                            }}
                        >
                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                Install on iPhone or iPad
                            </Typography>
                            <Typography sx={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                                Safari supports installing web apps directly to your home screen:
                            </Typography>
                        </Box>

                        <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <ListItem sx={{ px: 1, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(241, 245, 249, 0.6)' }}>
                                <ListItemIcon sx={{ minWidth: 36, color: '#007aff' }}>
                                    <IosShareRoundedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                                            1. Tap the <strong>Share</strong> button in Safari's bottom toolbar
                                        </Typography>
                                    }
                                />
                            </ListItem>

                            <ListItem sx={{ px: 1, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(241, 245, 249, 0.6)' }}>
                                <ListItemIcon sx={{ minWidth: 36, color: '#0b5299' }}>
                                    <AddBoxOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                                            2. Scroll down and tap <strong>Add to Home Screen</strong>
                                        </Typography>
                                    }
                                />
                            </ListItem>

                            <ListItem sx={{ px: 1, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(241, 245, 249, 0.6)' }}>
                                <ListItemIcon sx={{ minWidth: 36, color: '#16a34a' }}>
                                    <CheckCircleOutlineRoundedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                                            3. Tap <strong>Add</strong> in the top-right corner to finish
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        </List>
                    </Box>
                ) : (
                    /* Android / Desktop / Standard Installation Guidance */
                    <Box>
                        <Typography sx={{ fontSize: '13px', color: '#475569', mb: 2, lineHeight: 1.5 }}>
                            Install this web application on your device for a lightning-fast, native experience:
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(208, 108, 56, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FlashOnRoundedIcon sx={{ fontSize: 18, color: '#d06c38' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Instant Launch</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Opens immediately without browser tabs or address bar</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(11, 82, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <WifiOffRoundedIcon sx={{ fontSize: 18, color: '#0b5299' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Offline Resilience</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Access cached pages and schedule even with spotty connectivity</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <DevicesRoundedIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Cross-Device Ready</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>Optimized for Android, Windows, Mac, and iPad</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '13px',
                        textTransform: 'none',
                        px: 2
                    }}
                >
                    {isIOS ? 'Close' : 'Later'}
                </Button>

                {!isIOS && canInstall && (
                    <Button
                        variant="contained"
                        onClick={handleNativeInstall}
                        startIcon={<GetAppRoundedIcon />}
                        sx={{
                            background: 'linear-gradient(90deg, #d06c38 0%, #db6c30 100%)',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '13px',
                            textTransform: 'none',
                            px: 2.5,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(208, 108, 56, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #ba5d2d 0%, #c55d25 100%)'
                            }
                        }}
                    >
                        Install App
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default InstallModal;
