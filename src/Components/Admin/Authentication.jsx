import React, { useState, useEffect } from 'react';
import { Box, Link, Typography, TextField, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { saveAuthSession } from '../../utils/auth';


const Authentication = ({ open, onClose, initialUsername = '', initialPassword = '' }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        username: initialUsername || '',
        password: initialPassword || ''
    });

    useEffect(() => {
        if (open) {
            setCredentials({
                username: initialUsername || '',
                password: initialPassword || ''
            });
            setError('');
        }
    }, [open, initialUsername, initialPassword]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authAPI.checkMobile(mobileNumber);
            const data = await response.json();
            if (response.ok && data.exists) {
                setIsOtpSent(true);
            } else {
                setError(data.message || 'Mobile number not registered');
            }
        } catch (err) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        console.log("Verifying OTP:", otpValue);
        // Implement verification logic here
    };

    const handleOtpChange = (index, value) => {
        if (value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-input-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
        setTimeout(() => {
            setIsForgotPassword(false);
            setIsOtpSent(false);
            setMobileNumber('');
            setOtp(['', '', '', '', '', '']);
            setError('');
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(credentials.username, credentials.password);
            const data = await response.json();

            if (response.ok) {
                // Save user data + JWT token with inactivity tracking
                saveAuthSession({ ...data.user, token: data.token });
                if (onClose) onClose();
                if (data.user.role === 'player' || data.user.role === 'coach') {
                    navigate('/user/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 2, m: 2, maxWidth: 450 } } }}>
            <Box sx={{ width: '100%', bgcolor: 'white', p: { xs: 4, md: 5 }, position: 'relative' }}>
                <IconButton 
                    onClick={handleClose} 
                    sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        color: 'grey.500',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            bgcolor: '#ff4d4d', 
                            color: 'white',
                            transform: 'rotate(90deg)'
                        } 
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <img src="/site-logo.svg" alt="Admin Logo" style={{ maxWidth: '200px', width: '100%' }} />
                </Box>
                <Box component="h6" className="tab-card-title" sx={{ textAlign: 'center', mb: 3, mt: 0, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700 }}>
                    {isForgotPassword ? (isOtpSent ? 'Enter OTP' : 'Forgot Password') : 'Login'}
                </Box>
                {error && (
                    <Typography sx={{ color: 'red', textAlign: 'center', mb: 2, fontSize: '0.9rem' }}>
                        {error}
                    </Typography>
                )}

                {!isForgotPassword ? (
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            placeholder="Enter username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -2, alignItems: 'center' }}>
                            <Box></Box>
                            <Link 
                                href="#" 
                                underline="hover" 
                                sx={{ fontSize: '0.85rem', color: '#0b5299', cursor: 'pointer' }}
                                onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); }}
                            >
                                Forgot Password?
                            </Link>
                        </Box>

                        <Box component="button" type="submit" disabled={loading} className="btn-primary" sx={{ width: 'fit-content', px: 6, margin: '1rem auto 0 auto', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </Box>
                    </Box>
                ) : !isOtpSent ? (
                    <Box component="form" onSubmit={handleSendOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Mobile Number"
                            name="mobileNumber"
                            placeholder="Enter mobile number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            required
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -2, alignItems: 'center' }}>
                            <Link 
                                href="#" 
                                underline="hover" 
                                sx={{ fontSize: '0.85rem', color: '#0b5299', cursor: 'pointer' }}
                                onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); }}
                            >
                                Back to Login
                            </Link>
                        </Box>
                        <Box component="button" type="submit" disabled={loading} className="btn-primary" sx={{ width: 'fit-content', px: 6, margin: '1rem auto 0 auto', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Checking...' : 'Send OTP'}
                        </Box>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', textAlign: 'center' }}>
                            Enter the 6-digit OTP sent to {mobileNumber.slice(0, 2) + '*'.repeat(mobileNumber.length - 4) + mobileNumber.slice(-2)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            {otp.map((digit, index) => (
                                <TextField
                                    key={index}
                                    id={`otp-input-${index}`}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    slotProps={{ 
                                        input: { 
                                            inputProps: {
                                                maxLength: 1,
                                                style: { textAlign: 'center', fontSize: '1.5rem', padding: '10px 0' }
                                            }
                                        }
                                    }}
                                    sx={{ width: '3rem' }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -2, alignItems: 'center' }}>
                            <Link 
                                href="#" 
                                underline="hover" 
                                sx={{ fontSize: '0.85rem', color: '#0b5299', cursor: 'pointer' }}
                                onClick={(e) => { e.preventDefault(); setIsOtpSent(false); }}
                            >
                                Change Number
                            </Link>
                        </Box>
                        <Box component="button" type="submit" className="btn-primary" sx={{ width: 'fit-content', px: 6, margin: '1rem auto 0 auto' }}>
                            Verify
                        </Box>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
};

export default Authentication;
