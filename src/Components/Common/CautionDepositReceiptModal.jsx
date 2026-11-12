import React from 'react';
import {
    Box,
    Typography,
    Divider,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { getAssetUrl } from '../../utils/assetHelper';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HotelIcon from '@mui/icons-material/Hotel';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { getAmountInWords } from '../../utils/exportUtils';

const CautionDepositReceiptModal = ({
    open,
    onClose,
    receiptData
}) => {
    if (!receiptData) return null;

    const isCoach = Boolean(
        receiptData.isCoach ||
        receiptData.role === 'Coach' ||
        receiptData.paidByRole === 'Coach' ||
        receiptData.userType === 'coach'
    );

    const amount = Number(
        receiptData.amount ||
        receiptData.deposit?.amount ||
        2000
    );

    // Payer Name & Role
    let payerName = '';
    if (isCoach) {
        payerName = receiptData.coachName || receiptData.paidBy || receiptData.name || 'Coach';
        if (receiptData.coachRole && !payerName.includes('(')) {
            payerName += ` (${receiptData.coachRole})`;
        } else if (!payerName.includes('(')) {
            payerName += ' (Coach)';
        }
    } else {
        payerName = receiptData.deposit?.paidBy?.name || receiptData.paidBy || receiptData.name || 'Representative';
        const role = receiptData.deposit?.paidBy?.role || receiptData.paidByRole || receiptData.role || 'Player';
        if (role && !payerName.includes('(')) {
            payerName += ` (${role})`;
        }
    }

    // Payer Phone
    const payerPhone = isCoach
        ? (receiptData.coachPhone || receiptData.paidByPhone || receiptData.phone || receiptData.mobileNo || 'N/A')
        : (receiptData.deposit?.paidBy?.phone || receiptData.paidByPhone || receiptData.phone || receiptData.mobileNo || 'N/A');

    // Room Display
    const rawRoom = receiptData.roomNumber ||
        receiptData.deposit?.paidBy?.roomNumber ||
        (receiptData.rooms && receiptData.rooms.length > 0 ? (receiptData.rooms[0]?.roomNumber || receiptData.rooms[0]) : null);
    const roomDisplay = rawRoom
        ? (String(rawRoom).toLowerCase().startsWith('room') ? rawRoom : `Room ${rawRoom}`)
        : 'Room 02';

    // Receipt No
    const receiptNo = receiptData.receiptNo || receiptData.deposit?.receiptNo || 'CD-MANUAL';

    // Payment Mode
    const paymentMode = receiptData.paymentMode || receiptData.deposit?.paymentMode || 'Cash';

    // University Name
    const universityName = receiptData.universityName || 'Aditya University';

    // Date
    const rawDate = receiptData.paidAt || receiptData.deposit?.paidAt;
    const receiptDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US')
        : new Date().toLocaleDateString('en-US');

    const amountWords = getAmountInWords(amount);

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 3, maxWidth: 860, overflow: 'hidden' } } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', py: 1.5, px: 3, borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ color: '#059669' }} />
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{isCoach ? 'Coach Caution Deposit Receipt' : 'Hostel Caution Deposit Receipt'}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <ClearIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, bgcolor: '#ffffff' }}>
                <Box sx={{ width: '100%' }}>
                    <Box id="caution-deposit-printable-receipt" sx={{ bgcolor: '#ffffff', color: '#0f172a', p: { xs: 2, sm: 2.5 }, fontFamily: "'Montserrat', sans-serif" }}>
                        {/* Top Header Section */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            {/* University Logo */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pr: { xs: 0, sm: 2.5 }, borderRight: { xs: 'none', sm: '1.5px solid #e2e8f0' }, minWidth: { sm: 145 } }}>
                                <Box
                                    component="img"
                                    src={getAssetUrl('ADITYA LOGO2.png')}
                                    alt="Aditya University"
                                    sx={{ height: { xs: 46, sm: 58 }, width: 'auto', objectFit: 'contain' }}
                                />
                            </Box>

                            {/* Header Text */}
                            <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                                <Typography sx={{ fontWeight: 900, color: '#0b3b80', fontSize: { xs: '1rem', sm: '1.2rem' }, letterSpacing: '0.4px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                    SOUTH ZONE INTER UNIVERSITY CHESS (MEN) TOURNAMENT
                                </Typography>
                                <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: { xs: '0.8rem', sm: '0.9rem' }, letterSpacing: '0.2px', textTransform: 'uppercase', mt: 0.35 }}>
                                    HOSTEL ACCOMMODATION - {isCoach ? 'COACH' : 'TEAM'} CAUTION DEPOSIT RECEIPT
                                </Typography>
                                <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mt: 0.2 }}>
                                    (Manual Payment Voucher)
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
                                    {receiptNo}
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

                        {/* Main Details: 2 Columns - 50% / 50% */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: { xs: 2, sm: 2.5 },
                            alignItems: 'start',
                            mb: 1.75
                        }}>
                            {/* Left Column: University, Paid By, Payment Mode */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                                {/* University / Institution */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <SchoolIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>University / Institution</Typography>
                                        <Typography sx={{ fontWeight: 800, color: '#0b5299', fontSize: '1.02rem', lineHeight: 1.25 }}>
                                            {universityName}
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
                                            {paymentMode} (Offline)
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Right Column: Amount Received & Room */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {/* Mint Green Amount Card */}
                                <Box sx={{ bgcolor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 2.5, p: 1.6, px: 2, width: '100%', boxSizing: 'border-box' }}>
                                    <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Amount Received</Typography>
                                    <Typography sx={{ fontSize: { xs: '1.9rem', sm: '2.25rem' }, fontWeight: 900, color: '#059669', lineHeight: 1.15, my: 0.35 }}>
                                        ₹{amount.toLocaleString('en-IN')}
                                    </Typography>
                                    <Divider sx={{ my: 0.8, borderColor: '#bbf7d0' }} />
                                    <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Amount in Words</Typography>
                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '12.5px' }}>
                                        {amountWords}
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
            </DialogContent>

            <DialogActions sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Close
                </Button>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ textTransform: 'none', bgcolor: '#059669', borderRadius: 2, fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#047857' } }}
                >
                    Print Receipt
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CautionDepositReceiptModal;
