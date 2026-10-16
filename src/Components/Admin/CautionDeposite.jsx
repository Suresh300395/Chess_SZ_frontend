import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Paper,
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
    Tabs,
    Tab
} from '@mui/material';
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
import io from 'socket.io-client';
import { toast } from 'sonner';
import { registrationAPI, SOCKET_URL } from '../../utils/api';

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

    // 1. Team / University Deposit List
    const universityDepositList = useMemo(() => {
        return registrations.map(reg => {
            const allottedPlayers = (reg.players || []).filter(p => p.roomAllocation && p.roomAllocation.roomNumber);
            const allottedCoaches = (reg.coaches || []).filter(c => c.roomAllocation && c.roomAllocation.roomNumber);
            const allAllotted = [...allottedPlayers.map(p => ({ ...p, role: 'Player', name: p.playerName, phone: p.mobileNo })), ...allottedCoaches];

            const roomsSet = new Set();
            allAllotted.forEach(m => {
                if (m.roomAllocation?.roomNumber) {
                    roomsSet.add(`Room ${m.roomAllocation.roomNumber} (${m.roomAllocation.building || ''})`);
                }
            });

            const deposit = reg.cautionDeposit || {
                paid: false,
                amount: 2000,
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
                    amount: 2000,
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
        setPayModalOpen(true);
    };

    // Open Pay Modal for Coach
    const handleOpenCoachPayModal = (coachItem) => {
        setSelectedPayItem(coachItem);
        setPayTargetType('coach');
        setPaidByPersonId(coachItem.coachId);
        setPaymentMode('Cash');
        setPayModalOpen(true);
    };

    // Confirm Payment
    const handleConfirmPayment = async () => {
        if (!selectedPayItem) return;

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
                    amount: 2000,
                    paymentMode: paymentMode || 'Cash',
                    notes: 'Coach caution deposit manual collection'
                };

                const res = await registrationAPI.payCautionDeposit(payload);
                const data = await res.json();
                if (res.ok) {
                    toast.success(`Coach caution deposit of ₹2,000 recorded for Coach ${selectedPayItem.coachName}!`);
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
                    amount: 2000,
                    paymentMode: paymentMode || 'Cash',
                    notes: 'Manual cash collected at hostel desk'
                };

                const res = await registrationAPI.payCautionDeposit(payload);
                const data = await res.json();

                if (res.ok) {
                    toast.success(`Caution deposit of ₹2,000 recorded from ${payingMember.name} (${selectedPayItem.universityName})!`);
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

    // Open Receipt
    const handleOpenReceipt = (item, isCoach = false) => {
        setReceiptData({
            isCoach,
            universityName: item.universityName,
            deposit: item.deposit,
            coachName: item.coachName,
            coachRole: item.coachRole,
            coachPhone: item.coachPhone,
            roomNumber: item.roomNumber || item.deposit?.paidBy?.roomNumber
        });
        setReceiptModalOpen(true);
    };

    return (
        <Box sx={{ width: '100%', pb: 6 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: '#eff6ff', color: '#0b5299', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PaymentsIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: '800', fontSize: { xs: '1.3rem', md: '1.75rem' } }}>
                            Caution Deposit Management
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                            Collect, track, and refund ₹2,000 security deposits separately for Teams & Coaches
                        </Typography>
                    </Box>
                </Box>

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
            <Paper variant="outlined" sx={{ borderRadius: 2.5, mb: 3, bgcolor: '#ffffff', px: 2, pt: 1 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => {
                        setActiveTab(val);
                        setFilterStatus('all');
                    }}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.96rem',
                            minHeight: 48,
                            gap: 1
                        },
                        '& .Mui-selected': {
                            color: '#0b5299 !important'
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#0b5299',
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab
                        icon={<GroupsIcon />}
                        iconPosition="start"
                        label={`Team Caution Deposits (${universityDepositList.length})`}
                        value="team"
                    />
                    <Tab
                        icon={<PersonIcon />}
                        iconPosition="start"
                        label={`Coach Caution Deposits (${coachDepositList.length})`}
                        value="coach"
                    />
                </Tabs>
            </Paper>

            {/* KPI Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTED (CASH)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                        ₹{activeKpi.totalCollected.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857' }}>
                        From {activeKpi.paidCount} {activeTab === 'team' ? 'universities' : 'coaches'}
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DEPOSITS PAID</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0b5299', mt: 0.5 }}>
                        {activeKpi.paidCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Active holding deposit
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PENDING COLLECTION</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706', mt: 0.5 }}>
                        {activeKpi.pendingCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b45309' }}>
                        Hostel room allotted, cash unpaid
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>REFUNDED ON CHECKOUT</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748b', mt: 0.5 }}>
                        {activeKpi.refundedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Successfully returned
                    </Typography>
                </Paper>
            </Box>

            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    placeholder={activeTab === 'team' ? 'Search by university, payer name, or receipt no...' : 'Search by coach name, university, phone, or receipt no...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 340 } }}
                    InputProps={{
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
                    }}
                />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[
                        { label: 'All', value: 'all' },
                        { label: `Paid (${activeKpi.paidCount})`, value: 'paid' },
                        { label: `Pending (${activeKpi.pendingCount})`, value: 'pending' },
                        { label: `Refunded (${activeKpi.refundedCount})`, value: 'refunded' }
                    ].map(f => (
                        <Button
                            key={f.value}
                            size="small"
                            variant={filterStatus === f.value ? 'contained' : 'outlined'}
                            onClick={() => setFilterStatus(f.value)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: filterStatus === f.value ? '#0b5299' : 'transparent',
                                borderColor: '#cbd5e1',
                                color: filterStatus === f.value ? '#ffffff' : '#475569',
                                '&:hover': {
                                    bgcolor: filterStatus === f.value ? '#093f77' : 'rgba(0,0,0,0.04)'
                                }
                            }}
                        >
                            {f.label}
                        </Button>
                    ))}
                </Box>
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
                                                    <Chip label="Refunded" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, height: 24 }} />
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

                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handleResetDeposit(item, false)}
                                                            sx={{ textTransform: 'none', fontSize: '11px', color: '#94a3b8', minWidth: 'auto', p: 0.5, '&:hover': { color: '#ef4444' } }}
                                                        >
                                                            Reset
                                                        </Button>
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
                                                        Collect ₹2,000
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
                                                    <Chip label="Refunded" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, height: 24 }} />
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

                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handleResetDeposit(item, true)}
                                                            sx={{ textTransform: 'none', fontSize: '11px', color: '#94a3b8', minWidth: 'auto', p: 0.5, '&:hover': { color: '#ef4444' } }}
                                                        >
                                                            Reset
                                                        </Button>
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
                                                        Collect ₹2,000
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
                            ? `Collect physical cash of ₹2,000 for Coach ${selectedPayItem?.coachName} (${selectedPayItem?.universityName}). This is an independent deposit from player caution deposits.`
                            : 'Collect physical cash of ₹2,000 at the hostel desk from the room or university representative.'
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
                            label="Deposit Amount"
                            value="₹ 2,000"
                            size="small"
                            InputProps={{ readOnly: true, sx: { fontWeight: 700, bgcolor: '#f8fafc' } }}
                            helperText="Fixed refundable caution deposit"
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
                        {submitting ? 'Recording...' : 'Record Payment (₹2,000)'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog
                open={receiptModalOpen}
                onClose={() => setReceiptModalOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ color: '#059669' }} />
                        <Typography sx={{ fontWeight: 700 }}>Hostel Caution Deposit Receipt</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReceiptModalOpen(false)}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {receiptData && (
                        <Box sx={{ p: 2.5, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#fcfdfd' }}>
                            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid #e2e8f0', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b5299' }}>
                                    SOUTH ZONE INTER-UNIVERSITY TOURNAMENT
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                                    HOSTEL ACCOMMODATION - {receiptData.isCoach ? 'COACH' : 'TEAM'} CAUTION DEPOSIT RECEIPT
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    (Official Cash / Manual Payment Voucher)
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, fontSize: '0.88rem' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIPT NO:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{receiptData.deposit?.receiptNo || 'CD-MANUAL'}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DATE & TIME:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {receiptData.deposit?.paidAt ? new Date(receiptData.deposit.paidAt).toLocaleDateString() : 'Today'}
                                    </Typography>
                                </Box>
                                <Box sx={{ gridColumn: 'span 2' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>UNIVERSITY / INSTITUTION:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '1rem' }}>{receiptData.universityName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIVED FROM (PAID BY):</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {receiptData.isCoach
                                            ? `${receiptData.coachName} (${receiptData.coachRole || 'Coach'})`
                                            : `${receiptData.deposit?.paidBy?.name || 'Representative'} (${receiptData.deposit?.paidBy?.role || 'Member'})`
                                        }
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Phone: {receiptData.isCoach ? receiptData.coachPhone : (receiptData.deposit?.paidBy?.phone || 'N/A')}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ALLOTTED HOSTEL ROOM:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        Room {receiptData.roomNumber || receiptData.deposit?.paidBy?.roomNumber || 'Allotted'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PAYMENT MODE:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#047857' }}>{receiptData.deposit?.paymentMode || 'Cash'} (Manual Receipt)</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AMOUNT RECEIVED:</Typography>
                                    <Typography sx={{ fontWeight: 800, color: '#047857', fontSize: '1.2rem' }}>₹{receiptData.deposit?.amount || 2000}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ bgcolor: '#ecfdf5', p: 1.5, borderRadius: 1.5, border: '1px solid #a7f3d0' }}>
                                <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600, display: 'block' }}>
                                    Note: Refundable at checkout upon hostel room clearance and key return.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setReceiptModalOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                        sx={{ textTransform: 'none', bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
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
                            <>Are you sure you want to mark the ₹2,000 caution deposit for Coach <strong>{itemToRefund?.coachName}</strong> ({itemToRefund?.universityName}) as refunded?</>
                        ) : (
                            <>Are you sure you want to mark the ₹2,000 caution deposit for <strong>{itemToRefund?.universityName}</strong> as refunded?</>
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

