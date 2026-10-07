import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Common/Header';
import Tabs from './Common/Tabs';
import CommitteeCard from './Common/CommitteeCard';
import io from 'socket.io-client';

const Home = () => {
    const [activeTab, setActiveTab] = useState('Live Board');
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const tabs = ['Live Board', 'Route Map', 'Organizing Committee'];

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('http://localhost:3003/api/committee');
                if (res.ok) {
                    const data = await res.json();
                    setCommitteeMembers(data);
                }
            } catch (error) {
                console.error("Error fetching committee members:", error);
            }
        };

        fetchMembers();

        const socket = io('http://localhost:3003');
        
        socket.on('connect', () => {
            console.log('Webhook connected to backend!');
        });

        socket.on('committeeUpdated', () => {
            console.log('Webhook received: committeeUpdated');
            fetchMembers();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <Box className="home-container">
            <Header />
            <Box component="main">
                <Box component="section" className="hero-section">
                    <Box component="img" src="/hero.png" alt="South Zone Chess Tournament" className="hero-banner-img" />
                    <Box className="hero-content page-container">
                        <Box component="h1" className="hero-title">
                            <Box component="span" className="text-navy">SOUTH ZONE</Box><br />
                            <Box component="span" className="text-orange">CHESS</Box> <Box component="span" className="text-navy">TOURNAMENT</Box>
                        </Box>
                    </Box>
                </Box>

                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                <Box component="section" className="tab-content-section">
                    <Box className="tab-content-card">
                        <Box component="h2" className="tab-card-title" sx={{ mb: 1, mt: 0 }}>
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
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: committeeMembers.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                    md: committeeMembers.length === 1 ? '1fr' 
                                        : committeeMembers.length === 2 ? 'repeat(2, 1fr)'
                                        : committeeMembers.length === 3 ? 'repeat(3, 1fr)'
                                        : 'repeat(4, 1fr)'
                                },
                                gap: '30px', 
                                mt: 0,
                                width: '100%'
                            }}>
                                {committeeMembers.length > 0 ? (
                                    committeeMembers.map((member) => (
                                        <CommitteeCard 
                                            key={member._id} 
                                            member={{
                                                name: member.memberName,
                                                role: member.designation,
                                                position: member.position,
                                                image: member.photo,
                                                email: member.email,
                                                phone: member.phone
                                            }} 
                                        />
                                    ))
                                ) : (
                                    <Box component="p" style={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: '14px' }}>
                                        No committee members found.
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Home;