import { Box, Typography, Card, CardContent, Avatar, Chip, Divider, Button, LinearProgress, CircularProgress } from '@mui/material';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
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
import AccommodationDetails from './AccommodationDetails';

const UserDashboard = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('dashboard');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await authAPI.getDashboard();
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setDashData(data);
            } catch (err) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const acc = dashData?.accommodation || {};
    const ft = dashData?.foodTokens || {};
    const cd = dashData?.cautionDeposit || {};
    const usedPercent = ft.total > 0 ? Math.round((ft.used / ft.total) * 100) : 0;
    const playerDetails = dashData?.details || {};

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <Box sx={{ minHeight: '100vh', pt: 8, px: { xs: 1, md: '96px' }, pb: 4, backgroundColor: '#faf6f3' }}>
            <Card sx={{ width: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', p: { xs: 1, md: 4 } }}>

                {/* Page Title */}
                <Typography variant="h4" fontWeight="bold" color="#0b5299" sx={{ mb: 3 }}>
                    User Dashboard
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
                            boxShadow: '0 8px 32px rgba(11,82,153,0.3)',
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
                                    <Avatar sx={{
                                        width: 90,
                                        height: 90,
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                        border: '3px solid rgba(255,255,255,0.5)',
                                        fontSize: 36,
                                    }}>
                                        <PersonIcon sx={{ fontSize: 48, color: '#fff' }} />
                                    </Avatar>
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
                                                <BusinessIcon sx={{ color: '#64748b', fontSize: 20, mr: 2 }} />
                                                <Box sx={{ width: '135px', display: 'flex', justifyContent: 'space-between', pr: 1.5 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Block</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b">{acc.block || '—'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                                <MeetingRoomIcon sx={{ color: '#64748b', fontSize: 20, mr: 2 }} />
                                                <Box sx={{ width: '135px', display: 'flex', justifyContent: 'space-between', pr: 1.5 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Room Number</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b">{acc.roomNumber || '—'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <GroupIcon sx={{ color: '#64748b', fontSize: 20, mr: 2 }} />
                                                <Box sx={{ width: '135px', display: 'flex', justifyContent: 'space-between', pr: 1.5 }}>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">Room Type</Typography>
                                                    <Typography variant="body2" color="#64748b" fontWeight="600">-</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="600" color="#1e293b">{acc.roomType || '—'}</Typography>
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
                                                label={ft.status || 'Inactive'}
                                                size="small"
                                                sx={{
                                                    bgcolor: ft.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                                                    color: ft.status === 'Active' ? '#166534' : '#64748b',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: ft.status === 'Active' ? '#166534' : '#64748b' }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flexGrow: 1, position: 'relative' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                                                <Typography variant="h3" fontWeight="bold" color="#f97316">{ft.total > 0 ? ft.total - ft.used : 0}</Typography>
                                                <Typography variant="subtitle1" fontWeight="600" color="#64748b">Available</Typography>
                                            </Box>
                                            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>{ft.used || 0} Used of {ft.total || 0}</Typography>
                                            <LinearProgress variant="determinate" value={usedPercent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#f97316', borderRadius: 4 } }} />
                                            <Box sx={{ position: 'absolute', right: 0, top: '20%', width: 50, height: 50, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography variant="caption" fontWeight="bold" color="#0369a1" sx={{ lineHeight: 1 }}>{usedPercent}%</Typography>
                                                <Typography sx={{ fontSize: '10px', color: '#0369a1', lineHeight: 1, mt: 0.5 }}>Used</Typography>
                                            </Box>
                                        </Box>
                                        <Button variant="contained" disableElevation sx={{ bgcolor: '#f97316', textTransform: 'none', borderRadius: 1, fontWeight: 600, py: 1, width: 'fit-content', mt: 3, '&:hover': { bgcolor: '#ea580c' }, alignSelf: 'flex-end' }}>
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
                                                <Typography variant="h6" fontWeight="bold" color="#1e293b">Caution Deposit</Typography>
                                            </Box>
                                            <Chip
                                                icon={<AccessTimeIcon sx={{ fontSize: '16px !important' }} />}
                                                label={cd.refundStatus || 'N/A'}
                                                size="small"
                                                sx={{
                                                    bgcolor: cd.refundStatus === 'Refund Pending' ? '#fef3c7' : '#f1f5f9',
                                                    color: cd.refundStatus === 'Refund Pending' ? '#b45309' : '#64748b',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: cd.refundStatus === 'Refund Pending' ? '#b45309' : '#64748b' }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                                <Typography variant="h3" fontWeight="bold" color="#16a34a">₹{cd.amount?.toLocaleString('en-IN') || 0}</Typography>
                                                <Typography variant="subtitle1" fontWeight="600" color="#16a34a">{cd.paid ? 'Paid' : 'Unpaid'}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
                                                Total Deposit <span style={{ fontWeight: 600, color: '#1e293b', marginLeft: '4px' }}>₹{cd.amount?.toLocaleString('en-IN') || 0}</span>
                                            </Typography>
                                            <Divider sx={{ my: 2 }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Card>
        </Box>
    );
};

export default UserDashboard;