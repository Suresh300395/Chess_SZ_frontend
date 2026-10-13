import { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Button, Paper, Avatar,
    Dialog, DialogContent, IconButton
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import Tabs from './Common/Tabs';
import CommitteeCard from './Common/CommitteeCard';
import io from 'socket.io-client';
import { committeeAPI, routeMapAPI, liveBoardAPI, SOCKET_URL } from '../utils/api';

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

                <Box
                    sx={{
                        mt: { xs: 2, sm: 5 },
                        mb: { xs: 1.5, sm: 4 },
                        display: 'flex',
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
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                </Box>

                <Box component="section" className="tab-content-section" sx={{ px: { xs: 1.5, sm: 2, md: '96px' }, pb: { xs: 4, md: 8 } }}>
                    <Box className="tab-content-card" sx={{ p: { xs: 2, sm: 3, md: 5 }, bgcolor: 'white', borderRadius: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', height: 'auto', minHeight: 'auto' }}>
                        <Box
                            component="h2"
                            className="tab-card-title"
                            sx={{
                                mb: 3,
                                mt: 0,
                                position: { xs: 'sticky', md: 'static' },
                                top: { xs: '54px', md: 'auto' },
                                zIndex: { xs: 1090, md: 'auto' },
                                bgcolor: { xs: 'white', md: 'transparent' },
                                py: { xs: 1, md: 0 },
                                color: '#0b5299',
                                fontSize: { xs: '1.45rem', sm: '1.75rem', md: '2rem' },
                                fontWeight: 700
                            }}
                        >
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
                                                        <Paper
                                                            key={idx}
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
                                                                            {details.p1Won && (
                                                                                <Box
                                                                                    sx={{
                                                                                        position: 'absolute',
                                                                                        top: -11,
                                                                                        right: -5,
                                                                                        fontSize: '23px',
                                                                                        lineHeight: 1,
                                                                                        transform: 'rotate(18deg)',
                                                                                        transformOrigin: 'bottom center',
                                                                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.22))',
                                                                                        zIndex: 2,
                                                                                        userSelect: 'none',
                                                                                        pointerEvents: 'none'
                                                                                    }}
                                                                                >
                                                                                    👑
                                                                                </Box>
                                                                            )}
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
                                                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: details.p1Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626', px: 1 }}>
                                                                            {details.score1}
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                <Box sx={{ height: '1px', bgcolor: '#f1f5f9', my: 0.25 }} />

                                                                {/* Player 2 Row */}
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                                                                        <Box sx={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
                                                                            {details.p2Won && (
                                                                                <Box
                                                                                    sx={{
                                                                                        position: 'absolute',
                                                                                        top: -11,
                                                                                        right: -5,
                                                                                        fontSize: '23px',
                                                                                        lineHeight: 1,
                                                                                        transform: 'rotate(18deg)',
                                                                                        transformOrigin: 'bottom center',
                                                                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.22))',
                                                                                        zIndex: 2,
                                                                                        userSelect: 'none',
                                                                                        pointerEvents: 'none'
                                                                                    }}
                                                                                >
                                                                                    👑
                                                                                </Box>
                                                                            )}
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
                                                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: details.p2Won ? '#16a34a' : details.isDraw ? '#2563eb' : '#dc2626', px: 1 }}>
                                                                            {details.score2}
                                                                        </Typography>
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
                                                                        {details.p1Won && (
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: -13,
                                                                                    right: -6,
                                                                                    fontSize: '26px',
                                                                                    lineHeight: 1,
                                                                                    transform: 'rotate(18deg)',
                                                                                    transformOrigin: 'bottom center',
                                                                                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))',
                                                                                    zIndex: 2,
                                                                                    userSelect: 'none',
                                                                                    pointerEvents: 'none'
                                                                                }}
                                                                            >
                                                                                👑
                                                                            </Box>
                                                                        )}
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
                                                                        {details.p2Won && (
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    top: -13,
                                                                                    right: -6,
                                                                                    fontSize: '26px',
                                                                                    lineHeight: 1,
                                                                                    transform: 'rotate(18deg)',
                                                                                    transformOrigin: 'bottom center',
                                                                                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))',
                                                                                    zIndex: 2,
                                                                                    userSelect: 'none',
                                                                                    pointerEvents: 'none'
                                                                                }}
                                                                            >
                                                                                👑
                                                                            </Box>
                                                                        )}
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
                                                            </Box>
                                                        </Paper>
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
                            <Box sx={{ width: '100%', mt: 0 }}>
                                {committeeMembers.length > 0 ? (
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: committeeMembers.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                            md: committeeMembers.length <= 2 ? (committeeMembers.length === 1 ? '1fr' : 'repeat(2, 1fr)') : 'repeat(3, 1fr)',
                                            lg: committeeMembers.length === 1 ? '1fr'
                                                : committeeMembers.length === 2 ? 'repeat(2, 1fr)'
                                                : committeeMembers.length === 3 ? 'repeat(3, 1fr)'
                                                : 'repeat(4, 1fr)'
                                        },
                                        gap: { xs: 2, sm: 2.5, md: 3 }
                                    }}>
                                        {committeeMembers.map((member) => (
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