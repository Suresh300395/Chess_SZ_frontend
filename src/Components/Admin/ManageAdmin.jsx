import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Eye, EyeSlash, PencilSquare, Trash } from 'react-bootstrap-icons';
import { toast } from 'sonner';

const ManageAdmin = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: 'Aditya@123',
        mobile: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [editId, setEditId] = useState(null);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('http://localhost:3003/api/auth/admins');
            const data = await response.json();
            if (response.ok) {
                setAdmins(data);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editId 
                ? `http://localhost:3003/api/auth/admins/${editId}`
                : 'http://localhost:3003/api/auth/register-admin';
            
            const response = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                toast.success(editId ? 'Admin updated successfully' : 'Admin created successfully');
                setFormData({ username: '', password: 'Aditya@123', mobile: '' });
                setEditId(null);
                fetchAdmins();
            } else {
                toast.error(data.message || 'Failed to save admin');
            }
        } catch (error) {
            console.error('Error saving admin:', error);
            toast.error('Server error');
        }
    };

    const handleEdit = (admin) => {
        setFormData({
            username: admin.username,
            password: 'Aditya@123',
            mobile: admin.mobile || ''
        });
        setEditId(admin._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            try {
                const response = await fetch(`http://localhost:3003/api/auth/admins/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    toast.success('Admin deleted successfully');
                    fetchAdmins();
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete admin');
                }
            } catch (error) {
                console.error('Error deleting admin:', error);
                toast.error('Server error');
            }
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h4" sx={{ color: '#0b5299', fontWeight: 'bold', mb: 3 }}>
                Manage Admin
            </Typography>

            <Paper elevation={0} sx={{ p: 3, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#334155', fontWeight: 700 }}>
                    Create New Admin
                </Typography>

                <Box component="form" onSubmit={handleSubmit} autoComplete="off">
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                autoComplete="off"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                autoComplete="new-password"
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    edge="end"
                                                >
                                                    {showPassword ? <EyeSlash size={20} color="#646464ff" /> : <Eye size={20} color="#4e4e4eff" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                onMouseDown={(e) => e.preventDefault()}
                                                edge="end"
                                            >
                                                {showPassword ? <EyeSlash size={20} color="#0b5299" /> : <Eye size={20} color="#0b5299" />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                label="Mobile Number"
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                autoComplete="new-password"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {editId && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditId(null);
                                    setFormData({ username: '', password: 'Aditya@123', mobile: '' });
                                }}
                                sx={{ mr: 2, py: 1.5, px: 4, borderRadius: 1, fontSize: '1rem', fontWeight: 'bold', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                py: 1.5,
                                px: 4,
                                bgcolor: '#0b5299',
                                borderRadius: 1,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px 0 rgba(11, 82, 153, 0.39)',
                                '&:hover': {
                                    bgcolor: '#083c71',
                                    boxShadow: '0 6px 20px rgba(11, 82, 153, 0.23)'
                                }
                            }}
                        >
                            {editId ? 'Update Admin' : 'Make Admin'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, width: '100%', mt: 4, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#334155', fontWeight: 700 }}>
                    Admin List
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Username</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Password</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Mobile</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin._id} hover>
                                    <TableCell>{admin.username}</TableCell>
                                    <TableCell>{'•'.repeat(admin.password ? admin.password.length : 8)}</TableCell>
                                    <TableCell>{admin.mobile || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleEdit(admin)} color="primary" sx={{ mr: 1 }}>
                                            <PencilSquare size={18} />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(admin._id)} color="error">
                                            <Trash size={18} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {admins.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>
                                        No admins found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ManageAdmin;
