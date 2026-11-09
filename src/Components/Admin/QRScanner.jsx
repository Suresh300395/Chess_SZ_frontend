import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Tooltip
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

import { BrowserQRCodeReader, BrowserCodeReader } from '@zxing/browser';
import { foodTokenAPI } from '../../utils/api';
import { toast } from 'sonner';

/**
 * Synthesizes short audio chimes via Web Audio API for fast feedback in busy cafeteria lines
 */
const playAudioFeedback = (type = 'success', enabled = true) => {
    if (!enabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'success') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        } else {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, ctx.currentTime);
            osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch {
        // Audio might be ignored if browser prevents autoplay
    }
};

/**
 * Extract clean alphanumeric code even if scanned payload is JSON
 */
const extractCode = (raw) => {
    if (!raw) return '';
    let val = String(raw).trim();
    if (val.startsWith('{') && val.endsWith('}')) {
        try {
            const parsed = JSON.parse(val);
            if (parsed.code) return String(parsed.code).trim().toUpperCase();
        } catch {
            // fallback
        }
    }
    return val.trim().toUpperCase();
};

const QRScanner = () => {
    // Camera & ZXing state
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);
    const handleTokenCodeDetectedRef = useRef(null);

    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState('');
    const [torchSupported, setTorchSupported] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);

    // Scanner preferences (Auto-Redeem is always ON by default)
    const autoRedeem = true;
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Manual input & current verification state
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null); // { token, status, message, error }
    const [lastScannedCode, setLastScannedCode] = useState('');
    const [cooldown, setCooldown] = useState(false);

    // Session log / history of scans
    const [sessionHistory, setSessionHistory] = useState([]);

    // Stop camera stream cleanly
    const stopCamera = useCallback(() => {
        if (controlsRef.current) {
            try {
                controlsRef.current.stop();
            } catch (err) {
                console.warn('Error stopping camera stream:', err);
            }
            controlsRef.current = null;
        }
        setIsCameraActive(false);
        setIsTorchOn(false);
    }, []);

    // Fetch video input devices
    const loadVideoDevices = useCallback(async (activeDeviceId) => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return;
            }
            const devices = await BrowserCodeReader.listVideoInputDevices();
            setVideoDevices(devices || []);
            if (devices && devices.length > 0) {
                if (activeDeviceId && devices.some(d => d.deviceId === activeDeviceId)) {
                    setSelectedDeviceId(activeDeviceId);
                    return;
                }
                const savedId = localStorage.getItem('qr_scanner_preferred_device_id');
                if (savedId && devices.some(d => d.deviceId === savedId)) {
                    setSelectedDeviceId(savedId);
                    return;
                }
                // Prefer rear / back camera on mobile devices
                const rearDevice = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                );
                setSelectedDeviceId(rearDevice ? rearDevice.deviceId : devices[0].deviceId);
            }
        } catch (err) {
            console.error('Failed to list video devices:', err);
        }
    }, []);

    // Start camera stream with ZXing - auto starts on mount with resilient fallbacks
    const startCamera = useCallback(async (deviceIdToUse) => {
        setCameraPermissionError('');
        const savedPref = localStorage.getItem('qr_scanner_preferred_device_id');
        const deviceId = deviceIdToUse || selectedDeviceId || savedPref || undefined;

        try {
            stopCamera();

            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserQRCodeReader();
            }

            const videoElement = videoRef.current;
            if (!videoElement) return;

            const handleResult = (result, error) => {
                if (result) {
                    const scannedText = result.getText();
                    handleTokenCodeDetectedRef.current?.(scannedText);
                }
            };

            let controls = null;

            // Attempt 1: Try with ideal facingMode or specific deviceId (using ideal to avoid NotFoundError on single webcam/desktop systems)
            try {
                const constraints = {
                    video: deviceId
                        ? { deviceId: { ideal: deviceId } }
                        : { facingMode: { ideal: 'environment' } }
                };
                controls = await codeReaderRef.current.decodeFromConstraints(
                    constraints,
                    videoElement,
                    handleResult
                );
            } catch (constraintErr) {
                console.warn('Preferred camera constraint failed, attempting generic video fallback:', constraintErr);
                // Clear obsolete saved device id if it was the culprit
                if (deviceId) {
                    localStorage.removeItem('qr_scanner_preferred_device_id');
                }
                // Attempt 2: Fallback to any generic video camera available on system
                controls = await codeReaderRef.current.decodeFromConstraints(
                    { video: true },
                    videoElement,
                    handleResult
                );
            }

            controlsRef.current = controls;
            setIsCameraActive(true);
            localStorage.setItem('qr_scanner_camera_permission_saved', 'true');

            // Refresh device list now that permission is active
            loadVideoDevices(deviceId);

            // Synchronize selectedDeviceId & check torch capability
            try {
                const stream = videoElement.srcObject;
                if (stream) {
                    const tracks = stream.getVideoTracks();
                    if (tracks && tracks[0]) {
                        const settings = tracks[0].getSettings ? tracks[0].getSettings() : {};
                        if (settings.deviceId) {
                            setSelectedDeviceId(settings.deviceId);
                        }
                        const caps = tracks[0].getCapabilities ? tracks[0].getCapabilities() : {};
                        setTorchSupported(!!caps.torch);
                    }
                }
            } catch {
                setTorchSupported(false);
            }
        } catch (err) {
            console.error('Error starting video stream:', err);
            const isNotFound = err.name === 'NotFoundError' || err.message?.toLowerCase().includes('not found') || err.name === 'DevicesNotFoundError';
            const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
            const isBusy = err.name === 'NotReadableError' || err.name === 'TrackStartError';

            let friendlyMsg = `Unable to access camera: ${err.message || 'Unknown error'}`;
            if (isDenied) {
                friendlyMsg = 'Camera access was denied. Please allow camera permissions in your browser settings.';
            } else if (isNotFound) {
                friendlyMsg = 'No camera found on this device. You can type or use a USB barcode scanner below.';
            } else if (isBusy) {
                friendlyMsg = 'Camera is in use by another application. Please close other camera apps and retry.';
            }

            setCameraPermissionError(friendlyMsg);
            setIsCameraActive(false);
        }
    }, [selectedDeviceId, stopCamera, loadVideoDevices]);

    // Handle manual camera device dropdown change
    const handleDeviceChange = (e) => {
        const newDevId = e.target.value;
        setSelectedDeviceId(newDevId);
        if (newDevId) {
            localStorage.setItem('qr_scanner_preferred_device_id', newDevId);
        }
        startCamera(newDevId);
    };

    // Toggle flashlight/torch
    const toggleTorch = async () => {
        try {
            if (!videoRef.current || !videoRef.current.srcObject) return;
            const tracks = videoRef.current.srcObject.getVideoTracks();
            if (tracks && tracks[0]) {
                const newTorchState = !isTorchOn;
                await tracks[0].applyConstraints({
                    advanced: [{ torch: newTorchState }]
                });
                setIsTorchOn(newTorchState);
            }
        } catch (err) {
            console.error('Failed to toggle flashlight:', err);
            toast.error('Flashlight could not be toggled');
        }
    };

    // Initialize ZXing code reader & auto-start camera on mount
    useEffect(() => {
        codeReaderRef.current = new BrowserQRCodeReader();
        const savedId = localStorage.getItem('qr_scanner_preferred_device_id') || undefined;
        startCamera(savedId);

        return () => {
            stopCamera();
        };
    }, []);

    // Handle incoming scanned or manually entered code
    const handleTokenCodeDetected = useCallback(async (rawText) => {
        const cleanCode = extractCode(rawText);
        if (!cleanCode) return;

        // Debounce / Cooldown to avoid rapid multiple triggers of the same QR code
        if (cooldown || isProcessing) return;
        if (cleanCode === lastScannedCode && Date.now() - (lastScanResult?.timestamp || 0) < 3000) {
            return;
        }

        setCooldown(true);
        setTimeout(() => setCooldown(false), 2000);

        await processTokenCode(cleanCode);
    }, [cooldown, isProcessing, lastScannedCode, lastScanResult]);

    useEffect(() => {
        handleTokenCodeDetectedRef.current = handleTokenCodeDetected;
    }, [handleTokenCodeDetected]);

    // Process token verification and optional redemption
    const processTokenCode = async (code) => {
        setIsProcessing(true);
        setLastScannedCode(code);

        try {
            // If Auto-Redeem is enabled, directly call redeem
            if (autoRedeem) {
                const res = await foodTokenAPI.redeem(code);
                const data = await res.json();

                if (res.ok && data.success) {
                    playAudioFeedback('success', soundEnabled);
                    const scanData = {
                        token: data.token,
                        status: 'REDEEMED_NOW',
                        message: data.message || `Token ${code} redeemed successfully!`,
                        timestamp: Date.now()
                    };
                    setLastScanResult(scanData);
                    addSessionHistoryItem(scanData);
                    toast.success(data.message || `Redeemed for ${data.token?.name}!`);
                } else if (res.status === 409) {
                    // Already redeemed
                    playAudioFeedback('error', soundEnabled);
                    const scanData = {
                        token: data.token,
                        status: 'ALREADY_REDEEMED',
                        message: data.message || `Token ${code} was ALREADY REDEEMED!`,
                        timestamp: Date.now()
                    };
                    setLastScanResult(scanData);
                    addSessionHistoryItem(scanData);
                    toast.warning(data.message || 'Already redeemed!');
                } else if (res.status === 404) {
                    playAudioFeedback('error', soundEnabled);
                    const scanData = {
                        token: null,
                        status: 'NOT_FOUND',
                        message: data.message || `Token "${code}" not found in database.`,
                        timestamp: Date.now()
                    };
                    setLastScanResult(scanData);
                    addSessionHistoryItem(scanData);
                    toast.error(data.message || 'Token not found');
                } else {
                    // Cancelled or server error
                    playAudioFeedback('error', soundEnabled);
                    const scanData = {
                        token: data.token || null,
                        status: data.token?.status === 'CANCELLED' ? 'CANCELLED' : 'INVALID',
                        message: data.message || `Unable to redeem token (${code})`,
                        timestamp: Date.now()
                    };
                    setLastScanResult(scanData);
                    addSessionHistoryItem(scanData);
                    toast.error(data.message || 'Failed to redeem token');
                }
            } else {
                // Verification only (staff confirms manually)
                const res = await foodTokenAPI.verify(code);
                const data = await res.json();

                if (res.ok && data.success) {
                    if (data.token.status === 'ISSUED') {
                        playAudioFeedback('success', soundEnabled);
                    } else {
                        playAudioFeedback('error', soundEnabled);
                    }
                    const scanData = {
                        token: data.token,
                        status: data.token.status,
                        message: `Token is ${data.token.status}`,
                        timestamp: Date.now()
                    };
                    setLastScanResult(scanData);
                } else {
                    playAudioFeedback('error', soundEnabled);
                    setLastScanResult({
                        token: null,
                        status: 'NOT_FOUND',
                        message: data.message || `Token code "${code}" not found`,
                        timestamp: Date.now()
                    });
                }
            }
        } catch (err) {
            console.error('Error processing token:', err);
            playAudioFeedback('error', soundEnabled);
            setLastScanResult({
                token: null,
                status: 'ERROR',
                message: 'Network or server error while validating token',
                timestamp: Date.now()
            });
            toast.error('Network or server error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Manual redeem trigger when auto-redeem is OFF
    const handleManualRedeemClick = async () => {
        if (!lastScanResult?.token?.code) return;
        setIsProcessing(true);
        try {
            const res = await foodTokenAPI.redeem(lastScanResult.token.code);
            const data = await res.json();
            if (res.ok && data.success) {
                playAudioFeedback('success', soundEnabled);
                const updated = {
                    token: data.token,
                    status: 'REDEEMED_NOW',
                    message: data.message || 'Token redeemed successfully!',
                    timestamp: Date.now()
                };
                setLastScanResult(updated);
                addSessionHistoryItem(updated);
                toast.success(data.message || 'Food served!');
            } else {
                playAudioFeedback('error', soundEnabled);
                toast.error(data.message || 'Failed to redeem token');
            }
        } catch (err) {
            toast.error('Server error during redemption');
        } finally {
            setIsProcessing(false);
        }
    };

    // Append to local session history
    const addSessionHistoryItem = (scanData) => {
        setSessionHistory(prev => [
            {
                id: Date.now(),
                code: scanData.token?.code || lastScannedCode,
                name: scanData.token?.name || 'Unknown',
                mealType: scanData.token?.mealType || 'Meal',
                mealDate: scanData.token?.mealDate || '',
                status: scanData.status,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            },
            ...prev.slice(0, 49) // Keep last 50 scans
        ]);
    };

    // Handle manual code form submit (supports barcode guns typing into field)
    const handleManualSubmit = (e) => {
        e.preventDefault();
        const code = extractCode(manualCode);
        if (!code) {
            toast.warning('Please enter a valid token code');
            return;
        }
        processTokenCode(code);
        setManualCode('');
    };

    const redeemedSessionCount = sessionHistory.filter(h => h.status === 'REDEEMED_NOW' || h.status === 'REDEEMED').length;

    return (
        <Box sx={{ width: '100%', pb: 4 }}>
            {/* Page Header matching Admin standard */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <QrCodeScannerIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '22px', sm: '26px', md: '28px' }, lineHeight: 1.2 }}>
                                Food Token QR Scanner
                            </Typography>
                        </Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: '14px', mt: 0.5 }}>
                            Scan food tokens to verify and serve meals.
                        </Typography>
                    </Box>

                    {/* Quick controls on header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', sm: 'flex-end' },
                        width: { xs: '100%', sm: 'auto' },
                        gap: 1.5,
                        flexWrap: 'wrap'
                    }}>
                        <Chip
                            icon={<RestaurantIcon sx={{ color: '#ffffff !important' }} />}
                            label={`Redeemed This Session: ${redeemedSessionCount}`}
                            sx={{
                                backgroundColor: '#0b5299',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                py: 2.2,
                                px: 1,
                                borderRadius: '20px'
                            }}
                        />
                        <Tooltip title={soundEnabled ? 'Audio feedback ON' : 'Audio feedback MUTED'}>
                            <IconButton
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                sx={{
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#ffffff',
                                    color: soundEnabled ? '#d06c38' : '#94a3b8',
                                    '&:hover': { backgroundColor: '#f8fafc' }
                                }}
                            >
                                {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            {/* Main Scanner Card */}
            <Card sx={{
                maxWidth: '780px',
                margin: '0 auto 24px auto',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {/* Camera Toolbar - Hidden on mobile view as camera auto-starts */}
                    <Box sx={{
                        display: { xs: 'none', sm: 'flex' },
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        mb: 2
                    }}>
                        {/* Device Select */}
                        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                            <InputLabel id="camera-select-label">Camera Source</InputLabel>
                            <Select
                                labelId="camera-select-label"
                                value={selectedDeviceId}
                                label="Camera Source"
                                onChange={handleDeviceChange}
                                disabled={!videoDevices.length}
                            >
                                {videoDevices.map((device, idx) => (
                                    <MenuItem key={device.deviceId || idx} value={device.deviceId}>
                                        {device.label || `Camera ${idx + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Camera Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {torchSupported && isCameraActive && (
                                <Tooltip title={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={toggleTorch}
                                        color={isTorchOn ? 'warning' : 'primary'}
                                        startIcon={isTorchOn ? <FlashOffIcon /> : <FlashOnIcon />}
                                    >
                                        {isTorchOn ? 'Torch On' : 'Torch'}
                                    </Button>
                                </Tooltip>
                            )}

                            <Button
                                variant={isCameraActive ? 'outlined' : 'contained'}
                                color={isCameraActive ? 'error' : 'primary'}
                                size="small"
                                onClick={() => {
                                    if (isCameraActive) {
                                        stopCamera();
                                    } else {
                                        startCamera();
                                    }
                                }}
                                startIcon={isCameraActive ? <VideocamOffIcon /> : <VideocamIcon />}
                                sx={{
                                    backgroundColor: !isCameraActive ? '#d06c38' : undefined,
                                    '&:hover': {
                                        backgroundColor: !isCameraActive ? '#b65c2e' : undefined
                                    }
                                }}
                            >
                                {isCameraActive ? 'Pause' : 'Start Camera'}
                            </Button>
                        </Box>
                    </Box>

                    {/* Scanner Video Viewport */}
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        height: { xs: '260px', sm: '320px', md: '360px' },
                        backgroundColor: '#050c14',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #0b5299'
                    }}>
                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: isCameraActive ? 'block' : 'none'
                            }}
                            autoPlay
                            playsInline
                            muted
                        />

                        {/* Camera Paused Overlay */}
                        {!isCameraActive && (
                            <Box sx={{ textAlign: 'center', color: '#fff', p: 2 }}>
                                <VideocamOffIcon sx={{ fontSize: 54, color: '#888', mb: 1 }} />
                                <Typography variant="body1" sx={{ color: '#ccc', fontWeight: 600 }}>
                                    Camera is Paused
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
                                    Click "Start Camera" above or type token code below
                                </Typography>
                            </Box>
                        )}

                        {/* Live Target Overlay & Laser Animation */}
                        {isCameraActive && (
                            <>
                                {/* Scan Frame Guidelines */}
                                <Box sx={{
                                    position: 'absolute',
                                    width: '240px',
                                    height: '240px',
                                    border: '2px solid rgba(208, 108, 56, 0.7)',
                                    borderRadius: 2,
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                                    pointerEvents: 'none'
                                }}>
                                    {/* Corner brackets */}
                                    <Box sx={{ position: 'absolute', top: -3, left: -3, width: 20, height: 20, borderTop: '4px solid #d06c38', borderLeft: '4px solid #d06c38' }} />
                                    <Box sx={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderTop: '4px solid #d06c38', borderRight: '4px solid #d06c38' }} />
                                    <Box sx={{ position: 'absolute', bottom: -3, left: -3, width: 20, height: 20, borderBottom: '4px solid #d06c38', borderLeft: '4px solid #d06c38' }} />
                                    <Box sx={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderBottom: '4px solid #d06c38', borderRight: '4px solid #d06c38' }} />

                                    {/* Animated Laser Bar */}
                                    <Box sx={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        backgroundColor: '#d06c38',
                                        boxShadow: '0 0 8px 2px #d06c38',
                                        animation: 'scanLaser 2s infinite ease-in-out',
                                        '@keyframes scanLaser': {
                                            '0%': { top: '5%' },
                                            '50%': { top: '95%' },
                                            '100%': { top: '5%' }
                                        }
                                    }} />
                                </Box>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 12,
                                        color: '#ffffff',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontWeight: 500
                                    }}
                                >
                                    Align QR Code within the frame
                                </Typography>

                                {/* Floating Torch Button (Mobile / Fast Access) */}
                                {torchSupported && (
                                    <Tooltip title={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}>
                                        <IconButton
                                            onClick={toggleTorch}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                backgroundColor: isTorchOn ? '#d06c38' : 'rgba(0,0,0,0.5)',
                                                color: '#ffffff',
                                                zIndex: 6,
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                '&:hover': {
                                                    backgroundColor: isTorchOn ? '#b65c2e' : 'rgba(0,0,0,0.7)'
                                                }
                                            }}
                                        >
                                            {isTorchOn ? <FlashOnIcon fontSize="small" /> : <FlashOffIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                zIndex: 10
                            }}>
                                <CircularProgress size={44} sx={{ color: '#d06c38', mb: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Validating Token...</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Camera Error Message */}
                    {cameraPermissionError && (
                        <Alert
                            severity="warning"
                            action={
                                <Button color="inherit" size="small" onClick={() => startCamera()}>
                                    Retry
                                </Button>
                            }
                            sx={{ mt: 2 }}
                        >
                            {cameraPermissionError}
                        </Alert>
                    )}

                    {/* Manual Input for Barcode Gun or Typing */}
                    <Box sx={{ mt: 2.5 }}>
                        <form onSubmit={handleManualSubmit}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Enter or scan token code (e.g. 7W36FS9GCB)"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    slotProps={{
                                        htmlInput: {
                                            style: {
                                                textTransform: 'uppercase',
                                                fontFamily: 'monospace',
                                                fontWeight: 700,
                                                letterSpacing: '1px'
                                            }
                                        }
                                    }}
                                    sx={{
                                        '& input': {
                                            textTransform: 'uppercase',
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            letterSpacing: '1px'
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!manualCode.trim() || isProcessing}
                                    sx={{
                                        backgroundColor: '#0b5299',
                                        minWidth: '110px',
                                        fontWeight: 600,
                                        '&:hover': { backgroundColor: '#093e74' }
                                    }}
                                >
                                    Verify
                                </Button>
                            </Box>
                        </form>
                    </Box>

                    {/* Scan Result & Meal Details (Appears right here when a token is scanned) */}
                    {lastScanResult && (
                        <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Big Status Banner */}
                            {lastScanResult.status === 'REDEEMED_NOW' && (
                                <Box sx={{
                                    backgroundColor: '#e8f5e9',
                                    border: '2px solid #4caf50',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center'
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 44, color: '#2e7d32', mb: 0.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#2e7d32', letterSpacing: 0.5 }}>
                                        MEAL SERVED - REDEEMED!
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#1b5e20', fontWeight: 600 }}>
                                        Token successfully accepted
                                    </Typography>
                                </Box>
                            )}

                            {lastScanResult.status === 'ISSUED' && (
                                <Box sx={{
                                    backgroundColor: '#e3f2fd',
                                    border: '2px solid #2196f3',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center'
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 44, color: '#1976d2', mb: 0.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1565c0' }}>
                                        TOKEN VALID
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#0d47a1', fontWeight: 600 }}>
                                        Eligible for redemption
                                    </Typography>
                                </Box>
                            )}

                            {lastScanResult.status === 'ALREADY_REDEEMED' && (
                                <Box sx={{
                                    backgroundColor: '#ffebee',
                                    border: '2px solid #f44336',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center'
                                }}>
                                    <WarningAmberIcon sx={{ fontSize: 44, color: '#d32f2f', mb: 0.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#c62828' }}>
                                        ALREADY REDEEMED!
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 600, mt: 0.5 }}>
                                        {lastScanResult.message}
                                    </Typography>
                                </Box>
                            )}

                            {(lastScanResult.status === 'CANCELLED' || lastScanResult.status === 'INVALID' || lastScanResult.status === 'NOT_FOUND' || lastScanResult.status === 'ERROR') && (
                                <Box sx={{
                                    backgroundColor: '#fff3e0',
                                    border: '2px solid #ff9800',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center'
                                }}>
                                    <ErrorOutlineIcon sx={{ fontSize: 44, color: '#e65100', mb: 0.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#e65100' }}>
                                        {lastScanResult.status === 'CANCELLED' ? 'TOKEN CANCELLED' : 'INVALID TOKEN'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#bf360c', fontWeight: 600, mt: 0.5 }}>
                                        {lastScanResult.message}
                                    </Typography>
                                </Box>
                            )}

                            {/* Token Details Card */}
                            {lastScanResult.token && (
                                <Box sx={{
                                    backgroundColor: '#fbfbfd',
                                    borderRadius: 2,
                                    p: 2,
                                    border: '1px solid #eef0f3',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5
                                }}>
                                    {/* Code & Meal Badge */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ color: '#777', fontWeight: 600 }}>TOKEN CODE</Typography>
                                        <Chip
                                            label={lastScanResult.token.code}
                                            size="small"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 900,
                                                fontSize: '0.9rem',
                                                letterSpacing: 1.5,
                                                backgroundColor: '#0b5299',
                                                color: '#fff'
                                            }}
                                        />
                                    </Box>

                                    <Divider />

                                    {/* Participant Name & Role */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <PersonIcon sx={{ color: '#d06c38' }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#222' }}>
                                                {lastScanResult.token.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                                                {lastScanResult.token.personType} {lastScanResult.token.identifier ? `• ${lastScanResult.token.identifier}` : ''}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* University / College */}
                                    {lastScanResult.token.teamOrSport && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <SchoolIcon sx={{ color: '#0b5299' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#444' }}>
                                                {lastScanResult.token.teamOrSport}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Meal & Date */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <RestaurantIcon sx={{ color: '#d06c38' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0b5299' }}>
                                            {lastScanResult.token.mealType} • {lastScanResult.token.mealDate}
                                        </Typography>
                                    </Box>

                                    {/* Hostel Accommodation */}
                                    {(lastScanResult.token.block || lastScanResult.token.room) && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <MeetingRoomIcon sx={{ color: '#666' }} />
                                            <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>
                                                Hostel: {lastScanResult.token.block || 'N/A'} - Room: {lastScanResult.token.room || 'N/A'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Redemption Info if already redeemed */}
                                    {lastScanResult.token.redeemedAt && (
                                        <Box sx={{
                                            mt: 0.5,
                                            p: 1,
                                            borderRadius: 1,
                                            backgroundColor: '#fff3e0',
                                            border: '1px solid #ffe0b2'
                                        }}>
                                            <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600, display: 'block' }}>
                                                Redeemed at: {new Date(lastScanResult.token.redeemedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                            </Typography>
                                            {lastScanResult.token.redeemedBy && (
                                                <Typography variant="caption" sx={{ color: '#bf360c' }}>
                                                    Redeemed by: {lastScanResult.token.redeemedBy}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Clear / Scan Next Button */}
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setLastScanResult(null)}
                                startIcon={<RestartAltIcon />}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Scan Next Token
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Session Scans History Table */}
            <Card sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b5299' }}>
                            Recent Scans in This Session ({sessionHistory.length})
                        </Typography>
                        {sessionHistory.length > 0 && (
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => setSessionHistory([])}
                            >
                                Clear History
                            </Button>
                        )}
                    </Box>

                    {sessionHistory.length === 0 ? (
                        <Typography variant="body2" sx={{ color: '#999', py: 2, textAlign: 'center' }}>
                            No scans in this session yet. Scanned tokens will appear here.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Token Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Participant Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Meal</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sessionHistory.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell sx={{ fontSize: '0.8rem', color: '#666' }}>{item.time}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{item.code}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                            <TableCell>{item.mealType}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{item.mealDate}</TableCell>
                                            <TableCell>
                                                {item.status === 'REDEEMED_NOW' || item.status === 'REDEEMED' ? (
                                                    <Chip label="Redeemed" size="small" color="success" sx={{ fontWeight: 700 }} />
                                                ) : item.status === 'ALREADY_REDEEMED' ? (
                                                    <Chip label="Already Used" size="small" color="error" sx={{ fontWeight: 700 }} />
                                                ) : item.status === 'CANCELLED' ? (
                                                    <Chip label="Cancelled" size="small" color="warning" sx={{ fontWeight: 700 }} />
                                                ) : (
                                                    <Chip label={item.status} size="small" color="default" sx={{ fontWeight: 700 }} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default QRScanner;
