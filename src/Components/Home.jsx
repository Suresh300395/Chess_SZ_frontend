import { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Common/Header';
import Tabs from './Common/Tabs';

const Home = () => {
    const [activeTab, setActiveTab] = useState('Live Board');
    const tabs = ['Live Board', 'Route Map', 'Organizing Committee'];

    return (
        <Box className="home-container">
            <Header />
            <Box component="main">
                <Box component="section" className="hero-section">
                    <Box component="img" src="/hero.png" alt="South Zone Chess Tournament" className="hero-banner-img" />
                    <Box className="hero-content">
                        <Box component="h1" className="hero-title">
                            <Box component="span" className="text-navy">SOUTH ZONE</Box><br />
                            <Box component="span" className="text-orange">CHESS</Box> <Box component="span" className="text-navy">TOURNAMENT</Box>
                        </Box>
                    </Box>
                </Box>

                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                <Box component="section" className="tab-content-section">
                    <Box className="tab-content-card">
                        <Box component="h2" className="tab-card-title">
                            {activeTab}
                        </Box>

                        {activeTab === 'Live Board' && (
                            <Box>
                                <Box component="p" style={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: 'var(--text-body)' }}>Live Board data will be displayed here.</Box>
                            </Box>
                        )}

                        {activeTab === 'Route Map' && (
                            <Box>
                                <Box component="p" style={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: 'var(--text-body)' }}>Route Map data will be displayed here.</Box>
                            </Box>
                        )}

                        {activeTab === 'Organizing Committee' && (
                            <Box>
                                <Box component="p" style={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: 'var(--text-body)' }}>Organizing Committee data will be displayed here.</Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Home;