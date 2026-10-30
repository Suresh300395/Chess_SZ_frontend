import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Alert, Tooltip, Divider,
    Accordion, AccordionSummary, AccordionDetails,
    Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ScheduleIcon from '@mui/icons-material/Schedule';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CloseIcon from '@mui/icons-material/Close';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { authAPI } from '../../utils/api';
import { isMealTokenExpired, getMealExpiryCutoffLabel } from '../../config/foodTokenConfig';

/**
 * Steaming Coffee / Tea Cup for Breakfast
 */
const BreakfastIcon = ({ size = 52, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Steam Wisps */}
        <path d="M22 10C20.5 13.5 24.5 15.5 22.5 19" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 8C26.5 12 30.5 14.5 28.5 19" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 10C32.5 13.5 36.5 15.5 34.5 19" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cup Body */}
        <path d="M14 22H42V36C42 43.7 35.7 50 28 50C20.3 50 14 43.7 14 36V22Z" fill={color} />
        {/* Cup Handle */}
        <path d="M41 26H46C49.3 26 52 28.7 52 32C52 35.3 49.3 38 46 38H41" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
        {/* Saucer / Plate */}
        <rect x="8" y="53" width="40" height="4.5" rx="2.25" fill={color} />
    </svg>
);

/**
 * Dining Plate with Fork & Spoon for Lunch
 */
const LunchIcon = ({ size = 52, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fork on Left */}
        <path d="M12 14V24C12 27 14.5 29 17 29.5V52" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M17 14V24" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M22 14V24C22 27 19.5 29 17 29.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
        {/* Plate in Center */}
        <circle cx="32" cy="33" r="16.5" stroke={color} strokeWidth="3.2" />
        <circle cx="32" cy="33" r="10.5" stroke={color} strokeWidth="1.8" strokeDasharray="3 2" />
        <circle cx="32" cy="33" r="4.5" fill={color} />
        {/* Spoon on Right */}
        <ellipse cx="47" cy="21" rx="5" ry="7.5" fill={color} />
        <path d="M47 28V52" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

/**
 * Authentic Food Cloche / Serving Dome for Dinner
 */
const DinnerIcon = ({ size = 52, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Steam Wisps */}
        <path d="M26 12C24.5 15.5 28.5 17.5 26.5 21" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 9C30 13 35 16 32.5 21" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M38 12C36.5 15.5 40.5 17.5 38.5 21" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cloche Knob */}
        <circle cx="32" cy="24.5" r="3.2" fill={color} />
        {/* Cloche Serving Dome */}
        <path d="M13 43C13 30.5 21.5 25.5 32 25.5C42.5 25.5 51 30.5 51 43H13Z" fill={color} />
        {/* Cloche Base Tray */}
        <rect x="9" y="45" width="46" height="5" rx="2.5" fill={color} />
    </svg>
);

/**
 * Snack Cup with Straw for Snacks
 */
const SnacksIcon = ({ size = 52, color = '#ffffff' }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M38 8L34 22" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <rect x="18" y="21" width="28" height="4.5" rx="2" fill={color} />
        <path d="M20 25.5L23.5 51C23.8 53 25.5 54.5 27.5 54.5H36.5C38.5 54.5 40.2 53 40.5 51L44 25.5H20Z" fill={color} />
    </svg>
);

/**
 * Dispatches the matching separate icon for each meal type
 */
const MealTypeIcon = ({ mealType, size = 52, color = '#ffffff' }) => {
    const key = (mealType || '').trim().toLowerCase();
    if (key.includes('breakfast')) {
        return <BreakfastIcon size={size} color={color} />;
    }
    if (key.includes('lunch')) {
        return <LunchIcon size={size} color={color} />;
    }
    if (key.includes('dinner')) {
        return <DinnerIcon size={size} color={color} />;
    }
    if (key.includes('snack')) {
        return <SnacksIcon size={size} color={color} />;
    }
    return <DinnerIcon size={size} color={color} />;
};

/**
 * Format date like "16 OCT 2026" to match reference ticket
 */
const formatTicketDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
        if (typeof dateVal === 'string' && dateVal.includes('-')) {
            const parts = dateVal.split('T')[0].split('-');
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                const mIdx = parseInt(parts[1], 10) - 1;
                return `${parts[2]} ${months[mIdx] || ''} ${parts[0]}`;
            } else if (parts[2].length === 4) {
                // DD-MM-YYYY
                const mIdx = parseInt(parts[1], 10) - 1;
                return `${parts[0]} ${months[mIdx] || ''} ${parts[2]}`;
            }
        }
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }
        return String(dateVal);
    } catch {
        return String(dateVal);
    }
};

/**
 * Meal theme styling based on brand CSS variables:
 * - Breakfast: --color-orange: #d06c38
 * - Lunch:     --color-blue:   #0b5299
 * - Dinner:    --color-gold:   #BE9337
 */
const MEAL_THEMES = {
    breakfast: {
        primary: '#d06c38',
        gradient: 'linear-gradient(145deg, #e07d47 0%, #d06c38 100%)',
        border: '#fed7aa',
        shadow: 'rgba(208, 108, 56, 0.18)'
    },
    lunch: {
        primary: '#0b5299',
        gradient: 'linear-gradient(145deg, #186bbd 0%, #0b5299 100%)',
        border: '#bfdbfe',
        shadow: 'rgba(11, 82, 153, 0.18)'
    },
    dinner: {
        primary: '#BE9337',
        gradient: 'linear-gradient(145deg, #d4a748 0%, #BE9337 100%)',
        border: '#fde68a',
        shadow: 'rgba(190, 147, 55, 0.20)'
    }
};

const getMealTheme = (mealType) => {
    const key = (mealType || '').trim().toLowerCase();
    if (key.includes('breakfast')) return MEAL_THEMES.breakfast;
    if (key.includes('lunch')) return MEAL_THEMES.lunch;
    if (key.includes('dinner')) return MEAL_THEMES.dinner;
    return MEAL_THEMES.breakfast;
};

/**
 * Custom sort order: Breakfast (1) -> Lunch (2) -> Dinner (3)
 */
const MEAL_ORDER = {
    breakfast: 1,
    lunch: 2,
    dinner: 3
};

const getMealOrder = (mealType) => {
    const key = (mealType || '').trim().toLowerCase();
    return MEAL_ORDER[key] || 99;
};

const sortTokens = (tokensList) => {
    return [...tokensList].sort((a, b) => {
        const dateA = a.mealDate || '';
        const dateB = b.mealDate || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return getMealOrder(a.mealType) - getMealOrder(b.mealType);
    });
};

/**
 * Authentic Vintage Food Voucher Ticket
 * Matches the requested horizontal ticket layout (Stub + Cream Body + Date & Time)
 */
