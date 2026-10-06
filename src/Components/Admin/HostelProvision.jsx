import React from 'react';
import { Typography } from '@mui/material';

const HostelProvision = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 2 }}>
                Hostel Provision
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage hostel provisions here.
            </Typography>
        </>
    );
};

export default HostelProvision;
