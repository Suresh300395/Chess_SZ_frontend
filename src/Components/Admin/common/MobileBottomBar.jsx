import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Drawer
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { getCurrentUser } from '../../../utils/auth';
import { getMenusByRole } from './RolesNav';

const MobileBottomBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser() || { username: 'Admin', role: 'admin' };
    const menus = getMenusByRole(user.role);

    // Filter out the modules already placed on the bottom bar (Accommodation, Food Tokens, Caution Deposit, Dashboard)
    const bottomBarPaths = [
        '/admin/dashboard',
        '/admin/hostel-provision',
        '/admin/food-tokens',
        '/admin/caution-deposite'
    ];
    const drawerMenus = menus.filter(item => !bottomBarPaths.includes(item.path));

    const [modulesSheetOpen, setModulesSheetOpen] = useState(false);

    const currentPath = location.pathname;

    const isAccommodationActive = currentPath === '/admin/hostel-provision';
    const isFoodTokensActive = currentPath === '/admin/food-tokens';
    const isHomeActive = currentPath === '/admin/dashboard' || currentPath === '/admin' || currentPath === '/admin/';
    const isCautionDepositActive = currentPath === '/admin/caution-deposite';
    const isOtherModuleActive = !isHomeActive && !isAccommodationActive && !isFoodTokensActive && !isCautionDepositActive;

    const handleNavigate = (path) => {
        setModulesSheetOpen(false);
        navigate(path);
    };

    const navItems = [
        {
            id: 'accommodation',
            label: 'Accommodation',
            path: '/admin/hostel-provision',
            icon: HotelOutlinedIcon,
            isActive: isAccommodationActive,
            onClick: () => handleNavigate('/admin/hostel-provision')
        },
        {
            id: 'food',
            label: 'Food Tokens',
            path: '/admin/food-tokens',
            icon: RestaurantRoundedIcon,
            isActive: isFoodTokensActive,
            onClick: () => handleNavigate('/admin/food-tokens')
        },
        {
            id: 'home',
            label: 'Home',
            path: '/admin/dashboard',
            icon: HomeRoundedIcon,
            isActive: isHomeActive,
            onClick: () => handleNavigate('/admin/dashboard')
        },
        {
            id: 'caution',
            label: 'Caution Deposit',
            path: '/admin/caution-deposite',
            icon: PaymentsOutlinedIcon,
            isActive: isCautionDepositActive,
            onClick: () => handleNavigate('/admin/caution-deposite')
        },
        {
            id: 'modules',
            label: 'All Modules',
            path: null,
            icon: GridViewOutlinedIcon,
            isActive: isOtherModuleActive || modulesSheetOpen,
            onClick: () => setModulesSheetOpen(true)
        }
    ];

    return (
        <>
            {/* Floating Pill Bottom Navigation Bar */}
            <Box
                sx={{
                    display: { xs: 'flex', lg: 'none' },
                    position: 'fixed',
                    bottom: { xs: '14px', sm: '20px' },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: 'calc(100% - 28px)', sm: '380px' },
                    maxWidth: '410px',
                    height: '64px',
                    bgcolor: '#ffffff',
                    borderRadius: { xs: '14px', sm: '16px' },
                    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    px: 0.5,
                    zIndex: 1200,
                    userSelect: 'none'
                }}
            >
                {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const active = item.isActive;

                    return (
                        <Box
                            key={item.id}
                            onClick={item.onClick}
                            sx={{
                                flex: 1,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: 52, sm: 54 },
                                    height: { xs: 52, sm: 54 },
                                    borderRadius: '14px',
                                    background: active
                                        ? 'linear-gradient(135deg, #0b5299 0%, #1e88e5 100%)'
                                        : 'transparent',
                                    border: active ? '3.5px solid #ffffff' : '3.5px solid transparent',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: active ? '#ffffff' : '#64748b',
                                    transform: active
                                        ? { xs: 'translateY(-30px)', sm: 'translateY(-32px)' }
                                        : 'translateY(0)',
                                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease, border-color 0.25s ease, color 0.2s ease',
                                    '&:hover': {
                                        color: active ? '#ffffff' : '#0b5299'
                                    },
                                    '&:active': {
                                        transform: active
                                            ? { xs: 'translateY(-30px) scale(0.94)', sm: 'translateY(-32px) scale(0.94)' }
                                            : 'scale(0.9)'
                                    }
                                }}
                            >
                                <IconComponent
                                    sx={{
                                        fontSize: active ? { xs: 26, sm: 28 } : { xs: 24, sm: 26 },
                                        color: active ? '#ffffff' : 'inherit',
                                        transition: 'font-size 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease'
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Bottom Sheet Drawer for All Modules */}
            <Drawer
                anchor="bottom"
                open={modulesSheetOpen}
                onClose={() => setModulesSheetOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: '18px 18px 0 0',
                            maxHeight: '85vh',
                            bgcolor: '#ffffff',
                            overflowX: 'hidden !important',
                            overflowY: 'auto',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
                            maxWidth: '520px',
                            mx: 'auto'
                        }
                    }
                }}
            >
                <Box
                    sx={{
                        p: { xs: 1.5, sm: 2.5 },
                        pb: { xs: 3.5, sm: 4 },
                        width: '100%',
                        boxSizing: 'border-box',
                        overflowX: 'hidden !important'
                    }}
                >
                    {/* Drag pill handle */}
                    <Box sx={{ width: 40, height: 4, bgcolor: '#cbd5e1', borderRadius: 2, mx: 'auto', mb: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 0.5 }}>
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0b5299', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                                All Admin Modules
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '11px', sm: '12px' } }}>
                                Tap any module below to quickly navigate
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setModulesSheetOpen(false)} size="small" sx={{ bgcolor: '#f1f5f9', flexShrink: 0 }}>
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Modules Grid - Strictly fits screen width with zero horizontal scroll */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
                            gap: { xs: 1, sm: 1.25 },
                            overflowY: 'auto',
                            overflowX: 'hidden !important',
                            maxHeight: '60vh',
                            width: '100%',
                            boxSizing: 'border-box',
                            p: 0.25
                        }}
                    >
                        {drawerMenus.map((item) => {
                            const isSelected = currentPath === item.path;
                            return (
                                <Box
                                    key={item.path}
                                    onClick={() => handleNavigate(item.path)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: { xs: 0.9, sm: 1.1 },
                                        p: { xs: 0.9, sm: 1.2 },
                                        minWidth: 0,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        borderRadius: 1.5,
                                        bgcolor: isSelected ? 'rgba(11, 82, 153, 0.08)' : '#f8fafc',
                                        border: isSelected ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:active': { transform: 'scale(0.97)', bgcolor: 'rgba(11, 82, 153, 0.12)' }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: { xs: 32, sm: 36 },
                                            height: { xs: 32, sm: 36 },
                                            borderRadius: '8px',
                                            bgcolor: isSelected ? '#0b5299' : '#ffffff',
                                            color: isSelected ? '#ffffff' : '#0b5299',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                                            flexShrink: 0,
                                            '& svg': {
                                                fontSize: { xs: 18, sm: 20 }
                                            }
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontWeight: isSelected ? 700 : 600,
                                            color: isSelected ? '#0b5299' : '#334155',
                                            fontSize: { xs: '11px', sm: '12px' },
                                            lineHeight: 1.25,
                                            minWidth: 0,
                                            flex: 1,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default MobileBottomBar;
