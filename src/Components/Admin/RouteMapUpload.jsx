import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Paper, CircularProgress,
    IconButton, Alert, Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { toast } from 'sonner';
import { routeMapAPI, SOCKET_URL } from '../../utils/api';

const RouteMapUpload = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [newImageBase64, setNewImageBase64] = useState('');
    const [formData, setFormData] = useState({
        title: 'Aditya University Campus Route Map',
        description: 'Directions and travel routes to Aditya University, Surampalem.',
        directions: '• Nearest Railway Station: Samalkot Junction (15 km) - Auto & Bus connectivity available.\n• Nearest Airport: Rajahmundry Airport (60 km).\n• Major Bus Stops: Frequent university and APSRTC buses run from Kakinada (35 km) and Rajahmundry (50 km).\n• Campus Location: ADB Road, Aditya Nagar, Surampalem, Andhra Pradesh 533437.',
        mapImage: ''
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
                    directions: data.directions || '',
                    mapImage: data.mapImage || ''
                });
                if (data.mapImage) {
                    setPreviewUrl(resolveImgUrl(data.mapImage));
                }
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

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, WEBP)');
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error('Image size must be below 8MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setNewImageBase64(base64);
            setPreviewUrl(base64);
            toast.success('Image selected! Click "Save Route Map" to update.');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = async () => {
        if (newImageBase64) {
            setNewImageBase64('');
            setPreviewUrl(resolveImgUrl(formData.mapImage));
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.info('Selected image cleared.');
            return;
        }

        if (!window.confirm('Are you sure you want to remove the current route map image?')) return;

        try {
            setSaving(true);
            const res = await routeMapAPI.deleteImage();
            if (res.ok) {
                setFormData(prev => ({ ...prev, mapImage: '' }));
                setPreviewUrl('');
                setNewImageBase64('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                toast.success('Route map image deleted successfully');
            } else {
                toast.error('Failed to delete route map image');
            }
        } catch (err) {
            console.error('Error deleting image:', err);
            toast.error('Error deleting image');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                title: formData.title,
                description: formData.description,
                directions: formData.directions,
                ...(newImageBase64 ? { imageBase64: newImageBase64 } : {})
            };

            const res = await routeMapAPI.update(payload);
            if (res.ok) {
                const data = await res.json();
                toast.success('Route map updated successfully!');
                setNewImageBase64('');
                if (data.routeMap?.mapImage) {
                    setFormData(prev => ({ ...prev, mapImage: data.routeMap.mapImage }));
                    setPreviewUrl(resolveImgUrl(data.routeMap.mapImage));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.message || 'Failed to update route map');
            }
        } catch (err) {
            console.error('Error saving route map:', err);
            toast.error('Failed to save route map');
        } finally {
            setSaving(false);
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
                    Upload and manage the university campus route map, transit directions, and landmarks displayed under the public Route Map tab.
                </Typography>
            </Box>

            <form onSubmit={handleSave}>
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 2 }}>
                        Route Map Information
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

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 1 }}>
                        Route Map Image
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                        Upload a clear campus route map or layout plan (supports PNG, JPG, WEBP).
                    </Typography>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {previewUrl ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: '100%',
                                    maxWidth: { xs: '100%', sm: '480px', md: '540px' },
                                    maxHeight: '340px',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '2px solid #e2e8f0',
                                    boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    bgcolor: '#f8fafc',
                                    p: 1
                                }}
                            >
                                <Box
                                    component="img"
                                    src={previewUrl}
                                    alt="Route Map Preview"
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '320px',
                                        width: 'auto',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        borderRadius: 1.5
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={saving}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    Change Image
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleRemoveImage}
                                    disabled={saving}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    {newImageBase64 ? 'Discard New Image' : 'Delete Map Image'}
                                </Button>
                                <Button
                                    size="small"
                                    component="a"
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<OpenInNewIcon fontSize="small" />}
                                    sx={{ textTransform: 'none', color: '#0b5299' }}
                                >
                                    View Full Size
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: 3,
                                p: 5,
                                cursor: 'pointer',
                                textAlign: 'center',
                                bgcolor: '#f8fafc',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#0b5299',
                                    bgcolor: 'rgba(11,82,153,0.03)'
                                }
                            }}
                        >
                            <Box sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: '#e2e8f0',
                                color: '#0b5299',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 1.5
                            }}>
                                <CloudUploadIcon sx={{ fontSize: 36 }} />
                            </Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                Click to upload Route Map image
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                PNG, JPG, or WEBP (Max 8MB)
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* Save Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                        {saving ? 'Saving...' : 'Save Route Map'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default RouteMapUpload;
