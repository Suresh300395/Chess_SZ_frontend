import React from 'react';
import { Typography } from '@mui/material';

const PlayersMapping = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 2 }}>
                Players Mapping
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage players mapping here.
            </Typography>
        </>
    );
};

export default PlayersMapping;
