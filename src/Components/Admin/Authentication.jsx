import React, { useState } from 'react';
import { Box, Link, Typography, TextField, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';


const Authentication = ({ open, onClose }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                // Save user data + JWT token together
                localStorage.setItem('user', JSON.stringify({ ...data.user, token: data.token }));
                window.dispatchEvent(new Event('authChange'));
                if (onClose) onClose();
                if (data.user.role === 'player') {
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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 2, m: 2, maxWidth: 450 } } }}>
            <Box sx={{ width: '100%', bgcolor: 'white', p: { xs: 4, md: 5 }, position: 'relative' }}>
                <IconButton 
                    onClick={onClose} 
                    sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        color: 'grey.500',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                            bgcolor: '#ff4d4d', 
                            color: 'white' 
                        } 
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <img src="/site-logo.svg" alt="Admin Logo" style={{ maxWidth: '200px', width: '100%' }} />
                </Box>
                <Box component="h6" className="tab-card-title" sx={{ textAlign: 'left', mb: 3, mt: 0, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700 }}>
                    Login
                </Box>
                {error && (
                    <Typography sx={{ color: 'red', textAlign: 'center', mb: 2, fontSize: '0.9rem' }}>
                        {error}
                    </Typography>
                )}
                {/* <Box component="p" sx={{ color: 'rgba(13, 35, 59, 0.7)', textAlign: 'center', mb: 4, fontSize: '0.95rem' }}>
                    Welcome back! Please enter your details.
                </Box> */}

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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2 }}>
                        <Link href="#" underline="hover" sx={{ fontSize: '0.85rem', color: '#0b5299' }}>
                            Forgot Password?
                        </Link>
                    </Box>

                    <Box component="button" type="submit" disabled={loading} className="btn-primary" sx={{ width: 'fit-content', px: 6, margin: '1rem auto 0 auto', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default Authentication;