const MealCouponCard = ({ token, onOpenDetails }) => {
    const isRedeemed = token.status === 'REDEEMED' || token.rawStatus === 'REDEEMED';
    const isExpired = token.isExpired || token.status === 'EXPIRED';
    const cutoffLabel = getMealExpiryCutoffLabel(token.mealType);
    const theme = getMealTheme(token.mealType);

    return (
        <Card
            onClick={() => onOpenDetails && onOpenDetails(token)}
            sx={{
                width: '100%',
                borderRadius: '16px',
                border: isExpired ? '1.5px solid #e2e8f0' : (isRedeemed ? '1.5px solid #cbd5e1' : `1.5px solid ${theme.border}`),
                bgcolor: '#fdfbf7', // warm cream vintage ticket paper
                boxShadow: isExpired ? 'none' : `0 8px 20px -4px ${theme.shadow}, 0 2px 6px -2px rgba(0, 0, 0, 0.04)`,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isExpired ? 0.75 : 1,
                minHeight: { xs: 100, sm: 110 },
                '&:hover': {
                    transform: isExpired ? 'none' : 'translateY(-3px)',
                    boxShadow: isExpired ? 'none' : `0 12px 28px -4px ${theme.shadow}`,
                    borderColor: isExpired ? '#cbd5e1' : theme.primary
                }
            }}
        >
            {/* Left Edge Middle Cutout Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Top-Left Corner Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '-10px',
                    top: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Bottom-Left Corner Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '-10px',
                    bottom: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Divider Top Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    left: { xs: '84px', sm: '100px', md: '110px' },
                    top: '-9px',
                    transform: 'translateX(-50%)',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Divider Bottom Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    left: { xs: '84px', sm: '100px', md: '110px' },
                    bottom: '-9px',
                    transform: 'translateX(-50%)',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Right Edge Middle Cutout Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    right: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Top-Right Corner Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    right: '-10px',
                    top: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Bottom-Right Corner Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    right: '-10px',
                    bottom: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    bgcolor: '#faf6f3',
                    border: isExpired ? '1.5px solid #e2e8f0' : `1.5px solid ${theme.border}`,
                    zIndex: 3
                }}
            />

            {/* Right Perforation Dots Column */}
            <Box
                sx={{
                    position: 'absolute',
                    right: '10px',
                    top: '12px',
                    bottom: '12px',
                    width: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    opacity: isExpired ? 0.35 : 0.6,
                    zIndex: 2
                }}
            >
                {[...Array(6)].map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            bgcolor: '#94a3b8'
                        }}
                    />
                ))}
            </Box>

            {/* --- Left Stub with Meal-specific Icon --- */}
            <Box
                sx={{
                    width: { xs: '84px', sm: '100px', md: '110px' },
                    flexShrink: 0,
                    background: isExpired
                        ? 'linear-gradient(145deg, #94a3b8 0%, #64748b 100%)'
                        : theme.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 1, sm: 1.5 },
                    position: 'relative'
                }}
            >
                <MealTypeIcon
                    mealType={token.mealType}
                    size={52}
                    color="#ffffff"
                />
            </Box>

            {/* Vertical Dashed Separation Line */}
            <Box
                sx={{
                    width: 0,
                    borderRight: isExpired ? '2px dashed #cbd5e1' : `2px dashed ${theme.primary}`,
                    alignSelf: 'stretch',
                    position: 'relative',
                    zIndex: 1
                }}
            />

            {/* --- Right Cream Body with Meal Name, Line, Date & Time --- */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 1.75, sm: 2 },
                    px: { xs: 1.5, sm: 2.5 },
                    minWidth: 0,
                    zIndex: 1
                }}
            >
                {/* Meal Name - Big Bold Centered */}
                <Typography
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.1rem' },
                        fontWeight: 900,
                        color: isExpired ? '#64748b' : '#081d39',
                        letterSpacing: '1px',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    {token.mealType}
                </Typography>

                {/* Thin Horizontal Underline */}
                <Box
                    sx={{
                        width: '88%',
                        height: '2px',
                        bgcolor: isExpired ? '#cbd5e1' : theme.primary,
                        my: { xs: 1, sm: 1.25 }
                    }}
                />

                {/* Info Row: Calendar Date | Clock Cutoff Time */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { xs: 1, sm: 1.75 },
                        flexWrap: 'nowrap'
                    }}
                >
                    {/* Date Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.8 } }}>
                        <CalendarMonthIcon sx={{ color: isExpired ? '#94a3b8' : theme.primary, fontSize: { xs: 20, sm: 24 } }} />
                        <Typography
                            sx={{
                                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.05rem' },
                                fontWeight: 800,
                                color: isExpired ? '#64748b' : '#081d39',
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {formatTicketDate(token.mealDate)}
                        </Typography>
                    </Box>

                    {/* Vertical Separator | */}
                    <Divider orientation="vertical" flexItem sx={{ borderColor: '#cbd5e1', height: 18, alignSelf: 'center', mx: { xs: 0.25, sm: 0.5 } }} />

                    {/* Cutoff Time Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.8 } }}>
                        <AccessTimeIcon sx={{ color: isExpired ? '#94a3b8' : theme.primary, fontSize: { xs: 20, sm: 24 } }} />
                        <Typography
                            sx={{
                                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.05rem' },
                                fontWeight: 800,
                                color: isExpired ? '#64748b' : '#081d39',
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cutoffLabel}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Card>
    );
};

const FoodTokenDetails = ({ onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrMap, setQrMap] = useState({});
    const [detailsToken, setDetailsToken] = useState(null);
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
                        width: 240,
                        margin: 1,
                        color: {
                            dark: '#0b1e36',
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
        toast.success(`Copied coupon code ${code} to clipboard`);
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

    const allTokens = (data?.tokens || []).filter(t => t.mealType !== 'Snacks');

    // Filter tokens by expiration cutoff time and sort chronologically: Breakfast -> Lunch -> Dinner
    const activeTokens = sortTokens(allTokens.filter(t => {
        const expired = t.isExpired || isMealTokenExpired(t.mealDate, t.mealType);
        return !expired && t.status !== 'CANCELLED';
    }));

    const expiredTokens = sortTokens(allTokens.filter(t => {
        const expired = t.isExpired || isMealTokenExpired(t.mealDate, t.mealType);
        return expired && t.status !== 'CANCELLED';
    }));

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
                            Your issued meal coupons and vouchers for dining
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
                    Breakfast: <strong>11:00 AM</strong> &bull; Lunch: <strong>3:00 PM</strong> &bull; Dinner: <strong>10:00 PM</strong>. Coupons expire automatically after cutoff.
                </Typography>
            </Box>

            {/* Active Tokens List / Grid (2 wide tickets in 1 row in desktop view) */}
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
                                md: 'repeat(3, 1fr)'
                            },
                            gap: 2,
                            width: '100%'
                        }}
                    >
                        {activeTokens.map(token => (
                            <MealCouponCard
                                key={token.id || token.code}
                                token={token}
                                onCopy={handleCopy}
                                globalUser={data?.userName}
                                globalTeam={data?.teamOrSport}
                                onOpenDetails={setDetailsToken}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Expired / Past Coupons Collapsible Accordion */}
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
                                    md: 'repeat(3, 1fr)'
                                },
                                gap: 2,
                                width: '100%'
                            }}
                        >
                            {expiredTokens.map(token => (
                                <MealCouponCard
                                    key={token.id || token.code}
                                    token={token}
                                    onCopy={handleCopy}
                                    globalUser={data?.userName}
                                    globalTeam={data?.teamOrSport}
                                    onOpenDetails={setDetailsToken}
                                />
                            ))}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* QR Code & Token Details Dialog */}
            <Dialog
                open={Boolean(detailsToken)}
                onClose={() => setDetailsToken(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 1,
                        overflow: 'hidden'
                    }
                }}
            >
                {detailsToken && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                            <Box>
                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#0b1e36', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                    {detailsToken.mealType} Coupon
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                    {formatTicketDate(detailsToken.mealDate)} • {getMealExpiryCutoffLabel(detailsToken.mealType)}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setDetailsToken(null)} size="small" sx={{ color: '#94a3b8' }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ textAlign: 'center', pt: 1, pb: 2 }}>
                            {/* QR Code */}
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: '#ffffff',
                                    border: '2px solid #fed7aa',
                                    borderRadius: '16px',
                                    display: 'inline-flex',
                                    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.1)',
                                    mb: 2
                                }}
                            >
                                {qrMap[detailsToken.code] ? (
                                    <img
                                        src={qrMap[detailsToken.code]}
                                        alt={`QR for ${detailsToken.code}`}
                                        style={{ width: 180, height: 180, display: 'block', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <Box sx={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress size={30} sx={{ color: '#ea580c' }} />
                                    </Box>
                                )}
                            </Box>

                            {/* Coupon Code Pill */}
                            <Box
                                onClick={() => handleCopy(detailsToken.code)}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 0.75,
                                    bgcolor: '#fff7ed',
                                    borderRadius: '12px',
                                    border: '1.5px dashed #ea580c',
                                    cursor: 'pointer',
                                    mb: 2,
                                    '&:hover': { bgcolor: '#ffedd5' }
                                }}
                            >
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    CODE:
                                </Typography>
                                <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#ea580c', letterSpacing: '2px' }}>
                                    {detailsToken.code}
                                </Typography>
                                <ContentCopyIcon sx={{ fontSize: 16, color: '#9a3412' }} />
                            </Box>

                            {/* Details Card */}
                            <Box sx={{ bgcolor: '#f8fafc', borderRadius: '12px', p: 1.5, textAlign: 'left', border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Participant:</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{detailsToken.name || data?.userName || 'Participant'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>ID / Mobile:</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{detailsToken.identifier || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>University / Team:</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{detailsToken.teamOrSport || data?.teamOrSport || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Hostel Stay:</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>
                                        {detailsToken.stay || [detailsToken.block, detailsToken.room ? `Room ${detailsToken.room}` : ''].filter(Boolean).join(' - ') || 'Not Allocated'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 1.5 }}>
                                Aditya University • South Zone Inter-University Chess Tournament
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default FoodTokenDetails;
