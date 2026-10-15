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
    Avatar,
    Tooltip,
    Alert
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PrintIcon from '@mui/icons-material/Print';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HotelIcon from '@mui/icons-material/Hotel';
import RefreshIcon from '@mui/icons-material/Refresh';
import io from 'socket.io-client';
import { toast } from 'sonner';
import { registrationAPI, SOCKET_URL } from '../../utils/api';

const CautionDeposite = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, paid, pending, refunded

    // Modal state for manual payment collection
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedUniversityReg, setSelectedUniversityReg] = useState(null);
    const [paidByPersonId, setPaidByPersonId] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [submitting, setSubmitting] = useState(false);

    // Modal state for viewing/printing receipt
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [receiptReg, setReceiptReg] = useState(null);

    // Refund confirmation dialog
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [regToRefund, setRegToRefund] = useState(null);
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

    // Filter and compute items
    const universityDepositList = useMemo(() => {
        return registrations.map(reg => {
            // Find all allotted members (both players and coaches)
            const allottedPlayers = (reg.players || []).filter(p => p.roomAllocation && p.roomAllocation.roomNumber);
            const allottedCoaches = (reg.coaches || []).filter(c => c.roomAllocation && c.roomAllocation.roomNumber);
            const allAllotted = [...allottedPlayers.map(p => ({ ...p, role: 'Player', name: p.playerName, phone: p.mobileNo })), ...allottedCoaches];

            // Unique rooms allotted for this university
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

    // KPI Metrics
    const kpiMetrics = useMemo(() => {
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

    // Filtered list
    const filteredList = useMemo(() => {
        return universityDepositList.filter(item => {
            const matchesQuery = item.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.deposit.paidBy?.name && item.deposit.paidBy.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.deposit.receiptNo && item.deposit.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesQuery) return false;

            if (filterStatus === 'paid') return item.deposit.paid && item.deposit.refundStatus !== 'Refunded';
            if (filterStatus === 'pending') return !item.deposit.paid && item.allottedMembers.length > 0;
            if (filterStatus === 'refunded') return item.deposit.refundStatus === 'Refunded';

            return true;
        });
    }, [universityDepositList, searchQuery, filterStatus]);

    // Handle Open Pay Modal
    const handleOpenPayModal = (item) => {
        setSelectedUniversityReg(item);
        if (item.allottedMembers.length > 0) {
            setPaidByPersonId(item.allottedMembers[0]._id || item.allottedMembers[0].id);
        } else {
            setPaidByPersonId('');
        }
        setPaymentMode('Cash');
        setPayModalOpen(true);
    };

    // Handle Submit Manual Payment
    const handleConfirmPayment = async () => {
        if (!selectedUniversityReg) return;
        if (!paidByPersonId) {
            toast.error('Please select the member who paid in the "Paid by" dropdown');
            return;
        }

        const payingMember = selectedUniversityReg.allottedMembers.find(m => (m._id || m.id) === paidByPersonId);
        if (!payingMember) {
            toast.error('Selected member not found among room-allotted members');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                registrationId: selectedUniversityReg.registrationId,
                universityName: selectedUniversityReg.universityName,
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
                toast.success(`Caution deposit of ₹2,000 recorded from ${payingMember.name} (${selectedUniversityReg.universityName})!`);
                setPayModalOpen(false);
                await fetchRegistrations();
            } else {
                toast.error(data.message || 'Failed to record caution deposit');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error recording caution deposit');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Refund
    const handleProcessRefund = async () => {
        if (!regToRefund) return;
        setRefunding(true);
        try {
            const res = await registrationAPI.refundCautionDeposit({
                registrationId: regToRefund.registrationId,
                universityName: regToRefund.universityName
            });
            if (res.ok) {
                toast.success(`Caution deposit marked as refunded for ${regToRefund.universityName}`);
                setRefundDialogOpen(false);
                setRegToRefund(null);
                await fetchRegistrations();
            } else {
                toast.error('Failed to process refund');
            }
        } catch (err) {
            toast.error('Error processing refund');
        } finally {
            setRefunding(false);
        }
    };

    // Handle Reset
    const handleResetDeposit = async (item) => {
        try {
            const res = await registrationAPI.resetCautionDeposit({
                registrationId: item.registrationId,
                universityName: item.universityName
            });
            if (res.ok) {
                toast.info(`Caution deposit status reset for ${item.universityName}`);
                await fetchRegistrations();
            } else {
                toast.error('Failed to reset deposit');
            }
        } catch (err) {
            toast.error('Error resetting deposit');
        }
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
                            Collect, track, and refund ₹2,000 security deposits for hostel accommodation
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

            {/* KPI Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTED (CASH)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                        ₹{kpiMetrics.totalCollected.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857' }}>
                        From {kpiMetrics.paidCount} universities
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DEPOSITS PAID</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0b5299', mt: 0.5 }}>
                        {kpiMetrics.paidCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Active holding deposit
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PENDING COLLECTION</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#d97706', mt: 0.5 }}>
                        {kpiMetrics.pendingCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b45309' }}>
                        Hostel room allotted, cash unpaid
                    </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>REFUNDED ON CHECKOUT</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748b', mt: 0.5 }}>
                        {kpiMetrics.refundedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Successfully returned
                    </Typography>
                </Paper>
            </Box>

            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    placeholder="Search by university, payer name, or receipt no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 320 } }}
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
                        { label: `Paid (${kpiMetrics.paidCount})`, value: 'paid' },
                        { label: `Pending (${kpiMetrics.pendingCount})`, value: 'pending' },
                        { label: `Refunded (${kpiMetrics.refundedCount})`, value: 'refunded' }
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

            {/* Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflowX: 'auto' }}>
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
                            <TableCell sx={{ fontWeight: 700, color: '#334155', width: 180 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={32} sx={{ color: '#0b5299', mb: 1 }} />
                                    <Typography sx={{ color: 'text.secondary' }}>Loading caution deposits...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                    <Typography sx={{ color: 'text.secondary' }}>No caution deposit records found matching your filters.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredList.map((item, index) => {
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
                                                <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center' }}>
                                                    <Tooltip title="View / Print Receipt">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setReceiptReg(item);
                                                                setReceiptModalOpen(true);
                                                            }}
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
                                                                    setRegToRefund(item);
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
                                                    onClick={() => handleOpenPayModal(item)}
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
            </TableContainer>

            {/* Collect Payment Modal */}
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
                            Collect Caution Deposit - {selectedUniversityReg?.universityName}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setPayModalOpen(false)}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                        Collect physical cash of ₹2,000 at the hostel desk from the room or university representative.
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Paid by Dropdown */}
                        <FormControl fullWidth size="small">
                            <InputLabel id="admin-paid-by-label">Paid by *</InputLabel>
                            <Select
                                labelId="admin-paid-by-label"
                                value={paidByPersonId}
                                label="Paid by *"
                                onChange={(e) => setPaidByPersonId(e.target.value)}
                            >
                                {selectedUniversityReg?.allottedMembers.map((member) => (
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
                        disabled={submitting || !paidByPersonId}
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
                    {receiptReg && (
                        <Box sx={{ p: 2.5, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#fcfdfd' }}>
                            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid #e2e8f0', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b5299' }}>
                                    SOUTH ZONE INTER-UNIVERSITY TOURNAMENT
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                                    HOSTEL ACCOMMODATION - CAUTION DEPOSIT RECEIPT
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    (Official Cash / Manual Payment Voucher)
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, fontSize: '0.88rem' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIPT NO:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{receiptReg.deposit.receiptNo || 'CD-MANUAL'}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DATE & TIME:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {receiptReg.deposit.paidAt ? new Date(receiptReg.deposit.paidAt).toLocaleDateString() : 'Today'}
                                    </Typography>
                                </Box>
                                <Box sx={{ gridColumn: 'span 2' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>UNIVERSITY / INSTITUTION:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '1rem' }}>{receiptReg.universityName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIVED FROM (PAID BY):</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {receiptReg.deposit.paidBy?.name || 'Representative'} ({receiptReg.deposit.paidBy?.role || 'Member'})
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Phone: {receiptReg.deposit.paidBy?.phone || 'N/A'}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ALLOTTED HOSTEL ROOM:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        Room {receiptReg.deposit.paidBy?.roomNumber || 'Allotted'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PAYMENT MODE:</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#047857' }}>{receiptReg.deposit.paymentMode || 'Cash'} (Manual Receipt)</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AMOUNT RECEIVED:</Typography>
                                    <Typography sx={{ fontWeight: 800, color: '#047857', fontSize: '1.2rem' }}>₹{receiptReg.deposit.amount || 2000}</Typography>
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
                        Are you sure you want to mark the ₹2,000 caution deposit for <strong>{regToRefund?.universityName}</strong> as refunded?
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
