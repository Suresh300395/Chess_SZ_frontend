import { Box, Typography, Card, CardContent, Avatar, Chip, Divider } from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';

const UserDashboard = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const stats = [
        { label: 'Matches Played', value: '24', icon: <SportsSoccerIcon sx={{ fontSize: 32, color: '#0b5299' }} /> },
        { label: 'Tournaments', value: '6', icon: <EmojiEventsIcon sx={{ fontSize: 32, color: '#e67e22' }} /> },
        { label: 'Training Sessions', value: '48', icon: <FitnessCenterIcon sx={{ fontSize: 32, color: '#27ae60' }} /> },
        { label: 'This Month', value: '8', icon: <CalendarTodayIcon sx={{ fontSize: 32, color: '#8e44ad' }} /> },
    ];

    const recentActivity = [
        { title: 'Cricket Match vs Team B', date: 'Oct 5, 2026', result: 'Won', color: '#27ae60' },
        { title: 'Football Tournament Round 1', date: 'Oct 2, 2026', result: 'Lost', color: '#e74c3c' },
        { title: 'Basketball Practice', date: 'Sep 30, 2026', result: 'Attended', color: '#3498db' },
        { title: 'Athletics 100m Sprint', date: 'Sep 27, 2026', result: 'Won', color: '#27ae60' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', pt: 10, px: 3, pb: 4, backgroundColor: '#f4f6f9' }}>
            {/* Page Title */}
            <Typography variant="h4" fontWeight="bold" color="#0b5299" sx={{ mb: 3 }}>
                User Dashboard
            </Typography>

            {/* Profile Card - Full Width */}
            <Card sx={{
                width: '100%',
                borderRadius: 3,
                mb: 3,
                background: 'linear-gradient(135deg, #0b5299 0%, #1a7fd4 100%)',
                boxShadow: '0 8px 32px rgba(11,82,153,0.3)',
                color: '#fff',
                overflow: 'visible',
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Avatar sx={{
                            width: 90,
                            height: 90,
                            bgcolor: 'rgba(255,255,255,0.25)',
                            border: '3px solid rgba(255,255,255,0.5)',
                            fontSize: 36,
                        }}>
                            <PersonIcon sx={{ fontSize: 48, color: '#fff' }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                                {user?.name || 'Player Name'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                    label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Player'}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.4)' }}
                                />
                                <Chip
                                    icon={<StarIcon sx={{ color: '#FFD700 !important', fontSize: 14 }} />}
                                    label="Active Member"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,215,0,0.2)', color: '#FFD700', fontWeight: 600, border: '1px solid rgba(255,215,0,0.4)' }}
                                />
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                {user?.email || 'player@university.edu'}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold">🏆</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Season 2026</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Stats Cards - Full Width Grid */}
            <Card sx={{ width: '100%', borderRadius: 3, mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="#0b5299" sx={{ mb: 3 }}>
                        My Statistics
                    </Typography>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                        gap: 3,
                    }}>
                        {stats.map((stat, index) => (
                            <Box key={index} sx={{
                                textAlign: 'center',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e8ecf0',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                }
                            }}>
                                <Box sx={{ mb: 1 }}>{stat.icon}</Box>
                                <Typography variant="h4" fontWeight="bold" color="#0b5299">
                                    {stat.value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {stat.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>

            {/* Recent Activity - Full Width */}
            <Card sx={{ width: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="#0b5299" sx={{ mb: 2 }}>
                        Recent Activity
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recentActivity.map((item, index) => (
                            <Box key={index} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e8ecf0',
                                transition: 'background-color 0.2s',
                                '&:hover': { backgroundColor: '#eef2f7' }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: item.color,
                                        flexShrink: 0,
                                    }} />
                                    <Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.date}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    label={item.result}
                                    size="small"
                                    sx={{
                                        backgroundColor: item.color + '20',
                                        color: item.color,
                                        fontWeight: 600,
                                        border: `1px solid ${item.color}40`,
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UserDashboard;