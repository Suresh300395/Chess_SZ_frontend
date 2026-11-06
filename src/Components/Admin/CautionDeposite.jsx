import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Paper,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Tooltip,
    Alert,
    Divider,
    Grid
} from '@mui/material';
import CustomTabs from '../Common/Tabs';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HotelIcon from '@mui/icons-material/Hotel';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import SchoolIcon from '@mui/icons-material/School';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import io from 'socket.io-client';
import { toast } from 'sonner';
import { registrationAPI, SOCKET_URL } from '../../utils/api';
import { AnimatedCard, AnimatedText } from '../animations';

const CautionDeposite = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, paid, pending, refunded
    const [activeTab, setActiveTab] = useState('team'); // 'team' | 'coach'

    // Modal state for manual payment collection
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedPayItem, setSelectedPayItem] = useState(null); // team item or coach item
    const [payTargetType, setPayTargetType] = useState('team'); // 'team' | 'coach'
    const [paidByPersonId, setPaidByPersonId] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [depositAmount, setDepositAmount] = useState('2000');
    const [submitting, setSubmitting] = useState(false);

    // Modal state for viewing/printing receipt
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // Refund confirmation dialog
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [itemToRefund, setItemToRefund] = useState(null);
    const [refunding, setRefunding] = useState(false);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const res = await registrationAPI.getAll();
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data || []);
            } else {
                toast.error('Failed to load caution deposit records');
            }
        } catch (err) {
            console.error('Error fetching registrations for caution deposits:', err);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();

        const socket = io(SOCKET_URL);
        socket.on('dataUpdated', () => {
            fetchRegistrations();
        });
        socket.on('caution_deposit_updated', () => {
            fetchRegistrations();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // 1. Team / University Deposit List (Players only - Coaches are managed in separate Coaches tab)
    const universityDepositList = useMemo(() => {
        return registrations.map(reg => {
            const allottedPlayers = (reg.players || []).filter(p => p.roomAllocation && p.roomAllocation.roomNumber);
            const allAllotted = allottedPlayers.map(p => ({ ...p, role: 'Player', name: p.playerName, phone: p.mobileNo, id: p._id }));

            const roomsSet = new Set();
            allAllotted.forEach(m => {
                if (m.roomAllocation?.roomNumber) {
                    roomsSet.add(`Room ${m.roomAllocation.roomNumber} (${m.roomAllocation.building || ''})`);
                }
            });

            const deposit = reg.cautionDeposit || {
                paid: false,
                amount: 0,
                refundStatus: 'N/A'
            };

            return {
                registrationId: reg._id,
                universityName: reg.universityName,
                universityContact: reg.universityContact,
                allottedMembers: allAllotted,
                rooms: Array.from(roomsSet),
                deposit
            };
        });
    }, [registrations]);

    // 2. Coaches Deposit List (Each coach has separate caution deposit)
    const coachDepositList = useMemo(() => {
        const list = [];
        registrations.forEach(reg => {
            (reg.coaches || []).forEach(coach => {
                const hasRoom = !!(coach.roomAllocation && coach.roomAllocation.roomNumber);
                const deposit = coach.cautionDeposit || {
                    paid: false,
                    amount: 0,
                    refundStatus: 'N/A'
                };

                list.push({
                    coachId: coach._id,
                    coachName: coach.name,
                    coachRole: coach.role || 'Coach',
                    coachPhone: coach.mobileNo || coach.phone || 'N/A',
                    gender: coach.gender,
                    registrationId: reg._id,
                    universityName: reg.universityName,
                    universityContact: reg.universityContact,
                    hasRoom,
                    roomNumber: coach.roomAllocation?.roomNumber,
                    building: coach.roomAllocation?.building,
                    floor: coach.roomAllocation?.floor,
                    deposit
                });
            });
        });
        return list;
    }, [registrations]);

    // Team KPI Metrics
    const teamKpiMetrics = useMemo(() => {
        let totalCollected = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let refundedCount = 0;

        universityDepositList.forEach(item => {
            if (item.deposit.paid) {
                if (item.deposit.refundStatus === 'Refunded') {
                    refundedCount++;
                } else {
                    paidCount++;
                    totalCollected += (item.deposit.amount || 2000);
                }
            } else if (item.allottedMembers.length > 0) {
                pendingCount++;
            }
        });

        return {
            totalCollected,
            paidCount,
            pendingCount,
            refundedCount,
            totalWithRooms: universityDepositList.filter(u => u.allottedMembers.length > 0).length
        };
    }, [universityDepositList]);

    // Coach KPI Metrics
    const coachKpiMetrics = useMemo(() => {
        let totalCollected = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let refundedCount = 0;

        coachDepositList.forEach(item => {
            if (item.deposit.paid) {
                if (item.deposit.refundStatus === 'Refunded') {
                    refundedCount++;
                } else {
                    paidCount++;
                    totalCollected += (item.deposit.amount || 2000);
                }
            } else if (item.hasRoom) {
                pendingCount++;
            }
        });

        return {
            totalCollected,
            paidCount,
            pendingCount,
            refundedCount,
            totalWithRooms: coachDepositList.filter(c => c.hasRoom).length
        };
    }, [coachDepositList]);

    const activeKpi = activeTab === 'team' ? teamKpiMetrics : coachKpiMetrics;

    // Filtered Team list
    const filteredTeamList = useMemo(() => {
        return universityDepositList.filter(item => {
            const query = searchQuery.toLowerCase();
            const matchesQuery = item.universityName.toLowerCase().includes(query) ||
                (item.deposit.paidBy?.name && item.deposit.paidBy.name.toLowerCase().includes(query)) ||
                (item.deposit.receiptNo && item.deposit.receiptNo.toLowerCase().includes(query));

            if (!matchesQuery) return false;

            if (filterStatus === 'paid') return item.deposit.paid && item.deposit.refundStatus !== 'Refunded';
            if (filterStatus === 'pending') return !item.deposit.paid && item.allottedMembers.length > 0;
            if (filterStatus === 'refunded') return item.deposit.refundStatus === 'Refunded';

            return true;
        });
    }, [universityDepositList, searchQuery, filterStatus]);

    // Filtered Coach list
    const filteredCoachList = useMemo(() => {
        return coachDepositList.filter(item => {
            const query = searchQuery.toLowerCase();
            const matchesQuery = item.coachName.toLowerCase().includes(query) ||
                item.universityName.toLowerCase().includes(query) ||
                (item.coachPhone && item.coachPhone.includes(query)) ||
                (item.deposit.receiptNo && item.deposit.receiptNo.toLowerCase().includes(query));

            if (!matchesQuery) return false;

            if (filterStatus === 'paid') return item.deposit.paid && item.deposit.refundStatus !== 'Refunded';
            if (filterStatus === 'pending') return !item.deposit.paid && item.hasRoom;
            if (filterStatus === 'refunded') return item.deposit.refundStatus === 'Refunded';

            return true;
        });
    }, [coachDepositList, searchQuery, filterStatus]);

    // Open Pay Modal for Team
    const handleOpenTeamPayModal = (item) => {
        setSelectedPayItem(item);
        setPayTargetType('team');
        if (item.allottedMembers.length > 0) {
            setPaidByPersonId(item.allottedMembers[0]._id || item.allottedMembers[0].id);
        } else {
            setPaidByPersonId('');
        }
        setPaymentMode('Cash');
        setDepositAmount('2000');
        setPayModalOpen(true);
    };

    // Open Pay Modal for Coach
    const handleOpenCoachPayModal = (coachItem) => {
        setSelectedPayItem(coachItem);
        setPayTargetType('coach');
        setPaidByPersonId(coachItem.coachId);
        setPaymentMode('Cash');
        setDepositAmount('2000');
        setPayModalOpen(true);
    };

    // Confirm Payment
    const handleConfirmPayment = async () => {
        if (!selectedPayItem) return;

        const amtToPay = Number(depositAmount);
        if (!amtToPay || amtToPay <= 0) {
            toast.error('Please enter a valid deposit amount');
            return;
        }

        setSubmitting(true);
        try {
            if (payTargetType === 'coach') {
                const payload = {
                    registrationId: selectedPayItem.registrationId,
                    universityName: selectedPayItem.universityName,
                    coachId: selectedPayItem.coachId,
                    paidBy: {
                        personId: selectedPayItem.coachId,
                        name: selectedPayItem.coachName,
                        role: selectedPayItem.coachRole || 'Coach',
                        phone: selectedPayItem.coachPhone || '',
                        roomNumber: selectedPayItem.roomNumber || ''
                    },
                    amount: amtToPay,
                    paymentMode: paymentMode || 'Cash',
                    notes: 'Coach caution deposit manual collection'
                };

                const res = await registrationAPI.payCautionDeposit(payload);
                const data = await res.json();
                if (res.ok) {
                    toast.success(`Coach caution deposit of ₹${amtToPay.toLocaleString('en-IN')} recorded for Coach ${selectedPayItem.coachName}!`);
                    setPayModalOpen(false);
                    await fetchRegistrations();
                } else {
                    toast.error(data.message || 'Failed to record coach caution deposit');
                }
            } else {
                if (!paidByPersonId) {
                    toast.error('Please select the member who paid in the "Paid by" dropdown');
                    setSubmitting(false);
                    return;
                }

                const payingMember = selectedPayItem.allottedMembers.find(m => (m._id || m.id) === paidByPersonId);
                if (!payingMember) {
                    toast.error('Selected member not found among room-allotted members');
                    setSubmitting(false);
                    return;
                }

                const payload = {
                    registrationId: selectedPayItem.registrationId,
                    universityName: selectedPayItem.universityName,
                    paidBy: {
                        personId: payingMember._id || payingMember.id,
                        name: payingMember.name,
                        role: payingMember.role,
                        phone: payingMember.phone,
                        roomNumber: payingMember.roomAllocation?.roomNumber || ''
                    },
                    amount: amtToPay,
                    paymentMode: paymentMode || 'Cash',
                    notes: 'Manual cash collected at hostel desk'
                };

                const res = await registrationAPI.payCautionDeposit(payload);
                const data = await res.json();

                if (res.ok) {
                    toast.success(`Caution deposit of ₹${amtToPay.toLocaleString('en-IN')} recorded from ${payingMember.name} (${selectedPayItem.universityName})!`);
                    setPayModalOpen(false);
                    await fetchRegistrations();
                } else {
                    toast.error(data.message || 'Failed to record caution deposit');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Error recording caution deposit');
        } finally {
            setSubmitting(false);
        }
    };

    // Refund Confirmation
    const handleProcessRefund = async () => {
        if (!itemToRefund) return;
        setRefunding(true);
        try {
            const payload = {
                registrationId: itemToRefund.registrationId,
                universityName: itemToRefund.universityName
            };
            if (itemToRefund.isCoach) {
                payload.coachId = itemToRefund.coachId;
            }

            const res = await registrationAPI.refundCautionDeposit(payload);
            if (res.ok) {
                toast.success(
                    itemToRefund.isCoach
                        ? `Caution deposit refunded for Coach ${itemToRefund.coachName}`
                        : `Caution deposit refunded for ${itemToRefund.universityName}`
                );
                setRefundDialogOpen(false);
                setItemToRefund(null);
                await fetchRegistrations();
            } else {
                toast.error('Failed to process refund');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error processing refund');
        } finally {
            setRefunding(false);
        }
    };

    // Reset Deposit
    const handleResetDeposit = async (item, isCoach = false) => {
        try {
            const payload = {
                registrationId: item.registrationId,
                universityName: item.universityName
            };
            if (isCoach) {
                payload.coachId = item.coachId;
            }

            const res = await registrationAPI.resetCautionDeposit(payload);
            if (res.ok) {
                toast.info(
                    isCoach
                        ? `Caution deposit status reset for Coach ${item.coachName}`
                        : `Caution deposit status reset for ${item.universityName}`
                );
                await fetchRegistrations();
            } else {
                toast.error('Failed to reset deposit');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error resetting deposit');
        }
    };

    // Convert amount to words
    const getAmountInWords = (num) => {
        const n = Number(num);
        if (!n) return 'Rupees Zero Only';
        if (n === 2000) return 'Rupees Two Thousand Only';
        if (n === 1000) return 'Rupees One Thousand Only';
        if (n === 3000) return 'Rupees Three Thousand Only';
        if (n === 4000) return 'Rupees Four Thousand Only';
        if (n === 5000) return 'Rupees Five Thousand Only';
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const toWords = (val) => {
            if (val === 0) return '';
            if (val < 20) return a[val] + ' ';
            if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '') + ' ';
            if (val < 1000) return toWords(Math.floor(val / 100)) + 'Hundred ' + toWords(val % 100);
            if (val < 100000) return toWords(Math.floor(val / 1000)) + 'Thousand ' + toWords(val % 1000);
            if (val < 10000000) return toWords(Math.floor(val / 100000)) + 'Lakh ' + toWords(val % 100000);
            return toWords(Math.floor(val / 10000000)) + 'Crore ' + toWords(val % 10000000);
        };
        return `Rupees ${toWords(n).trim()} Only`;
    };

    // Open Receipt
    const handleOpenReceipt = (item, isCoach = false) => {
        const primaryRoom = item.roomNumber || item.deposit?.paidBy?.roomNumber || (item.rooms && item.rooms.length > 0 ? (item.rooms[0]?.roomNumber || item.rooms[0]) : null);
        setReceiptData({
            isCoach,
            universityName: item.universityName,
            deposit: item.deposit,
            coachName: item.coachName,
            coachRole: item.coachRole,
            coachPhone: item.coachPhone,
            rooms: item.rooms,
            roomNumber: primaryRoom
        });
        setReceiptModalOpen(true);
    };

    // Clean Receipt Printer (Controlled via @media print in index.css)
    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <Box sx={{ width: '100%', pb: 6 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <AnimatedText direction="down" delay={0.03}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PaymentsIcon sx={{ color: '#0b5299', fontSize: { xs: 32, md: 38 } }} />
                        <Box>
                            <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: '800', fontSize: { xs: '1.3rem', md: '1.75rem' } }}>
                                Caution Deposit Management
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                                Collect, track, and refund security deposits separately for Teams & Coaches
                            </Typography>
                        </Box>
                    </Box>
                </AnimatedText>

                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchRegistrations}
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Navigation Tabs (Team vs Coaches) */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <CustomTabs
                    tabs={[
                        {
                            label: `Team Caution Deposits (${universityDepositList.length})`,
                            value: 'team',
                            icon: <GroupsIcon sx={{ fontSize: 20 }} />
                        },
                        {
                            label: `Coach Caution Deposits (${coachDepositList.length})`,
                            value: 'coach',
                            icon: <PersonIcon sx={{ fontSize: 20 }} />
                        }
                    ]}
                    activeTab={activeTab}
                    setActiveTab={(val) => {
                        setActiveTab(val);
                        setFilterStatus('all');
                    }}
                />
            </Box>

            {/* KPI Cards */}
            <Box key={activeTab} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
                {[
                    {
                        title: 'Total Collected (Cash)',
                        count: `₹${activeKpi.totalCollected.toLocaleString('en-IN')}`,
                        subtitle: `From ${activeKpi.paidCount} ${activeTab === 'team' ? 'universities' : 'coaches'}`,
                        badge: 'Collected',
                        icon: <PaymentsIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <PaymentsIcon sx={{ fontSize: 90, color: '#059669' }} />,
                        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        shadow: 'rgba(5, 150, 105, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f6fdf9 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#a7f3d0',
                        badgeBg: '#ecfdf5',
                        badgeColor: '#047857'
                    },
                    {
                        title: 'Deposits Paid',
                        count: activeKpi.paidCount,
                        subtitle: 'Active holding deposit',
                        badge: 'Paid',
                        icon: <CheckCircleIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <CheckCircleIcon sx={{ fontSize: 90, color: '#0b5299' }} />,
                        gradient: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
                        shadow: 'rgba(11, 82, 153, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#93c5fd',
                        badgeBg: '#eff6ff',
                        badgeColor: '#1d4ed8'
                    },
                    {
                        title: 'Pending Collection',
                        count: activeKpi.pendingCount,
                        subtitle: 'Hostel room allotted, cash unpaid',
                        badge: 'Pending',
                        icon: <HotelIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <HotelIcon sx={{ fontSize: 90, color: '#d97706' }} />,
                        gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                        shadow: 'rgba(217, 119, 6, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#fde68a',
                        badgeBg: '#fffbeb',
                        badgeColor: '#b45309'
                    },
                    {
                        title: 'Refunded on Checkout',
                        count: activeKpi.refundedCount,
                        subtitle: 'Successfully returned',
                        badge: 'Refunded',
                        icon: <ReceiptIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <ReceiptIcon sx={{ fontSize: 90, color: '#6366f1' }} />,
                        gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        shadow: 'rgba(79, 70, 229, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f5f3ff 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#ddd6fe',
                        badgeBg: '#f5f3ff',
                        badgeColor: '#4f46e5'
                    }
                ].map((stat, index) => (
                    <AnimatedCard key={index} style={{ height: '100%' }}>
                        <Card
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            background: stat.bgGradient,
                            border: `1px solid ${stat.borderColor}`,
                            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%',
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                borderColor: stat.hoverBorder
                            }
                        }}
                    >
                        {/* Corner Category Badge */}
                        <Chip
                            label={stat.badge}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                bgcolor: stat.badgeBg,
                                color: stat.badgeColor,
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                height: '22px',
                                borderRadius: '6px',
                                zIndex: 1
                            }}
                        />

                        {/* Subtle decorative watermark icon */}
                        <Box sx={{
                            position: 'absolute',
                            right: -8,
                            bottom: -8,
                            opacity: 0.04,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.bgIcon}
                        </Box>

                        <CardContent sx={{ py: 2, pr: 2, pl: 1.5, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                {/* Icon badge */}
                                <Box sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '12px',
                                    background: stat.gradient,
                                    boxShadow: `0 4px 12px ${stat.shadow}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.05)' }
                                }}>
                                    {stat.icon}
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#64748b',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            display: 'block',
                                            mb: 0.5,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {stat.title}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.9rem' },
                                            lineHeight: 1
                                        }}
                                    >
                                        {stat.count}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Subtitle */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    display: 'block'
                                }}
                            >
                                {stat.subtitle}
                            </Typography>
                        </CardContent>
                    </Card>
                    </AnimatedCard>
                ))}
            </Box>

            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    placeholder={activeTab === 'team' ? 'Search by university, payer name, or receipt no...' : 'Search by coach name, university, phone, or receipt no...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 340 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null
                        }
                    }}
                />

                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                    <InputLabel id="filter-status-label" sx={{ fontSize: '0.88rem', color: '#64748b' }}>
                        Filter by Status
                    </InputLabel>
                    <Select
                        labelId="filter-status-label"
                        id="filter-status-select"
                        value={filterStatus}
                        label="Filter by Status"
                        onChange={(e) => setFilterStatus(e.target.value)}
                        startAdornment={
                            <InputAdornment position="start">
                                <FilterListIcon sx={{ color: '#64748b', fontSize: 20 }} />
                            </InputAdornment>
                        }
                        renderValue={(selected) => {
                            if (selected === 'all') return 'All Statuses';
                            if (selected === 'paid') return `Paid (${activeKpi.paidCount})`;
                            if (selected === 'pending') return `Pending (${activeKpi.pendingCount})`;
                            if (selected === 'refunded') return `Refunded (${activeKpi.refundedCount})`;
                            return selected;
                        }}
                        sx={{
                            borderRadius: 2,
                            bgcolor: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            color: '#0f172a',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#cbd5e1'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#94a3b8'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0b5299'
                            }
                        }}
                    >
                        <MenuItem value="all" sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            All Statuses
                        </MenuItem>
                        <MenuItem value="paid" sx={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Paid</span>
                            <Chip
                                label={activeKpi.paidCount}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    bgcolor: '#eff6ff',
                                    color: '#1d4ed8',
                                    ml: 1.5
                                }}
                            />
                        </MenuItem>
                        <MenuItem value="pending" sx={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Pending</span>
                            <Chip
                                label={activeKpi.pendingCount}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    bgcolor: '#fffbeb',
                                    color: '#b45309',
                                    ml: 1.5
                                }}
                            />
                        </MenuItem>
                        <MenuItem value="refunded" sx={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Refunded</span>
                            <Chip
                                label={activeKpi.refundedCount}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    bgcolor: '#f5f3ff',
                                    color: '#4f46e5',
                                    ml: 1.5
                                }}
                            />
                        </MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* Table Container */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflowX: 'auto' }}>
                {activeTab === 'team' ? (
                    /* ================= TAB 1: TEAM DEPOSITS ================= */
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 60 }}>S.No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>University</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Allotted Room(s)</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Paid by</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Receipt No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 190 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} sx={{ color: '#0b5299', mb: 1 }} />
                                        <Typography sx={{ color: 'text.secondary' }}>Loading team caution deposits...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTeamList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography sx={{ color: 'text.secondary' }}>No team caution deposit records found matching your filters.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeamList.map((item, index) => {
                                    const isPaid = item.deposit.paid;
                                    const isRefunded = item.deposit.refundStatus === 'Refunded';

                                    return (
                                        <TableRow key={item.registrationId} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                    {item.universityName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    Contact: {item.universityContact}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.rooms.length > 0 ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        {item.rooms.map(r => (
                                                            <Chip
                                                                key={r}
                                                                icon={<HotelIcon sx={{ fontSize: '14px !important' }} />}
                                                                label={r}
                                                                size="small"
                                                                sx={{ height: 22, fontSize: '11px', width: 'fit-content', bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                                                            />
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                        No rooms allotted yet
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isPaid ? (
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>
                                                            {item.deposit.paidBy?.name || 'Representative'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            {item.deposit.paidBy?.role} • Room {item.deposit.paidBy?.roomNumber || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 700, color: isPaid ? '#047857' : '#64748b' }}>
                                                    ₹{item.deposit.amount || 2000}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    {item.deposit.paymentMode || 'Cash'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {isPaid ? (
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                                                        {item.deposit.receiptNo || 'CD-MANUAL'}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isRefunded ? (
                                                    <Chip label="Refund Completed" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, height: 24, border: '1px solid #86efac' }} />
                                                ) : isPaid ? (
                                                    <Chip
                                                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                        label="Paid"
                                                        size="small"
                                                        sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, height: 24, border: '1px solid #a7f3d0' }}
                                                    />
                                                ) : item.allottedMembers.length > 0 ? (
                                                    <Chip label="Deposit Pending" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, height: 24 }} />
                                                ) : (
                                                    <Chip label="No Room Allotted" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', height: 24 }} />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {isPaid ? (
                                                    <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Tooltip title="View / Print Receipt">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenReceipt(item, false)}
                                                                sx={{ color: '#059669', bgcolor: '#ecfdf5' }}
                                                            >
                                                                <PrintIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {!isRefunded && (
                                                            <Tooltip title="Process Refund on Checkout">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => {
                                                                        setItemToRefund({ ...item, isCoach: false });
                                                                        setRefundDialogOpen(true);
                                                                    }}
                                                                    sx={{ textTransform: 'none', fontSize: '11px', py: 0.2, px: 1, borderRadius: 1.5, borderColor: '#cbd5e1', color: '#475569' }}
                                                                >
                                                                    Refund
                                                                </Button>
                                                            </Tooltip>
                                                        )}

                                                    </Box>
                                                ) : item.allottedMembers.length > 0 ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<PaymentsIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleOpenTeamPayModal(item)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            borderRadius: 1.5,
                                                            bgcolor: '#059669',
                                                            '&:hover': { bgcolor: '#047857' }
                                                        }}
                                                    >
                                                        Collect Deposit
                                                    </Button>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Allot room first</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    /* ================= TAB 2: COACH DEPOSITS ================= */
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 60 }}>S.No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Coach / Manager</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>University</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Allotted Room</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Receipt No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 190 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} sx={{ color: '#0b5299', mb: 1 }} />
                                        <Typography sx={{ color: 'text.secondary' }}>Loading coach caution deposits...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCoachList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <Typography sx={{ color: 'text.secondary' }}>No coach caution deposit records found matching your filters.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCoachList.map((item, index) => {
                                    const isPaid = item.deposit.paid;
                                    const isRefunded = item.deposit.refundStatus === 'Refunded';

                                    return (
                                        <TableRow key={item.coachId} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                            {item.coachName}
                                                        </Typography>
                                                        <Chip
                                                            label={item.coachRole || 'Coach'}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '10.5px', bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, mt: 0.3 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>
                                                    {item.universityName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.hasRoom ? (
                                                    <Chip
                                                        icon={<HotelIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={`Room ${item.roomNumber} (${item.building || ''})`}
                                                        size="small"
                                                        sx={{ height: 22, fontSize: '11px', width: 'fit-content', bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                        No room allotted yet
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem' }}>
                                                    {item.coachPhone}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 700, color: isPaid ? '#047857' : '#64748b' }}>
                                                    ₹{item.deposit.amount || 2000}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    {item.deposit.paymentMode || 'Cash'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {isPaid ? (
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                                                        {item.deposit.receiptNo || 'CD-COACH'}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isRefunded ? (
                                                    <Chip label="Refund Completed" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, height: 24, border: '1px solid #86efac' }} />
                                                ) : isPaid ? (
                                                    <Chip
                                                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                        label="Paid"
                                                        size="small"
                                                        sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 700, height: 24, border: '1px solid #a7f3d0' }}
                                                    />
                                                ) : item.hasRoom ? (
                                                    <Chip label="Deposit Pending" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, height: 24 }} />
                                                ) : (
                                                    <Chip label="No Room Allotted" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', height: 24 }} />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {isPaid ? (
                                                    <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Tooltip title="View / Print Receipt">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenReceipt(item, true)}
                                                                sx={{ color: '#059669', bgcolor: '#ecfdf5' }}
                                                            >
                                                                <PrintIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {!isRefunded && (
                                                            <Tooltip title="Process Refund on Checkout">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => {
                                                                        setItemToRefund({ ...item, isCoach: true });
                                                                        setRefundDialogOpen(true);
                                                                    }}
                                                                    sx={{ textTransform: 'none', fontSize: '11px', py: 0.2, px: 1, borderRadius: 1.5, borderColor: '#cbd5e1', color: '#475569' }}
                                                                >
                                                                    Refund
                                                                </Button>
                                                            </Tooltip>
                                                        )}

                                                    </Box>
                                                ) : item.hasRoom ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<PaymentsIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => handleOpenCoachPayModal(item)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            borderRadius: 1.5,
                                                            bgcolor: '#059669',
                                                            '&:hover': { bgcolor: '#047857' }
                                                        }}
                                                    >
                                                        Collect Deposit
                                                    </Button>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Allot room first</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Collect Payment Modal (Supports both Team & Coach) */}
            <Dialog
                open={payModalOpen}
                onClose={() => setPayModalOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PaymentsIcon sx={{ color: '#059669', fontSize: 26 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {payTargetType === 'coach'
                                ? `Collect Coach Caution Deposit - ${selectedPayItem?.coachName}`
                                : `Collect Caution Deposit - ${selectedPayItem?.universityName}`
                            }
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setPayModalOpen(false)}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                        {payTargetType === 'coach'
                            ? `Collect physical cash for Coach ${selectedPayItem?.coachName} (${selectedPayItem?.universityName}). This is an independent deposit from player caution deposits.`
                            : 'Collect physical cash at the hostel desk from the room or university representative.'
                        }
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {payTargetType === 'coach' ? (
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>COACH NAME & ROLE:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{selectedPayItem?.coachName} ({selectedPayItem?.coachRole})</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>UNIVERSITY:</Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#0b5299' }}>{selectedPayItem?.universityName}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ALLOTTED ROOM:</Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#16a34a' }}>Room {selectedPayItem?.roomNumber || 'Allotted'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CONTACT:</Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#475569' }}>{selectedPayItem?.coachPhone}</Typography>
                                </Box>
                            </Box>
                        ) : (
                            <FormControl fullWidth size="small">
                                <InputLabel id="admin-paid-by-label">Paid by *</InputLabel>
                                <Select
                                    labelId="admin-paid-by-label"
                                    value={paidByPersonId}
                                    label="Paid by *"
                                    onChange={(e) => setPaidByPersonId(e.target.value)}
                                >
                                    {selectedPayItem?.allottedMembers.map((member) => (
                                        <MenuItem key={member._id || member.id} value={member._id || member.id}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {member.name} ({member.role})
                                                </Typography>
                                                <Chip
                                                    label={member.roomAllocation ? `Room ${member.roomAllocation.roomNumber}` : 'Allocated'}
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '10px', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Amount */}
                        <TextField
                            label="Deposit Amount (₹) *"
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            size="small"
                            placeholder="e.g. 2000"
                            slotProps={{
                                input: {
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    sx: { fontWeight: 700, bgcolor: '#ffffff' }
                                }
                            }}
                            helperText="Enter collected deposit amount"
                        />

                        {/* Payment Mode */}
                        <FormControl fullWidth size="small">
                            <InputLabel id="admin-mode-label">Payment Mode</InputLabel>
                            <Select
                                labelId="admin-mode-label"
                                value={paymentMode}
                                label="Payment Mode"
                                onChange={(e) => setPaymentMode(e.target.value)}
                            >
                                <MenuItem value="Cash">Cash (Manual Collection at Counter)</MenuItem>
                                <MenuItem value="UPI">UPI / QR Code</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setPayModalOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmPayment}
                        disabled={submitting || (payTargetType === 'team' && !paidByPersonId)}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PaymentsIcon />}
                        sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none', fontWeight: 700 }}
                    >
                        {submitting ? 'Recording...' : `Record Payment (₹${Number(depositAmount || 0).toLocaleString('en-IN')})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modern Official Receipt Modal (Matching Image 2) */}
            <Dialog
                open={receiptModalOpen}
                onClose={() => setReceiptModalOpen(false)}
                maxWidth="md"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, maxWidth: 860, overflow: 'hidden' } } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 1.5, px: 3, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ color: '#059669' }} />
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>Hostel Caution Deposit Receipt</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReceiptModalOpen(false)}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, bgcolor: '#ffffff' }}>
                    {receiptData && (() => {
                        const amount = Number(receiptData.deposit?.amount || 2000);
                        const payerName = receiptData.isCoach
                            ? `${receiptData.coachName || 'Coach'} (${receiptData.coachRole || 'Coach'})`
                            : `${receiptData.deposit?.paidBy?.name || 'Representative'} (${receiptData.deposit?.paidBy?.role || 'Player'})`;
                        const payerPhone = receiptData.isCoach
                            ? (receiptData.coachPhone || 'N/A')
                            : (receiptData.deposit?.paidBy?.phone || 'N/A');
                        const rawRoom = receiptData.roomNumber || (receiptData.rooms && receiptData.rooms.length > 0 ? (receiptData.rooms[0]?.roomNumber || receiptData.rooms[0]) : null);
                        const roomDisplay = rawRoom ? (String(rawRoom).toLowerCase().startsWith('room') ? rawRoom : `Room ${rawRoom}`) : 'Room 205';
                        const receiptDate = receiptData.deposit?.paidAt
                            ? new Date(receiptData.deposit.paidAt).toLocaleDateString('en-US')
                            : new Date().toLocaleDateString('en-US');

                        return (
                            <Box sx={{ width: '100%' }}>
                                <Box id="caution-deposit-printable-receipt" sx={{ bgcolor: '#ffffff', color: '#0f172a', p: { xs: 2, sm: 2.5 } }}>
                                    {/* Top Header Section */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                        {/* University Logo */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pr: { xs: 0, sm: 2.5 }, borderRight: { xs: 'none', sm: '1.5px solid #e2e8f0' }, minWidth: { sm: 145 } }}>
                                            <Box
                                                component="img"
                                                src="/ADITYA LOGO2.png"
                                                alt="Aditya University"
                                                sx={{ height: { xs: 46, sm: 58 }, width: 'auto', objectFit: 'contain' }}
                                            />
                                        </Box>

                                        {/* Header Text */}
                                        <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                                            <Typography sx={{ fontWeight: 900, color: '#0b3b80', fontSize: { xs: '1rem', sm: '1.2rem' }, letterSpacing: '0.4px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                                SOUTH ZONE INTER-UNIVERSITY TOURNAMENT
                                            </Typography>
                                            <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: { xs: '0.8rem', sm: '0.9rem' }, letterSpacing: '0.2px', textTransform: 'uppercase', mt: 0.35 }}>
                                                HOSTEL ACCOMMODATION - {receiptData.isCoach ? 'COACH' : 'TEAM'} CAUTION DEPOSIT RECEIPT
                                            </Typography>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mt: 0.2 }}>
                                                (Official Cash / Manual Payment Voucher)
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* 2-Tone Accent Line */}
                                    <Box sx={{ display: 'flex', height: '3.5px', width: '130px', mx: 'auto', borderRadius: 2, overflow: 'hidden', mt: 0.8, mb: 1.25 }}>
                                        <Box sx={{ flex: 1, bgcolor: '#ea580c' }} />
                                        <Box sx={{ flex: 1, bgcolor: '#0284c7' }} />
                                    </Box>
                                    <Divider sx={{ borderColor: '#e2e8f0', mb: 1.5 }} />

                                    {/* Receipt No & Date Banner */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1px 1fr',
                                        alignItems: 'center',
                                        bgcolor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 2,
                                        py: 1,
                                        px: { xs: 2, sm: 3 },
                                        mb: 1.75
                                    }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Receipt No.</Typography>
                                            <Typography sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1rem', sm: '1.12rem' }, letterSpacing: '0.5px' }}>
                                                {receiptData.deposit?.receiptNo || 'CD-MANUAL'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ height: 32, bgcolor: '#cbd5e1' }} />
                                        <Box sx={{ pl: { xs: 2, sm: 3 } }}>
                                            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Date & Time</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <CalendarTodayOutlinedIcon sx={{ color: '#0284c7', fontSize: 18 }} />
                                                <Typography sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1rem', sm: '1.12rem' } }}>
                                                    {receiptDate}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Main Details: 2 Columns - 6*6 (50% / 50%) Alignment */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                        gap: { xs: 2, sm: 2.5 },
                                        alignItems: 'start',
                                        mb: 1.75
                                    }}>
                                        {/* Left Column (6 of 12): University, Paid By, Payment Mode */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                                            {/* University / Institution */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <SchoolIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>University / Institution</Typography>
                                                    <Typography sx={{ fontWeight: 800, color: '#0b5299', fontSize: '1.02rem', lineHeight: 1.25 }}>
                                                        {receiptData.universityName}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Received From (Paid By) */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <PersonIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Received From (Paid By)</Typography>
                                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.25 }}>
                                                        {payerName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', mt: 0.15 }}>
                                                        Phone: {payerPhone}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Payment Mode */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <CreditCardIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Payment Mode</Typography>
                                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.25 }}>
                                                        {receiptData.deposit?.paymentMode || 'Cash'} (Manual Receipt)
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Right Column (6 of 12): Amount Received & Room */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {/* Mint Green Card */}
                                            <Box sx={{ bgcolor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 2.5, p: 1.6, px: 2, width: '100%', boxSizing: 'border-box' }}>
                                                <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Amount Received</Typography>
                                                <Typography sx={{ fontSize: { xs: '1.9rem', sm: '2.25rem' }, fontWeight: 900, color: '#059669', lineHeight: 1.15, my: 0.35 }}>
                                                    ₹{amount.toLocaleString('en-IN')}
                                                </Typography>
                                                <Divider sx={{ my: 0.8, borderColor: '#bbf7d0' }} />
                                                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Amount in Words</Typography>
                                                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '12.5px' }}>
                                                    {getAmountInWords(amount)}
                                                </Typography>
                                            </Box>

                                            {/* Allotted Hostel Room */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <HotelIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Allotted Hostel Room</Typography>
                                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.02rem', lineHeight: 1.25 }}>
                                                        {roomDisplay}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ borderColor: '#e2e8f0', my: 1.25 }} />

                                    {/* Note Banner */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.25,
                                        bgcolor: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: 1.75,
                                        p: 1.1,
                                        px: 1.75,
                                        mb: 1.75
                                    }}>
                                        <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ffffff', fontWeight: 900, fontSize: '12px' }}>
                                            !
                                        </Box>
                                        <Typography sx={{ fontSize: '12px', color: '#334155' }}>
                                            <strong style={{ color: '#c2410c' }}>Note:</strong> Refundable at checkout upon hostel room clearance and key return.
                                        </Typography>
                                    </Box>

                                    {/* Footer: University Address & Signature */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pb: 1, flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>Aditya University</Typography>
                                            <Typography sx={{ color: '#64748b', fontSize: '11px', mt: 0.2 }}>
                                                Surampalem, Kakinada District, Andhra Pradesh - 533437
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center', minWidth: 170 }}>
                                            <Box sx={{ borderBottom: '1.5px dotted #94a3b8', width: '100%', mb: 0.5 }} />
                                            <Typography sx={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                                                Authorised Signature
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Bottom Decorative Bar */}
                                    <Box sx={{ display: 'flex', height: '3.5px', width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box sx={{ flex: 1, bgcolor: '#ea580c' }} />
                                        <Box sx={{ flex: 1, bgcolor: '#0284c7' }} />
                                    </Box>
                                </Box>

                                {/* Half Page Cut Indicator (Only in Print, below the receipt box) */}
                                <Box sx={{
                                    display: 'none',
                                    '@media print': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        mt: 1.5,
                                        color: '#64748b',
                                        fontSize: '11px',
                                        fontWeight: 600
                                    }
                                }}>
                                    <Box sx={{ flex: 1, borderTop: '1px dashed #94a3b8' }} />
                                    <span>✂ Cut or Fold Here (A4 Half-Page / A5 Official Receipt)</span>
                                    <Box sx={{ flex: 1, borderTop: '1px dashed #94a3b8' }} />
                                </Box>
                            </Box>
                        );
                    })()}
                </DialogContent>

                <DialogActions sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setReceiptModalOpen(false)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintReceipt}
                        sx={{ textTransform: 'none', bgcolor: '#059669', borderRadius: 2, fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#047857' } }}
                    >
                        Print Receipt
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Refund Confirm Dialog */}
            <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Caution Deposit Refund</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                        {itemToRefund?.isCoach ? (
                            <>Are you sure you want to mark the ₹{Number(itemToRefund?.deposit?.amount || 0).toLocaleString('en-IN')} caution deposit for Coach <strong>{itemToRefund?.coachName}</strong> ({itemToRefund?.universityName}) as refunded?</>
                        ) : (
                            <>Are you sure you want to mark the ₹{Number(itemToRefund?.deposit?.amount || 0).toLocaleString('en-IN')} caution deposit for <strong>{itemToRefund?.universityName}</strong> as refunded?</>
                        )}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                        Ensure keys have been returned and room clearance inspection has been verified.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRefundDialogOpen(false)} disabled={refunding} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleProcessRefund}
                        disabled={refunding}
                        sx={{ textTransform: 'none', bgcolor: '#0b5299' }}
                    >
                        {refunding ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CautionDeposite;

