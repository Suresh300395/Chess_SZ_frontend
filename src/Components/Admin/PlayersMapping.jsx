import React from 'react';
import { Box, Typography } from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { AnimatedText } from '../animations';

const PlayersMapping = () => {
    return (
        <Box sx={{ width: '100%' }}>
            <AnimatedText direction="down" delay={0.03}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <AssignmentIndIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                    <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                        Players Mapping
                    </Typography>
                </Box>
            </AnimatedText>
            <AnimatedText delay={0.06}>
                <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                    Manage players mapping here.
                </Typography>
            </AnimatedText>
        </Box>
    );
};

export default PlayersMapping;
