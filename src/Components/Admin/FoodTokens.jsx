import React from 'react';
import { Typography } from '@mui/material';

const FoodTokens = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 2 }}>
                Food Tokens
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage food tokens here.
            </Typography>
        </>
    );
};

export default FoodTokens;
