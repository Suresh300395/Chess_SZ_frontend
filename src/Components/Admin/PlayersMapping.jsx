import React from 'react';
import { Typography } from '@mui/material';

const PlayersMapping = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 2, fontSize: { xs: '1rem', md: '2rem' } }}>
                Players Mapping
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage players mapping here.
            </Typography>
        </>
    );
};

export default PlayersMapping;
