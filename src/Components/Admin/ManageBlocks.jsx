import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, MenuItem, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'sonner';

// Import centralized API base URL
import { API_BASE } from '../../utils/api';

const ManageBlocks = () => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
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
        <Box sx={{ p: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: '28px' }}>
                    Manage Hostel Blocks
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ color: '#0b5299', borderColor: '#0b5299' }}>
                        Template
                    </Button>
                    <Button variant="outlined" component="label" sx={{ color: '#0b5299', borderColor: '#0b5299' }}>
                        Upload CSV
                        <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditId(null); setOpen(true); }} sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#083d73' } }}>
                        Add Block
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Table>
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

                        <TextField label="Number of Floors" name="floorCount" type="number" value={formData.floorCount} onChange={handleChange} fullWidth InputProps={{ inputProps: { min: 1, max: 20 } }} />

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
