import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Avatar, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import io from 'socket.io-client';
import { toast } from 'sonner';
import { committeeAPI, SOCKET_URL } from '../../utils/api';

const OrganizingCommitee = () => {
    const [viewMode, setViewMode] = useState('table');
    const [formData, setFormData] = useState({
        memberName: '',
        designation: '',
        position: '',
        photo: null,
        order: ''
    });
    const [members, setMembers] = useState([]);

    // Edit modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        memberName: '',
        designation: '',
        position: '',
        photo: null,
        existingPhoto: '',
        previewPhoto: '',
        order: ''
    });
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        fetchMembers();

        const socket = io(SOCKET_URL);

        socket.on('committeeUpdated', () => {
            fetchMembers();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await committeeAPI.getAll();

            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    const handleOrderUpdate = async (id, newOrder) => {
        const orderNum = Number(newOrder);
        if (isNaN(orderNum)) {
            toast.error('Order must be a valid number');
            return;
        }
        try {
            const response = await committeeAPI.update(id, { order: orderNum });

            if (response.ok) {
                toast.success('Order updated successfully');
                fetchMembers();
            } else {
                const errData = await response.json().catch(() => ({}));
                toast.error(errData.error || 'Failed to update order');
            }
        } catch (err) {
            console.error('Error updating order:', err);
            toast.error('Failed to update order');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member?')) return;

        try {
            const response = await committeeAPI.delete(id);

            if (response.ok) {
                toast.success('Member deleted successfully');
                fetchMembers();
            } else {
                toast.error('Failed to delete member');
            }
        } catch (err) {
            console.error('Error deleting member:', err);
            toast.error('Failed to delete member');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = async (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'image/webp') {
            toast.error('Please upload only WEBP image format.');
            e.target.value = '';
            return;
        }

        if (file.size > 100 * 1024) {
            toast.error('Image size must be below 100KB.');
            e.target.value = '';
            return;
        }

        const isValidRatio = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width === img.height);
            img.src = URL.createObjectURL(file);
        });

        if (!isValidRatio) {
            toast.error('Image must have a 1:1 aspect ratio (square).');
            e.target.value = '';
            return;
        }

        if (isEdit) {
            setEditFormData(prev => ({ ...prev, photo: file, previewPhoto: URL.createObjectURL(file) }));
        } else {
            setFormData(prev => ({ ...prev, photo: file }));
        }
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const photoBase64 = await getBase64(formData.photo);
            const dataToSubmit = {
                ...formData,
                photo: photoBase64
            };

            const response = await committeeAPI.create(dataToSubmit);

            if (response.ok) {
                setFormData({
                    memberName: '',
                    designation: '',
                    position: '',
                    photo: null,
                    order: ''
                });
                fetchMembers();
                toast.success('Member added successfully!');
            } else {
                const errData = await response.json().catch(() => ({}));
                toast.error(`Failed to add member: ${errData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('An error occurred while adding the member.');
        }
    };

    // Open Edit Dialog
    const handleOpenEdit = (member) => {
        setEditingMemberId(member._id);
        setEditFormData({
            memberName: member.memberName || '',
            designation: member.designation || '',
            position: member.position || '',
            photo: null,
            existingPhoto: member.photo || '',
            previewPhoto: '',
            order: member.order !== undefined ? member.order : ''
        });
        setEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        if (editSubmitting) return;
        setEditModalOpen(false);
        setEditingMemberId(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditSubmitting(true);
        try {
            let photoPayload = editFormData.existingPhoto;
            if (editFormData.photo) {
                photoPayload = await getBase64(editFormData.photo);
            }

            const dataToSubmit = {
                memberName: editFormData.memberName,
                designation: editFormData.designation,
                position: editFormData.position,
                order: Number(editFormData.order),
                photo: photoPayload
            };

            const response = await committeeAPI.update(editingMemberId, dataToSubmit);

            if (response.ok) {
                toast.success('Member updated successfully!');
                fetchMembers();
                handleCloseEdit();
            } else {
                const errData = await response.json().catch(() => ({}));
                toast.error(`Failed to update member: ${errData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Edit error:', error);
            toast.error('An error occurred while updating member.');
        } finally {
            setEditSubmitting(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <GroupsIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                    Organizing Committee
                </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Manage organizing committee details here.
            </Typography>

            <Paper sx={{ p: { xs: 2, sm: 3 }, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, mb: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'center' }}>
                        <Box>
                            <TextField
                                fullWidth
                                label="Member Name*"
                                name="memberName"
                                value={formData.memberName}
                                onChange={handleChange}
                                required
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                label="Designation (Role)*"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                required
                            />
                        </Box>
                        <Box>
                            <TextField
                                fullWidth
                                label="Position in Committee*"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                required
                            />
                        </Box>

                        <Box>
                            <TextField
                                fullWidth
                                label="Display Order*"
                                name="order"
                                type="number"
                                value={formData.order}
                                onChange={handleChange}
                                required
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                UPLOAD PHOTO
                                <input
                                    type="file"
                                    hidden
                                    accept="image/webp"
                                    onChange={(e) => handleFileChange(e, false)}
                                />
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#09407a' }, width: { xs: '100%', sm: 'auto' } }}
                            >
                                ADD MEMBER
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                            * Photo rules: Only WEBP format, Max 100KB, 1:1 Aspect Ratio (Square).
                        </Typography>
                        {formData.photo && (
                            <Typography variant="caption" sx={{ color: 'green', fontWeight: 500 }}>
                                Selected: {formData.photo.name}
                            </Typography>
                        )}
                    </Box>
                </form>
            </Paper>

            {members.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                        <Typography variant="h6" sx={{ color: '#0b5299', fontWeight: '700' }}>
                            Committee Members ({members.length})
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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

                    {viewMode === 'cards' ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                            {members.map((member, index) => (
                                <Paper
                                    key={member._id}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: '#ffffff',
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: '#cbd5e1',
                                            boxShadow: '0 6px 16px rgba(11,82,153,0.08)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                        <Avatar src={member.photo} alt={member.memberName} sx={{ width: 56, height: 56, border: '2px solid #e2e8f0' }} />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', wordBreak: 'break-word' }}>
                                                {member.memberName}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#0b5299', fontWeight: 600, fontSize: '13px' }}>
                                                {member.position}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                {member.designation}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                Order:
                                            </Typography>
                                            <TextField
                                                type="number"
                                                size="small"
                                                defaultValue={member.order}
                                                onBlur={(e) => {
                                                    if (e.target.value !== String(member.order)) {
                                                        handleOrderUpdate(member._id, e.target.value);
                                                    }
                                                }}
                                                sx={{ width: '65px', '& input': { py: 0.4, fontSize: '12px' } }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit Member">
                                                <IconButton size="small" onClick={() => handleOpenEdit(member)} sx={{ color: '#0b5299', bgcolor: '#eff6ff' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Member">
                                                <IconButton size="small" onClick={() => handleDelete(member._id)} sx={{ color: '#dc2626', bgcolor: '#fef2f2' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, overflowX: 'auto', width: '100%' }}>
                            <Table sx={{ minWidth: 650 }} aria-label="committee members table">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell><b>S.No</b></TableCell>
                                        <TableCell><b>Photo</b></TableCell>
                                        <TableCell><b>Member Name</b></TableCell>
                                        <TableCell><b>Designation</b></TableCell>
                                        <TableCell><b>Position</b></TableCell>
                                        <TableCell><b>Order</b></TableCell>
                                        <TableCell align="center"><b>Actions</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {members.map((member, index) => (
                                        <TableRow key={member._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Avatar src={member.photo} alt={member.memberName} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{member.memberName}</TableCell>
                                            <TableCell>{member.designation}</TableCell>
                                            <TableCell>{member.position}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    defaultValue={member.order}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== String(member.order)) {
                                                            handleOrderUpdate(member._id, e.target.value);
                                                        }
                                                    }}
                                                    sx={{ width: '70px' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <Tooltip title="Edit Member">
                                                        <IconButton
                                                            aria-label="edit"
                                                            color="primary"
                                                            onClick={() => handleOpenEdit(member)}
                                                            sx={{ color: '#0b5299', '&:hover': { bgcolor: '#eff6ff' } }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Member">
                                                        <IconButton
                                                            aria-label="delete"
                                                            color="error"
                                                            onClick={() => handleDelete(member._id)}
                                                            sx={{ '&:hover': { bgcolor: '#fef2f2' } }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Edit Member Dialog Modal */}
            <Dialog
                open={editModalOpen}
                onClose={handleCloseEdit}
                maxWidth="sm"
                fullWidth
                disableRestoreFocus
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#0b5299', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon sx={{ color: '#0b5299' }} /> Edit Committee Member
                </DialogTitle>
                <form onSubmit={handleEditSubmit}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Current Photo Preview & Change Photo */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar
                                src={editFormData.previewPhoto || editFormData.existingPhoto}
                                alt={editFormData.memberName}
                                sx={{ width: 68, height: 68, border: '2px solid #0b5299', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            />
                            <Box>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                    Change Photo
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/webp"
                                        onChange={(e) => handleFileChange(e, true)}
                                    />
                                </Button>
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                                    Optional. WEBP only, max 100KB, 1:1 aspect ratio.
                                </Typography>
                                {editFormData.photo && (
                                    <Typography variant="caption" sx={{ color: 'green', fontWeight: 600 }}>
                                        New: {editFormData.photo.name}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <TextField
                            fullWidth
                            label="Member Name*"
                            name="memberName"
                            value={editFormData.memberName}
                            onChange={handleEditChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Designation (Role)*"
                            name="designation"
                            value={editFormData.designation}
                            onChange={handleEditChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Position in Committee*"
                            name="position"
                            value={editFormData.position}
                            onChange={handleEditChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Display Order*"
                            name="order"
                            type="number"
                            value={editFormData.order}
                            onChange={handleEditChange}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={handleCloseEdit}
                            variant="outlined"
                            disabled={editSubmitting}
                            sx={{ borderRadius: 1.5, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={editSubmitting}
                            sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#09407a' }, borderRadius: 1.5, textTransform: 'none', px: 3 }}
                        >
                            {editSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default OrganizingCommitee;
