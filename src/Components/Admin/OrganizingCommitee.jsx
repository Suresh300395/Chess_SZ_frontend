import React from 'react';
import { Typography } from '@mui/material';

const OrganizingCommitee = () => {
    return (
        <>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 2 }}>
                Organizing Commitee
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Manage organizing commitee details here.
            </Typography>
        </>
    );
};

export default OrganizingCommitee;
