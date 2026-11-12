import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box, Typography, Chip, Button, Paper, Avatar,
    Dialog, DialogContent, IconButton, Tooltip
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import Tabs from './Common/Tabs';
import CommitteeCard from './Common/CommitteeCard';
import PublicBottomBar from './Common/PublicBottomBar';
import { AnimatedCard, AnimatedText } from './animations';
import io from 'socket.io-client';
import { committeeAPI, routeMapAPI, liveBoardAPI, SOCKET_URL } from '../utils/api';
import { scrollToTabContainer } from '../utils/scrollUtils';
import { getAssetUrl } from '../utils/assetHelper';

const getMatchDetails = (m, currentRound) => {
    const rawRes = (m.result || '*').trim();
    const roundText = currentRound || 'Round 1';

    const cleanRes = rawRes.replace(/\s+/g, '');
    if (cleanRes === '1-0' || cleanRes === '1:0') {
        return {
            status: 'COMPLETED',
            score1: '1',
            score2: '0',
            p1Won: true,
            p2Won: false,
            roundText
        };
    }
    if (cleanRes === '0-1' || cleanRes === '0:1') {
        return {
            status: 'COMPLETED',
            score1: '0',
            score2: '1',
            p1Won: false,
            p2Won: true,
            roundText
        };
    }
    if (cleanRes === '1/2-1/2' || cleanRes === '0.5-0.5' || cleanRes === '½-½') {
        return {
            status: 'COMPLETED',
            score1: '½',
            score2: '½',
            p1Won: false,
            p2Won: false,
            isDraw: true,
            roundText
        };
    }
    if (rawRes.toLowerCase() === 'live' || rawRes.toLowerCase() === 'ongoing') {
        return {
            status: 'LIVE',
            roundText
        };
    }
    return {
        status: 'UPCOMING',
        roundText
    };
};

