import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Avatar, Popover, Divider, ButtonBase } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { getCurrentUser, clearAuthSession } from '../../utils/auth';
import { SOCKET_URL } from '../../utils/api';
import './ProfilePopover.css';

const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
        return photoPath;
    }
    return `${SOCKET_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
};

const getDynamicInitials = (user, explicitInitials) => {
    if (explicitInitials) return String(explicitInitials).toUpperCase().slice(0, 2);
    if (!user) return 'SU';

    if (user.role && user.role.toLowerCase() === 'superadmin') {
        return 'SU';
    }

    const name = (user.name || user.username || '').trim();
    if (name) {
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        if (name.length >= 2) {
            return name.substring(0, 2).toUpperCase();
        }
        return name[0].toUpperCase();
    }

    if (user.role) {
        const role = user.role.trim();
        if (role.length >= 2) return role.substring(0, 2).toUpperCase();
        return role[0].toUpperCase();
    }

    return 'SU';
};

const ProfilePopover = ({
    user: propUser,
    userName,
    userRole,
    avatarInitials,
    photo,
    onHome,
    onLogout,
    className = '',
    sx = {}
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [sessionUser, setSessionUser] = useState(() => getCurrentUser());
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleAuthChange = () => {
            setSessionUser(getCurrentUser());
        };
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('authChange', handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('authChange', handleAuthChange);
        };
    }, []);

    const user = propUser || sessionUser || { username: 'Admin', role: 'admin' };
    const displayName = userName || user.name || user.username || 'User';
    const displayRole = userRole || user.role || 'superadmin';
    const resolvedPhoto = photo ? resolvePhotoUrl(photo) : resolvePhotoUrl(user?.photo);
    const initials = getDynamicInitials(user, avatarInitials);

    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user') || location.pathname.includes('/dashboard');
    const open = Boolean(anchorEl);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setAnchorEl(null);
    };

    const handleHomeClick = () => {
        handleClose();
        if (onHome) {
            onHome();
        } else if (isDashboard) {
            navigate('/');
        } else {
            const isUserRole = ['player', 'coach', 'user'].includes(user?.role?.toLowerCase());
            const dest = isUserRole ? '/user/dashboard' : '/admin/dashboard';
            navigate(dest);
        }
    };

    const handleLogoutClick = () => {
        handleClose();
        if (onLogout) {
            onLogout();
        } else {
            clearAuthSession(false);
            navigate('/');
        }
    };

    const isUserRole = ['player', 'coach', 'user'].includes(user?.role?.toLowerCase());
    const actionTitle = isDashboard ? 'Home' : (isUserRole ? 'User Dashboard' : 'Dashboard');
    const ActionIcon = isDashboard ? HomeIcon : DashboardIcon;

    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', ...sx }} className={`profile-popover-root ${className}`}>
            {/* Profile Trigger */}
            <button
                type="button"
                className={`profile-popover-trigger ${open ? 'active' : ''}`}
                onClick={handleOpen}
                aria-label="Profile Menu"
                aria-haspopup="true"
                aria-expanded={open}
            >
                <div className="profile-trigger-avatar-ring">
                    <Avatar
                        src={resolvedPhoto || undefined}
                        alt={displayName}
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#0b5299',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '15px',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {initials}
                    </Avatar>
                </div>
            </button>

            {/* Popover Container */}
            <Popover
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableRestoreFocus
                transitionDuration={{ enter: 225, exit: 0 }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        className: 'profile-popover-paper',
                        sx: {
                            width: { xs: 290, sm: 310 }
                        }
                    }
                }}
            >
                {/* Triangular pointer connected to avatar */}
                <div className="profile-popover-arrow" />

                {/* Inner Container */}
                <div className="profile-popover-inner">
                    {/* Decorative Orange Gradient Shapes */}
                    <div className="profile-popover-shape-tr" />
                    <div className="profile-popover-shape-br" />

                    {/* Profile Information Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, position: 'relative', zIndex: 1 }}>
                        <Avatar
                            src={resolvedPhoto || undefined}
                            alt={displayName}
                            sx={{
                                width: 46,
                                height: 46,
                                bgcolor: '#0b5299',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '16px',
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 10px rgba(11, 82, 153, 0.25)'
                            }}
                        >
                            {initials}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontWeight: 700,
                                    letterSpacing: '0.6px',
                                    textTransform: 'uppercase',
                                    lineHeight: 1.2,
                                    mb: 0.3
                                }}
                            >
                                Role
                            </Typography>
                            <Typography
                                noWrap
                                sx={{
                                    fontSize: '15.5px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    lineHeight: 1.25,
                                    textTransform: 'capitalize'
                                }}
                            >
                                {displayRole}
                            </Typography>
                            {displayName && displayName.toLowerCase() !== displayRole.toLowerCase() && (
                                <Typography
                                    noWrap
                                    sx={{
                                        fontSize: '12px',
                                        color: '#64748b',
                                        fontWeight: 500,
                                        lineHeight: 1.2,
                                        mt: 0.2
                                    }}
                                >
                                    {displayName}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Subtle Divider */}
                    <Divider sx={{ my: 1.75, borderColor: 'rgba(226, 232, 240, 0.8)', position: 'relative', zIndex: 1 }} />

                    {/* Actions Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                        {/* Home / Dashboard Action */}
                        <ButtonBase
                            className="profile-popover-action-btn profile-popover-action-home"
                            onClick={handleHomeClick}
                        >
                            <ActionIcon sx={{ fontSize: 20, color: '#0b5299' }} />
                            <Typography sx={{ fontWeight: 600, color: '#0b5299', fontSize: '14.5px', flexGrow: 1 }}>
                                {actionTitle}
                            </Typography>
                            <KeyboardArrowRightIcon className="profile-action-arrow" sx={{ fontSize: 20, color: '#0b5299' }} />
                        </ButtonBase>

                        {/* Logout Action */}
                        <ButtonBase
                            className="profile-popover-action-btn profile-popover-action-logout"
                            onClick={handleLogoutClick}
                        >
                            <LogoutIcon sx={{ fontSize: 20, color: '#d06c38' }} />
                            <Typography sx={{ fontWeight: 600, color: '#d06c38', fontSize: '14.5px', flexGrow: 1 }}>
                                Logout
                            </Typography>
                            <KeyboardArrowRightIcon className="profile-action-arrow" sx={{ fontSize: 20, color: '#d06c38' }} />
                        </ButtonBase>
                    </Box>
                </div>
            </Popover>
        </Box>
    );
};

export default ProfilePopover;
