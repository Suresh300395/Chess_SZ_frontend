import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box sx={{ 
            bgcolor: 'transparent', 
            py: 3, 
            textAlign: 'center',
            mt: 'auto',
            borderTop: '1px solid rgba(11, 82, 153, 0.1)'
        }}>
            <Typography sx={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: '0.95rem', fontWeight: 500 }}>
                Design and Developed by <Box component="span" sx={{ color: '#d06c38', fontWeight: 700 }}>IT Applications</Box>
            </Typography>
        </Box>
    );
};

export default Footer;
