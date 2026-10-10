import React from 'react';
import { Box, Typography } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';

const CautionDeposite = () => {
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <PaymentsIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                    Caution Deposit
                </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Manage caution deposits here.
            </Typography>
        </Box>
    );
};

export default CautionDeposite;
