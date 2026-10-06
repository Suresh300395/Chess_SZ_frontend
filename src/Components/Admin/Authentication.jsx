import React, { useState } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Authentication = () => {
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
            const response = await fetch('http://localhost:3003/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/admin/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF6F3', p: 2 }}>
            <Box sx={{ maxWidth: 450, width: '100%', bgcolor: 'white', p: { xs: 4, md: 5 }, borderRadius: 4, boxShadow: '0 10px 40px rgba(11, 82, 153, 0.08)' }}>
                <Box component="h2" className="tab-card-title" sx={{ textAlign: 'center', mb: 1, mt: 0, fontSize: 'clamp(24px, 4vw, 32px)' }}>
                    Admin Login
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
                    <Box className="form-group">
                        <Box component="label">Username</Box>
                        <Box
                            component="input"
                            type="text"
                            name="username"
                            className="form-input"
                            placeholder="Enter username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                        />
                    </Box>

                    <Box className="form-group">
                        <Box component="label">Password</Box>
                        <Box
                            component="input"
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                        <Link href="#" underline="hover" sx={{ color: 'var(--color-orange)', fontSize: 'var(--text-label)', fontWeight: 600 }}>
                            Forgot password?
                        </Link>
                    </Box>

                    <Box component="button" type="submit" disabled={loading} className="btn-primary" sx={{ width: '100%', margin: '1rem 0 0 0', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Authentication;
