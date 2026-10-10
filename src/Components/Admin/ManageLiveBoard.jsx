import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, Paper, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { toast } from 'sonner';
import { liveBoardAPI } from '../../utils/api';

const ManageLiveBoard = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: 'South Zone Inter-University Chess Championship - Live Board',
        currentRound: 'Round 1',
        status: 'LIVE',
        announcement: 'Tournament live board is active. Follow the top boards in real-time!',
        embedUrl: '',
        externalLink: '',
        matches: []
    });

    const fetchLiveBoard = async () => {
        try {
            setLoading(true);
            const res = await liveBoardAPI.get();
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title || '',
                    currentRound: data.currentRound || 'Round 1',
                    status: data.status || 'LIVE',
                    announcement: data.announcement || '',
                    embedUrl: data.embedUrl || '',
                    externalLink: data.externalLink || '',
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

    const handleAddMatch = () => {
        const nextBoardNum = String((formData.matches?.length || 0) + 1);
        setFormData(prev => ({
            ...prev,
            matches: [
                ...(prev.matches || []),
                {
                    boardNumber: nextBoardNum,
                    whitePlayer: '',
                    whiteUniversity: '',
                    blackPlayer: '',
                    blackUniversity: '',
                    result: '*'
                }
            ]
        }));
    };

    const handleMatchChange = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.matches];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, matches: updated };
        });
    };

    const handleRemoveMatch = (index) => {
        setFormData(prev => ({
            ...prev,
            matches: prev.matches.filter((_, i) => i !== index)
        }));
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
        <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <LiveTvIcon sx={{ color: '#0b5299', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#0b5299', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                        Manage Live Board
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Configure the live chess match broadcast, embed links, live announcements, and top board pairings displayed on the public home page.
                </Typography>
            </Box>

            <form onSubmit={handleSave}>
                {/* General Settings Card */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a', mb: 2 }}>
                        Live Broadcast Settings
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Board Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Current Round"
                            name="currentRound"
                            value={formData.currentRound}
                            onChange={handleChange}
                            placeholder="e.g. Round 1"
                        />
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <MenuItem value="LIVE">🟢 LIVE</MenuItem>
                            <MenuItem value="UPCOMING">🟡 UPCOMING</MenuItem>
                            <MenuItem value="PAUSED">🟠 PAUSED</MenuItem>
                            <MenuItem value="COMPLETED">🔵 COMPLETED</MenuItem>
                        </TextField>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Announcement / Ticker Message"
                            name="announcement"
                            value={formData.announcement}
                            onChange={handleChange}
                            placeholder="Live games in progress. Follow the top boards in real-time!"
                            helperText="This message is highlighted as a live status banner on the home page."
                        />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Live Board Embed URL (Lichess / Chess.com / YouTube)"
                            name="embedUrl"
                            value={formData.embedUrl}
                            onChange={handleChange}
                            placeholder="e.g. https://lichess.org/broadcast/... or https://www.youtube.com/embed/..."
                            helperText="Paste an embeddable broadcast link or video stream URL to display a live board directly on the home page."
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="External Pairings / Chess-Results Link"
                            name="externalLink"
                            value={formData.externalLink}
                            onChange={handleChange}
                            placeholder="e.g. https://chess-results.com/tnr..."
                            helperText="Optional link to full pairings and standings sheet for players and coaches."
                        />
                    </Box>

                    {formData.embedUrl && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: '#0b5299' }}>
                                    Embed Preview
                                </Typography>
                                <Button
                                    size="small"
                                    component="a"
                                    href={formData.embedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<OpenInNewIcon fontSize="small" />}
                                    sx={{ textTransform: 'none', fontSize: '11px' }}
                                >
                                    Open Link
                                </Button>
                            </Box>
                            <Box sx={{ width: '100%', height: '320px', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                                <iframe
                                    src={formData.embedUrl}
                                    title="Live Board Embed Preview"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowFullScreen
                                />
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Top Matches / Pairings Scoreboard */}
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>
                                Top Board Matches & Results
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Display live board match pairings, university names, and results.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAddMatch}
                            sx={{
                                textTransform: 'none',
                                borderColor: '#0b5299',
                                color: '#0b5299',
                                borderRadius: 2,
                                fontWeight: 600,
                                alignSelf: { xs: 'flex-start', sm: 'center' }
                            }}
                        >
                            Add Match Board
                        </Button>
                    </Box>

                    {formData.matches.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No match boards added yet. Click <b>"Add Match Board"</b> above to show board-by-board pairings on the home page, or rely on the Embed URL.
                        </Alert>
                    ) : (
                        <TableContainer sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflowX: 'auto', width: '100%' }}>
                            <Table size="small" sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', width: '90px' }}>Board #</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>White Player (Name & University)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '130px', textAlign: 'center' }}>Result</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Black Player (Name & University)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '60px', textAlign: 'center' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.matches.map((match, index) => (
                                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={match.boardNumber}
                                                    onChange={(e) => handleMatchChange(index, 'boardNumber', e.target.value)}
                                                    sx={{ width: '70px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <TextField
                                                        size="small"
                                                        placeholder="White Player Name"
                                                        value={match.whitePlayer}
                                                        onChange={(e) => handleMatchChange(index, 'whitePlayer', e.target.value)}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        placeholder="University"
                                                        value={match.whiteUniversity}
                                                        onChange={(e) => handleMatchChange(index, 'whiteUniversity', e.target.value)}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <TextField
                                                    select
                                                    size="small"
                                                    value={match.result}
                                                    onChange={(e) => handleMatchChange(index, 'result', e.target.value)}
                                                    sx={{ width: '110px' }}
                                                >
                                                    <MenuItem value="*">Ongoing (*)</MenuItem>
                                                    <MenuItem value="1 - 0">1 - 0</MenuItem>
                                                    <MenuItem value="0 - 1">0 - 1</MenuItem>
                                                    <MenuItem value="½ - ½">½ - ½ (Draw)</MenuItem>
                                                    <MenuItem value="Upcoming">Upcoming</MenuItem>
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <TextField
                                                        size="small"
                                                        placeholder="Black Player Name"
                                                        value={match.blackPlayer}
                                                        onChange={(e) => handleMatchChange(index, 'blackPlayer', e.target.value)}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        placeholder="University"
                                                        value={match.blackUniversity}
                                                        onChange={(e) => handleMatchChange(index, 'blackUniversity', e.target.value)}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleRemoveMatch(index)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                        {saving ? 'Saving...' : 'Save Live Board'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default ManageLiveBoard;
