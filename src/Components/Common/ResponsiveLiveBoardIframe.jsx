import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, IconButton, Tooltip, Typography
} from '@mui/material';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import LiveTvIcon from '@mui/icons-material/LiveTv';

const CHESS_RESULTS_BASE_WIDTH = 760; // Natural desktop width of Chess-Results tables

/**
 * Format any YouTube / live stream link into an embeddable URL
 */
export const formatEmbedStreamUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';

    // If already an embed URL
    if (trimmed.includes('youtube.com/embed/') || trimmed.includes('player.twitch.tv')) {
        return trimmed;
    }

    // Convert standard YouTube watch/live/shorts URL to embed
    const ytRegex = /(?:youtube\.com\/(?:watch\?.*v=|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(ytRegex);
    if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }

    return trimmed;
};

const ResponsiveLiveBoardIframe = ({
    url,
    streamUrl = '',
    title = 'Tournament Live Broadcast',
    externalLink,
    height = { xs: '600px', sm: '720px', md: '820px' },
    showToolbar = true,
    defaultView = 'results'
}) => {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(700);
    const [zoomFactor, setZoomFactor] = useState(1.0);
    const [isFitMode, setIsFitMode] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeView, setActiveView] = useState(defaultView); // 'results' | 'stream'

    // Automatically switch activeView if one source is absent
    useEffect(() => {
        if (!url && streamUrl) {
            setActiveView('stream');
        } else if (url && !streamUrl) {
            setActiveView('results');
        } else if (defaultView) {
            setActiveView(defaultView);
        }
    }, [url, streamUrl, defaultView]);

    const isChessResults = Boolean(url && url.toLowerCase().includes('chess-results.com'));
    const formattedStreamUrl = formatEmbedStreamUrl(streamUrl);

    // Observe container dimensions dynamically
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                if (w > 0) setContainerWidth(w);
                if (h > 0) setContainerHeight(h);
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });
        resizeObserver.observe(containerRef.current);

        window.addEventListener('resize', updateSize);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    // Calculate effective scale
    const autoScale = (isChessResults && containerWidth > 0)
        ? (containerWidth / CHESS_RESULTS_BASE_WIDTH)
        : 1;

    const effectiveScale = isFitMode ? (autoScale * zoomFactor) : zoomFactor;

    const handleZoomIn = () => {
        setIsFitMode(false);
        setZoomFactor(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
    };

    const handleZoomOut = () => {
        setIsFitMode(false);
        setZoomFactor(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.4));
    };

    const handleResetFit = () => {
        setIsFitMode(true);
        setZoomFactor(1.0);
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const iframeHeight = isChessResults && effectiveScale > 0
        ? Math.round(containerHeight / effectiveScale)
        : '100%';

    // Determine target link for "Open in New Tab"
    const currentExternalLink = activeView === 'stream'
        ? (streamUrl || externalLink || url)
        : (externalLink || url);

    return (
        <Box
            sx={{
                width: '100%',
                '@keyframes livePulse': {
                    '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                    '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
                    '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
                }
            }}
        >
            {/* Top Toolbar */}
            {showToolbar && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: { xs: 1.25, sm: 1.5 },
                        mb: 1.5
                    }}
                >
                    {/* Left side: Controls based on active view */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    >
                        {activeView === 'results' ? (
                            isChessResults && (
                                <Box
                                    sx={{
                                        flex: { xs: 1, sm: 'initial' },
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: '#ffffff',
                                        border: '1.5px solid #cbd5e1',
                                        borderRadius: '50px',
                                        px: 0.75,
                                        height: '38px',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                        gap: 0.5,
                                        minWidth: 0
                                    }}
                                >
                                    <Tooltip title="Zoom Out (-)">
                                        <IconButton
                                            size="small"
                                            onClick={handleZoomOut}
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                color: '#475569',
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                                '&:hover': { bgcolor: '#f1f5f9', color: '#0b5299' }
                                            }}
                                        >
                                            <RemoveRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Click to Fit to Screen" arrow>
                                        <Button
                                            onClick={handleResetFit}
                                            size="small"
                                            startIcon={<FitScreenIcon sx={{ fontSize: '15px !important', color: '#0b5299' }} />}
                                            sx={{
                                                flex: { xs: 1, sm: 'initial' },
                                                height: '30px',
                                                minHeight: '30px',
                                                textTransform: 'none',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                color: '#0b5299',
                                                px: { xs: 1, sm: 1.5 },
                                                py: 0,
                                                minWidth: 'auto',
                                                borderRadius: '30px',
                                                bgcolor: isFitMode && zoomFactor === 1.0 ? '#f0fdf4' : '#f0f9ff',
                                                border: isFitMode && zoomFactor === 1.0 ? '1px solid #bbf7d0' : '1px solid #bae6fd',
                                                whiteSpace: 'nowrap',
                                                justifyContent: 'center',
                                                '&:hover': {
                                                    bgcolor: isFitMode && zoomFactor === 1.0 ? '#dcfce7' : '#e0f2fe'
                                                }
                                            }}
                                        >
                                            {isFitMode && zoomFactor === 1.0 ? 'Fit (100%)' : `${Math.round(effectiveScale * 100)}%`}
                                        </Button>
                                    </Tooltip>

                                    <Tooltip title="Zoom In (+)">
                                        <IconButton
                                            size="small"
                                            onClick={handleZoomIn}
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                color: '#475569',
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                                '&:hover': { bgcolor: '#f1f5f9', color: '#0b5299' }
                                            }}
                                        >
                                            <AddRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )
                        ) : (
                            <Box
                                sx={{
                                    flex: { xs: 1, sm: 'initial' },
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: '#fef2f2',
                                    border: '1.5px solid #fecaca',
                                    borderRadius: '50px',
                                    px: 2,
                                    height: '38px',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 2px 6px rgba(239,68,68,0.06)',
                                    gap: 1
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: '#ef4444',
                                        animation: 'livePulse 1.8s infinite'
                                    }}
                                />
                                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', letterSpacing: 0.3 }}>
                                    Live Stream Player
                                </Typography>
                            </Box>
                        )}

                        {/* Refresh button directly beside the pill with matching 38px height */}
                        <Tooltip title={activeView === 'stream' ? 'Reload Live Stream' : 'Refresh Standings & Pairings'}>
                            <IconButton
                                size="small"
                                onClick={handleRefresh}
                                sx={{
                                    border: '1.5px solid #cbd5e1',
                                    bgcolor: '#fff',
                                    color: activeView === 'stream' ? '#dc2626' : '#0b5299',
                                    width: '38px',
                                    height: '38px',
                                    boxSizing: 'border-box',
                                    borderRadius: '50%',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                    flexShrink: 0,
                                    '&:hover': {
                                        bgcolor: '#f1f5f9',
                                        borderColor: activeView === 'stream' ? '#dc2626' : '#0b5299'
                                    }
                                }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Center: Live Streaming & Results Switcher */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    >
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                bgcolor: '#f8fafc',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '50px',
                                p: '3px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                height: '38px',
                                boxSizing: 'border-box',
                                width: { xs: '100%', sm: 'auto' }
                            }}
                        >
                            <Button
                                size="small"
                                onClick={() => setActiveView('results')}
                                sx={{
                                    flex: { xs: 1, sm: 'initial' },
                                    height: '30px',
                                    minHeight: '30px',
                                    borderRadius: '30px',
                                    textTransform: 'none',
                                    fontSize: '12.5px',
                                    fontWeight: activeView === 'results' ? 700 : 500,
                                    px: { xs: 1.5, sm: 2 },
                                    py: 0,
                                    color: activeView === 'results' ? '#0b5299' : '#64748b',
                                    bgcolor: activeView === 'results' ? '#ffffff' : 'transparent',
                                    boxShadow: activeView === 'results' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    border: activeView === 'results' ? '1px solid #bae6fd' : '1px solid transparent',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: activeView === 'results' ? '#ffffff' : '#f1f5f9'
                                    }
                                }}
                            >
                                ♟️ Chess Results
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setActiveView('stream')}
                                sx={{
                                    flex: { xs: 1, sm: 'initial' },
                                    height: '30px',
                                    minHeight: '30px',
                                    borderRadius: '30px',
                                    textTransform: 'none',
                                    fontSize: '12.5px',
                                    fontWeight: activeView === 'stream' ? 700 : 600,
                                    px: { xs: 1.5, sm: 2 },
                                    py: 0,
                                    color: activeView === 'stream' ? '#dc2626' : '#64748b',
                                    bgcolor: activeView === 'stream' ? '#ffffff' : 'transparent',
                                    boxShadow: activeView === 'stream' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    border: activeView === 'stream' ? '1px solid #fecaca' : '1px solid transparent',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.75,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: activeView === 'stream' ? '#ffffff' : '#f1f5f9'
                                    }
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        bgcolor: '#ef4444',
                                        animation: 'livePulse 1.8s infinite'
                                    }}
                                />
                                Live Streaming
                            </Button>
                        </Box>
                    </Box>

                    {/* Right side: Open in New Tab */}
                    {currentExternalLink && (
                        <Button
                            variant="outlined"
                            size="small"
                            component="a"
                            href={currentExternalLink}
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<OpenInNewIcon fontSize="small" />}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                borderRadius: '50px',
                                textTransform: 'none',
                                borderColor: activeView === 'stream' ? '#dc2626' : '#0b5299',
                                color: activeView === 'stream' ? '#dc2626' : '#0b5299',
                                fontWeight: 600,
                                fontSize: '13px',
                                height: { xs: '38px', sm: '38px' },
                                whiteSpace: 'nowrap',
                                px: 2.5,
                                justifyContent: 'center',
                                boxShadow: '0 1px 4px rgba(11,82,153,0.08)',
                                '&:hover': {
                                    bgcolor: activeView === 'stream' ? '#fef2f2' : '#f0f9ff',
                                    borderColor: activeView === 'stream' ? '#b91c1c' : '#083d73'
                                }
                            }}
                        >
                            {activeView === 'stream' ? 'Watch on YouTube' : 'Open in New Tab'}
                        </Button>
                    )}
                </Box>
            )}

            {/* Iframe Viewport Container */}
            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    height: height,
                    borderRadius: 3,
                    overflow: 'hidden',
                    overflowX: (activeView === 'results' && isChessResults && (!isFitMode || zoomFactor > 1.0)) ? 'auto' : 'hidden',
                    overflowY: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                    border: '1.5px solid #e2e8f0',
                    bgcolor: activeView === 'stream' ? '#0f172a' : '#ffffff',
                    position: 'relative',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {activeView === 'stream' ? (
                    formattedStreamUrl ? (
                        <iframe
                            key={`stream-${refreshKey}`}
                            src={formattedStreamUrl}
                            title={`${title} - Live Stream`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                minHeight: '380px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                textAlign: 'center',
                                color: '#ffffff'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                                    border: '2px solid rgba(239, 68, 68, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2.5
                                }}
                            >
                                <LiveTvIcon sx={{ fontSize: 36, color: '#ef4444' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#f8fafc' }}>
                                Live Stream Offline
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 440, mb: 3, lineHeight: 1.6, fontSize: '13px' }}>
                                The tournament live video stream link has not been configured yet or the broadcast will start with the upcoming round. You can follow live boards and pairings in the meantime!
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => setActiveView('results')}
                                startIcon={<FitScreenIcon />}
                                sx={{
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.5)',
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    px: 2.5,
                                    py: 0.8,
                                    '&:hover': {
                                        borderColor: '#38bdf8',
                                        bgcolor: 'rgba(56, 189, 248, 0.1)'
                                    }
                                }}
                            >
                                View Live Chess Results & Standings
                            </Button>
                        </Box>
                    )
                ) : isChessResults ? (
                    <Box
                        sx={{
                            width: `${Math.round(CHESS_RESULTS_BASE_WIDTH * effectiveScale)}px`,
                            height: '100%',
                            minWidth: '100%',
                            position: 'relative'
                        }}
                    >
                        <iframe
                            key={`${refreshKey}-${effectiveScale}`}
                            src={url}
                            title={title}
                            frameBorder="0"
                            allowFullScreen
                            loading="lazy"
                            scrolling="yes"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{
                                border: 0,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${CHESS_RESULTS_BASE_WIDTH}px`,
                                height: `${iframeHeight}px`,
                                transform: `scale(${effectiveScale})`,
                                transformOrigin: 'top left',
                                display: 'block'
                            }}
                        />
                    </Box>
                ) : url ? (
                    <iframe
                        key={refreshKey}
                        src={url}
                        title={title}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            minHeight: '380px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center',
                            bgcolor: '#f8fafc'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
                            Chess Results Link Not Configured
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 440, mb: formattedStreamUrl ? 2.5 : 0, lineHeight: 1.6, fontSize: '13px' }}>
                            Live standings and pairings will appear here once the link is updated.
                        </Typography>
                        {formattedStreamUrl && (
                            <Button
                                variant="outlined"
                                onClick={() => setActiveView('stream')}
                                sx={{
                                    color: '#dc2626',
                                    borderColor: '#fca5a5',
                                    borderRadius: '50px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    px: 2.5,
                                    py: 0.8,
                                    '&:hover': {
                                        borderColor: '#dc2626',
                                        bgcolor: '#fef2f2'
                                    }
                                }}
                            >
                                Switch to Live Stream
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ResponsiveLiveBoardIframe;
