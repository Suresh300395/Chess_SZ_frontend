import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

const Dashboard = () => {
    const stats = [
        { title: 'Total Players', count: 0, icon: <GroupsIcon sx={{ fontSize: 32, color: '#0b5299' }} /> },
        { title: 'Total Teams', count: 0, icon: <EmojiEventsIcon sx={{ fontSize: 32, color: '#0b5299' }} /> },
        { title: 'Total Rounds', count: 0, icon: <FormatListNumberedIcon sx={{ fontSize: 32, color: '#0b5299' }} /> }
    ];

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 1 }}>
                Welcome to Admin Dashboard
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Select an option from the sidebar to view details, manage registrations and organize the tournament.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%' }}>
                {stats.map((stat, index) => (
                    <Box key={index} sx={{ flex: 1 }}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            bgcolor: 'aliceblue',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            height: '100%',
                            width: '100%',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                <Box sx={{ 
                                    p: 1.5, 
                                    borderRadius: 2, 
                                    bgcolor: 'rgba(11, 82, 153, 0.1)',
                                    mr: 2,
                                    display: 'flex'
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                                        {stat.title}
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#334155' }}>
                                        {stat.count}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default Dashboard;
