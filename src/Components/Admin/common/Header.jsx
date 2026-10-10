import React, { useState } from 'react';
import { Box, Typography, Avatar, Menu, MenuItem, Divider, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ShieldIcon from '@mui/icons-material/Shield';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import { getCurrentUser, clearAuthSession } from '../../../utils/auth';

const Header = ({ title, onToggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Get user from active session
    const user = getCurrentUser() || { username: 'Admin', role: 'admin' };
    const dashboardPath = user.role === 'player' ? '/user/dashboard' : '/admin/dashboard';
    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        clearAuthSession(false);
        navigate('/');
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#ffffff',
            px: { xs: 2, sm: 3 },
            py: 1.25,
            zIndex: 10,
            borderBottom: '1px solid #f1f5f9'
        }}>
            {/* Left: Mobile/Tablet Branding */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    component="img"
                    src="/ADITYA LOGO2.png"
                    alt="Aditya University"
                    sx={{
                        height: { xs: 28, sm: 32 },
                        display: { xs: 'block', lg: 'none' }
                    }}
                />
            </Box>
            <Box
                onClick={handleClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    p: 0.5,
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    border: open ? '3px solid #0b5299' : '3px solid transparent',
                    '&:hover': { borderColor: 'rgba(11, 82, 153, 0.3)' }
                }}
            >
                <Avatar
                    src={`https://ui-avatars.com/api/?name=${user.username}&background=0b5299&color=fff`}
                    sx={{ width: 35, height: 35 }}
                />
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{ paper: {
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 10px 40px rgba(0,0,0,0.1))',
                        mt: 2.5,
                        padding: '8px',
                        width: '300px',
                        borderRadius: 4,
                        border: '1px solid rgba(0,0,0,0.04)',
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 23,
                            width: 14,
                            height: 14,
                            bgcolor: '#ffffff',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                            borderLeft: '1px solid rgba(0,0,0,0.04)',
                            borderTop: '1px solid rgba(0,0,0,0.04)'
                        },
                        '& .MuiMenuItem-root': {
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            mb: 0.5
                        }
                    },
                }}}
            >
                {/* User Info Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, pb: 1.5 }}>
                    <Avatar
                        src={`https://ui-avatars.com/api/?name=${user.username}&background=0b5299&color=fff`}
                        sx={{ width: 50, height: 50, bgcolor: '#e3f0fb', color: '#0b5299', fontWeight: 'bold' }}
                    />
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', lineHeight: 1.2 }}>
                            {user.username}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '13px', mt: 0.5 }}>
                            {user.email || 'admin@adityauniversity.edu.in'}
                        </Typography>
                    </Box>
                </Box>

                {/* Role Badge */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, bgcolor: '#fff0e8', px: 2, py: 1, borderRadius: '20px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, bgcolor: '#d06c38', color: '#fff', borderRadius: '50%' }}>
                            <ShieldIcon sx={{ fontSize: '14px' }} />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ color: '#a85b32', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>
                                ROLE
                            </Typography>
                            <Typography sx={{ fontWeight: 800, color: '#d06c38', fontSize: '14px', textTransform: 'capitalize', lineHeight: 1, mt: 0.5 }}>
                                {user.role}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 1, mx: 2, borderColor: 'rgba(0,0,0,0.06)' }} />

                {/* Dynamic Home & Dashboard Items */}
                <Box sx={{ px: 2, py: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {isDashboard ? (
                        <MenuItem 
                            onClick={() => { handleClose(); navigate('/'); }} 
                            sx={{ bgcolor: '#f4f7fc', borderRadius: '12px', py: 1.5, px: 2, '&:hover': { bgcolor: '#eef2f9' } }}
                        >
                            <HomeIcon sx={{ color: '#0b5299', mr: 2 }} />
                            <Typography sx={{ fontWeight: 600, color: '#0f172a', flexGrow: 1, fontSize: '15px' }}>
                                Home
                            </Typography>
                            <KeyboardArrowRightIcon sx={{ color: '#64748b' }} />
                        </MenuItem>
                    ) : (
                        <MenuItem 
                            onClick={() => { handleClose(); navigate(dashboardPath); }} 
                            sx={{ bgcolor: '#f4f7fc', borderRadius: '12px', py: 1.5, px: 2, '&:hover': { bgcolor: '#eef2f9' } }}
                        >
                            <DashboardIcon sx={{ color: '#0b5299', mr: 2 }} />
                            <Typography sx={{ fontWeight: 600, color: '#0f172a', flexGrow: 1, fontSize: '15px' }}>
                                Dashboard
                            </Typography>
                            <KeyboardArrowRightIcon sx={{ color: '#64748b' }} />
                        </MenuItem>
                    )}
                </Box>

                {/* Logout Item */}
                <Box sx={{ px: 2, pb: 1 }}>
                    <MenuItem onClick={handleLogout} sx={{ bgcolor: '#fff5f0', borderRadius: '12px', py: 1.5, px: 2, '&:hover': { bgcolor: '#ffefe6' } }}>
                        <LogoutIcon sx={{ color: '#d06c38', mr: 2 }} />
                        <Typography sx={{ fontWeight: 600, color: '#d06c38', fontSize: '15px' }}>
                            Logout
                        </Typography>
                    </MenuItem>
                </Box>
            </Menu>
        </Box>
    );
};

export default Header;
