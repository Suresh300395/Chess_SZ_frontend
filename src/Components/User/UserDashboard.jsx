import {
    Box, Typography, Card, CardContent, Avatar, Chip, Divider, Button,
    LinearProgress, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton
} from '@mui/material';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { authAPI, SOCKET_URL } from '../../utils/api';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AccommodationDetails from './AccommodationDetails';
import FoodTokenDetails from './FoodTokenDetails';
import { getCurrentUser, updateUserSession } from '../../utils/auth';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { isMealTokenExpired } from '../../config/foodTokenConfig';

const UserDashboard = () => {
    const user = getCurrentUser();

    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('dashboard');
    const [openPhotoModal, setOpenPhotoModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [savingPhoto, setSavingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await authAPI.getDashboard();
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setDashData(data);
            } catch (err) {
                toast.error('Failed to load dashboard data', { id: 'dashboard-load-error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const acc = dashData?.accommodation || {};
    const ft = dashData?.foodTokens || {};
    const cd = dashData?.cautionDeposit || {};
    const ftTokens = ft.tokens || [];
    const activeFtTokens = ftTokens.filter(t => !t.isExpired && !isMealTokenExpired(t.mealDate, t.mealType) && t.status !== 'CANCELLED');
    const availableFtCount = ft.available !== undefined ? ft.available : activeFtTokens.filter(t => t.status === 'ISSUED').length;
    const totalActiveFt = ft.total !== undefined ? ft.total : activeFtTokens.length;
    const usedPercent = totalActiveFt > 0 ? Math.round(((ft.used || 0) / (totalActiveFt + (ft.used || 0))) * 100) : 0;
    const playerDetails = dashData?.details || {};

    const formatDate = (dateStr) => {
        return formatDateDDMMYYYY(dateStr);
    };

    const resolvePhotoUrl = (photoPath) => {
        if (!photoPath) return '';
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
            return photoPath;
        }
        return `${SOCKET_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
    };

    const handleOpenModal = () => {
        setPreviewUrl(resolvePhotoUrl(dashData?.photo || user?.photo) || null);
        setOpenPhotoModal(true);
    };

    const handleCloseModal = () => {
        if (savingPhoto) return;
        setOpenPhotoModal(false);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const compressAndEncodeImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxDim = 400;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDim) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.88);
                    resolve(compressed);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image (JPG, PNG, WEBP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be below 5MB');
            return;
        }

        try {
            const compressed = await compressAndEncodeImage(file);
            setPreviewUrl(compressed);
        } catch (err) {
            console.error('Image process error:', err);
            toast.error('Failed to process image');
        }
    };

    const handleSavePhoto = async () => {
        if (!previewUrl) {
            toast.error('Please select a photo first');
            return;
        }
        setSavingPhoto(true);
        try {
            const res = await authAPI.updateProfilePhoto(previewUrl);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to update photo');
            }
            const data = await res.json();
            const updatedPhoto = data.photo || previewUrl;
            setDashData((prev) => ({ ...prev, photo: updatedPhoto }));
            updateUserSession({ photo: updatedPhoto });
            toast.success('Profile photo updated successfully!');
            handleCloseModal();
        } catch (err) {
            console.error('Error saving photo:', err);
            toast.error(err.message || 'Failed to save photo');
        } finally {
            setSavingPhoto(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', pt: { xs: 1.5, sm: 2, md: 8 }, px: { xs: 1.5, sm: 2, md: '96px' }, pb: 4, backgroundColor: '#faf6f3' }}>
            <Card sx={{ width: '100%', borderRadius: { xs: 3, md: 4 }, boxShadow: 'none !important', border: '1px solid #eaedf1', p: { xs: 2, sm: 2.5, md: 4 } }}>

                {/* Page Title */}
                <Typography variant="h4" fontWeight="bold" color="#0b5299" sx={{ mb: { xs: 2, md: 3 }, fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.85rem' } }}>
                    Welcome {dashData?.name || user?.name || user?.username || 'User'}..!
                </Typography>

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#0b5299' }} />
                    </Box>
                )}

                {/* Content */}
                {!loading && (
                    <>
                        <Card sx={{
                            width: '100%',
                            borderRadius: 3,
                            mb: 3,
                            backgroundColor: 'var(--color-navy)',
                            boxShadow: 'none !important',
                            color: '#fff',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* Desktop Sun Background */}
                            <Box sx={{
                                display: { xs: 'none', sm: 'block' },
                                position: 'absolute',
                                top: '50%',
                                right: 0,
                                height: '130%',
                                aspectRatio: '1/1',
                                transform: 'translate(50%, -50%)',
                                backgroundImage: 'url("/Circle _Gold.svg")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                                zIndex: 0,
                                opacity: 0.8
                            }} />

                            {/* Mobile Sun Background */}
                            <Box sx={{
                                display: { xs: 'block', sm: 'none' },
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                width: '120%',
                                aspectRatio: '1/1',
                                transform: 'translate(-50%, 50%)',
                                backgroundImage: 'url("/Circle _Gold.svg")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                                zIndex: 0,
                                opacity: 0.8
                            }} />
                            <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                    {/* Hoverable Avatar with Edit Icon */}
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        <Box
                                            onClick={handleOpenModal}
                                            sx={{
                                                position: 'relative',
                                                width: 90,
                                                height: 90,
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                border: '3px solid rgba(255,255,255,0.7)',
                                                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                                bgcolor: 'rgba(255,255,255,0.25)',
                                                '&:hover .photo-edit-overlay': {
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            <Avatar
                                                src={resolvePhotoUrl(dashData?.photo || user?.photo)}
                                                alt={dashData?.name || user?.name || 'Player'}
                                                sx={{
                                                    width: '100%',
                                                    height: '100%',
                                                    bgcolor: 'transparent',
                                                    fontSize: 36,
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 48, color: '#fff' }} />
                                            </Avatar>

                                            {/* Hover Overlay with Edit Icon */}
                                            <Box
                                                className="photo-edit-overlay"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    bgcolor: 'rgba(0, 0, 0, 0.58)',
                                                    backdropFilter: 'blur(1px)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.25s ease',
                                                    color: '#fff',
                                                }}
                                            >
                                                <CameraAltIcon sx={{ fontSize: 24, mb: 0.3 }} />
                                                <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                    Edit
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Corner Edit Badge */}
                                        <Box
                                            onClick={handleOpenModal}
                                            sx={{
                                                position: 'absolute',
                                                bottom: -2,
                                                right: -2,
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                bgcolor: '#0b5299',
                                                color: '#fff',
                                                border: '2px solid #fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                                transition: 'transform 0.2s ease, background-color 0.2s ease',
                                                zIndex: 3,
                                                '&:hover': {
                                                    transform: 'scale(1.1)',
                                                    bgcolor: '#083d73',
                                                }
                                            }}
                                            title="Change photo"
                                        >
                                            <EditIcon sx={{ fontSize: 15 }} />
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                                            {dashData?.name || user?.name || 'Player Name'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Chip
                                                label={dashData?.role ? dashData.role.charAt(0).toUpperCase() + dashData.role.slice(1) : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Player')}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.4)' }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                                            Mobile: {dashData?.email || user?.email || user?.username || 'player@university.edu'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Additional Player Details */}
                                {playerDetails && (
                                    <>
                                        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 3 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>University</Typography>
                                                <Typography variant="body2" fontWeight="600">{playerDetails.universityName || '—'}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Gender</Typography>
                                                <Typography variant="body2" fontWeight="600">{playerDetails.gender || '—'}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>DOB</Typography>
                                                <Typography variant="body2" fontWeight="600">{formatDate(playerDetails.dob)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Transport</Typography>
                                                <Typography variant="body2" fontWeight="600">{playerDetails.transportMode || '—'} {playerDetails.transportNumber ? `(${playerDetails.transportNumber})` : ''}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Arrival</Typography>
                                                <Typography variant="body2" fontWeight="600">{formatDate(playerDetails.arrivalDate)} {playerDetails.arrivalTime || ''}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Departure</Typography>
                                                <Typography variant="body2" fontWeight="600">{formatDate(playerDetails.departureDate)} {playerDetails.departureTime || ''}</Typography>
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dynamic Section */}
                        {activeView === 'accommodation_details' ? (
                            <Box sx={{ width: '100%' }}>
                                <AccommodationDetails onBack={() => setActiveView('dashboard')} />
                            </Box>
                        ) : activeView === 'food_tokens' ? (
                            <Box sx={{ width: '100%' }}>
                                <FoodTokenDetails onBack={() => setActiveView('dashboard')} />
                            </Box>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" color="#1a202c" sx={{ mb: 2 }}>
                                    My Facilities &amp; Payments
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>

                                    {/* Accommodation Card */}
                                    <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#3b82f6', width: 48, height: 48, borderRadius: 2 }}>
                                                    <HotelIcon />
                                                </Avatar>
                                                <Typography variant="h6" fontWeight="bold" color="#1e293b">Accommodation</Typography>
                                            </Box>
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                                                label={acc.status || 'Not Allocated'}
                                                size="small"
                                                sx={{
                                                    bgcolor: acc.status === 'Allocated' ? '#dcfce7' : '#f1f5f9',
                                                    color: acc.status === 'Allocated' ? '#166534' : '#64748b',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: acc.status === 'Allocated' ? '#166534' : '#64748b' }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                <BusinessIcon sx={{ color: '#64748b', fontSize: 20, mr: { xs: 1, sm: 2 }, flexShrink: 0 }} />
                                                <Box sx={{ width: { xs: '110px', sm: '135px' }, display: 'flex', justifyContent: 'space-between', pr: 1.5, flexShrink: 0 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Block</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b" sx={{ wordBreak: 'break-word' }}>{acc.block || '—'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                <MeetingRoomIcon sx={{ color: '#64748b', fontSize: 20, mr: { xs: 1, sm: 2 }, flexShrink: 0 }} />
                                                <Box sx={{ width: { xs: '110px', sm: '135px' }, display: 'flex', justifyContent: 'space-between', pr: 1.5, flexShrink: 0 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Room Number</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b" sx={{ wordBreak: 'break-word' }}>{acc.roomNumber || '—'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <GroupIcon sx={{ color: '#64748b', fontSize: 20, mr: { xs: 1, sm: 2 }, flexShrink: 0 }} />
                                                <Box sx={{ width: { xs: '110px', sm: '135px' }, display: 'flex', justifyContent: 'space-between', pr: 1.5, flexShrink: 0 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Room Type</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b" sx={{ wordBreak: 'break-word' }}>{acc.roomType || '—'}</Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            onClick={() => setActiveView('accommodation_details')}
                                            sx={{ bgcolor: '#0b5299', textTransform: 'none', borderRadius: 1, fontWeight: 600, py: 1, width: 'fit-content', alignSelf: 'flex-end' }}
                                        >
                                            View Details <span style={{ marginLeft: '8px' }}>›</span>
                                        </Button>
                                    </Box>

                                    {/* Food Tokens Card */}
                                    <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #fee2e2', bgcolor: '#fff5f5', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#f97316', width: 48, height: 48, borderRadius: 2 }}>
                                                    <RestaurantIcon />
                                                </Avatar>
                                                <Typography variant="h6" fontWeight="bold" color="#1e293b">Food Tokens</Typography>
                                            </Box>
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                                                label={availableFtCount > 0 ? 'Active' : (ft.used > 0 ? 'Used' : 'Inactive')}
                                                size="small"
                                                sx={{
                                                    bgcolor: availableFtCount > 0 ? '#dcfce7' : '#f1f5f9',
                                                    color: availableFtCount > 0 ? '#166534' : '#64748b',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: availableFtCount > 0 ? '#166534' : '#64748b' }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="h3" fontWeight="bold" color="#f97316">{availableFtCount}</Typography>
                                                        <Typography variant="subtitle1" fontWeight="600" color="#64748b">Available</Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="#64748b">{ft.used || 0} Used of {totalActiveFt || 0}</Typography>
                                                </Box>
                                                <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0, ml: 1.5 }}>
                                                    <Typography variant="caption" fontWeight="bold" color="#0369a1" sx={{ lineHeight: 1 }}>{usedPercent}%</Typography>
                                                    <Typography sx={{ fontSize: '10px', color: '#0369a1', lineHeight: 1, mt: 0.5 }}>Used</Typography>
                                                </Box>
                                            </Box>
                                            <LinearProgress variant="determinate" value={usedPercent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#f97316', borderRadius: 4 } }} />
                                        </Box>
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            onClick={() => setActiveView('food_tokens')}
                                            sx={{ bgcolor: '#f97316', textTransform: 'none', borderRadius: 1, fontWeight: 600, py: 1, width: 'fit-content', mt: 3, '&:hover': { bgcolor: '#ea580c' }, alignSelf: 'flex-end' }}
                                        >
                                            View Tokens <span style={{ marginLeft: '8px' }}>›</span>
                                        </Button>
                                    </Box>

                                    {/* Caution Deposit Card */}
                                    <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #dcfce7', bgcolor: '#f0fdf4', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#22c55e', width: 48, height: 48, borderRadius: 2 }}>
                                                    <AccountBalanceWalletIcon />
                                                </Avatar>
                                                <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                                    {(dashData?.userType === 'coach' || user?.role === 'coach') ? 'Coach Caution Deposit' : 'Caution Deposit'}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                icon={
                                                    cd.refundStatus === 'Refunded' ? (
                                                        <CheckCircleIcon sx={{ fontSize: '16px !important', color: '#166534 !important' }} />
                                                    ) : (
                                                        <AccessTimeIcon sx={{ fontSize: '16px !important', color: cd.refundStatus === 'Refund Pending' ? '#b45309 !important' : '#64748b !important' }} />
                                                    )
                                                }
                                                label={cd.refundStatus || 'N/A'}
                                                size="small"
                                                sx={{
                                                    bgcolor: cd.refundStatus === 'Refunded' ? '#dcfce7' : (cd.refundStatus === 'Refund Pending' ? '#fef3c7' : '#f1f5f9'),
                                                    color: cd.refundStatus === 'Refunded' ? '#166534' : (cd.refundStatus === 'Refund Pending' ? '#b45309' : '#64748b'),
                                                    fontWeight: 600,
                                                    border: cd.refundStatus === 'Refunded' ? '1px solid #86efac' : (cd.refundStatus === 'Refund Pending' ? '1px solid #fde68a' : 'none'),
                                                    '& .MuiChip-icon': {
                                                        color: cd.refundStatus === 'Refunded' ? '#166534' : (cd.refundStatus === 'Refund Pending' ? '#b45309' : '#64748b')
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                                <Typography variant="h3" fontWeight="bold" color="#16a34a">₹{cd.amount?.toLocaleString('en-IN') || 0}</Typography>
                                                <Typography variant="subtitle1" fontWeight="600" color="#16a34a">{cd.paid ? 'Paid' : 'Unpaid'}</Typography>
                                            </Box>
                                            {cd.paid && cd.paidBy && (
                                                <Typography variant="body2" color="#64748b" sx={{ mb: 1 }}>
                                                    Paid by <span style={{ fontWeight: 600, color: '#1e293b', marginLeft: '4px' }}>{cd.paidBy}</span>
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
                                                Total Deposit <span style={{ fontWeight: 600, color: '#1e293b', marginLeft: '4px' }}>₹{cd.amount?.toLocaleString('en-IN') || 0}</span>
                                            </Typography>
                                            <Divider sx={{ my: 2 }} />

                                            {/* Refund Information below the line */}
                                            <Box sx={{
                                                bgcolor: '#ffffff',
                                                p: 1.75,
                                                borderRadius: 2,
                                                border: '1px solid #bbf7d0',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.25
                                            }}>
                                                <InfoIcon sx={{ fontSize: 20, color: '#16a34a', mt: 0.2, flexShrink: 0 }} />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="700" color="#166534" sx={{ mb: 0.5 }}>
                                                        Refund Information
                                                    </Typography>
                                                    <Typography variant="body2" color="#334155" sx={{ fontSize: '0.84rem', lineHeight: 1.55 }}>
                                                        {cd.refundStatus === 'Refunded' ? (
                                                            <>
                                                                Caution deposit of <strong>₹{cd.amount?.toLocaleString('en-IN') || '2,000'}</strong> has been <strong>successfully refunded</strong>{(dashData?.userType === 'coach' || user?.role === 'coach') ? ' to Coach.' : ' to your university representative.'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                This {(dashData?.userType === 'coach' || user?.role === 'coach') ? 'coach ' : ''}caution deposit is <strong>100% refundable</strong>. Money will be refunded at the time of <strong>vacating the hostel room and returning keys</strong>, subject to room clearance and no property damage.
                                                            </>
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Card>

            {/* Photo Upload Dialog Modal */}
            <Dialog
                open={openPhotoModal}
                onClose={handleCloseModal}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            p: 1,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                            Update Profile Photo
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Upload a photo for your profile
                        </Typography>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        disabled={savingPhoto}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#0f172a' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3, textAlign: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {previewUrl ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: 140,
                                    height: 140,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid #0b5299',
                                    boxShadow: '0 8px 24px rgba(11,82,153,0.25)',
                                }}
                            >
                                <Avatar
                                    src={resolvePhotoUrl(previewUrl)}
                                    alt="Preview"
                                    sx={{ width: '100%', height: '100%' }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Photo Preview
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={savingPhoto}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                    Change Photo
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    disabled={savingPhoto}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Remove
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: 3,
                                p: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1.5,
                                bgcolor: '#f8fafc',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#0b5299',
                                    bgcolor: 'rgba(11,82,153,0.04)',
                                }
                            }}
                        >
                            <Box sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                bgcolor: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0b5299'
                            }}>
                                <CloudUploadIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight="600" color="#1e293b">
                                Click to select a photo
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                                PNG, JPG, or WEBP (Max 5MB)
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        onClick={handleCloseModal}
                        disabled={savingPhoto}
                        sx={{ textTransform: 'none', borderRadius: 2, color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSavePhoto}
                        disabled={!previewUrl || savingPhoto}
                        sx={{
                            bgcolor: '#0b5299',
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#083d73' }
                        }}
                    >
                        {savingPhoto ? (
                            <>
                                <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
                                Saving...
                            </>
                        ) : (
                            'Save Photo'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserDashboard;