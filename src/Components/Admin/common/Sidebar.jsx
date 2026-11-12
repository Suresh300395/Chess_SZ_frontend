import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMenusByRole } from './RolesNav';
import { getCurrentUser } from '../../../utils/auth';
import { getAssetUrl } from '../../../utils/assetHelper';

const Sidebar = ({ onNavigate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(getCurrentUser() || { role: 'admin' });

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(getCurrentUser() || { role: 'admin' });
        };
        window.addEventListener('authChange', handleAuthChange);
        return () => window.removeEventListener('authChange', handleAuthChange);
    }, []);

    const menus = getMenusByRole(user.role, user.allowedModules);

    const handleItemClick = (path) => {
        navigate(path);
        if (onNavigate) {
            onNavigate();
        }
    };

    return (
        <Box sx={{
            width: '270px',
            height: '100%',
            backgroundColor: '#ffffff',
            color: '#0b5299',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid #e2e8f0',
            boxSizing: 'border-box'
        }}>
            {/* Fixed Logo Header */}
            <Box sx={{
                flexShrink: 0,
                px: 2.5,
                pt: 2.5,
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f1f5f9'
            }}>
                <Box
                    component="img"
                    src={getAssetUrl('ADITYA LOGO2.png')}
                    alt="Aditya University Logo"
                    sx={{ width: '85%', maxWidth: '200px', display: 'block' }}
                />
            </Box>

            {/* Scrollable Menu Items */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.2,
                '&::-webkit-scrollbar': {
                    width: '5px'
                },
                '&::-webkit-scrollbar-track': {
                    background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#cbd5e1',
                    borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: '#94a3b8'
                },
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent'
            }}>
                {menus.map((menu, index) => {
                    const isActive = location.pathname === menu.path;
                    return (
                        <Box 
                            key={index} 
                            onClick={() => handleItemClick(menu.path)}
                            sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer', 
                                fontWeight: isActive ? 600 : 400, 
                                fontSize: '14px',
                                padding: '11px 14px',
                                borderRadius: '8px',
                                color: isActive ? '#ffffff' : '#0b5299',
                                backgroundColor: isActive ? '#d06c38' : 'transparent',
                                transition: 'all 0.25s ease',
                                '&:hover': { 
                                    color: '#ffffff',
                                    backgroundColor: '#d06c38',
                                    transform: 'translateX(4px)'
                                } 
                            }}
                        >
                            {menu.icon}
                            <Typography sx={{ fontWeight: 'inherit', fontSize: 'inherit', whiteSpace: 'nowrap' }}>
                                {menu.name}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default Sidebar;
