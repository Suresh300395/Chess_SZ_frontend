import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Alert, Tooltip, IconButton, Divider,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ScheduleIcon from '@mui/icons-material/Schedule';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { authAPI } from '../../utils/api';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { isMealTokenExpired, getMealExpiryCutoffLabel } from '../../config/foodTokenConfig';

const MEAL_ICONS = {
    'Breakfast': { icon: WbSunnyOutlinedIcon, color: '#f59e0b', bg: '#fef3c7', borderColor: '#fde68a' },
    'Lunch': { icon: RestaurantOutlinedIcon, color: '#16a34a', bg: '#dcfce7', borderColor: '#bbf7d0' },
    'Snacks': { icon: CoffeeOutlinedIcon, color: '#9333ea', bg: '#f3e8ff', borderColor: '#e9d5ff' },
    'Dinner': { icon: DarkModeOutlinedIcon, color: '#0284c7', bg: '#e0f2fe', borderColor: '#bae6fd' }
};

const formatTime = (dateVal) => {
    if (!dateVal) return '—';
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '—';
    }
};

/**
 * Authentic Boarding-pass / Ticket style Meal Coupon Card
 * Perfectly sized for 4-in-a-row display in desktop view
 */
const MealCouponCard = ({ token, qrUrl, onCopy, globalUser, globalTeam }) => {
    const mealMeta = MEAL_ICONS[token.mealType] || { icon: RestaurantIcon, color: '#f97316', bg: '#fff5f0', borderColor: '#fed7aa' };
    const IconComp = mealMeta.icon;
    const isRedeemed = token.status === 'REDEEMED' || token.rawStatus === 'REDEEMED';
    const isExpired = token.isExpired || token.status === 'EXPIRED';
    const cutoffLabel = getMealExpiryCutoffLabel(token.mealType);

    const displayName = token.name || globalUser || 'Participant';
    const displayPhone = token.identifier || '—';
    const displayTeam = token.teamOrSport || globalTeam || '—';
    const displayStay = token.stay || [token.block, token.room ? (String(token.room).toLowerCase().includes('room') ? token.room : `Room ${token.room}`) : ''].filter(Boolean).join(' - ') || 'Not Allocated';

    return (
        <Card
            sx={{
                width: '100%',
                height: '100%',
                borderRadius: '20px',
                border: isExpired ? '1.5px solid #e2e8f0' : (isRedeemed ? '1.5px solid #cbd5e1' : '1.5px solid #fed7aa'),
                bgcolor: '#ffffff',
                boxShadow: isExpired ? 'none' : '0 6px 22px rgba(249, 115, 22, 0.08)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                opacity: isExpired ? 0.78 : 1,
                '&:hover': {
                    transform: isExpired ? 'none' : 'translateY(-3px)',
                    boxShadow: isExpired ? 'none' : '0 12px 28px rgba(249, 115, 22, 0.14)'
                }
            }}
        >
            {/* Top Section: Ticket Details */}
            <Box sx={{ p: 2, pb: 1.5 }}>
                {/* Header: Meal Type + Date + Status Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                bgcolor: mealMeta.bg,
                                color: mealMeta.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1.5px solid ${mealMeta.borderColor}`,
                                flexShrink: 0
                            }}
                        >
                            <IconComp sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                                {token.mealType}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
                                {formatDateDDMMYYYY(token.mealDate)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Status Chip */}
                    {isExpired ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fef2f2', px: 1.25, py: 0.4, borderRadius: '50px', border: '1px solid #fecaca' }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444' }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>Expired</Typography>
                        </Box>
                    ) : isRedeemed ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', px: 1.25, py: 0.4, borderRadius: '50px', border: '1px solid #cbd5e1' }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#64748b' }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Redeemed</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ecfdf5', px: 1.25, py: 0.4, borderRadius: '50px', border: '1px solid #a7f3d0' }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10b981' }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#047857' }}>Ready</Typography>
                        </Box>
                    )}
                </Box>

                {/* Participant Details Box (4 Compact Rows) */}
                <Box
                    sx={{
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        p: 0.75,
                        bgcolor: '#ffffff',
                        mb: 1.5
                    }}
                >
                    {/* Row 1: Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: '8px', px: 1.25, py: 0.6, mb: 0.75 }}>
                        <PersonIcon sx={{ color: '#3b82f6', fontSize: 16, mr: 1, flexShrink: 0 }} />
                        <Typography sx={{ width: 68, color: '#64748b', fontSize: 11.5, fontWeight: 500, flexShrink: 0 }}>Name</Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#e2e8f0', height: 14 }} />
                        <Typography sx={{ color: '#0f172a', fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                        </Typography>
                    </Box>

                    {/* Row 2: ID / Mobile */}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: '8px', px: 1.25, py: 0.6, mb: 0.75 }}>
                        <SmartphoneIcon sx={{ color: '#10b981', fontSize: 16, mr: 1, flexShrink: 0 }} />
                        <Typography sx={{ width: 68, color: '#64748b', fontSize: 11.5, fontWeight: 500, flexShrink: 0 }}>ID/Mobile</Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#e2e8f0', height: 14 }} />
                        <Typography sx={{ color: '#0f172a', fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayPhone}
                        </Typography>
                    </Box>

                    {/* Row 3: Team */}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: '8px', px: 1.25, py: 0.6, mb: 0.75 }}>
                        <GroupsIcon sx={{ color: '#8b5cf6', fontSize: 16, mr: 1, flexShrink: 0 }} />
                        <Typography sx={{ width: 68, color: '#64748b', fontSize: 11.5, fontWeight: 500, flexShrink: 0 }}>Team</Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#e2e8f0', height: 14 }} />
                        <Typography sx={{ color: '#0f172a', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayTeam}
                        </Typography>
                    </Box>

                    {/* Row 4: Stay */}
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: '8px', px: 1.25, py: 0.6 }}>
                        <HomeIcon sx={{ color: '#ea580c', fontSize: 16, mr: 1, flexShrink: 0 }} />
                        <Typography sx={{ width: 68, color: '#64748b', fontSize: 11.5, fontWeight: 500, flexShrink: 0 }}>Stay</Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#e2e8f0', height: 14 }} />
                        <Typography sx={{ color: '#0f172a', fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayStay}
                        </Typography>
                    </Box>
                </Box>

                {/* Coupon Code Dashed Box */}
                <Box
                    sx={{
                        p: 1.25,
                        px: 1.5,
                        borderRadius: '12px',
                        border: '1.5px dashed #cbd5e1',
                        bgcolor: '#ffffff',
                        mb: 1.5
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                            COUPON CODE
                        </Typography>
                        <Tooltip title="Copy Code">
                            <IconButton size="small" onClick={() => onCopy(token.code)} sx={{ p: 0.25 }}>
                                <ContentCopyIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: 'monospace',
                            fontSize: 19,
                            fontWeight: 800,
                            color: isExpired ? '#94a3b8' : (isRedeemed ? '#64748b' : '#ea580c'),
                            letterSpacing: '2.5px',
                            textDecoration: isExpired ? 'line-through' : 'none',
                            mt: 0.25
                        }}
                    >
                        {token.code}
                    </Typography>
                </Box>

                {/* Timestamps Footer (Issued On & Cutoff Time) */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    {/* Issued On */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '8px',
                                bgcolor: '#eff6ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#3b82f6',
                                flexShrink: 0
                            }}
                        >
                            <CalendarMonthIcon sx={{ fontSize: 17 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 9.5, color: '#64748b', fontWeight: 500, lineHeight: 1.1 }}>Issued</Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                                {formatDateDDMMYYYY(token.issuedAt)}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', height: 24 }} />

                    {/* Cutoff Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '8px',
                                bgcolor: '#fff7ed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ea580c',
                                flexShrink: 0
                            }}
                        >
                            <AccessTimeIcon sx={{ fontSize: 17 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 9.5, color: '#64748b', fontWeight: 500, lineHeight: 1.1 }}>Cutoff</Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                                {cutoffLabel}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Perforation Horizontal Divider Line with Cutout Notches */}
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    borderTop: '2px dashed #cbd5e1',
                    my: 0.5,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-12px',
                        top: '-11px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        bgcolor: '#faf6f3',
                        border: '1.5px solid #fed7aa',
                        zIndex: 2
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: '-12px',
                        top: '-11px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        bgcolor: '#faf6f3',
                        border: '1.5px solid #fed7aa',
                        zIndex: 2
                    }
                }}
            />

            {/* Bottom Stub Section: Thermal Ticket Stub / QR Code */}
            <Box
                sx={{
                    p: 2,
                    pt: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    bgcolor: '#fafbfc'
                }}
            >
                {/* Organization & Event Header */}
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    ADITYA UNIVERSITY
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500, mt: 0.25, maxWidth: 220 }}>
                    {token.eventName || 'South Zone Inter-University Chess Tournament'}
                </Typography>

                {/* Chess Icon Divider */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70%', my: 1, gap: 1 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#b45309', opacity: 0.35 }} />
                    <span style={{ fontSize: '13px', color: '#b45309', userSelect: 'none' }}>♟</span>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#b45309', opacity: 0.35 }} />
                </Box>

                {/* Food Token Meal Title */}
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase' }}>
                    F O O D   T O K E N
                </Typography>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: '#ea580c', letterSpacing: '0.75px', lineHeight: 1.2, mt: 0.25 }}>
                    {(token.mealType || '').toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', mt: 0.25 }}>
                    {formatDateDDMMYYYY(token.mealDate)}
                </Typography>

                {/* QR Code Container */}
                <Box
                    sx={{
                        p: 0.75,
                        mt: 1,
                        mb: 0.75,
                        bgcolor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                >
                    {qrUrl ? (
                        <img
                            src={qrUrl}
                            alt={`QR for ${token.code}`}
                            style={{ width: 115, height: 115, display: 'block', borderRadius: '6px' }}
                        />
                    ) : (
                        <Box sx={{ width: 115, height: 115, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress size={20} sx={{ color: '#ea580c' }} />
                        </Box>
                    )}
                </Box>

                {/* Spaced Monospace Code */}
                <Typography
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: isExpired ? '#94a3b8' : '#0f172a',
                        letterSpacing: '2.5px',
                        mb: 0.75
                    }}
                >
                    {token.code.split('').join(' ')}
                </Typography>

                {/* Valid for One-time Use Badge */}
                <Box
                    sx={{
                        bgcolor: '#fef3c7',
                        px: 1.5,
                        py: 0.35,
                        borderRadius: '50px',
                        border: '1px solid #fde68a'
                    }}
                >
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#b45309', letterSpacing: '0.5px' }}>
                        VALID FOR ONE-TIME USE ONLY
                    </Typography>
                </Box>

                {/* Printed Timestamp */}
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 1 }}>
                    Printed: {formatTime(token.lastPrintedAt || token.issuedAt)}
                </Typography>
            </Box>
        </Card>
    );
};

