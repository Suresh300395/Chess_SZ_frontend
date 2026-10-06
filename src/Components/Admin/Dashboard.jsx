import React from 'react';
import { Typography } from '@mui/material';

const Dashboard = () => {
    return (
        <>
            <Typography variant="h6" sx={{ color: '#0b5299', mb: 2 }}>
                Welcome to Admin Dashboard
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
                Select an option from the sidebar to view details, manage registrations and organize the tournament.
            </Typography>
        </>
    );
};

export default Dashboard;
