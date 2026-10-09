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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { authAPI } from '../../utils/api';

const AccommodationDetails = ({ onBack }) => {
    const [details, setDetails] = useState(null);
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
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
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
        <Box sx={{ width: '100%', boxSizing: 'border-box', p: { xs: 0, md: 2 }, mt: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#e0f2fe', p: 1.5, borderRadius: 2, color: '#0369a1' }}>
                        <HotelIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="#1e293b">Accommodation Details</Typography>
                        <Typography variant="body2" color="#64748b">Your allotted hostel room information and related details</Typography>
                    </Box>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '14px !important' }}/>} 
                    onClick={onBack}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: '#0b5299', borderColor: '#0b5299' }}
                >
                    Back to Dashboard
                </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                {/* Left Card: Room Details */}
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="#64748b" fontWeight="600" sx={{ mb: 0.5 }}>Room Number</Typography>
                                    <Typography variant="h3" fontWeight="bold" color="#0f172a" sx={{ mb: 3 }}>{details.roomNumber}</Typography>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '140px 20px 1fr', gap: 1.5, alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                            <BusinessIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Block</Typography>
                                        </Box>
                                        <Typography variant="body2" color="#64748b" align="center">-</Typography>
                                        <Typography variant="body2" fontWeight="600" color="#0f172a" sx={{ whiteSpace: 'nowrap' }}>{details.block || details.building}</Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                            <LayersIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Floor</Typography>
                                        </Box>
                                        <Typography variant="body2" color="#64748b" align="center">-</Typography>
                                        <Typography variant="body2" fontWeight="600" color="#0f172a" sx={{ whiteSpace: 'nowrap' }}>{details.floor}</Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                            <GroupIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Capacity</Typography>
                                        </Box>
                                        <Typography variant="body2" color="#64748b" align="center">-</Typography>
                                        <Typography variant="body2" fontWeight="600" color="#0f172a" sx={{ whiteSpace: 'nowrap' }}>{details.capacity}</Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                            <CheckCircleIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Status</Typography>
                                        </Box>
                                        <Typography variant="body2" color="#64748b" align="center">-</Typography>
                                        <Chip 
                                            label={details.status} 
                                            size="small" 
                                            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, borderRadius: 1.5, width: 'fit-content' }} 
                                        />

                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                            <EventAvailableIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Allocation Date</Typography>
                                        </Box>
                                        <Typography variant="body2" color="#64748b" align="center">-</Typography>
                                        <Typography variant="body2" fontWeight="600" color="#0f172a" sx={{ whiteSpace: 'nowrap' }}>{details.allocatedAt ? new Date(details.allocatedAt).toLocaleDateString() : 'Academic Year'}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Right Card: Room Occupancy */}
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%', bgcolor: '#f8fafc' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <GroupIcon sx={{ color: '#0b5299', mr: 1.5 }} />
                                <Typography variant="h6" fontWeight="bold" color="#0f172a">Room Occupancy</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {details.roommates && details.roommates.map((rm, idx) => {
                                    // Check if it's the current user (rudimentary check using localstorage username/mobile)
                                    const currentUserMobile = JSON.parse(localStorage.getItem('user') || '{}').username;
                                    const isMe = rm.regNo === currentUserMobile;
                                    return (
                                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: '#cbd5e1', color: '#475569' }}>
                                                    {rm.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold" color="#0f172a">{rm.name}</Typography>
                                                        {isMe && <Chip label="You" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#3b82f6', color: '#fff', fontWeight: 600 }} />}
                                                    </Box>
                                                    <Typography variant="caption" display="block" color="#64748b">Reg No: {rm.regNo}</Typography>
                                                    <Typography variant="caption" display="block" color="#64748b">Course: {rm.course}</Typography>
                                                </Box>
                                            </Box>
                                            <Chip label={rm.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, borderRadius: 1.5 }} />
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                {/* Bottom Left: Hostel Information */}
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <InfoIcon sx={{ color: '#0b5299', mr: 1.5 }} />
                                <Typography variant="h6" fontWeight="bold" color="#0f172a">Hostel Information</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {[
                                    { label: 'Hostel Name', value: details.hostelInfo?.name || details.building || 'Not Assigned', icon: <BusinessIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Hostel Block', value: details.hostelInfo?.block || details.building || 'Not Assigned', icon: <BusinessIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Warden', value: details.hostelInfo?.warden || 'Not Assigned', icon: <PersonIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Warden Contact', value: details.hostelInfo?.wardenContact || 'Not Assigned', icon: <PhoneIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Office Hours', value: details.hostelInfo?.officeHours || 'Not Assigned', icon: <AccessTimeIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                    { label: 'Address', value: details.hostelInfo?.address || 'Not Assigned', icon: <LocationOnIcon fontSize="small" sx={{ color: '#0b5299' }} /> },
                                ].map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '150px 20px 1fr', py: 1.5, alignItems: 'flex-start' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748b' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.icon}
                                                </Box>
                                                <Typography variant="body2" fontWeight="500" sx={{ whiteSpace: 'nowrap' }}>{item.label}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="#64748b" align="center" sx={{ mt: '2px' }}>-</Typography>
                                            <Typography variant="body2" fontWeight="600" color="#1e293b" sx={{ mt: '2px', wordBreak: 'break-word' }}>{item.value}</Typography>
                                        </Box>
                                        {idx < 5 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                                    </React.Fragment>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Bottom Right: Guidelines */}
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <AssignmentIcon sx={{ color: '#0b5299', mr: 1.5 }} />
                                <Typography variant="h6" fontWeight="bold" color="#0f172a">Important Guidelines</Typography>
                            </Box>
                            
                            <Box sx={{ bgcolor: '#fef9c3', borderRadius: 2, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                    'Keep the room clean and maintain discipline.',
                                    'Any damage to property will be charged.',
                                    'Visitors are not allowed inside the hostel rooms.',
                                    'Follow hostel timings strictly.',
                                    'Report maintenance issues to the warden office.',
                                    'Ragging is strictly prohibited.'
                                ].map((rule, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20, mt: -0.2 }} />
                                        <Typography variant="body2" color="#451a03" fontWeight="500">{rule}</Typography>
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
