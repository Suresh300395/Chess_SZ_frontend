import React from 'react';
import { Box, Typography } from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const PlayersMapping = () => {
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <AssignmentIndIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                    Players Mapping
                </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Manage players mapping here.
            </Typography>
        </Box>
    );
};

export default PlayersMapping;
