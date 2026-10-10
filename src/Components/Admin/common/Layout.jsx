import React from 'react';
import { Box } from '@mui/material';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <Box 
            sx={{ 
                flex: '1 0 auto', 
                backgroundColor: 'white', 
                p: { xs: 2, sm: 2.5, md: 3, lg: 4 }, 
                pb: 0, 
                borderRadius: 3, 
                display: 'flex', 
                flexDirection: 'column',
                boxSizing: 'border-box',
                minWidth: 0,
                width: '100%',
                overflowX: 'hidden'
            }}
        >
            {/* Standard wrapper for all admin modules ensuring responsive space between parent element and content */}
            <Box
                className="admin-module-wrapper"
                sx={{
                    flex: 1,
                    width: '100%',
                    minWidth: 0,
                    p: 0,
                    pb: { xs: 2, sm: 3, md: 4 },
                    '& > div': {
                        p: '0 !important',
                        padding: '0 !important',
                        m: '0 !important',
                        margin: '0 !important',
                        maxWidth: '100% !important',
                        width: '100% !important',
                        boxSizing: 'border-box'
                    }
                }}
            >
                {children}
            </Box>
            
            <Footer />
        </Box>
    );
};

export default Layout;
