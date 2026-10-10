import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Layout from './Layout';
import MobileBottomBar from './MobileBottomBar';

const Main_layout = () => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#FAF6F3' }}>
            {/* Desktop Permanent Sidebar - Hidden on mobile (< lg) */}
            <Box sx={{ display: { xs: 'none', lg: 'block' }, flexShrink: 0, height: '100vh' }}>
                <Sidebar />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
                <Header title="Dashboard Overview" />
                
                {/* Scrollable Content Area with bottom clearance for MobileBottomBar on mobile */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: { xs: 1, sm: 1.5, md: 2 },
                        pb: { xs: '90px', lg: 2 },
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Layout>
                        <Outlet />
                    </Layout>
                </Box>
            </Box>

            {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet < lg) */}
            <MobileBottomBar />
        </Box>
    );
};

export default Main_layout;

