import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentsIcon from '@mui/icons-material/Payments';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import MapIcon from '@mui/icons-material/Map';

export const getMenusByRole = (role) => {
    const commonMenus = [
        { name: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
        { name: "Organizing Commitee", path: "/admin/organizing-committee", icon: <GroupsIcon /> },
        { name: "Players Mapping", path: "/admin/players-mapping", icon: <AssignmentIndIcon /> },
        { name: "Accommodation", path: "/admin/hostel-provision", icon: <HotelIcon /> },
        { name: "Food Tokens", path: "/admin/food-tokens", icon: <RestaurantIcon /> },
        { name: "Caution Deposit", path: "/admin/caution-deposite", icon: <PaymentsIcon /> },
        { name: "Manage Live Board", path: "/admin/manage-live-board", icon: <LiveTvIcon /> }
    ];

    if (role === 'superadmin') {
        return [
            ...commonMenus,
            { name: "Manage Admin", path: "/admin/manage-admin", icon: <AdminPanelSettingsIcon /> },
            { name: "Manage Blocks", path: "/admin/manage-blocks", icon: <HotelIcon /> },
            { name: "Route Map Upload", path: "/admin/route-map-upload", icon: <MapIcon /> }
        ];
    }

    return commonMenus;
};
