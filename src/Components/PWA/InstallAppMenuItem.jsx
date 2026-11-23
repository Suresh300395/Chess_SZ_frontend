import React from 'react';
import { ButtonBase, Typography } from '@mui/material';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { usePWA } from '../../hooks/usePWA';

/**
 * InstallAppMenuItem
 * Seamlessly integrates into menus (ProfilePopover, Drawers, Mobile bars).
 * Automatically hides when the app is already installed in standalone mode.
 */
const InstallAppMenuItem = ({
    onClick,
    variant = 'popover', // 'popover' | 'drawer' | 'button'
    sx = {}
}) => {
    const { isInstalled, installApp } = usePWA();

    // If app is already installed in standalone mode, hide the install option
    if (isInstalled) {
        return null;
    }

    const handleClick = async (e) => {
        if (onClick) {
            onClick(e);
        }
        await installApp();
    };

    if (variant === 'drawer') {
        return (
            <ButtonBase
                onClick={handleClick}
                sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: 'rgba(208, 108, 56, 0.08)',
                    color: '#d06c38',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    '&:hover': {
                        bgcolor: 'rgba(208, 108, 56, 0.14)'
                    },
                    ...sx
                }}
            >
                <InstallMobileRoundedIcon sx={{ fontSize: 22, color: '#d06c38' }} />
                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#d06c38', flexGrow: 1 }}>
                    Install App
                </Typography>
                <KeyboardArrowRightIcon sx={{ fontSize: 18, color: '#d06c38' }} />
            </ButtonBase>
        );
    }

    // Default 'popover' variant matching ProfilePopover buttons
    return (
        <ButtonBase
            className="profile-popover-action-btn profile-popover-action-install"
            onClick={handleClick}
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: '10px 14px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                bgcolor: 'rgba(208, 108, 56, 0.06)',
                '&:hover': {
                    bgcolor: 'rgba(208, 108, 56, 0.12)',
                    transform: 'translateX(3px)'
                },
                mb: 0.8,
                ...sx
            }}
        >
            <InstallMobileRoundedIcon sx={{ fontSize: 20, color: '#d06c38' }} />
            <Typography sx={{ fontWeight: 600, color: '#d06c38', fontSize: '14.5px', flexGrow: 1, textAlign: 'left' }}>
                Install App
            </Typography>
            <KeyboardArrowRightIcon className="profile-action-arrow" sx={{ fontSize: 20, color: '#d06c38' }} />
        </ButtonBase>
    );
};

export default InstallAppMenuItem;
