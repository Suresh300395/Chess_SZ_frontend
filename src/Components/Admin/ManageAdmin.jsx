import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, Paper, IconButton, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Card, CardContent, Chip, Tooltip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, CircularProgress
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SelectAllRoundedIcon from '@mui/icons-material/SelectAllRounded';
import DeselectRoundedIcon from '@mui/icons-material/DeselectRounded';
import SecurityIcon from '@mui/icons-material/Security';
import { Eye, EyeSlash, PencilSquare, Trash } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { authAPI, SOCKET_URL } from '../../utils/api';
import { AnimatedText, AnimatedCard } from '../animations';
import { ALL_ADMIN_MODULES } from './common/RolesNav';


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

    // Module Mapping Modal State
    const [mappingModalOpen, setMappingModalOpen] = useState(false);
    const [mappingAdmin, setMappingAdmin] = useState(null);
    const [selectedModules, setSelectedModules] = useState([]);
    const [savingModules, setSavingModules] = useState(false);

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
        const socket = io(SOCKET_URL);
        socket.on('admins_updated', fetchAdmins);
        return () => socket.disconnect();
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

    // Open module mapping dialog
    const handleOpenMapping = (admin) => {
        setMappingAdmin(admin);
        const current = Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0
            ? admin.allowedModules
            : ['dashboard', 'organizing-committee', 'players-mapping', 'hostel-provision', 'food-tokens', 'caution-deposite', 'manage-live-board'];
        setSelectedModules(current);
        setMappingModalOpen(true);
    };

    const handleCloseMapping = () => {
        if (savingModules) return;
        setMappingModalOpen(false);
        setMappingAdmin(null);
    };

    const handleToggleModule = (id) => {
        setSelectedModules(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedModules(ALL_ADMIN_MODULES.map(m => m.id));
    };

    const handleDeselectAll = () => {
        setSelectedModules([]);
    };

    const handleSaveModules = async () => {
        if (!mappingAdmin) return;
        setSavingModules(true);
        try {
            const response = await authAPI.updateAdmin(mappingAdmin._id, {
                allowedModules: selectedModules
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Modules successfully mapped for "${mappingAdmin.username}"!`);
                setAdmins(prev => prev.map(a => a._id === mappingAdmin._id ? { ...a, allowedModules: selectedModules } : a));
                handleCloseMapping();
            } else {
                toast.error(data.message || 'Failed to save module mapping');
            }
        } catch (error) {
            console.error('Error saving modules:', error);
            toast.error('Server error while saving module mapping');
        } finally {
            setSavingModules(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <AnimatedText direction="down" duration={0.45}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AdminPanelSettingsIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                        <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                            Manage Admin
                        </Typography>
                    </Box>
                </AnimatedText>
            </Box>

            <AnimatedCard delay={0.06}>
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
            </AnimatedCard>

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
                                {admins.map((admin, index) => (
                                    <AnimatedCard key={admin._id} delay={Math.min(index * 0.05, 0.25)} style={{ height: '100%', width: '100%' }}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    height: '100%',
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
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', pt: 0.5, borderTop: '1px dashed #e2e8f0' }}>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>Modules:</Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                                <Chip
                                                                    size="small"
                                                                    label={
                                                                        Array.isArray(admin.allowedModules)
                                                                            ? `${admin.allowedModules.length} Modules`
                                                                            : 'Default'
                                                                    }
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '0.72rem',
                                                                        fontWeight: 600,
                                                                        bgcolor: Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0 ? '#eff6ff' : '#f1f5f9',
                                                                        color: Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0 ? '#1d4ed8' : '#64748b'
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<TuneIcon sx={{ fontSize: 13 }} />}
                                                                    onClick={() => handleOpenMapping(admin)}
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        py: 0.2,
                                                                        px: 1,
                                                                        fontSize: '0.74rem',
                                                                        borderRadius: 1.2,
                                                                        borderColor: '#93c5fd',
                                                                        color: '#0b5299',
                                                                        bgcolor: '#eff6ff',
                                                                        '&:hover': { bgcolor: '#0b5299', color: '#fff', borderColor: '#0b5299' }
                                                                    }}
                                                                >
                                                                    Map
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </AnimatedCard>
                                    ))}
                                </Box>
                        )}
                    </Box>
                ) : (
                <TableContainer sx={{ overflowX: 'auto', width: '100%', borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                <TableCell sx={{ width: '24%', fontWeight: 700, color: '#475569', fontSize: '0.84rem', py: 1.8, pl: 3 }}>Username</TableCell>
                                <TableCell sx={{ width: '18%', fontWeight: 700, color: '#475569', fontSize: '0.84rem', py: 1.8 }}>Password</TableCell>
                                <TableCell sx={{ width: '18%', fontWeight: 700, color: '#475569', fontSize: '0.84rem', py: 1.8 }}>Mobile</TableCell>
                                <TableCell sx={{ width: '26%', fontWeight: 700, color: '#475569', fontSize: '0.84rem', py: 1.8 }}>Module Mapping</TableCell>
                                <TableCell align="center" sx={{ width: '14%', fontWeight: 700, color: '#475569', fontSize: '0.84rem', py: 1.8, pr: 3 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow
                                    key={admin._id}
                                    hover
                                    sx={{
                                        '&:hover': { bgcolor: '#fbfcfd' },
                                        '& td': { py: 1.6, verticalAlign: 'middle', borderColor: '#f1f5f9' },
                                        '&:last-child td': { borderBottom: 0 }
                                    }}
                                >
                                    <TableCell sx={{ pl: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    bgcolor: '#eff6ff',
                                                    color: '#0b5299',
                                                    fontWeight: 700,
                                                    fontSize: '0.88rem',
                                                    border: '1px solid #bfdbfe'
                                                }}
                                            >
                                                {admin.username ? admin.username.charAt(0).toUpperCase() : 'A'}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', lineHeight: 1.2 }}>
                                                    {admin.username}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                                                    Admin
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.95rem', letterSpacing: 2 }}>
                                            {'•'.repeat(admin.password ? admin.password.length : 8)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.9rem' }}>
                                            {admin.mobile || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
                                                onClick={() => handleOpenMapping(admin)}
                                                sx={{
                                                    height: 30,
                                                    textTransform: 'none',
                                                    borderRadius: 1.5,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    px: 1.5,
                                                    borderColor: '#93c5fd',
                                                    color: '#0b5299',
                                                    bgcolor: '#eff6ff',
                                                    transition: 'all 0.2s',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        bgcolor: '#0b5299',
                                                        color: '#ffffff',
                                                        borderColor: '#0b5299'
                                                    }
                                                }}
                                            >
                                                Map
                                            </Button>
                                            <Chip
                                                size="small"
                                                label={
                                                    Array.isArray(admin.allowedModules)
                                                        ? `${admin.allowedModules.length} / ${ALL_ADMIN_MODULES.length} Modules`
                                                        : 'Default (7 Modules)'
                                                }
                                                sx={{
                                                    height: 28,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    bgcolor: Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0 ? '#eff6ff' : '#f8fafc',
                                                    color: Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0 ? '#1d4ed8' : '#64748b',
                                                    border: '1px solid',
                                                    borderColor: Array.isArray(admin.allowedModules) && admin.allowedModules.length > 0 ? '#bfdbfe' : '#e2e8f0',
                                                    '& .MuiChip-label': { px: 1 }
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ pr: 3 }}>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                            <Tooltip title="Edit Admin">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(admin)}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 1.5,
                                                        color: '#0b5299',
                                                        bgcolor: '#eff6ff',
                                                        border: '1px solid #bfdbfe',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { bgcolor: '#0b5299', color: '#ffffff', borderColor: '#0b5299' }
                                                    }}
                                                >
                                                    <PencilSquare size={15} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Admin">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(admin._id)}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 1.5,
                                                        color: '#dc2626',
                                                        bgcolor: '#fef2f2',
                                                        border: '1px solid #fecaca',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { bgcolor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' }
                                                    }}
                                                >
                                                    <Trash size={15} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {admins.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b' }}>
                                        No admins found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                )}
            </Paper>

            {/* Module Mapping Modal */}
            <Dialog
                open={mappingModalOpen}
                onClose={handleCloseMapping}
                maxWidth="md"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#0b5299', display: 'flex' }}>
                            <SecurityIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                Module Mapping
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                                Configure accessible modules for: <b>{mappingAdmin?.username}</b>
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleCloseMapping} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#0f172a' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Top Selection Info & Quick Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                        <Chip
                            icon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                            label={`${selectedModules.length} of ${ALL_ADMIN_MODULES.length} Modules Selected`}
                            sx={{
                                bgcolor: '#eff6ff',
                                color: '#1d4ed8',
                                fontWeight: 600,
                                border: '1px solid #bfdbfe'
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SelectAllRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={handleSelectAll}
                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                Select All
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                startIcon={<DeselectRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={handleDeselectAll}
                                sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}
                            >
                                Clear All
                            </Button>
                        </Box>
                    </Box>

                    {/* Modules Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                        {ALL_ADMIN_MODULES.map((mod) => {
                            const isChecked = selectedModules.includes(mod.id);
                            return (
                                <Box
                                    key={mod.id}
                                    onClick={() => handleToggleModule(mod.id)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderRadius: 2.5,
                                        cursor: 'pointer',
                                        border: '1.5px solid',
                                        borderColor: isChecked ? '#0b5299' : '#e2e8f0',
                                        bgcolor: isChecked ? '#f0f7ff' : '#ffffff',
                                        boxShadow: isChecked ? '0 2px 8px rgba(11,82,153,0.08)' : 'none',
                                        transition: 'all 0.2s ease',
                                        userSelect: 'none',
                                        '&:hover': {
                                            borderColor: isChecked ? '#0b5299' : '#94a3b8',
                                            bgcolor: isChecked ? '#e6f2ff' : '#f8fafc',
                                            transform: 'translateY(-1px)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={() => handleToggleModule(mod.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                            p: 0.5,
                                            mr: 1,
                                            color: '#cbd5e1',
                                            '&.Mui-checked': { color: '#0b5299' }
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: isChecked ? '#0b5299' : '#f1f5f9',
                                            color: isChecked ? '#ffffff' : '#0b5299',
                                            mr: 1.5,
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {React.cloneElement(mod.icon, { sx: { fontSize: 20 } })}
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: isChecked ? '#0b5299' : '#1e293b' }}>
                                            {mod.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block', lineHeight: 1.2 }}>
                                            {mod.description || mod.path}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseMapping}
                        disabled={savingModules}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveModules}
                        disabled={savingModules}
                        startIcon={savingModules ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{
                            bgcolor: '#0b5299',
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': { bgcolor: '#083c71' }
                        }}
                    >
                        {savingModules ? 'Saving...' : 'Save Modules'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageAdmin;
