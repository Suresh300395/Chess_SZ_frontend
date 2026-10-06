import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentsIcon from '@mui/icons-material/Payments';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menus = [
        { name: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
        { name: "Organizing Commitee", path: "/admin/organizing-committee", icon: <GroupsIcon /> },
        { name: "Players Mapping", path: "/admin/players-mapping", icon: <AssignmentIndIcon /> },
        { name: "Hostel Provision", path: "/admin/hostel-provision", icon: <HotelIcon /> },
        { name: "Food Tokens", path: "/admin/food-tokens", icon: <RestaurantIcon /> },
        { name: "Caution deposite", path: "/admin/caution-deposite", icon: <PaymentsIcon /> }
    ];

    return (
        <Box sx={{ width: '270px', backgroundColor: '#ffffff', color: '#0b5299', p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 5, mt: 2, color: '#0b5299', textAlign: 'center' }}>
                Admin Panel
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {menus.map((menu, index) => {
                    const isActive = location.pathname === menu.path;
                    return (
                        <Box 
                            key={index} 
                            onClick={() => navigate(menu.path)}
                            sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer', 
                                fontWeight: isActive ? 700 : 600, 
                                fontSize: '14px',
                                padding: '12px 18px',
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
                            <Typography sx={{ fontWeight: 'inherit', fontSize: 'inherit' }}>
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
