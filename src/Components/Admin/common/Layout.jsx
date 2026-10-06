import React from 'react';
import { Box, Typography } from '@mui/material';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <Box sx={{ flex: '1 0 auto', backgroundColor: 'white', p: 4, pb: 0, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            
            {/* The individual page component content is injected here */}
            {children}
            
            <Footer />
        </Box>
    );
};

export default Layout;