const FoodTokenDetails = ({ onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrMap, setQrMap] = useState({});
    const [, setTick] = useState(0);

    // Re-check expiry every 30 seconds so tokens disappear in real time when cutoff passes
    useEffect(() => {
        const timer = setInterval(() => {
            setTick(t => t + 1);
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const res = await authAPI.getFoodTokenDetails();
                if (!res.ok) throw new Error('Failed to load food tokens');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTokens();
    }, []);

    // Generate QR codes for all tokens
    useEffect(() => {
        if (!data?.tokens || data.tokens.length === 0) return;
        const generateQRs = async () => {
            const map = {};
            for (const token of data.tokens) {
                try {
                    map[token.code] = await QRCode.toDataURL(token.code, {
                        width: 200,
                        margin: 1,
                        color: {
                            dark: '#0f172a',
                            light: '#ffffff'
                        }
                    });
                } catch (err) {
                    console.error('Failed to generate QR for', token.code, err);
                }
            }
            setQrMap(map);
        };
        generateQRs();
    }, [data]);

    const handleCopy = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        toast.success(`Copied code ${code} to clipboard`);
    };

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
                <Button startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '14px !important' }} />} onClick={onBack} sx={{ mb: 2 }}>
                    Back
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const allTokens = data?.tokens || [];

    // Filter tokens by expiration cutoff time:
    // Breakfast: 10:00 AM, Lunch: 2:00 PM, Snacks: 6:00 PM, Dinner: 9:00 PM
    const activeTokens = allTokens.filter(t => {
        const expired = t.isExpired || isMealTokenExpired(t.mealDate, t.mealType);
        return !expired && t.status !== 'CANCELLED';
    });

    const expiredTokens = allTokens.filter(t => {
        const expired = t.isExpired || isMealTokenExpired(t.mealDate, t.mealType);
        return expired && t.status !== 'CANCELLED';
    });

    const availableCount = activeTokens.filter(t => t.status === 'ISSUED').length;
    const activeTotalCount = activeTokens.length;

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', p: { xs: 0, md: 1 }, mt: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#fff5f0', p: 1.5, borderRadius: 2, color: '#f97316' }}>
                        <RestaurantIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="#1e293b">Food Tokens &amp; Coupons</Typography>
                        <Typography variant="body2" color="#64748b">
                            Your issued meal coupons and QR codes for dining
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={onBack}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: '#0b5299', borderColor: '#0b5299' }}
                >
                    Back to Dashboard
                </Button>
            </Box>

            {/* Summary Metrics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: expiredTokens.length > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }, gap: 2, mb: 4 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid #dcfce7', bgcolor: '#f0fdf4', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="body2" color="#166534" fontWeight="600" sx={{ mb: 0.5 }}>
                            Available Tokens
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="#16a34a">
                            {availableCount}
                        </Typography>
                        <Typography variant="caption" color="#166534">
                            Ready to redeem
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#fff7ed', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="body2" color="#9a3412" fontWeight="600" sx={{ mb: 0.5 }}>
                            Active Coupons
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="#ea580c">
                            {activeTotalCount}
                        </Typography>
                        <Typography variant="caption" color="#9a3412">
                            Currently valid meal coupons
                        </Typography>
                    </CardContent>
                </Card>

                {expiredTokens.length > 0 && (
                    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="body2" color="#64748b" fontWeight="600" sx={{ mb: 0.5 }}>
                                Expired Coupons
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="#64748b">
                                {expiredTokens.length}
                            </Typography>
                            <Typography variant="caption" color="#94a3b8">
                                Past meal cutoff time
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Meal Cutoff Schedule Notice */}
            <Box
                sx={{
                    mb: 3,
                    p: 1.5,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap'
                }}
            >
                <ScheduleIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
                    Meal Expiration Schedule:
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e40af' }}>
                    Breakfast: <strong>10:00 AM</strong> &bull; Lunch: <strong>2:00 PM</strong> &bull; Snacks: <strong>6:00 PM</strong> &bull; Dinner: <strong>9:00 PM</strong>. Coupons expire automatically after cutoff.
                </Typography>
            </Box>

            {/* Active Tokens List / Grid (4 coupons in 1 row in desktop view) */}
            {activeTokens.length === 0 ? (
                <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
                    <Box sx={{ mb: 2, color: '#94a3b8' }}>
                        <ConfirmationNumberOutlinedIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ mb: 1 }}>
                        No Active Meal Coupons
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ maxWidth: 460, mx: 'auto' }}>
                        {allTokens.length > 0
                            ? 'All previously issued coupons have reached their meal cutoff time or were redeemed.'
                            : 'Your food coupons will appear here once the organizing committee issues them for your stay.'}
                    </Typography>
                </Card>
            ) : (
                <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ mb: 2.5 }}>
                        Your Issued Meal Coupons ({activeTokens.length})
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(2, 1fr)',
                                lg: 'repeat(4, 1fr)'
                            },
                            gap: 2.5,
                            width: '100%'
                        }}
                    >
                        {activeTokens.map(token => (
                            <MealCouponCard
                                key={token.id || token.code}
                                token={token}
                                qrUrl={qrMap[token.code]}
                                onCopy={handleCopy}
                                globalUser={data?.userName}
                                globalTeam={data?.teamOrSport}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Expired / Past Coupons Collapsible Accordion (4 coupons in 1 row) */}
            {expiredTokens.length > 0 && (
                <Accordion
                    defaultExpanded={false}
                    sx={{
                        mt: 4,
                        width: '100%',
                        borderRadius: '16px !important',
                        border: '1px solid #e2e8f0',
                        bgcolor: '#f8fafc',
                        boxShadow: 'none',
                        '&:before': { display: 'none' }
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#64748b' }} />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <EventAvailableIcon sx={{ fontSize: 20, color: '#64748b' }} />
                            <Typography variant="subtitle2" fontWeight="700" color="#475569">
                                Past / Expired Coupons ({expiredTokens.length})
                            </Typography>
                            <Chip
                                label="Cutoff Passed"
                                size="small"
                                sx={{ height: 20, fontSize: 10, bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}
                            />
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1, pb: 3 }}>
                        <Typography variant="caption" color="#64748b" sx={{ display: 'block', mb: 2 }}>
                            These tokens have passed their meal cutoff time and are no longer valid for dining.
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(2, 1fr)',
                                    lg: 'repeat(4, 1fr)'
                                },
                                gap: 2.5,
                                width: '100%'
                            }}
                        >
                            {expiredTokens.map(token => (
                                <MealCouponCard
                                    key={token.id || token.code}
                                    token={token}
                                    qrUrl={qrMap[token.code]}
                                    onCopy={handleCopy}
                                    globalUser={data?.userName}
                                    globalTeam={data?.teamOrSport}
                                />
                            ))}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            )}
        </Box>
    );
};

export default FoodTokenDetails;
