import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PaymentsIcon from '@mui/icons-material/Payments';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';

export const ALL_ADMIN_MODULES = [
    { id: 'dashboard', name: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon />, description: 'Overview metrics & analytics' },
    { id: 'organizing-committee', name: 'Organizing Commitee', path: '/admin/organizing-committee', icon: <GroupsIcon />, description: 'Organizing committee members' },
    { id: 'players-mapping', name: 'Players Mapping', path: '/admin/players-mapping', icon: <AssignmentIndIcon />, description: 'Map players & university rosters' },
    { id: 'hostel-provision', name: 'Accommodation', path: '/admin/hostel-provision', icon: <HotelIcon />, description: 'Hostel room allocation & management' },
    { id: 'food-tokens', name: 'Food Tokens', path: '/admin/food-tokens', icon: <RestaurantIcon />, description: 'Food tokens issuance & redemption' },
    { id: 'qr-scanner', name: 'QR Scanner', path: '/admin/qr-scanner', icon: <QrCodeScannerIcon />, description: 'Scan & redeem food tokens' },
    { id: 'caution-deposite', name: 'Caution Deposit', path: '/admin/caution-deposite', icon: <PaymentsIcon />, description: 'Collect & refund caution deposits' },
    { id: 'manage-live-board', name: 'Manage Live Board', path: '/admin/manage-live-board', icon: <LiveTvIcon />, description: 'Update live match rounds & scores' },
    { id: 'manage-blocks', name: 'Manage Blocks', path: '/admin/manage-blocks', icon: <ApartmentIcon />, description: 'Configure hostel blocks & rooms' },
    { id: 'route-map-upload', name: 'Route Map Upload', path: '/admin/route-map-upload', icon: <MapIcon />, description: 'Upload campus navigation route maps' },
    { id: 'manage-admin', name: 'Manage Admin', path: '/admin/manage-admin', icon: <AdminPanelSettingsIcon />, description: 'Admin user management & permissions' }
];

export const getMenusByRole = (role, allowedModules = undefined) => {
    if (role === 'superadmin') {
        return ALL_ADMIN_MODULES;
    }

    // If allowedModules array is explicitly defined for this admin
    if (Array.isArray(allowedModules)) {
        return ALL_ADMIN_MODULES.filter(m =>
            allowedModules.includes(m.id) || allowedModules.includes(m.path)
        );
    }

    // Default common menus for existing admins without specific mapping
    const defaultIds = [
        'dashboard',
        'organizing-committee',
        'players-mapping',
        'hostel-provision',
        'food-tokens',
        'qr-scanner',
        'caution-deposite',
        'manage-live-board'
    ];
    return ALL_ADMIN_MODULES.filter(m => defaultIds.includes(m.id));
};
