import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, Paper,
    CircularProgress, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'sonner';
import { liveBoardAPI } from '../../utils/api';
import { AnimatedText, AnimatedCard } from '../animations';
import ResponsiveLiveBoardIframe from '../Common/ResponsiveLiveBoardIframe';

const ManageLiveBoard = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [formData, setFormData] = useState({
        title: 'South Zone Inter-University Chess Championship - Live Board',
        currentRound: 'Round 1',
        status: 'LIVE',
        announcement: 'Tournament live board is active. Follow the top boards in real-time!',
        embedUrl: 'https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0',
        externalLink: 'https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0',
        streamUrl: '',
        matches: []
    });

    const fetchLiveBoard = async () => {
        try {
            setLoading(true);
            const res = await liveBoardAPI.get();
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title || 'South Zone Inter-University Chess Championship - Live Board',
                    currentRound: data.currentRound || 'Round 1',
                    status: data.status || 'LIVE',
                    announcement: data.announcement || 'Tournament live board is active. Follow the top boards in real-time!',
                    embedUrl: data.embedUrl || 'https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0',
                    externalLink: data.externalLink || 'https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0',
                    streamUrl: data.streamUrl || '',
                    matches: data.matches || []
                });
            }
        } catch (error) {
            console.error('Error fetching live board:', error);
            toast.error('Failed to load live board data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveBoard();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await liveBoardAPI.update(formData);
            if (res.ok) {
                toast.success('Live board settings saved successfully!');
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.message || 'Failed to save live board');
            }
        } catch (error) {
            console.error('Error saving live board:', error);
            toast.error('Error saving live board');
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
        <Box sx={{ width: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <AnimatedText direction="down" duration={0.45}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <LiveTvIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                        <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                            Manage Live Board
                        </Typography>
                    </Box>
                </AnimatedText>
                <AnimatedText delay={0.08} duration={0.4}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Configure the official Chess-Results tournament live broadcast embed link and pairings page URL.
                    </Typography>
                </AnimatedText>
            </Box>

            <form onSubmit={handleSave}>
                <AnimatedCard delay={0.06}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mb: 3,
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                    >
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
                                Live Chess-Results Configuration
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '13px' }}>
                                Manage the live tournament broadcast and pairings link displayed on the home page.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2 }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.8, fontSize: '13px' }}>
                                    Live Board Embed URL (Chess-Results.com) *
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="embedUrl"
                                    value={formData.embedUrl}
                                    onChange={handleChange}
                                    required
                                    placeholder="https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0"
                                    helperText="Paste the Chess-Results URL to embed live standings and pairings into the home page."
                                    sx={{
                                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                        '& .MuiFormHelperText-root': { fontSize: '12px', color: '#64748b', mt: 0.8 }
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.8, fontSize: '13px' }}>
                                    External Full Screen / Pairings Link
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="externalLink"
                                    value={formData.externalLink}
                                    onChange={handleChange}
                                    placeholder="https://s1.chess-results.com/tnr1522420.aspx?lan=1&SNode=S0"
                                    helperText="Link used when users click 'Open in Full Screen / New Tab' on the home page live board."
                                    sx={{
                                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                        '& .MuiFormHelperText-root': { fontSize: '12px', color: '#64748b', mt: 0.8 }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Live Video Streaming URL Field */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.8, fontSize: '13px' }}>
                                Live Video Streaming Embed URL (YouTube / Stream URL)
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                name="streamUrl"
                                value={formData.streamUrl}
                                onChange={handleChange}
                                placeholder="e.g. https://www.youtube.com/watch?v=... or https://www.youtube.com/embed/..."
                                helperText="Enter a YouTube live stream or video link. When viewers on the home page click the 'Live Streaming' button, this live broadcast is displayed."
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                    '& .MuiFormHelperText-root': { fontSize: '12px', color: '#64748b', mt: 0.8 }
                                }}
                            />
                        </Box>

                        {/* Live Embed Preview */}
                        {formData.embedUrl && (
                            <Box sx={{ mt: 3, p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#0b5299', fontSize: '13px', mb: 1.5 }}>
                                    Live Embed Preview (Interactive View)
                                </Typography>
                                <ResponsiveLiveBoardIframe
                                    url={formData.embedUrl}
                                    streamUrl={formData.streamUrl}
                                    title="Live Board Embed Preview"
                                    externalLink={formData.externalLink || formData.embedUrl}
                                    height={{ xs: '450px', sm: '550px', md: '650px' }}
                                />
                            </Box>
                        )}

                        {/* Save Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                sx={{
                                    bgcolor: '#0b5299',
                                    px: 3.5,
                                    height: '42px',
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#083d73', boxShadow: 'none' }
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Live Board Links'}
                            </Button>
                        </Box>
                    </Paper>
                </AnimatedCard>
            </form>
        </Box>
    );
};

export default ManageLiveBoard;
