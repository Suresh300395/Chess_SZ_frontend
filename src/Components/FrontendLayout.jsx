import { Outlet, useLocation } from 'react-router-dom';
import Header from './Common/Header';
import Footer from './Common/Footer';
import { Box } from '@mui/material';

const FrontendLayout = () => {
    const location = useLocation();
    const isDashboard = location.pathname.includes('/dashboard');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FAF6F3' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
};

export default FrontendLayout;
