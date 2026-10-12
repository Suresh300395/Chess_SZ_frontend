import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, MenuItem, Grid, Card, CardContent, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import HotelIcon from '@mui/icons-material/Hotel';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import { toast } from 'sonner';

// Import centralized API base URL
import { API_BASE } from '../../utils/api';

const ManageBlocks = () => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', block: 'Boys Hostel', warden: '', wardenContact: '', officeHours: '', address: '', capacityPerRoom: 4, floorCount: 1, floors: [{ floorName: 'Ground Floor', roomCount: '', roomsString: '' }]
    });

    const fetchBlocks = async () => {
        try {
            const response = await fetch(`${API_BASE}/blocks`);
            if (!response.ok) throw new Error('Failed to fetch blocks');
            const data = await response.json();
            setBlocks(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'floorCount') {
            const count = parseInt(value, 10) || 0;
            const newFloors = Array.from({ length: count }, (_, i) => formData.floors[i] || { floorName: `Floor ${i + 1}`, roomCount: '', roomsString: '' });
            setFormData({ ...formData, floorCount: count, floors: newFloors });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFloorChange = (index, field, value) => {
        const updatedFloors = [...formData.floors];
        updatedFloors[index][field] = value;

        // Auto-generate room strings if count and start number are provided
        if (field === 'roomCount' && updatedFloors[index].roomsString === '') {
            // Wait for user to type rooms manually or implement auto-gen if needed.
            // But they asked for comma separated input, so we just update the field.
        }

        setFormData({ ...formData, floors: updatedFloors });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Process floors to split room strings into arrays
            const processedFloors = formData.floors.map(f => ({
                floorName: f.floorName,
                roomCount: parseInt(f.roomCount, 10) || 0,
                rooms: f.roomsString.split(',').map(r => r.trim()).filter(r => r)
            }));

            const payload = { ...formData, floors: processedFloors };

            const url = editId ? `${API_BASE}/blocks/${editId}` : `${API_BASE}/blocks`;
            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to save block');

            toast.success(`Block ${editId ? 'updated' : 'added'} successfully`);
            handleClose();
            fetchBlocks();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (b) => {
        setEditId(b._id);
        const floorsForState = (b.floors || []).map(f => ({
            floorName: f.floorName,
            roomCount: f.roomCount,
            roomsString: f.rooms ? f.rooms.join(', ') : ''
        }));

        setFormData({
            name: b.name,
            block: b.block || 'Boys Hostel',
            warden: b.warden || '',
            wardenContact: b.wardenContact || '',
            officeHours: b.officeHours || '',
            address: b.address || '',
            capacityPerRoom: b.capacityPerRoom || 4,
            floorCount: floorsForState.length > 0 ? floorsForState.length : 1,
            floors: floorsForState.length > 0 ? floorsForState : [{ floorName: 'Ground Floor', roomCount: '', roomsString: '' }]
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditId(null);
        setFormData({ name: '', block: 'Boys Hostel', warden: '', wardenContact: '', officeHours: '', address: '', capacityPerRoom: 4, floorCount: 1, floors: [{ floorName: 'Ground Floor', roomCount: '', roomsString: '' }] });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this block?')) return;
        try {
            const response = await fetch(`${API_BASE}/blocks/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete block');
            toast.success('Block deleted successfully');
            fetchBlocks();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Category,Block Name,Warden Name,Warden Contact,Office Hours,Address,Capacity Per Room,Floor Name,Rooms Count,Room Numbers (Use space after comma e.g. 101, 102)\n"
            + "Boys Hostel,Boys Hostel Block A,Vishnu,9143143143,06:00 AM - 10:00 PM,Surampalem,4,Ground Floor,5,\"101, 102, 103, 104, 105\"";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "hostel_blocks_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;

            // Basic CSV parser that respects quotes
            const rows = [];
            let row = [];
            let inQuotes = false;
            let currentValue = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(currentValue);
                    currentValue = '';
                } else if (char === '\n' && !inQuotes) {
                    row.push(currentValue);
                    rows.push(row);
                    row = [];
                    currentValue = '';
                } else if (char !== '\r') {
                    currentValue += char;
                }
            }
            if (currentValue || row.length > 0) {
                row.push(currentValue);
                rows.push(row);
            }

            if (rows.length < 2) {
                toast.error('CSV is empty or missing data rows');
                return;
            }

            const headers = rows[0].map(h => h.trim());
            const dataRows = rows.slice(1).filter(r => r.some(c => c.trim() !== ''));
            const blocksMap = {};

            for (const r of dataRows) {
                const getVal = (colName) => {
                    const idx = headers.indexOf(colName);
                    return idx !== -1 && r[idx] ? r[idx].trim() : '';
                };

                const blockName = getVal('Block Name');
                if (!blockName) continue;

                if (!blocksMap[blockName]) {
                    blocksMap[blockName] = {
                        name: blockName,
                        block: getVal('Category') || 'Boys Hostel',
                        warden: getVal('Warden Name'),
                        wardenContact: getVal('Warden Contact'),
                        officeHours: getVal('Office Hours'),
                        address: getVal('Address'),
                        capacityPerRoom: parseInt(getVal('Capacity Per Room'), 10) || 4,
                        floors: []
                    };
                }

                const roomColHeader = headers.find(h => h.includes('Room Numbers'));
                const roomsString = getVal(roomColHeader || 'Room Numbers (Comma Separated)');

                const floorName = getVal('Floor Name');
                if (floorName) {
                    blocksMap[blockName].floors.push({
                        floorName: floorName,
                        roomCount: parseInt(getVal('Rooms Count'), 10) || 0,
                        rooms: roomsString.split(',').map(room => room.trim()).filter(room => room)
                    });
                }
            }

            const blocksToUpload = Object.values(blocksMap);
            if (blocksToUpload.length === 0) {
                toast.error('No valid block data found in CSV');
                return;
            }

            setLoading(true);
            let successCount = 0;
            let errorCount = 0;

            for (const block of blocksToUpload) {
                try {
                    const response = await fetch(`${API_BASE}/blocks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(block)
                    });
                    if (response.ok) successCount++;
                    else errorCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            if (errorCount > 0) {
                toast.warning(`Upload finished: ${successCount} added, ${errorCount} failed (duplicates?)`);
            } else {
                toast.success(`Upload successful: ${successCount} blocks added`);
            }

            setLoading(false);
            fetchBlocks();
            e.target.value = null; // reset input
        };
        reader.readAsText(file);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: { xs: '100%', md: 'auto' }, gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                        <HotelIcon sx={{ color: '#0b5299', fontSize: { xs: 26, sm: 30, md: 34 } }} />
                        <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.15rem', sm: '1.4rem', md: '1.75rem' } }}>
                            Manage Hostel Blocks
                        </Typography>
                    </Box>

                    {/* On mobile: View Toggle stays in the SAME ROW as heading */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                        <Tooltip title="Cards View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('cards')}
                                sx={{
                                    p: 0.6,
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'cards' ? '#0b5299' : 'transparent',
                                    color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                                    boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                    '&:hover': {
                                        bgcolor: viewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                        color: viewMode === 'cards' ? '#ffffff' : '#0b5299'
                                    }
                                }}
                            >
                                <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Table View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('table')}
                                sx={{
                                    p: 0.6,
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'table' ? '#0b5299' : 'transparent',
                                    color: viewMode === 'table' ? '#ffffff' : '#64748b',
                                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                    '&:hover': {
                                        bgcolor: viewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                        color: viewMode === 'table' ? '#ffffff' : '#0b5299'
                                    }
                                }}
                            >
                                <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                    {/* On desktop: View Toggle inline with actions */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <Tooltip title="Cards View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('cards')}
                                sx={{
                                    p: 0.6,
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'cards' ? '#0b5299' : 'transparent',
                                    color: viewMode === 'cards' ? '#ffffff' : '#64748b',
                                    boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                    '&:hover': {
                                        bgcolor: viewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                        color: viewMode === 'cards' ? '#ffffff' : '#0b5299'
                                    }
                                }}
                            >
                                <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Table View">
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('table')}
                                sx={{
                                    p: 0.6,
                                    borderRadius: 1.5,
                                    bgcolor: viewMode === 'table' ? '#0b5299' : 'transparent',
                                    color: viewMode === 'table' ? '#ffffff' : '#64748b',
                                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                    '&:hover': {
                                        bgcolor: viewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                        color: viewMode === 'table' ? '#ffffff' : '#0b5299'
                                    }
                                }}
                            >
                                <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ color: '#0b5299', borderColor: '#0b5299', flex: { xs: '1 1 auto', md: 'none' } }}>
                        Template
                    </Button>
                    <Button variant="outlined" component="label" sx={{ color: '#0b5299', borderColor: '#0b5299', flex: { xs: '1 1 auto', md: 'none' } }}>
                        Upload CSV
                        <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditId(null); setOpen(true); }} sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#083d73' }, flex: { xs: '1 1 auto', md: 'none' } }}>
                        Add Block
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : viewMode === 'cards' ? (
                <Box>
                    {blocks.length === 0 ? (
                        <Paper sx={{ py: 6, textAlign: 'center', color: '#64748b', borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <HotelIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                                No blocks found. Add one to get started.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                            {blocks.map((b) => {
                                const totalRooms = b.floors ? b.floors.reduce((acc, f) => acc + f.roomCount, 0) : b.totalRooms || 0;
                                const floorCount = b.floors ? b.floors.length : 0;
                                return (
                                    <Card
                                        key={b._id}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                boxShadow: '0 8px 20px rgba(11,82,153,0.1)',
                                                borderColor: '#93c5fd'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, '&:last-child': { pb: 2.5 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.3 }}>
                                                        {b.name}
                                                    </Typography>
                                                    <Chip
                                                        label={b.block}
                                                        size="small"
                                                        sx={{
                                                            mt: 0.8,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            bgcolor: b.block === 'Boys Hostel' ? '#eff6ff' : b.block === 'Girls Hostel' ? '#fdf2f8' : '#f8fafc',
                                                            color: b.block === 'Boys Hostel' ? '#1d4ed8' : b.block === 'Girls Hostel' ? '#be185d' : '#334155',
                                                            border: '1px solid',
                                                            borderColor: b.block === 'Boys Hostel' ? '#bfdbfe' : b.block === 'Girls Hostel' ? '#fbcfe8' : '#cbd5e1'
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(b)} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(b._id)} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Floors
                                                    </Typography>
                                                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                                                        {floorCount}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Total Rooms
                                                    </Typography>
                                                    <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '1rem' }}>
                                                        {totalRooms}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, fontSize: '0.85rem', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <strong style={{ color: '#1e293b' }}>Warden:</strong> {b.warden || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <strong style={{ color: '#1e293b' }}>Contact:</strong> {b.wardenContact || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowX: 'auto', width: '100%' }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell><b>Category</b></TableCell>
                                <TableCell><b>Block Name</b></TableCell>
                                <TableCell><b>Warden</b></TableCell>
                                <TableCell><b>Contact</b></TableCell>
                                <TableCell><b>Floors</b></TableCell>
                                <TableCell><b>Rooms</b></TableCell>
                                <TableCell><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {blocks.map((b) => (
                                <TableRow key={b._id}>
                                    <TableCell>{b.block}</TableCell>
                                    <TableCell>{b.name}</TableCell>
                                    <TableCell>{b.warden || 'N/A'}</TableCell>
                                    <TableCell>{b.wardenContact || 'N/A'}</TableCell>
                                    <TableCell>{b.floors ? b.floors.length : 0}</TableCell>
                                    <TableCell>
                                        {b.floors ? b.floors.reduce((acc, f) => acc + f.roomCount, 0) : b.totalRooms || 0}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton color="primary" onClick={() => handleEdit(b)} sx={{ mr: 1 }}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(b._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {blocks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No blocks found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editId ? 'Edit Block' : 'Add New Block'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="Category"
                            name="block"
                            value={formData.block}
                            onChange={handleChange}
                            required
                            fullWidth
                        >
                            <MenuItem value="Boys Hostel">Boys Hostel</MenuItem>
                            <MenuItem value="Girls Hostel">Girls Hostel</MenuItem>
                            <MenuItem value="Staff Hostel">Staff Hostel</MenuItem>
                            <MenuItem value="Guest House">Guest House</MenuItem>
                        </TextField>
                        <TextField label="Block Name (e.g. Boys Hostel Block A)" name="name" value={formData.name} onChange={handleChange} required fullWidth />

                        <TextField label="Number of Floors" name="floorCount" type="number" value={formData.floorCount} onChange={handleChange} fullWidth slotProps={{ htmlInput: { min: 1, max: 20 } }} />

                        {formData.floors.map((floor, index) => (
                            <Box key={index} component="fieldset" sx={{ mt: 1, p: 2, borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#f8fafc', width: '100%', boxSizing: 'border-box', mx: 0, minWidth: 0 }}>
                                <legend style={{ padding: '0 8px', color: '#0f172a', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    Floor {index + 1}
                                </legend>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: '100%' }}>
                                    <TextField size="small" label="Floor Name (e.g. Ground Floor)" value={floor.floorName} onChange={(e) => handleFloorChange(index, 'floorName', e.target.value)} fullWidth />
                                    <TextField size="small" label="Rooms Count" type="number" value={floor.roomCount} onChange={(e) => handleFloorChange(index, 'roomCount', e.target.value)} fullWidth />
                                    <Box sx={{ gridColumn: 'span 2' }}>
                                        <TextField size="small" label="Room Numbers (Comma Separated)" placeholder="e.g. 101, 102, 103" value={floor.roomsString} onChange={(e) => handleFloorChange(index, 'roomsString', e.target.value)} fullWidth multiline rows={2} />
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Box sx={{ borderTop: '1px solid #e2e8f0', my: 1, pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#0f172a', fontWeight: 'bold' }}>Additional Details</Typography>
                            <TextField label="Warden Name" name="warden" value={formData.warden} onChange={handleChange} fullWidth />
                            <TextField label="Warden Contact" name="wardenContact" value={formData.wardenContact} onChange={handleChange} fullWidth />
                            <TextField label="Office Hours" name="officeHours" value={formData.officeHours} onChange={handleChange} fullWidth />
                            <TextField label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth multiline rows={2} />
                            <TextField label="Capacity Per Room" name="capacityPerRoom" type="number" value={formData.capacityPerRoom} onChange={handleChange} fullWidth />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 0 }}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ bgcolor: '#0b5299' }}>{editId ? 'Update Block' : 'Add Block'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default ManageBlocks;
