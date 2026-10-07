import React from 'react';
import { Typography } from '@mui/material';

const CautionDeposite = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 2, fontSize: { xs: '1rem', md: '2rem' } }}>
                Caution Deposite
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage caution deposites here.
            </Typography>
        </>
    );
};

export default CautionDeposite;
