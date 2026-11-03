import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    LinearProgress,
    CircularProgress,
    Alert
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { toast } from 'sonner';
import { authAPI } from '../../utils/api';

/**
 * Mask mobile number for secure UI presentation (e.g. 99******87).
 */
function maskIdentifier(val) {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.length >= 10) {
        return `${trimmed.slice(0, 2)}******${trimmed.slice(-2)}`;
    }
    return trimmed;
}

/**
 * Password strength calculation.
 */
function calculatePasswordStrength(pass) {
    if (!pass) return { score: 0, label: 'None', color: '#94a3b8', rules: {} };

    const rules = {
        length: pass.length >= 12,
        upper: /[A-Z]/.test(pass),
        lower: /[a-z]/.test(pass),
        number: /[0-9]/.test(pass),
        special: /[^A-Za-z0-9]/.test(pass)
    };

    let score = 0;
    if (rules.length) score += 20;
    if (rules.upper) score += 20;
    if (rules.lower) score += 20;
    if (rules.number) score += 20;
    if (rules.special) score += 20;

    let label = 'Weak';
    let color = '#ef4444'; // Red

    if (score >= 80) {
        label = 'Strong';
        color = '#10b981'; // Green
    } else if (score >= 60) {
        label = 'Moderate';
        color = '#f59e0b'; // Amber
    }

    return { score, label, color, rules };
}

