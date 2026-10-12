import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Chip, Tooltip, Avatar } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import { Eye, EyeSlash, PencilSquare, Trash } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import { authAPI } from '../../utils/api';


const ManageAdmin = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: 'Aditya@123',
        mobile: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [editId, setEditId] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    const fetchAdmins = async () => {
        try {
            const response = await authAPI.getAdmins();
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
            const response = editId
                ? await authAPI.updateAdmin(editId, formData)
                : await authAPI.registerAdmin(formData);

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
                const response = await authAPI.deleteAdmin(id);
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
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <AdminPanelSettingsIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                    Manage Admin
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
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
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-end', gap: 2 }}>
                        {editId && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditId(null);
                                    setFormData({ username: '', password: 'Aditya@123', mobile: '' });
                                }}
                                sx={{ py: 1.5, px: 4, borderRadius: 1, fontSize: '1rem', fontWeight: 'bold', textTransform: 'none' }}
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

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, width: '100%', mt: 4, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>
                        Admin List ({admins.length})
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
                    <Box>
                        {admins.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center', color: '#64748b' }}>
                                No admins found.
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                                {admins.map((admin) => (
                                    <Card
                                        key={admin._id}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(11,82,153,0.1)',
                                                borderColor: '#93c5fd'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                    <Avatar sx={{ width: 38, height: 38, bgcolor: '#eff6ff', color: '#0b5299', fontWeight: 700, fontSize: '1rem' }}>
                                                        {admin.username ? admin.username.charAt(0).toUpperCase() : 'A'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.2 }}>
                                                            {admin.username}
                                                        </Typography>
                                                        <Chip
                                                            label="Admin"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, mt: 0.3 }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton size="small" onClick={() => handleEdit(admin)} color="primary" sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                                        <PencilSquare size={16} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(admin._id)} color="error" sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                        <Trash size={16} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Box sx={{ bgcolor: '#f8fafc', p: 1.2, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Password:</Typography>
                                                    <Typography sx={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.85rem' }}>
                                                        {'•'.repeat(admin.password ? admin.password.length : 8)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Mobile:</Typography>
                                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                                                        {admin.mobile || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : (
                <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
                    <Table sx={{ minWidth: 500 }}>
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
                )}
            </Paper>
        </Box>
    );
};

export default ManageAdmin;