const Home = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'About');
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [liveBoard, setLiveBoard] = useState(null);
    const [routeMap, setRouteMap] = useState(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const tabs = ['About', 'Live Board', 'Route Map', 'Organizing Committee'];

    const isFirstMount = useRef(true);

    useEffect(() => {
        if (location.state?.targetTab) {
            setActiveTab(location.state.targetTab);
            scrollToTabContainer();
        }
    }, [location.state?.targetTab]);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        scrollToTabContainer();
    }, [activeTab]);

    const resolveImgUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
        return `${SOCKET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleDownloadMap = async (imgUrl, filename = 'campus-route-map') => {
        if (!imgUrl) return;
        try {
            const fullUrl = resolveImgUrl(imgUrl);
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const ext = fullUrl.includes('.png') ? 'png' : (fullUrl.includes('.webp') ? 'webp' : 'jpg');
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${filename}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            const fullUrl = resolveImgUrl(imgUrl);
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = `${filename}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
                    <Box component="img" src={getAssetUrl('hero.png')} alt="South Zone Chess Tournament" className="hero-banner-img" />
                    <Box className="hero-content page-container">
                        <AnimatedText direction="down" delay={0.05}>
                            <Box component="h1" className="hero-title">
                                <Box component="span" className="text-navy">SOUTH ZONE</Box><br />
                                <Box component="span" className="text-navy">INTER UNIVERSITY</Box><br />
                                <Box component="span" className="text-orange">CHESS (MEN)</Box> <Box component="span" className="text-navy">TOURNAMENT</Box>
                            </Box>
                        </AnimatedText>
                    </Box>
                </Box>

                <Box
                    sx={{
                        mt: { xs: 2, sm: 5 },
                        mb: { xs: 1.5, sm: 4 },
                        display: { xs: 'none', md: 'flex' },
                        justifyContent: 'center',
                        position: { xs: 'sticky', md: 'static' },
                        top: { xs: 0, md: 'auto' },
                        zIndex: { xs: 1100, md: 'auto' },
                        bgcolor: { xs: '#FAF6F3', md: 'transparent' },
                        py: { xs: 0.5, md: 0 },
                        px: { xs: 1.5, sm: 2, md: '96px' },
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    <AnimatedCard delay={0.06} whileInView={true} style={{ width: 'auto' }}>
                        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </AnimatedCard>
                </Box>

                <Box component="section" className="tab-content-section" sx={{ mt: { xs: 2.5, sm: 3.5, md: 0 }, px: { xs: 1.5, sm: 2, md: '96px' }, pb: { xs: 2.5, sm: 3.5, md: 8 } }}>
                    <AnimatedCard key={activeTab} whileInView={true} style={{ width: '100%' }}>
                        <Box className="tab-content-card" sx={{ p: { xs: 2, sm: 3, md: 5 }, bgcolor: 'white', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', height: 'auto', minHeight: 'auto' }}>
                        <Box
                            component="h2"
                            className="tab-card-title"
                            sx={{
                                mb: 3,
                                mt: 0,
                                color: '#0b5299',
                                fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' },
                                fontWeight: 700
                            }}
                        >
                            {activeTab}
                        </Box>

                        {/* ABOUT TAB */}
                        {activeTab === 'About' && (
                            <Box sx={{ width: '100%', mt: 0 }}>
                                <AnimatedCard whileInView={true} delay={0.04} style={{ width: '100%', marginBottom: '28px' }}>
                                    <Box
                                        sx={{
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            borderRadius: 3,
                                            p: { xs: 2.5, sm: 3.5, md: 4 },
                                            border: '1px solid #e2e8f0',
                                        }}
                                    >
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                color: '#0b5299',
                                                fontWeight: 700,
                                                fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.65rem' },
                                                mb: 1.5,
                                            }}
                                        >
                                            South Zone Inter University Chess (Men) Tournament 2026
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#334155',
                                                lineHeight: 1.75,
                                                fontSize: { xs: '14px', sm: '15px', md: '16px' },
                                            }}
                                        >
                                            Welcome to the prestigious South Zone Inter University Chess (Men) Tournament, proudly organized and hosted by <strong>Aditya University</strong>, Surampalem, under the esteemed auspices of the <strong>Association of Indian Universities (AIU)</strong>, New Delhi. This grand championship brings together top collegiate chess players and university teams from across the southern zone to compete in strategic mastery, intellectual discipline, and true sportsmanship.
                                        </Typography>
                                    </Box>
                                </AnimatedCard>

                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                        gap: 2.5,
                                        mb: 3.5,
                                    }}
                                >
                                    <AnimatedCard whileInView={true} delay={0.05} style={{ height: '100%', width: '100%' }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                bgcolor: '#ffffff',
                                                borderRadius: 3,
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(11, 82, 153, 0.08)' },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '24px', mb: 1 }}>🏛️</Typography>
                                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                Host Institution
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#0b5299', fontWeight: 700, mt: 0.5 }}>
                                                Aditya University
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                                Surampalem, Kakinada Dist., A.P.
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>

                                    <AnimatedCard whileInView={true} delay={0.1} style={{ height: '100%', width: '100%' }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                bgcolor: '#ffffff',
                                                borderRadius: 3,
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(11, 82, 153, 0.08)' },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '24px', mb: 1 }}>🏆</Typography>
                                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                Governing Body
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#0b5299', fontWeight: 700, mt: 0.5 }}>
                                                AIU, New Delhi
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                                Association of Indian Universities
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>

                                    <AnimatedCard whileInView={true} delay={0.15} style={{ height: '100%', width: '100%' }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                bgcolor: '#ffffff',
                                                borderRadius: 3,
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(11, 82, 153, 0.08)' },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '24px', mb: 1 }}>♟️</Typography>
                                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                Event Discipline
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#0b5299', fontWeight: 700, mt: 0.5 }}>
                                                Chess (Men)
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                                South Zone Universities Championship
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>

                                    <AnimatedCard whileInView={true} delay={0.2} style={{ height: '100%', width: '100%' }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                bgcolor: '#ffffff',
                                                borderRadius: 3,
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(11, 82, 153, 0.08)' },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '24px', mb: 1 }}>📍</Typography>
                                            <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                Tournament Venue
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#0b5299', fontWeight: 700, mt: 0.5 }}>
                                                Aditya Campus
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                                Indoor Sports Complex & Halls
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                    <AnimatedCard whileInView={true} delay={0.08} style={{ height: '100%', width: '100%' }}>
                                        <Box sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
                                            <Typography variant="h6" sx={{ color: '#0b5299', fontWeight: 700, mb: 1.5, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
                                                About Aditya University
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
                                                Aditya University stands as a premier higher education institution dedicated to academic brilliance and athletic prowess. The campus features world-class indoor sports facilities, fully furnished accommodations, and experienced organizers committed to conducting zonal tournaments of the highest caliber.
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>

                                    <AnimatedCard whileInView={true} delay={0.14} style={{ height: '100%', width: '100%' }}>
                                        <Box sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', boxSizing: 'border-box' }}>
                                            <Typography variant="h6" sx={{ color: '#0b5299', fontWeight: 700, mb: 1.5, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
                                                Tournament Format & Fair Play
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
                                                The tournament is conducted in strict compliance with official FIDE Laws of Chess and AIU sports guidelines. Featuring live digital broadcast scoreboards, computerized pairing systems, and certified arbiters, the championship ensures complete transparency and high-level competition.
                                            </Typography>
                                        </Box>
                                    </AnimatedCard>
                                </Box>
                            </Box>
                        )}

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


                                {/* Embed Video / Live Board */}
                                {liveBoard?.embedUrl && (
                                    <AnimatedCard whileInView={true} delay={0.05} style={{ width: '100%', marginBottom: '32px' }}>
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
                                    </AnimatedCard>
                                )}

                                {/* Top Matches Table / Cards */}
                                {liveBoard?.matches && liveBoard.matches.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 2 }}>
                                            Top Boards Match Scoreboard
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {liveBoard.matches.map((m, idx) => {
                                                const details = getMatchDetails(m, liveBoard?.currentRound);
                                                const isCompleted = details.status === 'COMPLETED';
                                                const isLive = details.status === 'LIVE';

                                                const borderColor = isCompleted ? '#86efac' : isLive ? '#fca5a5' : '#93c5fd';
                                                const cardBg = isCompleted ? '#f6fdf9' : isLive ? '#fffbfb' : '#ffffff';
                                                const badgeBg = isCompleted ? '#1e293b' : isLive ? '#dc2626' : '#3b82f6';

                                                return (
                                                    <AnimatedCard
                                                        key={idx}
                                                        whileInView={true}
                                                        delay={Math.min(idx * 0.05, 0.25)}
                                                        style={{ width: '100%' }}
                                                    >
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                borderRadius: '16px',
                                                                border: `1.5px solid ${borderColor}`,
                                                                bgcolor: cardBg,
                                                                overflow: 'hidden',
                                                                display: 'flex',
                                                                flexDirection: { xs: 'column', sm: 'row' },
                                                                alignItems: 'stretch',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 8px 24px rgba(11,82,153,0.08)'
                                                                }
                                                            }}
                                                        >
                                                        {/* MOBILE HEADER BAR (xs only) */}
                                                        <Box
                                                            sx={{
                                                                display: { xs: 'flex', sm: 'none' },
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                bgcolor: badgeBg,
                                                                px: 2,
                                                                py: 1,
                                                                color: '#ffffff'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <Typography sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', opacity: 0.85, textTransform: 'uppercase' }}>
                                                                    Board
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800 }}>
                                                                    #{m.boardNumber || idx + 1}
                                                                </Typography>
                                                            </Box>

                                                            {isCompleted ? (
                                                                <Chip
                                                                    label="Completed"
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: '#dcfce7',
                                                                        color: '#15803d',
                                                                        fontWeight: 700,
                                                                        fontSize: '11px',
                                                                        height: 22,
                                                                        borderRadius: '6px'
                                                                    }}
                                                                />
                                                            ) : isLive ? (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.3, borderRadius: '6px' }}>
                                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ffffff' }} />
                                                                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>LIVE</Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.18)', px: 1, py: 0.3, borderRadius: '6px' }}>
                                                                    <AccessTimeIcon sx={{ fontSize: 13, color: '#ffffff' }} />
                                                                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>
                                                                        Upcoming • {details.roundText}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>

                                                        {/* MOBILE MATCH BODY (xs only) */}
                                                        <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', p: 1.75, gap: 1 }}>
                                                            {/* Player 1 Row */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                                                                    <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                                                                        <Avatar
                                                                            src={m.whitePhoto ? resolveImgUrl(m.whitePhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.whitePlayer || 'White')}&background=0b5299&color=fff&bold=true`}
                                                                            alt={m.whitePlayer || 'Player 1'}
                                                                            sx={{ width: 42, height: 42, border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                                                                        />
                                                                    </Box>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.25 }}>
                                                                            {m.whitePlayer || 'TBD'}
                                                                        </Typography>
                                                                        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
                                                                            {m.whiteUniversity || 'University'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {isCompleted && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 0.5 }}>
                                                                        {details.p1Won && (
                                                                            <Box
                                                                                component="img"
                                                                                src={getAssetUrl('Trophyy.webp')}
                                                                                alt="Winner Trophy"
                                                                                sx={{ width: 22, height: 22, objectFit: 'contain' }}
                                                                            />
                                                                        )}
                                                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: details.p1Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626' }}>
                                                                            {details.score1}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>

                                                            <Box sx={{ height: '1px', bgcolor: '#f1f5f9', my: 0.25 }} />

                                                            {/* Player 2 Row */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                                                                    <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                                                                        <Avatar
                                                                            src={m.blackPhoto ? resolveImgUrl(m.blackPhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.blackPlayer || 'Black')}&background=0b5299&color=fff&bold=true`}
                                                                            alt={m.blackPlayer || 'Player 2'}
                                                                            sx={{ width: 42, height: 42, border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                                                                        />
                                                                    </Box>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.25 }}>
                                                                            {m.blackPlayer || 'TBD'}
                                                                        </Typography>
                                                                        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
                                                                            {m.blackUniversity || 'University'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {isCompleted && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 0.5 }}>
                                                                        {details.p2Won && (
                                                                            <Box
                                                                                component="img"
                                                                                src={getAssetUrl('Trophyy.webp')}
                                                                                alt="Winner Trophy"
                                                                                sx={{ width: 22, height: 22, objectFit: 'contain' }}
                                                                            />
                                                                        )}
                                                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: details.p2Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626' }}>
                                                                            {details.score2}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* DESKTOP LEFT BADGE (sm and above) */}
                                                        <Box
                                                            sx={{
                                                                display: { xs: 'none', sm: 'flex' },
                                                                bgcolor: badgeBg,
                                                                width: { sm: 84 },
                                                                minWidth: { sm: 84 },
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                px: 1.5,
                                                                py: 2,
                                                                gap: 0.25,
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    color: '#ffffff',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    letterSpacing: '0.5px',
                                                                    opacity: 0.9,
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                Board
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    color: '#ffffff',
                                                                    fontSize: { sm: '1.45rem' },
                                                                    fontWeight: 800,
                                                                    lineHeight: 1.1
                                                                }}
                                                            >
                                                                #{m.boardNumber || idx + 1}
                                                            </Typography>
                                                        </Box>

                                                        {/* DESKTOP MATCH CONTENT (sm and above) */}
                                                        <Box
                                                            sx={{
                                                                display: { xs: 'none', sm: 'flex' },
                                                                flex: 1,
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                p: { sm: 2, md: 2.5 },
                                                                gap: 2,
                                                                minWidth: 0
                                                            }}
                                                        >
                                                            {/* Left Player: White */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 2,
                                                                    flex: 1,
                                                                    minWidth: 0
                                                                }}
                                                            >
                                                                <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                                                                    <Avatar
                                                                        src={m.whitePhoto ? resolveImgUrl(m.whitePhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.whitePlayer || 'White')}&background=0b5299&color=fff&bold=true`}
                                                                        alt={m.whitePlayer || 'Player 1'}
                                                                        sx={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            border: '2px solid #ffffff',
                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                    <Typography
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: '1.1rem',
                                                                            color: '#0f172a',
                                                                            lineHeight: 1.25,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {m.whitePlayer || 'TBD'}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.88rem',
                                                                            color: '#64748b',
                                                                            fontWeight: 500,
                                                                            mt: 0.25,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {m.whiteUniversity || 'University'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Center Section: Score or Status */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: 130,
                                                                    flexShrink: 0,
                                                                    px: 1
                                                                }}
                                                            >
                                                                {isCompleted ? (
                                                                    <>
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1.5,
                                                                                bgcolor: '#f8fafc',
                                                                                border: '1px solid #e2e8f0',
                                                                                px: 2.2,
                                                                                py: 0.4,
                                                                                borderRadius: '12px',
                                                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                sx={{
                                                                                    fontSize: '1.4rem',
                                                                                    fontWeight: 800,
                                                                                    color: details.p1Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626'
                                                                                }}
                                                                            >
                                                                                {details.score1}
                                                                            </Typography>
                                                                            <Typography
                                                                                sx={{
                                                                                    fontSize: '1rem',
                                                                                    fontWeight: 700,
                                                                                    color: '#64748b'
                                                                                }}
                                                                            >
                                                                                -
                                                                            </Typography>
                                                                            <Typography
                                                                                sx={{
                                                                                    fontSize: '1.4rem',
                                                                                    fontWeight: 800,
                                                                                    color: details.p2Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626'
                                                                                }}
                                                                            >
                                                                                {details.score2}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Chip
                                                                            label="Completed"
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: '#dcfce7',
                                                                                color: '#15803d',
                                                                                fontWeight: 700,
                                                                                fontSize: '11px',
                                                                                height: 22,
                                                                                borderRadius: '6px',
                                                                                mt: 0.6
                                                                            }}
                                                                        />
                                                                    </>
                                                                ) : isLive ? (
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            bgcolor: '#fef2f2',
                                                                            border: '1px solid #fecaca',
                                                                            px: 2.5,
                                                                            py: 0.8,
                                                                            borderRadius: '14px',
                                                                            textAlign: 'center'
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                                            <Box
                                                                                sx={{
                                                                                    width: 8,
                                                                                    height: 8,
                                                                                    borderRadius: '50%',
                                                                                    bgcolor: '#ef4444'
                                                                                }}
                                                                            />
                                                                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
                                                                                LIVE
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mt: 0.2 }}>
                                                                            {details.roundText}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            bgcolor: '#f0f7ff',
                                                                            border: '1px solid #dbeafe',
                                                                            px: 2.5,
                                                                            py: 0.8,
                                                                            borderRadius: '14px',
                                                                            textAlign: 'center'
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <AccessTimeIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                                                                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
                                                                                Upcoming
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500, mt: 0.2 }}>
                                                                            {details.roundText}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>

                                                            {/* Right Player: Black */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 2,
                                                                    flex: 1,
                                                                    minWidth: 0
                                                                }}
                                                            >
                                                                <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                                                                    <Avatar
                                                                        src={m.blackPhoto ? resolveImgUrl(m.blackPhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.blackPlayer || 'Black')}&background=0b5299&color=fff&bold=true`}
                                                                        alt={m.blackPlayer || 'Player 2'}
                                                                        sx={{
                                                                            width: 52,
                                                                            height: 52,
                                                                            border: '2px solid #ffffff',
                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                    <Typography
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: '1.1rem',
                                                                            color: '#0f172a',
                                                                            lineHeight: 1.25,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {m.blackPlayer || 'TBD'}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: '0.88rem',
                                                                            color: '#64748b',
                                                                            fontWeight: 500,
                                                                            mt: 0.25,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                    >
                                                                        {m.blackUniversity || 'University'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Desktop Winner Trophy at Card Ending */}
                                                            {isCompleted && (details.p1Won || details.p2Won) && (
                                                                <Tooltip title={`Winner: ${details.p1Won ? m.whitePlayer : m.blackPlayer}`} arrow>
                                                                    <Box
                                                                        component="img"
                                                                        src={getAssetUrl('Trophyy.webp')}
                                                                        alt="Winner Trophy"
                                                                        sx={{
                                                                            width: { sm: 38, md: 44 },
                                                                            height: { sm: 38, md: 44 },
                                                                            objectFit: 'contain',
                                                                            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.16))',
                                                                            flexShrink: 0,
                                                                            ml: 1.5,
                                                                            cursor: 'pointer',
                                                                            transition: 'transform 0.2s ease',
                                                                            '&:hover': {
                                                                                transform: 'scale(1.15)'
                                                                            }
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </Paper>
                                                    </AnimatedCard>
                                                );
                                            })}
                                        </Box>
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

                                {(() => {
                                    const mapImagesList = Array.isArray(routeMap?.mapImages) ? routeMap.mapImages : [];
                                    const currentMapImg = mapImagesList[selectedMapIndex] || mapImagesList[0] || '';

                                    if (mapImagesList.length === 0) {
                                        return (
                                            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1', mb: 3 }}>
                                                <MapIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                                <Typography variant="subtitle1" fontWeight="bold" color="#334155">
                                                    Route Map Coming Soon
                                                </Typography>
                                                <Typography variant="body2" color="#64748b">
                                                    The campus route map will be uploaded here shortly.
                                                </Typography>
                                            </Box>
                                        );
                                    }

                                    return (
                                        <Box sx={{ mb: 4 }}>
                                            {/* Gallery Grid */}
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: {
                                                        xs: '1fr',
                                                        sm: mapImagesList.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                                        md: mapImagesList.length === 1 ? '1fr' : (mapImagesList.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
                                                    },
                                                    gap: { xs: 2, sm: 2.5, md: 3 },
                                                    width: '100%',
                                                    maxWidth: mapImagesList.length === 1 ? '820px' : '100%',
                                                    mx: 'auto'
                                                }}
                                            >
                                                {mapImagesList.map((img, idx) => (
                                                    <AnimatedCard
                                                        key={idx}
                                                        delay={idx * 0.08}
                                                        whileInView={true}
                                                        style={{ width: '100%', height: '100%' }}
                                                    >
                                                        <Box
                                                            onClick={() => {
                                                                setSelectedMapIndex(idx);
                                                                setIsMapModalOpen(true);
                                                            }}
                                                            sx={{
                                                                position: 'relative',
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                                bgcolor: 'transparent',
                                                                border: 'none',
                                                                boxShadow: 'none',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                height: 'auto',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                p: 0,
                                                                width: '100%',
                                                                '&:hover': {
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: 'none',
                                                                    '& .gallery-hover-overlay': { opacity: 1 },
                                                                    '& .gallery-image': { transform: 'scale(1.015)' }
                                                                }
                                                            }}
                                                        >
                                                            {/* Top-Left Corner: Download Button */}
                                                            <Tooltip title="Download Map">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadMap(img, `campus-route-map-${idx + 1}`);
                                                                    }}
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        left: 12,
                                                                        top: 12,
                                                                        zIndex: 4,
                                                                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                                        backdropFilter: 'blur(6px)',
                                                                        color: '#0b5299',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': {
                                                                            bgcolor: '#0b5299',
                                                                            color: '#ffffff',
                                                                            transform: 'scale(1.1)'
                                                                        }
                                                                    }}
                                                                >
                                                                    <DownloadIcon sx={{ fontSize: 20 }} />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Top-Right Corner: Map Badge */}
                                                            {mapImagesList.length > 1 && (
                                                                <Chip
                                                                    label={`Map ${idx + 1}`}
                                                                    size="small"
                                                                    sx={{
                                                                        position: 'absolute',
                                                                        right: 12,
                                                                        top: 12,
                                                                        zIndex: 4,
                                                                        bgcolor: 'rgba(15, 23, 42, 0.78)',
                                                                        backdropFilter: 'blur(4px)',
                                                                        color: '#ffffff',
                                                                        fontWeight: 700,
                                                                        fontSize: 11,
                                                                        height: 24
                                                                    }}
                                                                />
                                                            )}

                                                            {/* Gallery Image */}
                                                            <Box
                                                                component="img"
                                                                src={resolveImgUrl(img)}
                                                                alt={`Campus Route Map ${idx + 1}`}
                                                                className="gallery-image"
                                                                sx={{
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    height: 'auto',
                                                                    maxHeight: { xs: 340, sm: 480, md: 560 },
                                                                    objectFit: 'contain',
                                                                    borderRadius: 2,
                                                                    display: 'block',
                                                                    transition: 'transform 0.3s ease'
                                                                }}
                                                            />

                                                            {/* Hover Overlay Hint */}
                                                            <Box
                                                                className="gallery-hover-overlay"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    inset: 0,
                                                                    bgcolor: 'rgba(11, 82, 153, 0.05)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    opacity: 0,
                                                                    transition: 'opacity 0.2s ease',
                                                                    pointerEvents: 'none',
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                                                                        color: '#0b5299',
                                                                        px: 2,
                                                                        py: 0.8,
                                                                        borderRadius: 2,
                                                                        fontWeight: 700,
                                                                        fontSize: '13px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.8,
                                                                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                                                                    }}
                                                                >
                                                                    <ZoomInIcon sx={{ fontSize: 18 }} />
                                                                    Click to Enlarge
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </AnimatedCard>
                                                ))}
                                            </Box>
                                        </Box>
                                    );
                                })()}

                                {routeMap?.directions && (
                                    <AnimatedCard whileInView={true} delay={0.12} style={{ width: '100%', marginTop: '24px' }}>
                                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a', mb: 1.5 }}>
                                                Transit & Travel Directions
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                                {routeMap.directions}
                                            </Typography>
                                        </Paper>
                                    </AnimatedCard>
                                )}
                            </Box>
                        )}

                        {/* ORGANIZING COMMITTEE TAB */}
                        {activeTab === 'Organizing Committee' && (
                            <Box sx={{ width: '100%', mt: 0 }}>
                                {committeeMembers.length > 0 ? (
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: committeeMembers.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                            md: committeeMembers.length <= 2
                                                ? (committeeMembers.length === 1 ? '1fr' : 'repeat(2, 1fr)')
                                                : 'repeat(auto-fit, minmax(310px, 1fr))',
                                            lg: committeeMembers.length === 1 ? '1fr'
                                                : committeeMembers.length === 2 ? 'repeat(2, 1fr)'
                                                : committeeMembers.length === 4 ? 'repeat(2, 1fr)'
                                                : 'repeat(3, 1fr)',
                                            xl: committeeMembers.length === 1 ? '1fr'
                                                : committeeMembers.length === 2 ? 'repeat(2, 1fr)'
                                                : committeeMembers.length === 4 ? 'repeat(2, 1fr)'
                                                : 'repeat(3, 1fr)'
                                        },
                                        gap: { xs: 2, sm: 2.5, md: 3 },
                                        maxWidth: committeeMembers.length === 1
                                            ? '480px'
                                            : (committeeMembers.length === 2 || committeeMembers.length === 4 ? '920px' : '100%'),
                                        mx: 'auto'
                                    }}>
                                        {committeeMembers.map((member, index) => (
                                            <CommitteeCard
                                                key={member._id}
                                                index={index}
                                                member={{
                                                    name: member.memberName,
                                                    role: member.designation,
                                                    position: member.position,
                                                    image: resolveImgUrl(member.photo),
                                                    email: member.email,
                                                    phone: member.phone
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Box component="p" style={{ color: 'rgba(13, 35, 59, 0.7)', fontSize: '14px' }}>
                                        No committee members found.
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </AnimatedCard>
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
                            borderRadius: { xs: 2.5, sm: 3 },
                            p: { xs: 1, sm: 1.5 },
                            m: { xs: 1, sm: 2 },
                            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
                            maxHeight: '92vh',
                            bgcolor: '#ffffff',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                {(() => {
                    const mapImagesList = Array.isArray(routeMap?.mapImages) ? routeMap.mapImages : [];
                    const currentMapImg = mapImagesList[selectedMapIndex] || mapImagesList[0] || '';

                    return (
                        <>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 1, sm: 1.2 },
                                borderBottom: '1px solid #f1f5f9',
                                gap: 1.5
                            }}>
                                {/* Title & Map Index */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        sx={{
                                            color: '#0b5299',
                                            fontSize: { xs: '0.95rem', sm: '1.15rem' },
                                            lineHeight: 1.3
                                        }}
                                    >
                                        {routeMap?.title || 'Aditya University Campus Route Map'}
                                    </Typography>

                                    {/* Mobile view only: Download button right next to title */}
                                    <Tooltip title="Download High-Res Map">
                                        <IconButton
                                            onClick={() => handleDownloadMap(currentMapImg, `campus-route-map-${selectedMapIndex + 1}`)}
                                            size="small"
                                            aria-label="Download Map"
                                            sx={{
                                                display: { xs: 'inline-flex', sm: 'none' },
                                                color: '#0b5299',
                                                bgcolor: '#eff6ff',
                                                border: '1.5px solid #bfdbfe',
                                                width: 32,
                                                height: 32,
                                                flexShrink: 0,
                                                boxShadow: '0 1px 4px rgba(11,82,153,0.15)',
                                                '&:hover': { bgcolor: '#dbeafe', color: '#1d4ed8' }
                                            }}
                                        >
                                            <DownloadIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>

                                    {mapImagesList.length > 1 && (
                                        <Chip
                                            label={`Map ${selectedMapIndex + 1} of ${mapImagesList.length}`}
                                            size="small"
                                            sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                                        />
                                    )}
                                </Box>

                                {/* Right Side: Close Button */}
                                <IconButton
                                    onClick={() => setIsMapModalOpen(false)}
                                    size="small"
                                    sx={{
                                        color: '#64748b',
                                        bgcolor: '#f1f5f9',
                                        flexShrink: 0,
                                        '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' }
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <DialogContent sx={{ p: { xs: 0.5, sm: 1 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                {/* Floating Top-Left Download Shortcut over Image (Desktop Only) */}
                                <Tooltip title="Download High-Res Map">
                                    <IconButton
                                        onClick={() => handleDownloadMap(currentMapImg, `campus-route-map-${selectedMapIndex + 1}`)}
                                        sx={{
                                            display: { xs: 'none', sm: 'flex' },
                                            position: 'absolute',
                                            left: 20,
                                            top: 20,
                                            zIndex: 6,
                                            bgcolor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#0b5299',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                                            width: 44,
                                            height: 44,
                                            '&:hover': {
                                                bgcolor: '#0b5299',
                                                color: '#ffffff'
                                            }
                                        }}
                                    >
                                        <DownloadIcon sx={{ fontSize: 24 }} />
                                    </IconButton>
                                </Tooltip>

                                <Box
                                    component="img"
                                    src={resolveImgUrl(currentMapImg)}
                                    alt={`Route Map Full Size ${selectedMapIndex + 1}`}
                                    sx={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: { xs: '76vh', sm: '82vh' },
                                        objectFit: 'contain',
                                        borderRadius: 2,
                                        display: 'block'
                                    }}
                                />

                                {mapImagesList.length > 1 && (
                                    <>
                                        <IconButton
                                            onClick={() => setSelectedMapIndex(i => (i - 1 + mapImagesList.length) % mapImagesList.length)}
                                            sx={{
                                                position: 'absolute',
                                                left: 16,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                                                '&:hover': { bgcolor: '#ffffff' }
                                            }}
                                        >
                                            <ArrowBackIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => setSelectedMapIndex(i => (i + 1) % mapImagesList.length)}
                                            sx={{
                                                position: 'absolute',
                                                right: 16,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                                                '&:hover': { bgcolor: '#ffffff' }
                                            }}
                                        >
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </>
                                )}
                            </DialogContent>
                        </>
                    );
                })()}
            </Dialog>

            {/* Mobile Bottom Navigation Bar */}
            <PublicBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Box>
    );
};

export default Home;