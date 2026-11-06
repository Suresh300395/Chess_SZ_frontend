import React, { useState, useEffect } from 'react';
import { Box, Link, Typography, TextField, Dialog, IconButton, InputAdornment } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { saveAuthSession } from '../../utils/auth';
import { getMenusByRole } from './common/RolesNav';
import ForgotPasswordWorkflow from '../Common/ForgotPasswordWorkflow';

const Authentication = ({ open, onClose, initialUsername = '', initialPassword = '' }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        username: initialUsername || '',
        password: initialPassword || ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    useEffect(() => {
        if (open) {
            setCredentials({
                username: initialUsername || '',
                password: initialPassword || ''
            });
            setError('');
            setShowPassword(false);
            setIsForgotPassword(false);
        }
    }, [open, initialUsername, initialPassword]);

    const handleClose = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        if (onClose) onClose();
        setTimeout(() => {
            setIsForgotPassword(false);
            setError('');
            setShowPassword(false);
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(credentials.username, credentials.password);
            const data = await response.json();

            if (response.ok) {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                // Save user data + JWT token with inactivity tracking
                saveAuthSession({ ...data.user, token: data.token });
                if (onClose) onClose();
                if (data.user.role === 'player' || data.user.role === 'coach') {
                    navigate('/user/dashboard');
                } else {
                    const userMenus = getMenusByRole(data.user.role, data.user.allowedModules);
                    const defaultPath = userMenus.length > 0 ? userMenus[0].path : '/admin/dashboard';
                    navigate(defaultPath);
                }
            } else {
                setError(data.message || 'Invalid username or password');
            }
        } catch (err) {
            setError(err.message || 'Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            disableRestoreFocus
            transitionDuration={{ enter: 225, exit: 0 }}
            slotProps={{ paper: { sx: { borderRadius: 2, m: 2, maxWidth: 460 } } }}
        >
            <Box sx={{ width: '100%', bgcolor: 'white', p: { xs: 3.5, sm: 4.5 }, position: 'relative' }}>
                <IconButton
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
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

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                    <img src="/site-logo.svg" alt="Portal Logo" style={{ maxWidth: '190px', width: '100%' }} />
                </Box>

                {!isForgotPassword ? (
                    <>
                        <Box
                            component="h6"
                            className="tab-card-title"
                            sx={{ textAlign: 'center', mb: 3, mt: 0, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700 }}
                        >
                            Login
                        </Box>

                        {error && (
                            <Typography sx={{ color: 'red', textAlign: 'center', mb: 2, fontSize: '0.9rem' }}>
                                {error}
                            </Typography>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth
                                label="Username / Email / Mobile"
                                name="username"
                                placeholder="Enter username, email or mobile"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Enter password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(prev => !prev)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: '#64748b' }}
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1, alignItems: 'center' }}>
                                <Link
                                    href="#"
                                    underline="hover"
                                    sx={{ fontSize: '0.85rem', color: '#0b5299', cursor: 'pointer', fontWeight: 500 }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsForgotPassword(true);
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </Box>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </Box>
                    </>
                ) : (
                    <ForgotPasswordWorkflow
                        onBackToLogin={() => setIsForgotPassword(false)}
                        onSuccessLogin={(identifier) => {
                            setCredentials(prev => ({
                                ...prev,
                                username: identifier || prev.username,
                                password: ''
                            }));
                            setIsForgotPassword(false);
                        }}
                    />
                )}
            </Box>
        </Dialog>
    );
};

export default Authentication;
