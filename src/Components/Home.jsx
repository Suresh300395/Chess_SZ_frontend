import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Alert,
    Dialog, DialogContent, IconButton
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import Header from './Common/Header';
import Tabs from './Common/Tabs';
import CommitteeCard from './Common/CommitteeCard';
import io from 'socket.io-client';
import { committeeAPI, routeMapAPI, liveBoardAPI, SOCKET_URL } from '../utils/api';

const Home = () => {
    const [activeTab, setActiveTab] = useState('Live Board');
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [liveBoard, setLiveBoard] = useState(null);
    const [routeMap, setRouteMap] = useState(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const tabs = ['Live Board', 'Route Map', 'Organizing Committee'];

    const resolveImgUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
        return `${SOCKET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const fetchMembers = async () => {
        try {
            const res = await committeeAPI.getAll();
            if (res.ok) {
                const data = await res.json();
                setCommitteeMembers(data);
            }
        } catch (error) {
            console.error("Error fetching committee members:", error);
        }
    };

    const fetchLiveBoard = async () => {
        try {
            const res = await liveBoardAPI.get();
            if (res.ok) {
                const data = await res.json();
                setLiveBoard(data);
            }
        } catch (error) {
            console.error("Error fetching live board:", error);
        }
    };

    const fetchRouteMap = async () => {
        try {
            const res = await routeMapAPI.get();
            if (res.ok) {
                const data = await res.json();
                setRouteMap(data);
            }
        } catch (error) {
            console.error("Error fetching route map:", error);
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchLiveBoard();
        fetchRouteMap();

        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Webhook connected to backend!');
        });

        socket.on('committeeUpdated', () => {
            fetchMembers();
        });

        socket.on('liveBoardUpdated', (data) => {
            if (data) setLiveBoard(data);
            else fetchLiveBoard();
        });

        socket.on('routeMapUpdated', () => {
            fetchRouteMap();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getStatusChip = (status) => {
        switch (status) {
            case 'LIVE':
                return <Chip label="🟢 LIVE NOW" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 700 }} />;
            case 'UPCOMING':
                return <Chip label="🟡 UPCOMING" size="small" sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700 }} />;
            case 'PAUSED':
                return <Chip label="🟠 PAUSED" size="small" sx={{ bgcolor: '#ffedd5', color: '#ea580c', fontWeight: 700 }} />;
            case 'COMPLETED':
                return <Chip label="🔵 COMPLETED" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }} />;
            default:
                return null;
        }
    };

    return (
        <Box className="home-container">
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

                <Box sx={{ mt: 5, mb: 4, display: 'flex', justifyContent: 'center' }}>
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                </Box>

                <Box component="section" className="tab-content-section" sx={{ px: { xs: 1, md: 6 }, pb: 8 }}>
                    <Box className="tab-content-card" sx={{ p: { xs: 3, md: 5 }, bgcolor: 'white', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box component="h2" className="tab-card-title" sx={{ mb: 3, mt: 0 }}>
                            {activeTab}
                        </Box>

                        {/* LIVE BOARD TAB */}
                        {activeTab === 'Live Board' && (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {liveBoard?.status && getStatusChip(liveBoard.status)}
                                        {liveBoard?.currentRound && (
                                            <Chip label={liveBoard.currentRound} size="small" sx={{ bgcolor: '#0b5299', color: '#fff', fontWeight: 600 }} />
                                        )}
                                    </Box>
                                    {liveBoard?.externalLink && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            component="a"
                                            href={liveBoard.externalLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            startIcon={<OpenInNewIcon />}
                                            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#0b5299', color: '#0b5299', fontWeight: 600 }}
                                        >
                                            View Full Pairings & Standings
                                        </Button>
                                    )}
                                </Box>

                                {liveBoard?.announcement && (
                                    <Alert severity="info" icon={<LiveTvIcon />} sx={{ mb: 3, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                        <b>Live Update:</b> {liveBoard.announcement}
                                    </Alert>
                                )}

                                {/* Embed Video / Live Board */}
                                {liveBoard?.embedUrl && (
                                    <Box sx={{ mb: 4 }}>
                                        <Box sx={{ width: '100%', height: { xs: '320px', md: '520px' }, borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', bgcolor: '#000' }}>
                                            <iframe
                                                src={liveBoard.embedUrl}
                                                title="Tournament Live Broadcast"
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                allowFullScreen
                                            />
                                        </Box>
                                    </Box>
                                )}

                                {/* Top Matches Table */}
                                {liveBoard?.matches && liveBoard.matches.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 1.5 }}>
                                            Top Boards Match Scoreboard
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Board</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>White Player</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '120px' }}>Result</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Black Player</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {liveBoard.matches.map((m, idx) => (
                                                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ fontWeight: 600, color: '#0b5299' }}>#{m.boardNumber || idx + 1}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="600">{m.whitePlayer || 'TBD'}</Typography>
                                                                {m.whiteUniversity && (
                                                                    <Typography variant="caption" color="text.secondary">{m.whiteUniversity}</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'center' }}>
                                                                <Chip
                                                                    label={m.result || '*'}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        bgcolor: m.result === '*' ? '#fef3c7' : '#f1f5f9',
                                                                        color: m.result === '*' ? '#d97706' : '#0f172a'
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="600">{m.blackPlayer || 'TBD'}</Typography>
                                                                {m.blackUniversity && (
                                                                    <Typography variant="caption" color="text.secondary">{m.blackUniversity}</Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {!liveBoard?.embedUrl && (!liveBoard?.matches || liveBoard.matches.length === 0) && (
                                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                                        <LiveTvIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold" color="#334155">
                                            {liveBoard?.title || 'Live Match Center'}
                                        </Typography>
                                        <Typography variant="body2" color="#64748b" sx={{ mt: 0.5 }}>
                                            {liveBoard?.announcement || 'Live chess matches and board broadcasts will be updated once the round commences.'}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* ROUTE MAP TAB */}
                        {activeTab === 'Route Map' && (
                            <Box>
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#0b5299', mb: 1 }}>
                                    {routeMap?.title || 'Aditya University Campus Route Map'}
                                </Typography>
                                {routeMap?.description && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                                        {routeMap.description}
                                    </Typography>
                                )}

                                {routeMap?.mapImage ? (
                                    <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box
                                            onClick={() => setIsMapModalOpen(true)}
                                            sx={{
                                                width: '100%',
                                                maxWidth: { xs: '100%', sm: '480px', md: '540px' },
                                                maxHeight: { xs: '260px', sm: '320px', md: '360px' },
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                                border: '2px solid #e2e8f0',
                                                boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                                                bgcolor: '#f8fafc',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                p: 1,
                                                transition: 'all 0.25s ease',
                                                '&:hover': {
                                                    boxShadow: '0 10px 28px rgba(11,82,153,0.18)',
                                                    borderColor: '#0b5299',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={resolveImgUrl(routeMap.mapImage)}
                                                alt="Aditya University Route Map"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: { xs: '240px', sm: '300px', md: '340px' },
                                                    width: 'auto',
                                                    height: 'auto',
                                                    objectFit: 'contain',
                                                    display: 'block',
                                                    borderRadius: 1.5
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                            <Button
                                                size="small"
                                                onClick={() => setIsMapModalOpen(true)}
                                                startIcon={<ZoomInIcon />}
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#0b5299',
                                                    fontWeight: 600,
                                                    bgcolor: '#f1f5f9',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    '&:hover': { bgcolor: '#e2e8f0' }
                                                }}
                                            >
                                                Click to Enlarge / Full View
                                            </Button>
                                            <Button
                                                size="small"
                                                component="a"
                                                href={resolveImgUrl(routeMap.mapImage)}
                                                target="_blank"
                                                rel="noreferrer"
                                                startIcon={<OpenInNewIcon />}
                                                sx={{ textTransform: 'none', color: '#64748b', fontWeight: 500 }}
                                            >
                                                Open Original
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1', mb: 3 }}>
                                        <MapIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold" color="#334155">
                                            Route Map Coming Soon
                                        </Typography>
                                        <Typography variant="body2" color="#64748b">
                                            The campus route map will be uploaded here shortly.
                                        </Typography>
                                    </Box>
                                )}

                                {routeMap?.directions && (
                                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', mb: 1.5 }}>
                                            Transit & Travel Directions
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                            {routeMap.directions}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}

                        {/* ORGANIZING COMMITTEE TAB */}
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

            {/* Full Size Route Map Lightbox Modal */}
            <Dialog
                open={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                maxWidth="lg"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            p: { xs: 1, sm: 2 },
                            bgcolor: '#ffffff'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0b5299' }}>
                        {routeMap?.title || 'Campus Route Map'}
                    </Typography>
                    <IconButton onClick={() => setIsMapModalOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 1, textAlign: 'center' }}>
                    <Box
                        component="img"
                        src={resolveImgUrl(routeMap?.mapImage)}
                        alt="Route Map Full Size"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '82vh',
                            objectFit: 'contain',
                            borderRadius: 2
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Home;