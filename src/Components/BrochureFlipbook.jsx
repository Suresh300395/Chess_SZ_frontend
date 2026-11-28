import React, { useState, useRef, useEffect, forwardRef, useCallback, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Box, Button, Dialog, DialogContent } from '@mui/material';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Synthesize a soft paper-turn whoosh sound using Web Audio API (0 dependencies, 0 latency)
const playPaperSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const bufferSize = Math.floor(ctx.sampleRate * 0.12);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const envelope = Math.sin((Math.PI * i) / bufferSize);
            data[i] = (Math.random() * 2 - 1) * 0.12 * envelope;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;
        noise.connect(filter);
        filter.connect(ctx.destination);
        noise.start();
    } catch (_) { }
};

// ForwardRef Page component required by react-pageflip
const Page = forwardRef(({ number, image, children }, ref) => {
    return (
        <div
            ref={ref}
            data-density="soft"
            className="flip-page"
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
            }}
        >
            <img
                src={image}
                alt={`Brochure Page ${number}`}
                loading="eager"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                }}
            />
            {children}
        </div>
    );
});

Page.displayName = 'FlipBookPage';

const TOTAL_PAGES = 12;
const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
    number: i + 1,
    image: `/brochure/page-${i + 1}.jpg`,
    isCover: i === 0,
    isBackCover: i === TOTAL_PAGES - 1,
}));

