import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMenusByRole } from './RolesNav';
import { getCurrentUser } from '../../../utils/auth';

const Sidebar = ({ onNavigate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const user = getCurrentUser() || { role: 'admin' };
    const menus = getMenusByRole(user.role);

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
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            color: '#0b5299',
            px: 2,
            py: 3,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box
                component="img"
                src="/ADITYA LOGO2.png"
                alt="Aditya University Logo"
                sx={{ width: '80%', margin: '0 auto', display: 'block', mb: 2, mt: 0 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
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
                                fontWeight: isActive ? 500 : 300, 
                                fontSize: '14px',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                color: isActive ? '#ffffff' : '#0b5299',
                                backgroundColor: isActive ? '#d06c38' : 'transparent',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    color: '#ffffff',
                                    backgroundColor: '#d06c38',
                                    transform: 'translateX(5px)'
                                } 
                            }}
                        >
                            {menu.icon}
                            <Typography sx={{ fontWeight: 'inherit', fontSize: 'inherit', whiteSpace: 'nowrap' }}>
                                {menu.name}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    );
};

export default Sidebar;