export default function ForgotPasswordWorkflow({ onBackToLogin, onSuccessLogin }) {
    // Current step: 'FORGOT' | 'OTP' | 'RESET' | 'SUCCESS'
    const [step, setStep] = useState('FORGOT');

    // Form inputs (mobile number strictly)
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState(''); // Kept strictly in component memory
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI state
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [countdown, setCountdown] = useState(60);

    // Refs for individual OTP input elements
    const otpRefs = useRef([]);

    // 60-second cooldown timer
    useEffect(() => {
        let timer = null;
        if (step === 'OTP' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [step, countdown]);

    // Numeric 10-digit mobile number input handler
    const handleIdentifierChange = (e) => {
        const numeric = e.target.value.replace(/\D/g, '').slice(0, 10);
        setIdentifier(numeric);
        if (error) setError('');
    };

    /* =========================================================================
       SCREEN 1: Send OTP to Registered Mobile Number
       ========================================================================= */
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');

        const trimmed = identifier.trim();
        if (!trimmed) {
            setError('Please enter your 10-digit registered mobile number.');
            return;
        }

        if (trimmed.length !== 10) {
            setError('Mobile number must be exactly 10 digits.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.forgotPassword(trimmed);
            const data = await response.json();

            if (response.ok) {
                toast.success('Verification code sent to your registered mobile number.');
                setStep('OTP');
                setCountdown(60);
                setOtp(['', '', '', '', '', '']);
                setTimeout(() => {
                    if (otpRefs.current[0]) otpRefs.current[0].focus();
                }, 100);
            } else {
                setError(data.message || 'Unable to process request. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Network error. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================================
       SCREEN 2: OTP Verification & Resend
       ========================================================================= */
    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (error) setError('');

        if (digit && index < 5) {
            const nextInput = otpRefs.current[index + 1];
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const prevInput = otpRefs.current[index - 1];
                if (prevInput) {
                    prevInput.focus();
                    const newOtp = [...otp];
                    newOtp[index - 1] = '';
                    setOtp(newOtp);
                }
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        const digits = pasteData.replace(/\D/g, '').slice(0, 6);

        if (!digits) return;

        const newOtp = [...otp];
        for (let i = 0; i < digits.length; i++) {
            newOtp[i] = digits[i];
        }
        setOtp(newOtp);
        if (error) setError('');

        const nextIndex = Math.min(digits.length, 5);
        otpRefs.current[nextIndex]?.focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        const fullOtp = otp.join('');

        if (fullOtp.length !== 6) {
            setError('Please enter all 6 digits of the verification code.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verifyResetOtp(identifier.trim(), fullOtp);
            const data = await response.json();

            if (response.ok && data.resetToken) {
                setResetToken(data.resetToken);
                toast.success('Code verified successfully.');
                setStep('RESET');
                setError('');
            } else {
                setError(data.message || 'Incorrect verification code. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Network error during verification.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0 || resendLoading) return;

        setError('');
        setResendLoading(true);
        try {
            const response = await authAPI.resendResetOtp(identifier.trim());
            const data = await response.json();

            if (response.ok) {
                toast.success('A new verification code has been dispatched.');
                setCountdown(60);
                setOtp(['', '', '', '', '', '']);
                otpRefs.current[0]?.focus();
            } else {
                setError(data.message || 'Failed to resend code. Please wait and try again.');
            }
        } catch (err) {
            setError(err.message || 'Network error while resending OTP.');
        } finally {
            setResendLoading(false);
        }
    };

    /* =========================================================================
       SCREEN 3: Reset Password
       ========================================================================= */
    const passwordStrength = calculatePasswordStrength(newPassword);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword || !confirmPassword) {
            setError('Please fill in both password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
            return;
        }

        if (newPassword.length < 12) {
            setError('Password must be at least 12 characters long.');
            return;
        }

        if (passwordStrength.score < 80) {
            setError('Password does not satisfy the security requirements.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.resetPassword(resetToken, newPassword, confirmPassword);
            const data = await response.json();

            if (response.ok) {
                setResetToken(''); // Invalidate memory token immediately
                setStep('SUCCESS');
                toast.success('Password updated successfully.');
            } else {
                setError(data.message || 'Failed to update password. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Network error while resetting password.');
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================================
       SCREEN 4: Success Screen
       ========================================================================= */
    const handleFinishToLogin = () => {
        if (onSuccessLogin) {
            onSuccessLogin(identifier.trim());
        } else if (onBackToLogin) {
            onBackToLogin();
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header Title */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0D233B', fontSize: '1.35rem' }}>
                    {step === 'FORGOT' && 'Forgot Password'}
                    {step === 'OTP' && 'Verify OTP Code'}
                    {step === 'RESET' && 'Create New Password'}
                    {step === 'SUCCESS' && 'Password Reset Complete'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '0.85rem' }}>
                    {step === 'FORGOT' && 'Enter your registered mobile number to receive a secure 6-digit OTP.'}
                    {step === 'OTP' && `A 6-digit verification code was sent to +91 ${maskIdentifier(identifier)}`}
                    {step === 'RESET' && 'Set a strong, unique password of at least 12 characters.'}
                    {step === 'SUCCESS' && 'Your account security credentials have been updated.'}
                </Typography>
            </Box>

            {/* Error & Info Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.85rem' }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {infoMessage && (
                <Alert severity="info" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.85rem' }}>
                    {infoMessage}
                </Alert>
            )}

            {/* SCREEN 1: FORGOT PASSWORD (REGISTERED MOBILE ONLY) */}
            {step === 'FORGOT' && (
                <Box component="form" onSubmit={handleSendOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        fullWidth
                        label="Registered Mobile Number"
                        name="mobileNumber"
                        placeholder="Enter 10-digit mobile number"
                        value={identifier}
                        onChange={handleIdentifierChange}
                        disabled={loading}
                        error={Boolean(error)}
                        autoFocus
                        required
                        slotProps={{
                            htmlInput: {
                                maxLength: 10,
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                            },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0b5299', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <PhoneIphoneIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                            +91
                                        </Box>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading || identifier.trim().length !== 10}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: (loading || identifier.trim().length !== 10) ? 0.7 : 1,
                            cursor: (loading || identifier.trim().length !== 10) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading && <CircularProgress size={18} color="inherit" />}
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Typography
                            component="span"
                            onClick={onBackToLogin}
                            sx={{
                                fontSize: '0.85rem',
                                color: '#0b5299',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            <ArrowBackIcon fontSize="small" /> Back to Login
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* SCREEN 2: OTP VERIFICATION */}
            {step === 'OTP' && (
                <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* 6 Individual OTP Boxes */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: { xs: 1, sm: 1.5 },
                            my: 1
                        }}
                        onPaste={handleOtpPaste}
                    >
                        {otp.map((digit, idx) => (
                            <TextField
                                key={idx}
                                inputRef={(el) => (otpRefs.current[idx] = el)}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                disabled={loading}
                                slotProps={{
                                    htmlInput: {
                                        maxLength: 1,
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                        style: {
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            padding: '10px 0',
                                            color: '#0b5299',
                                            width: '100%'
                                        }
                                    }
                                }}
                                sx={{
                                    width: { xs: '42px', sm: '50px' },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        bgcolor: digit ? '#f0f7ff' : '#ffffff',
                                        borderColor: digit ? '#0b5299' : '#cbd5e1'
                                    }
                                }}
                            />
                        ))}
                    </Box>

                    {/* Resend Timer & Action */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                        <Typography
                            component="span"
                            onClick={() => {
                                setStep('FORGOT');
                                setError('');
                            }}
                            sx={{ fontSize: '0.82rem', color: '#64748b', cursor: 'pointer', '&:hover': { color: '#0b5299' } }}
                        >
                            Change Mobile Number
                        </Typography>

                        {countdown > 0 ? (
                            <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                                Resend in <strong style={{ color: '#0b5299' }}>{countdown}s</strong>
                            </Typography>
                        ) : (
                            <Typography
                                component="span"
                                onClick={handleResendOtp}
                                sx={{
                                    fontSize: '0.82rem',
                                    color: '#0b5299',
                                    fontWeight: 600,
                                    cursor: resendLoading ? 'not-allowed' : 'pointer',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                {resendLoading ? 'Resending...' : 'Resend OTP'}
                            </Typography>
                        )}
                    </Box>

                    <button
                        type="submit"
                        disabled={loading || otp.join('').length !== 6}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: (loading || otp.join('').length !== 6) ? 0.7 : 1,
                            cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading && <CircularProgress size={18} color="inherit" />}
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography
                            component="span"
                            onClick={onBackToLogin}
                            sx={{
                                fontSize: '0.85rem',
                                color: '#64748b',
                                cursor: 'pointer',
                                '&:hover': { color: '#0b5299', textDecoration: 'underline' }
                            }}
                        >
                            Cancel and Return to Login
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* SCREEN 3: RESET PASSWORD */}
            {step === 'RESET' && (
                <Box component="form" onSubmit={handleResetPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 12 characters"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (error) setError('');
                        }}
                        disabled={loading}
                        required
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />

                    {/* Password Strength Indicator */}
                    {newPassword && (
                        <Box sx={{ mt: -0.5, mb: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Password Strength:
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: passwordStrength.color }}>
                                    {passwordStrength.label}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={passwordStrength.score}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: passwordStrength.color,
                                        borderRadius: 3
                                    }
                                }}
                            />

                            {/* Checklist Criteria */}
                            <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8 }}>
                                <Typography sx={{ fontSize: '0.72rem', color: passwordStrength.rules.length ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {passwordStrength.rules.length ? '✓' : '○'} 12+ Characters
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: passwordStrength.rules.upper ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {passwordStrength.rules.upper ? '✓' : '○'} Uppercase (A-Z)
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: passwordStrength.rules.lower ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {passwordStrength.rules.lower ? '✓' : '○'} Lowercase (a-z)
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: passwordStrength.rules.number ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {passwordStrength.rules.number ? '✓' : '○'} Number (0-9)
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: passwordStrength.rules.special ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {passwordStrength.rules.special ? '✓' : '○'} Special Symbol
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (error) setError('');
                        }}
                        disabled={loading}
                        required
                        error={Boolean(confirmPassword && newPassword !== confirmPassword)}
                        helperText={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading || passwordStrength.score < 80 || newPassword !== confirmPassword}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: (loading || passwordStrength.score < 80 || newPassword !== confirmPassword) ? 0.7 : 1,
                            cursor: (loading || passwordStrength.score < 80 || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading && <CircularProgress size={18} color="inherit" />}
                        {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                </Box>
            )}

            {/* SCREEN 4: SUCCESS */}
            {step === 'SUCCESS' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 2 }}>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: '#ecfdf5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            color: '#10b981'
                        }}
                    >
                        <CheckCircleOutlinedIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D233B', mb: 1 }}>
                        Password Updated!
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#475569', mb: 3, maxWidth: 360, lineHeight: 1.6 }}>
                        Your password has been securely reset. You can now log into your account using your new credentials.
                    </Typography>

                    <button
                        type="button"
                        onClick={handleFinishToLogin}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Return to Login
                    </button>
                </Box>
            )}
        </Box>
    );
}
