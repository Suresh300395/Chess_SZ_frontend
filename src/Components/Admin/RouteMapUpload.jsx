import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Paper, CircularProgress,
    IconButton, Divider, Chip, Tooltip, Dialog, DialogContent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'sonner';
import { routeMapAPI, SOCKET_URL } from '../../utils/api';

const RouteMapUpload = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadProgressText, setUploadProgressText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [images, setImages] = useState([]); // Array of { id, url, path }
    const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
    const [formData, setFormData] = useState({
        title: 'Aditya University Campus Route Map',
        description: 'Directions and travel routes to Aditya University, Surampalem.',
        directions: '• Nearest Railway Station: Samalkot Junction (15 km) - Auto & Bus connectivity available.\n• Nearest Airport: Rajahmundry Airport (60 km).\n• Major Bus Stops: Frequent university and APSRTC buses run from Kakinada (35 km) and Rajahmundry (50 km).\n• Campus Location: ADB Road, Aditya Nagar, Surampalem, Andhra Pradesh 533437.'
    });

    const fileInputRef = useRef(null);

    const resolveImgUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
        return `${SOCKET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const fetchRouteMap = async () => {
        try {
            setLoading(true);
            const res = await routeMapAPI.get();
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title || 'Aditya University Campus Route Map',
                    description: data.description || '',
                    directions: data.directions || ''
                });

                let rawList = [];
                if (Array.isArray(data.mapImages)) {
                    rawList = data.mapImages;
                }

                setImages(rawList.map((path, idx) => ({
                    id: `server-${idx}-${Date.now()}`,
                    url: resolveImgUrl(path),
                    path: path
                })));
            }
        } catch (error) {
            console.error('Error fetching route map:', error);
            toast.error('Failed to load route map data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRouteMap();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Process and immediately auto-save multiple files in a single batch
     */
    const processAndUploadFiles = async (fileList) => {
        if (!fileList || fileList.length === 0) return;

        const validFiles = [];
        for (const file of fileList) {
            if (!file.type.startsWith('image/')) {
                toast.error(`"${file.name}" is not an image file (PNG, JPG, WEBP)`);
                continue;
            }
            if (file.size > 12 * 1024 * 1024) {
                toast.error(`"${file.name}" exceeds 12MB limit`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        try {
            setSaving(true);
            setUploadProgressText(`Uploading & saving ${validFiles.length} image(s)...`);

            // Read all files as base64 in parallel
            const base64List = await Promise.all(
                validFiles.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(file);
                }))
            );

            // Combine existing image paths with new base64 items
            const currentSavedPaths = images.map(item => item.path || item.url);
            const combinedImages = [...currentSavedPaths, ...base64List];

            // AUTO-SAVE directly to backend! No need to click "Save" afterwards!
            const res = await routeMapAPI.update({
                title: formData.title,
                description: formData.description,
                directions: formData.directions,
                images: combinedImages
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Successfully uploaded and saved ${validFiles.length} map image(s)!`);
                if (data.routeMap) {
                    const rawList = Array.isArray(data.routeMap?.mapImages) ? data.routeMap.mapImages : [];

                    setImages(rawList.map((path, idx) => ({
                        id: `server-${idx}-${Date.now()}`,
                        url: resolveImgUrl(path),
                        path: path
                    })));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.message || 'Failed to upload images');
            }
        } catch (err) {
            console.error('Error auto-uploading images:', err);
            toast.error('Failed to process and upload images');
        } finally {
            setSaving(false);
            setUploadProgressText('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFilesChange = (e) => {
        const fileList = Array.from(e.target.files || []);
        processAndUploadFiles(fileList);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        processAndUploadFiles(files);
    };

    const handleRemoveImage = async (indexToRemove) => {
        if (!window.confirm('Are you sure you want to delete this map image?')) return;
        const remainingImages = images.filter((_, idx) => idx !== indexToRemove);
        setImages(remainingImages);

        try {
            setSaving(true);
            setUploadProgressText('Deleting map image...');
            const res = await routeMapAPI.update({
                title: formData.title,
                description: formData.description,
                directions: formData.directions,
                images: remainingImages.map(img => img.path || img.url)
            });
            if (res.ok) {
                toast.success('Map image deleted and saved.');
            }
        } catch (err) {
            console.error('Error deleting image:', err);
            toast.error('Failed to save deletion');
        } finally {
            setSaving(false);
            setUploadProgressText('');
        }
    };

    const handleMoveImage = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= images.length) return;
        const copy = [...images];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        setImages(copy);

        try {
            await routeMapAPI.update({
                title: formData.title,
                description: formData.description,
                directions: formData.directions,
                images: copy.map(img => img.path || img.url)
            });
            toast.success('Map order updated and saved.');
        } catch (err) {
            console.error('Error reordering images:', err);
            toast.error('Failed to save updated order');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to remove ALL route map images?')) return;
        try {
            setSaving(true);
            setUploadProgressText('Clearing all map images...');
            const res = await routeMapAPI.deleteImage();
            if (res.ok) {
                setImages([]);
                toast.success('All map images deleted.');
            }
        } catch (err) {
            console.error('Error clearing images:', err);
            toast.error('Failed to clear images');
        } finally {
            setSaving(false);
            setUploadProgressText('');
        }
    };

    // Save title, description, and transit directions text
    const handleSaveInfo = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setUploadProgressText('Saving information...');
            const payload = {
                title: formData.title,
                description: formData.description,
                directions: formData.directions,
                images: images.map(item => item.path || item.url)
            };

            const res = await routeMapAPI.update(payload);
            if (res.ok) {
                toast.success('Route map details saved successfully!');
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.message || 'Failed to update route map info');
            }
        } catch (err) {
            console.error('Error saving route map info:', err);
            toast.error('Failed to save route map details');
        } finally {
            setSaving(false);
            setUploadProgressText('');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#0b5299' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: '1100px', mx: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <MapIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 32 } }} />
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#0b5299', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2rem' } }}>
                        Route Map Upload
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Upload multiple campus layout plans, transit directions, and stadium venue maps. Selected images automatically upload and save immediately.
                </Typography>
            </Box>

            <form onSubmit={handleSaveInfo}>
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    {/* Header bar of images section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                Route Map Images ({images.length})
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Select 2 or more files at once (or drag and drop them). They will auto-upload and save immediately!
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={saving}
                                sx={{
                                    bgcolor: '#0b5299',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    '&:hover': { bgcolor: '#083d73' }
                                }}
                            >
                                {saving ? (uploadProgressText || 'Uploading...') : 'Add Map Images'}
                            </Button>
                            {images.length > 0 && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleClearAll}
                                    disabled={saving}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Hidden multi-file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFilesChange}
                    />

                    {/* Active Uploading Status Banner */}
                    {saving && uploadProgressText && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8'
                        }}>
                            <CircularProgress size={18} sx={{ color: '#1d4ed8' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {uploadProgressText}
                            </Typography>
                        </Box>
                    )}

                    {/* Drag and Drop Zone & Grid */}
                    <Box
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        sx={{
                            borderRadius: 3,
                            p: isDragging ? 1.5 : 0,
                            border: isDragging ? '2px dashed #0b5299' : 'none',
                            bgcolor: isDragging ? 'rgba(11,82,153,0.04)' : 'transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {images.length > 0 ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: 'repeat(3, 1fr)'
                                    },
                                    gap: 2.5,
                                    mt: 1
                                }}
                            >
                                {images.map((item, index) => (
                                    <Paper
                                        key={item.id || index}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 3,
                                            border: '1.5px solid #e2e8f0',
                                            bgcolor: '#ffffff',
                                            boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: '0 8px 24px rgba(11,82,153,0.12)',
                                                borderColor: '#0b5299'
                                            }
                                        }}
                                    >
                                        {/* Card Header with Badges & Reorder Controls */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Chip
                                                label={index === 0 ? 'Map 1 (Primary)' : `Map ${index + 1}`}
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    bgcolor: index === 0 ? '#eff6ff' : '#f1f5f9',
                                                    color: index === 0 ? '#1d4ed8' : '#475569',
                                                    border: index === 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                                                }}
                                            />

                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Tooltip title="Move Earlier">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMoveImage(index, -1)}
                                                            disabled={index === 0 || saving}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            <ArrowBackIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Move Later">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleMoveImage(index, 1)}
                                                            disabled={index === images.length - 1 || saving}
                                                            sx={{ p: 0.5 }}
                                                        >
                                                            <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Delete Map">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveImage(index)}
                                                        disabled={saving}
                                                        sx={{ p: 0.5, ml: 0.5 }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        {/* Image Preview Area */}
                                        <Box
                                            onClick={() => setActiveLightboxIndex(index)}
                                            sx={{
                                                width: '100%',
                                                height: 180,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                bgcolor: '#f8fafc',
                                                border: '1px solid #f1f5f9',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                '&:hover .zoom-overlay': { opacity: 1 }
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={item.url}
                                                alt={`Map ${index + 1}`}
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                            <Box
                                                className="zoom-overlay"
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    bgcolor: 'rgba(0,0,0,0.35)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease',
                                                    color: '#ffffff'
                                                }}
                                            >
                                                <ZoomInIcon sx={{ fontSize: 32 }} />
                                            </Box>
                                        </Box>

                                        {/* Card Footer Actions */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                            <Button
                                                size="small"
                                                startIcon={<ZoomInIcon />}
                                                onClick={() => setActiveLightboxIndex(index)}
                                                sx={{ textTransform: 'none', fontSize: 12, color: '#0b5299', fontWeight: 600 }}
                                            >
                                                View Full Size
                                            </Button>
                                            <Button
                                                size="small"
                                                component="a"
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                startIcon={<OpenInNewIcon fontSize="small" />}
                                                sx={{ textTransform: 'none', fontSize: 12, color: '#64748b' }}
                                            >
                                                Open
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))}

                                {/* Add More Maps Tile with Multi-Drop */}
                                <Paper
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        border: '2px dashed #0b5299',
                                        bgcolor: '#f8fafc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        minHeight: 240,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: 'rgba(11,82,153,0.05)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: '50%',
                                            bgcolor: '#e2e8f0',
                                            color: '#0b5299',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 1.5
                                        }}
                                    >
                                        <AddPhotoAlternateIcon sx={{ fontSize: 30 }} />
                                    </Box>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                        + Add More Maps
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', mt: 0.5 }}>
                                        Select 2 or more files (auto-saves instantly)
                                    </Typography>
                                </Paper>
                            </Box>
                        ) : (
                            /* Large empty dropzone */
                            <Box
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: 3,
                                    p: 5,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    bgcolor: '#f8fafc',
                                    mt: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#0b5299',
                                        bgcolor: 'rgba(11,82,153,0.03)'
                                    }
                                }}
                            >
                                <Box sx={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: '50%',
                                    bgcolor: '#e2e8f0',
                                    color: '#0b5299',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 1.5
                                }}>
                                    <CloudUploadIcon sx={{ fontSize: 38 }} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                    Click or Drag & Drop multiple Route Map images here
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                    Select 2 or more files at once. All images upload and save automatically!
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Route Map Text Information */}
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 2 }}>
                        Route Map Details & Transit Directions
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Short Summary"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g. Directions and travel routes to Aditya University, Surampalem."
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Travel Directions & Key Transit Info"
                            name="directions"
                            value={formData.directions}
                            onChange={handleChange}
                            placeholder="Detail nearest stations, airport, highway routes, and bus connectivity..."
                            helperText="Provide step-by-step directions for visiting teams, players, and officials."
                        />
                    </Box>

                    {/* Save Details Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#0b5299',
                                px: 4,
                                py: 1.2,
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '15px',
                                boxShadow: '0 4px 14px rgba(11,82,153,0.3)',
                                '&:hover': { bgcolor: '#083d73' }
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Details'}
                        </Button>
                    </Box>
                </Paper>
            </form>

            {/* Lightbox Dialog to preview any map full size */}
            <Dialog
                open={activeLightboxIndex !== null}
                onClose={() => setActiveLightboxIndex(null)}
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
                {activeLightboxIndex !== null && images[activeLightboxIndex] && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#0b5299' }}>
                                    Map {activeLightboxIndex + 1} of {images.length}
                                </Typography>
                                <Chip
                                    label={activeLightboxIndex === 0 ? 'Primary Map' : `Image #${activeLightboxIndex + 1}`}
                                    size="small"
                                    sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                                />
                            </Box>
                            <IconButton onClick={() => setActiveLightboxIndex(null)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <DialogContent sx={{ p: 1, textAlign: 'center', position: 'relative' }}>
                            <Box
                                component="img"
                                src={images[activeLightboxIndex].url}
                                alt={`Route Map ${activeLightboxIndex + 1}`}
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '80vh',
                                    objectFit: 'contain',
                                    borderRadius: 2
                                }}
                            />

                            {/* Previous / Next Navigation Arrows inside Lightbox */}
                            {images.length > 1 && (
                                <>
                                    <IconButton
                                        onClick={() => setActiveLightboxIndex(i => (i - 1 + images.length) % images.length)}
                                        sx={{
                                            position: 'absolute',
                                            left: 16,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: 'rgba(255,255,255,0.85)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            '&:hover': { bgcolor: '#ffffff' }
                                        }}
                                    >
                                        <ArrowBackIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setActiveLightboxIndex(i => (i + 1) % images.length)}
                                        sx={{
                                            position: 'absolute',
                                            right: 16,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: 'rgba(255,255,255,0.85)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            '&:hover': { bgcolor: '#ffffff' }
                                        }}
                                    >
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default RouteMapUpload;
