import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Layout from './Layout';

const Main_layout = () => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#FAF6F3' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header title="Dashboard Overview" />
                
                {/* Scrollable Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Layout>
                        <Outlet />
                    </Layout>
                </Box>
            </Box>
        </Box>
    );
};

export default Main_layout;
