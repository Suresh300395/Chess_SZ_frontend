import React, { useState } from 'react';
import { Box, Typography, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const Header = ({ title }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Get user from localStorage
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { username: 'Super Admin', role: 'superadmin' };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/admin');
    };

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            bgcolor: '#ffffff',
            px: 3,
            py: 1.5,
            zIndex: 10
        }}>
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
                PaperProps={{
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
                }}
            >
                <Box sx={{ p: 2, bgcolor: '#f6f8fb', borderRadius: 3, mb: 1.5 }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', mb: 0.5 }}>
                        Role
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#d06c38', fontSize: '1.25rem', textTransform: 'capitalize' }}>
                        {user.role}
                    </Typography>
                </Box>

                <Divider sx={{ my: 1, mx: 1, borderColor: 'rgba(0,0,0,0.05)' }} />

                <MenuItem onClick={handleClose} sx={{ '&:hover': { bgcolor: '#f2f6fb' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: '50%', bgcolor: '#e3f0fb', color: '#0b5299' }}>
                        <PersonIcon />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', flexGrow: 1, fontSize: '14px' }}>
                        Profile
                    </Typography>
                    <KeyboardArrowRightIcon sx={{ color: '#94a3b8' }} />
                </MenuItem>

                <Divider sx={{ my: 1, mx: 1, borderColor: 'rgba(0,0,0,0.05)' }} />

                <MenuItem onClick={handleLogout} sx={{ '&:hover': { bgcolor: '#fff0e8' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: '50%', bgcolor: '#ffede4', color: '#d06c38' }}>
                        <LogoutIcon />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: '#d06c38', fontSize: '14px' }}>
                        Logout
                    </Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default Header;
