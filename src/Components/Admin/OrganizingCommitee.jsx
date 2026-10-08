import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import io from 'socket.io-client';
import { committeeAPI, SOCKET_URL } from '../../utils/api';


const OrganizingCommitee = () => {
    const [formData, setFormData] = useState({
        memberName: '',
        designation: '',
        position: '',
        photo: null,
        order: ''
    });
    const [members, setMembers] = useState([]);

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
        try {
            const response = await committeeAPI.update(id, { order: newOrder });

            if (response.ok) {
                fetchMembers(); // refresh table
            } else {
                alert('Failed to update order');
            }
        } catch (err) {
            console.error('Error updating order:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member?')) return;

        try {
            const response = await committeeAPI.delete(id);

            if (response.ok) {
                fetchMembers();
            } else {
                alert('Failed to delete member');
            }
        } catch (err) {
            console.error('Error deleting member:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'image/webp') {
            alert('Please upload only WEBP image format.');
            e.target.value = '';
            return;
        }

        if (file.size > 100 * 1024) {
            alert('Image size must be below 100KB.');
            e.target.value = '';
            return;
        }

        const isValidRatio = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width === img.height);
            img.src = URL.createObjectURL(file);
        });

        if (!isValidRatio) {
            alert('Image must have a 1:1 aspect ratio (square).');
            e.target.value = '';
            return;
        }

        setFormData({ ...formData, photo: file });
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
                alert('Member added successfully!');
            } else {
                const errData = await response.json();
                alert(`Failed to add member. Reason: ${errData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred while adding the member.');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 1, fontSize: { xs: '1rem', md: '2rem' } }}>
                Organizing Committee
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Manage organizing committee details here.
            </Typography>

            <Paper sx={{ p: 3, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, mb: 4 }}>
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
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                            >
                                UPLOAD PHOTO
                                <input
                                    type="file"
                                    hidden
                                    accept="image/webp"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            <Button type="submit" variant="contained" sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#09407a' } }}>
                                ADD MEMBER
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
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
                <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="committee members table">
                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell><b>S.No</b></TableCell>
                                <TableCell><b>Order</b></TableCell>
                                <TableCell><b>Photo</b></TableCell>
                                <TableCell><b>Member Name</b></TableCell>
                                <TableCell><b>Designation</b></TableCell>
                                <TableCell><b>Position</b></TableCell>
                                <TableCell><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.map((member, index) => (
                                <TableRow key={member._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{index + 1}</TableCell>
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
                                    <TableCell>
                                        <Avatar src={member.photo} alt={member.memberName} />
                                    </TableCell>
                                    <TableCell>{member.memberName}</TableCell>
                                    <TableCell>{member.designation}</TableCell>
                                    <TableCell>{member.position}</TableCell>
                                    <TableCell>
                                        <IconButton aria-label="delete" color="error" onClick={() => handleDelete(member._id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default OrganizingCommitee;
