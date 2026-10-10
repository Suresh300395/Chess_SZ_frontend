import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent, Chip,
    CircularProgress, Alert, Grid, IconButton, Tooltip, Divider
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { toast } from 'sonner';
import { authAPI } from '../../utils/api';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

const MEAL_ICONS = {
    'Breakfast': { icon: WbSunnyOutlinedIcon, color: '#f59e0b', bg: '#fef3c7' },
    'Lunch': { icon: RestaurantOutlinedIcon, color: '#16a34a', bg: '#dcfce7' },
    'Snacks': { icon: CoffeeOutlinedIcon, color: '#9333ea', bg: '#f3e8ff' },
    'Dinner': { icon: DarkModeOutlinedIcon, color: '#0284c7', bg: '#e0f2fe' }
};

const FoodTokenDetails = ({ onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const tokens = data?.tokens || [];
    const total = data?.total || 0;
    const available = data?.available || 0;
    const used = data?.used || 0;

    return (
        <Box sx={{ width: '100%', boxSizing: 'border-box', p: { xs: 0, md: 2 }, mt: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#fff5f0', p: 1.5, borderRadius: 2, color: '#f97316' }}>
                        <RestaurantIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" color="#1e293b">Food Tokens &amp; Coupons</Typography>
                        <Typography variant="body2" color="#64748b">
                            Your issued meal tokens and coupon codes for dining
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 4 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid #dcfce7', bgcolor: '#f0fdf4', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="body2" color="#166534" fontWeight="600" sx={{ mb: 0.5 }}>
                            Available Tokens
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="#16a34a">
                            {available}
                        </Typography>
                        <Typography variant="caption" color="#166534">
                            Ready to redeem
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#fff7ed', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="body2" color="#9a3412" fontWeight="600" sx={{ mb: 0.5 }}>
                            Total Issued
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="#ea580c">
                            {total}
                        </Typography>
                        <Typography variant="caption" color="#9a3412">
                            Total meal coupons allocated
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Tokens List / Grid */}
            {tokens.length === 0 ? (
                <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center', border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
                    <Box sx={{ mb: 2, color: '#94a3b8' }}>
                        <ConfirmationNumberOutlinedIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ mb: 1 }}>
                        No Food Tokens Issued Yet
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ maxWidth: 450, mx: 'auto' }}>
                        Your food coupons will appear here once the organizing committee issues them for your stay.
                    </Typography>
                </Card>
            ) : (
                <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b" sx={{ mb: 2 }}>
                        Your Issued Meal Coupons ({tokens.length})
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                            gap: 2.5
                        }}
                    >
                        {tokens.map(token => {
                            const mealMeta = MEAL_ICONS[token.mealType] || { icon: RestaurantIcon, color: '#f97316', bg: '#fff5f0' };
                            const IconComp = mealMeta.icon;
                            const isRedeemed = token.status === 'REDEEMED';

                            return (
                                <Card
                                    key={token.id || token.code}
                                    sx={{
                                        borderRadius: 3,
                                        border: isRedeemed ? '1px solid #e2e8f0' : '1.5px solid #fed7aa',
                                        bgcolor: isRedeemed ? '#f8fafc' : '#ffffff',
                                        boxShadow: isRedeemed ? 'none' : '0 4px 16px rgba(249, 115, 22, 0.08)',
                                        overflow: 'hidden',
                                        transition: 'transform 0.15s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: isRedeemed ? '#f1f5f9' : '#fff7ed',
                                            borderBottom: '1px solid #fed7aa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 2,
                                                    bgcolor: mealMeta.bg,
                                                    color: mealMeta.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <IconComp sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold" color="#1e293b" sx={{ lineHeight: 1.2 }}>
                                                    {token.mealType}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b">
                                                    {formatDateDDMMYYYY(token.mealDate)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={isRedeemed ? 'Redeemed' : 'Ready'}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '11px',
                                                bgcolor: isRedeemed ? '#e2e8f0' : '#dcfce7',
                                                color: isRedeemed ? '#475569' : '#166534'
                                            }}
                                        />
                                    </Box>

                                    <CardContent sx={{ p: 2.5 }}>
                                        <Typography variant="caption" color="#64748b" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Coupon Code
                                        </Typography>
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                mb: 2,
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: isRedeemed ? '#f1f5f9' : '#f8fafc',
                                                border: '1px dashed #cbd5e1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                fontWeight="800"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    letterSpacing: 2,
                                                    color: isRedeemed ? '#94a3b8' : '#ea580c'
                                                }}
                                            >
                                                {token.code}
                                            </Typography>
                                            <Tooltip title="Copy Token Code">
                                                <IconButton size="small" onClick={() => handleCopy(token.code)}>
                                                    <ContentCopyIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="#64748b">
                                                Issued: {token.issuedAt ? formatDateDDMMYYYY(token.issuedAt) : 'N/A'}
                                            </Typography>
                                            {isRedeemed && token.redeemedAt && (
                                                <Typography variant="caption" color="#0369a1" fontWeight="600">
                                                    Used: {new Date(token.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default FoodTokenDetails;