const BrochureFlipbook = forwardRef((props, ref) => {
    const flipBookRef = useRef(null);
    const bookStageRef = useRef(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFsModal, setIsFsModal] = useState(false);

    // Synchronous mobile detection
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    // Helper to calculate exact responsive dimensions (A4 ratio = 1.414)
    const calculateDims = useCallback(() => {
        if (typeof window === 'undefined') return { width: 460, height: 650 };
        const winWidth = window.innerWidth;
        const A4_RATIO = 1.414;

        if (winWidth < 768) {
            // Mobile: 1-page full width with small margin
            const available = Math.max(winWidth - 32, 260);
            const w = Math.min(available, 380);
            return { width: Math.round(w), height: Math.round(w * A4_RATIO) };
        } else if (winWidth < 980) {
            // Tablet: smaller 2-page spread
            const maxPageWidth = Math.floor((winWidth - 80) / 2);
            const w = Math.min(maxPageWidth, 380);
            return { width: Math.round(w), height: Math.round(w * A4_RATIO) };
        } else {
            // Desktop: standard 2-page spread (exact original size)
            const maxPageWidth = Math.floor((Math.min(winWidth, 1140) - 96) / 2);
            const w = Math.min(maxPageWidth, 460);
            return { width: Math.round(w), height: Math.round(w * A4_RATIO) };
        }
    }, []);

    const [bookDims, setBookDims] = useState(calculateDims);
    const [currentPage, setCurrentPage] = useState(0);

    const updateDimensions = useCallback(() => {
        const mobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
        setIsMobile(mobile);
        setBookDims(calculateDims());
    }, [calculateDims]);

    useEffect(() => {
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [updateDimensions]);

    // Dimensions during fullscreen vs standard view
    const getActiveDims = useCallback(() => {
        if (isFullscreen) {
            const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
            const A4_RATIO = 1.414;
            if (isMobile) {
                // Mobile fullscreen: keep standard mobile sizing (do not force screen height)
                const available = Math.max(winWidth - 32, 260);
                const w = Math.min(available, 380);
                return { width: Math.round(w), height: Math.round(w * A4_RATIO) };
            } else {
                // Desktop fullscreen: FIT TO SCREEN HEIGHT (only in desktop view)
                const targetHeight = Math.min(
                    winHeight - 16,
                    Math.floor(((winWidth - 32) / 2) * A4_RATIO)
                );
                const targetWidth = Math.round(targetHeight / A4_RATIO);
                return { width: targetWidth, height: targetHeight };
            }
        }
        return bookDims;
    }, [isFullscreen, isMobile, bookDims]);

    const currentDims = getActiveDims();

    // Fullscreen toggle: expands ONLY the PDF book container to 100vw/100vh
    const toggleFullscreen = useCallback(() => {
        const el = bookStageRef.current;
        if (!el) return;

        const isCurrentlyFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);

        if (!isCurrentlyFull) {
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => setIsFsModal(true));
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else {
                setIsFsModal(true);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            setIsFsModal(false);
        }
    }, []);

    // Expose toggleFullscreen to parent component (Home.jsx)
    useImperativeHandle(ref, () => ({
        toggleFullscreen,
    }), [toggleFullscreen]);

    // Listen to native fullscreen changes
    useEffect(() => {
        const handleFsChange = () => {
            const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
            setIsFullscreen(isFull);
            updateDimensions();
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, [updateDimensions]);

    // Keyboard navigation (ArrowLeft = prev, ArrowRight = next, Escape = exit fs)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                try {
                    flipBookRef.current?.pageFlip()?.flipNext('top');
                } catch (_) { }
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                try {
                    flipBookRef.current?.pageFlip()?.flipPrev('top');
                } catch (_) { }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFlip = useCallback((e) => {
        if (e && typeof e.data === 'number') {
            setCurrentPage(e.data);
        }
        playPaperSound();
    }, []);

    // On desktop in 2-page spread mode, shift closed front/back cover to dead center
    const isDesktop = !isMobile;
    const isClosedCover = isDesktop && currentPage === 0;
    const isClosedBack = isDesktop && currentPage >= TOTAL_PAGES - 1;

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pt: 0,
                pb: { xs: 1, sm: 2 },
                mt: 0,
                overflow: 'hidden',
                '& .stf__parent': {
                    margin: '0 auto !important',
                    maxWidth: '100% !important',
                },
                '& .stf__wrapper': {
                    margin: '0 auto !important',
                    maxWidth: '100% !important',
                },
            }}
        >
            {/* 3D Realistic Book Stage (target of Fullscreen API) */}
            <Box
                ref={bookStageRef}
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    background: 'transparent',
                    userSelect: 'none',
                    '&:fullscreen, &:-webkit-full-screen': {
                        backgroundColor: '#090d16 !important',
                        width: '100vw !important',
                        height: '100vh !important',
                        display: 'flex !important',
                        flexDirection: 'column !important',
                        alignItems: 'center !important',
                        justifyContent: 'center !important',
                        p: '0 !important',
                        overflow: 'hidden !important',
                        boxSizing: 'border-box !important',
                    },
                }}
            >
                {/* Floating Exit Fullscreen Button (only visible in fullscreen mode) */}
                {isFullscreen && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={toggleFullscreen}
                        startIcon={<FullscreenExitIcon />}
                        sx={{
                            position: 'absolute',
                            top: { xs: 12, sm: 20 },
                            right: { xs: 12, sm: 20 },
                            color: '#ffffff',
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9999,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                                borderColor: '#ffffff',
                            },
                        }}
                    >
                        Exit Fullscreen
                    </Button>
                )}

                {/* Flipbook Animated Container */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        perspective: '1800px',
                        filter: isFullscreen
                            ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8))'
                            : 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.12))',
                        mt: 0,
                        mb: isFullscreen ? 0 : { xs: 1, sm: 2 },
                        transform: !isMobile && currentPage === 0
                            ? `translateX(-${currentDims.width / 2}px)`
                            : (!isMobile && currentPage >= TOTAL_PAGES - 1
                                ? `translateX(${currentDims.width / 2}px)`
                                : 'none'),
                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <HTMLFlipBook
                        key={`${isMobile ? 'mobile' : 'desktop'}-${isFullscreen ? 'fs' : 'normal'}`}
                        ref={flipBookRef}
                        startPage={currentPage}
                        width={currentDims.width}
                        height={currentDims.height}
                        size="fixed"
                        autoSize={false}
                        minWidth={isMobile ? 240 : 300}
                        maxWidth={isFullscreen && !isMobile ? 1400 : (isMobile ? 440 : 580)}
                        minHeight={isMobile ? 340 : 420}
                        maxHeight={isFullscreen && !isMobile ? 2200 : (isMobile ? 650 : 820)}
                        drawShadow={true}
                        maxShadowOpacity={0.65}
                        flippingTime={isMobile ? 650 : 750}
                        showCover={!isMobile}
                        usePortrait={isMobile}
                        mobileScrollSupport={true}
                        onFlip={handleFlip}
                        className="brochure-flipbook"
                        style={{ margin: '0 auto' }}
                    >
                        {PAGES.map((page) => (
                            <Page
                                key={page.number}
                                number={page.number}
                                image={page.image}
                            />
                        ))}
                    </HTMLFlipBook>
                </Box>
            </Box>

            {/* Fallback Dialog Modal (for Safari/browsers restricting Element.requestFullscreen) */}
            <Dialog
                open={isFsModal}
                onClose={() => setIsFsModal(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#090d16',
                        p: { xs: 1, sm: 2 },
                        m: 1,
                        maxHeight: '96vh',
                        borderRadius: 3,
                    },
                }}
            >
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 1, sm: 2 },
                        position: 'relative',
                    }}
                >
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setIsFsModal(false)}
                            startIcon={<FullscreenExitIcon />}
                            sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}
                        >
                            Exit
                        </Button>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8))',
                        }}
                    >
                        <HTMLFlipBook
                            startPage={currentPage}
                            width={isMobile ? 360 : 460}
                            height={isMobile ? 509 : 650}
                            size="fixed"
                            autoSize={false}
                            minWidth={isMobile ? 240 : 300}
                            maxWidth={isMobile ? 440 : 580}
                            minHeight={isMobile ? 340 : 420}
                            maxHeight={isMobile ? 650 : 820}
                            drawShadow={true}
                            maxShadowOpacity={0.65}
                            flippingTime={isMobile ? 650 : 750}
                            showCover={!isMobile}
                            usePortrait={isMobile}
                            mobileScrollSupport={true}
                            onFlip={handleFlip}
                            className="brochure-flipbook-modal"
                            style={{ margin: '0 auto' }}
                        >
                            {PAGES.map((page) => (
                                <Page
                                    key={`modal-${page.number}`}
                                    number={page.number}
                                    image={page.image}
                                />
                            ))}
                        </HTMLFlipBook>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
});

BrochureFlipbook.displayName = 'BrochureFlipbook';

export default BrochureFlipbook;
