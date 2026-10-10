import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Card, CardContent, Divider, Avatar, Chip, 
    CircularProgress, Alert, Grid
} from '@mui/material';
// Need icons
import HotelIcon from '@mui/icons-material/Hotel';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import BusinessIcon from '@mui/icons-material/Business';
import LayersIcon from '@mui/icons-material/Layers';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { getCurrentUser } from '../../utils/auth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { authAPI, blocksAPI, SOCKET_URL } from '../../utils/api';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { io } from 'socket.io-client';

const DEFAULT_GUIDELINES = [
    'Keep the room clean and maintain discipline.',
    'Any damage to property will be charged.',
    'Visitors are not allowed inside the hostel rooms.',
    'Follow hostel timings strictly.',
    'Report maintenance issues to the warden office.',
    'Ragging is strictly prohibited.'
];

const AccommodationDetails = ({ onBack }) => {
    const [details, setDetails] = useState(null);
    const [guidelines, setGuidelines] = useState(DEFAULT_GUIDELINES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Fallback static image URL
    const roomImageUrl = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await authAPI.getAccommodationDetails();
                if (!res.ok) throw new Error('Failed to load accommodation details');
                const data = await res.json();
                setDetails(data);
                if (data.guidelines && Array.isArray(data.guidelines) && data.guidelines.length > 0) {
                    setGuidelines(data.guidelines);
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchGuidelines = async () => {
            try {
                const res = await blocksAPI.getGuidelines();
                if (res.ok) {
                    const gData = await res.json();
                    if (gData && Array.isArray(gData.points) && gData.points.length > 0) {
                        setGuidelines(gData.points);
                    }
                }
            } catch (err) {
                console.error('Error fetching guidelines:', err);
            }
        };

        fetchDetails();
        fetchGuidelines();

        // Realtime guidelines updates
        const socket = io(SOCKET_URL);
        socket.on('accommodation_guidelines_updated', (data) => {
            if (data && Array.isArray(data.points) && data.points.length > 0) {
                setGuidelines(data.points);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={40} thickness={4} sx={{ color: '#0b5299' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Button startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '14px !important' }}/>} onClick={onBack} sx={{ mb: 2 }}>Back</Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!details) return null;

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', p: { xs: 1, sm: 2 }, mt: { xs: 1, sm: 2 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2.5, sm: 3.5 }, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: '#e0f2fe', p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HotelIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: { xs: '1.15rem', sm: '1.4rem' }, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>Accommodation Details</Typography>
                        <Typography sx={{ fontSize: { xs: '11.5px', sm: '13px' }, color: '#64748b', mt: 0.25 }}>Your allotted hostel room information and related details</Typography>
                    </Box>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '13px !important' }}/>} 
                    onClick={onBack}
                    sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 600, 
                        color: '#0b5299', 
                        borderColor: '#0b5299',
                        fontSize: { xs: '12.5px', sm: '13.5px' },
                        py: { xs: 0.75, sm: 1 },
                        px: { xs: 2, sm: 2.5 },
                        width: { xs: '100%', sm: 'auto' }
                    }}
                >
                    Back to Dashboard
                </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                {/* Left Card: Room Details */}
                <Box>
                    <Card sx={{ borderRadius: { xs: 2.5, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: '16px !important', sm: 3 }, '&:last-child': { pb: { xs: '16px !important', sm: 3 } } }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#64748b', fontWeight: 600, mb: 0.5 }}>Room Number</Typography>
                                <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 800, color: '#0f172a', mb: { xs: 2, sm: 2.5 }, lineHeight: 1 }}>{details.roomNumber}</Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 } }}>
                                    {[
                                        {
                                            icon: <BusinessIcon sx={{ fontSize: { xs: 17, sm: 19 }, color: '#0b5299' }} />,
                                            label: 'Block',
                                            value: details.block || details.building || '—'
                                        },
                                        {
                                            icon: <LayersIcon sx={{ fontSize: { xs: 17, sm: 19 }, color: '#0b5299' }} />,
                                            label: 'Floor',
                                            value: details.floor || '—'
                                        },
                                        {
                                            icon: <GroupIcon sx={{ fontSize: { xs: 17, sm: 19 }, color: '#0b5299' }} />,
                                            label: 'Capacity',
                                            value: details.capacity ? `${details.capacity} Sharing` : '—'
                                        },
                                        {
                                            icon: <CheckCircleIcon sx={{ fontSize: { xs: 17, sm: 19 }, color: '#0b5299' }} />,
                                            label: 'Status',
                                            isChip: true,
                                            value: details.status || 'Allocated'
                                        },
                                        {
                                            icon: <EventAvailableIcon sx={{ fontSize: { xs: 17, sm: 19 }, color: '#0b5299' }} />,
                                            label: 'Allocation Date',
                                            value: details.allocatedAt ? formatDateDDMMYYYY(details.allocatedAt) : 'Academic Year'
                                        }
                                    ].map((row, idx) => (
                                        <Box 
                                            key={idx} 
                                            sx={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: { xs: '115px 12px 1fr', sm: '140px 16px 1fr' }, 
                                                gap: { xs: 0.75, sm: 1.25 }, 
                                                alignItems: 'center',
                                                py: { xs: 0.75, sm: 1 },
                                                borderBottom: idx < 4 ? '1px solid #f8fafc' : 'none'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {row.icon}
                                                </Box>
                                                <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, fontWeight: 500, color: '#64748b' }}>
                                                    {row.label}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, color: '#94a3b8', textAlign: 'center' }}>-</Typography>
                                            {row.isChip ? (
                                                <Chip 
                                                    label={row.value} 
                                                    size="small" 
                                                    sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, borderRadius: 1.5, width: 'fit-content', fontSize: '11.5px', height: 24 }} 
                                                />
                                            ) : (
                                                <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>
                                                    {row.value}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Right Card: Room Occupancy */}
                <Box>
                    <Card sx={{ borderRadius: { xs: 2.5, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%', bgcolor: '#f8fafc' }}>
                        <CardContent sx={{ p: { xs: '16px !important', sm: 3 }, '&:last-child': { pb: { xs: '16px !important', sm: 3 } } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 2.5 } }}>
                                <GroupIcon sx={{ color: '#0b5299', mr: 1.25, fontSize: { xs: 22, sm: 24 } }} />
                                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700, color: '#0f172a' }}>Room Occupancy</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {details.roommates && details.roommates.map((rm, idx) => {
                                    const currentUserMobile = getCurrentUser()?.username;
                                    const isMe = rm.regNo === currentUserMobile;
                                    return (
                                        <Box 
                                            key={idx} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between', 
                                                p: { xs: '16px', sm: 2 }, 
                                                bgcolor: '#ffffff', 
                                                borderRadius: 2, 
                                                border: '1px solid #e2e8f0',
                                                gap: 1.5,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0, flex: 1 }}>
                                                <Avatar sx={{ 
                                                    bgcolor: '#e0f2fe', 
                                                    color: '#0369a1', 
                                                    fontWeight: 700,
                                                    width: { xs: 38, sm: 42 },
                                                    height: { xs: 38, sm: 42 },
                                                    fontSize: { xs: '15px', sm: '16px' },
                                                    flexShrink: 0,
                                                    border: '1.5px solid #bae6fd'
                                                }}>
                                                    {rm.name ? rm.name.charAt(0).toUpperCase() : 'U'}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '13.5px', sm: '14.5px' }, wordBreak: 'break-word', lineHeight: 1.2 }}>
                                                            {rm.name}
                                                        </Typography>
                                                        {isMe && (
                                                            <Chip 
                                                                label="You" 
                                                                size="small" 
                                                                sx={{ height: 18, fontSize: '10px', bgcolor: '#0b5299', color: '#fff', fontWeight: 700, px: 0.5 }} 
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography sx={{ fontSize: { xs: '11.5px', sm: '12px' }, color: '#64748b', fontWeight: 500 }}>
                                                                Reg No:
                                                            </Typography>
                                                            <Typography sx={{ fontSize: { xs: '11.5px', sm: '12px' }, color: '#1e293b', fontWeight: 600 }}>
                                                                {rm.regNo || '—'}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                            <Typography sx={{ fontSize: { xs: '11.5px', sm: '12px' }, color: '#64748b', fontWeight: 500 }}>
                                                                Course:
                                                            </Typography>
                                                            <Typography sx={{ fontSize: { xs: '11.5px', sm: '12px' }, color: '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>
                                                                {rm.course || '—'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                                                <Chip 
                                                    label={rm.status || 'Allocated'} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: '#dcfce7', 
                                                        color: '#166534', 
                                                        fontWeight: 600, 
                                                        borderRadius: 1.5,
                                                        fontSize: '11px',
                                                        height: 24
                                                    }} 
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                                {(!details.roommates || details.roommates.length === 0) && (
                                    <Typography variant="body2" color="text.secondary">No other occupants assigned yet.</Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
                {/* Bottom Left: Hostel Information */}
                <Box>
                    <Card sx={{ borderRadius: { xs: 2.5, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: '16px !important', sm: 3 }, '&:last-child': { pb: { xs: '16px !important', sm: 3 } } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 2.5 } }}>
                                <InfoIcon sx={{ color: '#0b5299', mr: 1.25, fontSize: { xs: 22, sm: 24 } }} />
                                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700, color: '#0f172a' }}>Hostel Information</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 } }}>
                                {[
                                    { label: 'Hostel Name', value: details.hostelInfo?.name || details.building || 'Not Assigned', icon: <BusinessIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Hostel Block', value: details.hostelInfo?.block || details.building || 'Not Assigned', icon: <BusinessIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Warden', value: details.hostelInfo?.warden || 'Not Assigned', icon: <PersonIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Warden Contact', value: details.hostelInfo?.wardenContact || 'Not Assigned', icon: <PhoneIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Office Hours', value: details.hostelInfo?.officeHours || 'Not Assigned', icon: <AccessTimeIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Address', value: details.hostelInfo?.address || 'Not Assigned', icon: <LocationOnIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                ].map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <Box sx={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: { xs: '115px 12px 1fr', sm: '140px 16px 1fr' }, 
                                            gap: { xs: 0.75, sm: 1.25 }, 
                                            py: { xs: 0.75, sm: 1 }, 
                                            alignItems: 'flex-start' 
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {item.icon}
                                                </Box>
                                                <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, fontWeight: 500, color: '#64748b' }}>
                                                    {item.label}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, color: '#94a3b8', textAlign: 'center' }}>-</Typography>
                                            <Typography sx={{ fontSize: { xs: '12.5px', sm: '13.5px' }, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                        {idx < 5 && <Divider sx={{ borderColor: '#f8fafc' }} />}
                                    </React.Fragment>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Bottom Right: Guidelines */}
                <Box>
                    <Card sx={{ borderRadius: { xs: 2.5, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: '16px !important', sm: 3 }, '&:last-child': { pb: { xs: '16px !important', sm: 3 } } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 2.5 } }}>
                                <AssignmentIcon sx={{ color: '#0b5299', mr: 1.25, fontSize: { xs: 22, sm: 24 } }} />
                                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700, color: '#0f172a' }}>Important Guidelines</Typography>
                            </Box>
                            
                            <Box sx={{ bgcolor: '#fefce8', border: '1px solid #fef08a', borderRadius: 2, p: { xs: '16px', sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {(guidelines && guidelines.length > 0 ? guidelines : DEFAULT_GUIDELINES).map((rule, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                        <WarningAmberIcon sx={{ color: '#eab308', fontSize: 18, mt: 0.1, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#713f12', fontWeight: 500, lineHeight: 1.4 }}>
                                            {rule}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default AccommodationDetails;
