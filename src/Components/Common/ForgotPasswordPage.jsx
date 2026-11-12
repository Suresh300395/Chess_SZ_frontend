import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordWorkflow from './ForgotPasswordWorkflow';
import Authentication from '../Admin/Authentication';
import { AnimatedCard } from '../animations';
import { getAssetUrl } from '../../utils/assetHelper';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [prefilledUser, setPrefilledUser] = useState('');

    const handleBackToLogin = () => {
        setLoginModalOpen(true);
    };

    const handleSuccessLogin = (identifier) => {
        setPrefilledUser(identifier);
        setLoginModalOpen(true);
    };

    return (
        <Box
            sx={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 8, md: 12 },
                px: 2,
                bgcolor: '#f8fafc'
            }}
        >
            <AnimatedCard>
                <Paper
                    elevation={3}
                    sx={{
                        width: '100%',
                        maxWidth: 460,
                        p: { xs: 3, sm: 4.5 },
                        borderRadius: '16px',
                        border: '1px solid #eaedf1',
                        bgcolor: '#ffffff'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <img src={getAssetUrl('site-logo.svg')} alt="Tournament Logo" style={{ maxWidth: '190px', width: '100%' }} />
                    </Box>

                    <ForgotPasswordWorkflow
                        onBackToLogin={handleBackToLogin}
                        onSuccessLogin={handleSuccessLogin}
                    />
                </Paper>
            </AnimatedCard>

            {/* Modal login dialog opened when returning to login */}
            <Authentication
                open={loginModalOpen}
                initialUsername={prefilledUser}
                onClose={() => {
                    setLoginModalOpen(false);
                    navigate('/');
                }}
            />
        </Box>
    );
}

