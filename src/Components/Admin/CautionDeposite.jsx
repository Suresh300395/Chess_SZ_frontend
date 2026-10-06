import React from 'react';
import { Typography } from '@mui/material';

const CautionDeposite = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 2 }}>
                Caution Deposite
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage caution deposites here.
            </Typography>
        </>
    );
};

export default CautionDeposite;
