import React from 'react';
import { Typography } from '@mui/material';

const FoodTokens = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 2, fontSize: { xs: '1rem', md: '2rem' } }}>
                Food Tokens
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage food tokens here.
            </Typography>
        </>
    );
};

export default FoodTokens;
