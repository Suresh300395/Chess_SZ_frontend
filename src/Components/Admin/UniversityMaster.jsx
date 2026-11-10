import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
    Switch,
    FormControlLabel,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import { universityMasterAPI, SOCKET_URL } from '../../utils/api';
import { AnimatedCard } from '../animations';

const UniversityMaster = () => {
    // -------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------
    const [universities, setUniversities] = useState([]);
    const [totalUniversities, setTotalUniversities] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, registeredCount: 0, registeredPlayersCount: 0 });

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Add / Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUniversity, setEditingUniversity] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        status: 'ACTIVE'
    });
    const [saving, setSaving] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const dupCheckTimer = useRef(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [universityToDelete, setUniversityToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Bulk Import Modal State
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importPreviewRows, setImportPreviewRows] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Debounce Search Query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // -------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------
    const fetchStats = useCallback(async () => {
        try {
            const res = await universityMasterAPI.getStats();
            const data = await res.json();
            if (res.ok && data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Error fetching university stats:', err);
        }
    }, []);

    const fetchUniversities = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                q: debouncedSearch,
                status: statusFilter
            };
            const res = await universityMasterAPI.getAll(params);
            const data = await res.json();
            if (res.ok && data.success) {
                setUniversities(data.universities || []);
                setTotalUniversities(data.total || 0);
            } else {
                toast.error(data.message || 'Failed to fetch universities');
            }
        } catch (err) {
            console.error('Fetch universities error:', err);
            toast.error('Network error fetching universities');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchUniversities();
    }, [fetchUniversities]);

    // Real-time socket updates
    useEffect(() => {
        let socket;
        try {
            socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            socket.on('universityUpdated', () => {
                fetchUniversities();
                fetchStats();
            });
            socket.on('connect_error', () => {
                // Connection retry handled gracefully
            });
        } catch (e) {
            console.warn('Socket connection error:', e);
        }
        return () => {
            if (socket) socket.disconnect();
        };
    }, [fetchUniversities, fetchStats]);

    // -------------------------------------------------------------
    // DUPLICATE DETECTION LOGIC (REAL-TIME)
    // -------------------------------------------------------------
    const triggerDuplicateCheck = (nameVal, aliasesArr, excludeId) => {
        if (!nameVal || nameVal.trim().length < 2) {
            setDuplicateWarning(null);
            setCheckingDuplicate(false);
            return;
        }

        if (dupCheckTimer.current) clearTimeout(dupCheckTimer.current);

        setCheckingDuplicate(true);
        dupCheckTimer.current = setTimeout(async () => {
            try {
                const params = {
                    name: nameVal.trim(),
                    aliases: (aliasesArr || []).join(','),
                    excludeId: excludeId || ''
                };
                const res = await universityMasterAPI.checkDuplicate(params);
                const data = await res.json();
                if (data.isDuplicate) {
                    setDuplicateWarning({
                        severity: 'error',
                        message: data.message,
                        isBlocked: true
                    });
                } else if (data.isSimilar) {
                    setDuplicateWarning({
                        severity: 'warning',
                        message: data.message,
                        isBlocked: false
                    });
                } else {
                    setDuplicateWarning(null);
                }
            } catch (err) {
                console.error('Duplicate check error:', err);
            } finally {
                setCheckingDuplicate(false);
            }
        }, 350);
    };

    // -------------------------------------------------------------
    // ADD / EDIT HANDLERS
    // -------------------------------------------------------------
    const handleOpenAddModal = () => {
        setEditingUniversity(null);
        setFormData({
            name: '',
            phone: '',
            address: '',
            status: 'ACTIVE'
        });
        setDuplicateWarning(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (uni) => {
        setEditingUniversity(uni);
        setFormData({
            name: uni.name || '',
            phone: uni.phone || '',
            address: uni.address || '',
            status: uni.status || 'ACTIVE'
        });
        setDuplicateWarning(null);
        setModalOpen(true);
    };

    const handleNameChange = (val) => {
        setFormData(prev => ({ ...prev, name: val }));
        triggerDuplicateCheck(val, [], editingUniversity?._id);
    };

    const handleSaveUniversity = async () => {
        if (!formData.name.trim()) {
            toast.error('University name is required');
            return;
        }

        if (duplicateWarning?.isBlocked) {
            toast.error(duplicateWarning.message);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                status: formData.status || 'ACTIVE'
            };

            let res;
            if (editingUniversity) {
                res = await universityMasterAPI.update(editingUniversity._id, payload);
            } else {
                res = await universityMasterAPI.create(payload);
            }

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || (editingUniversity ? 'Updated successfully' : 'Created successfully'));
                setModalOpen(false);
                fetchUniversities();
                fetchStats();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Failed to save university');
        } finally {
            setSaving(false);
        }
    };

    // -------------------------------------------------------------
    // STATUS TOGGLE
    // -------------------------------------------------------------
    const handleToggleStatus = async (uni) => {
        try {
            const res = await universityMasterAPI.toggleStatus(uni._id);
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                fetchUniversities();
                fetchStats();
            } else {
                toast.error(data.message || 'Status toggle failed');
            }
        } catch (err) {
            console.error('Toggle status error:', err);
            toast.error('Failed to update status');
        }
    };

    // -------------------------------------------------------------
    // DELETE HANDLERS
    // -------------------------------------------------------------
    const handleOpenDeleteModal = (uni) => {
        setUniversityToDelete(uni);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!universityToDelete) return;
        setDeleting(true);
        try {
            const res = await universityMasterAPI.delete(universityToDelete._id);
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                setDeleteModalOpen(false);
                fetchUniversities();
                fetchStats();
            } else {
                toast.error(data.message || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Network error deleting university');
        } finally {
            setDeleting(false);
        }
    };

    // -------------------------------------------------------------
    // BULK IMPORT LOGIC
    // -------------------------------------------------------------
    const handleOpenImportModal = () => {
        setImportFile(null);
        setImportPreviewRows([]);
        setImportResult(null);
        setImportModalOpen(true);
    };

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setImportResult(null);

        // Client-side parse preview using XLSX
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                setImportPreviewRows(data.slice(0, 10)); // preview first 10 rows
            } catch (err) {
                console.error('Error parsing excel:', err);
                toast.error('Failed to parse file format. Ensure it is a valid .xlsx or .csv');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExecuteImport = () => {
        if (!importFile) {
            toast.error('Please choose a file to import');
            return;
        }

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (!rows || rows.length === 0) {
                    toast.error('Uploaded sheet has no rows');
                    setImporting(false);
                    return;
                }

                const res = await universityMasterAPI.bulkImport({ rows });
                const data = await res.json();
                if (res.ok && data.success) {
                    setImportResult(data.summary);
                    toast.success(data.message);
                    fetchUniversities();
                    fetchStats();
                } else {
                    toast.error(data.message || 'Import failed');
                }
            } catch (err) {
                console.error('Import execution error:', err);
                toast.error('Failed to complete import');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsBinaryString(importFile);
    };

    const handleDownloadTemplate = () => {
        window.open(universityMasterAPI.getTemplateUrl(), '_blank');
    };

    const handleExportExcel = () => {
        const url = universityMasterAPI.getExportUrl({ status: statusFilter });
        window.open(url, '_blank');
    };

    const statCards = [
        {
            title: 'Total Universities',
            count: stats.total,
            subtitle: 'Universities in master directory',
            badge: 'Directory',
            icon: <SchoolIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <SchoolIcon sx={{ fontSize: 90, color: '#0b5299' }} />,
            gradient: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
            shadow: 'rgba(11, 82, 153, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#93c5fd',
            badgeBg: '#eff6ff',
            badgeColor: '#1d4ed8'
        },
        {
            title: 'Active Universities',
            count: stats.active,
            subtitle: 'Available for registration',
            badge: 'Active',
            icon: <CheckCircleOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <CheckCircleOutlinedIcon sx={{ fontSize: 90, color: '#059669' }} />,
            gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            shadow: 'rgba(5, 150, 105, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f6fdf9 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#a7f3d0',
            badgeBg: '#ecfdf5',
            badgeColor: '#047857'
        },
        {
            title: 'Inactive Universities',
            count: stats.inactive,
            subtitle: 'Disabled from registration',
            badge: 'Disabled',
            icon: <CancelOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <CancelOutlinedIcon sx={{ fontSize: 90, color: '#64748b' }} />,
            gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            shadow: 'rgba(100, 116, 139, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#cbd5e1',
            badgeBg: '#f1f5f9',
            badgeColor: '#475569'
        },
        {
            title: 'Registered Players',
            count: stats.registeredPlayersCount ?? stats.registeredCount,
            subtitle: 'Enrolled participants in event',
            badge: 'Players',
            icon: <GroupsIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <GroupsIcon sx={{ fontSize: 90, color: '#d06c38' }} />,
            gradient: 'linear-gradient(135deg, #d06c38 0%, #ea580c 100%)',
            shadow: 'rgba(208, 108, 56, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbf7 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#fed7aa',
            badgeBg: '#fff7ed',
            badgeColor: '#c2410c'
        }
    ];

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', pb: 5 }}>
            {/* 1. Page Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.125rem' } }}>
                            <SchoolIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: '#0b5299' }} />
                            University Master
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                            Manage registered universities, official contacts, and addresses
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(12, 1fr)', sm: 'auto auto auto' },
                        gap: 1.5,
                        width: { xs: '100%', sm: 'auto' },
                        alignItems: 'center'
                    }}>
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadOutlinedIcon />}
                            onClick={handleExportExcel}
                            sx={{
                                gridColumn: { xs: 'span 6', sm: 'auto' },
                                width: '100%',
                                height: '42px',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: '#cbd5e1',
                                color: '#0b5299',
                                borderRadius: 1,
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '12px', sm: '13px' }
                            }}
                        >
                            Export
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CloudUploadOutlinedIcon />}
                            onClick={handleOpenImportModal}
                            sx={{
                                gridColumn: { xs: 'span 6', sm: 'auto' },
                                width: '100%',
                                height: '42px',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: '#0b5299',
                                color: '#0b5299',
                                borderRadius: 1,
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '12px', sm: '13px' },
                                px: { xs: 1, sm: 2 }
                            }}
                        >
                            Bulk Import (Excel)
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddModal}
                            sx={{
                                gridColumn: { xs: 'span 12', sm: 'auto' },
                                width: '100%',
                                height: '42px',
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: '#d06c38',
                                '&:hover': { bgcolor: '#b85826' },
                                borderRadius: 1,
                                px: 2.5,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Add University
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* 2. Top Metric Cards */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: { xs: 2, sm: 2.5, md: 3 },
                width: '100%',
                mb: 4
            }}>
                {statCards.map((stat, index) => (
                    <AnimatedCard key={index} delay={index * 0.08} style={{ height: '100%', width: '100%' }}>
                        <Card
                            sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '16px',
                                background: stat.bgGradient,
                                border: `1px solid ${stat.borderColor}`,
                                boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                height: '100%',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                    borderColor: stat.hoverBorder
                                }
                            }}
                        >
                            {/* Corner Category Badge (Pinned to top-right corner) */}
                            <Chip
                                label={stat.badge}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    bgcolor: stat.badgeBg,
                                    color: stat.badgeColor,
                                    fontWeight: 600,
                                    fontSize: '0.72rem',
                                    height: '22px',
                                    borderRadius: '6px',
                                    zIndex: 1
                                }}
                            />

                            {/* Subtle decorative watermark icon in bottom-right corner */}
                            <Box sx={{
                                position: 'absolute',
                                right: -8,
                                bottom: -8,
                                opacity: 0.04,
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {stat.bgIcon}
                            </Box>

                            <CardContent sx={{ py: 2, pr: 2, pl: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    {/* Icon badge */}
                                    <Box sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: '12px',
                                        background: stat.gradient,
                                        boxShadow: `0 4px 12px ${stat.shadow}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.05)' }
                                    }}>
                                        {stat.icon}
                                    </Box>

                                    <Box>
                                        {/* Title */}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#64748b',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase',
                                                display: 'block',
                                                mb: 0.5
                                            }}
                                        >
                                            {stat.title}
                                        </Typography>

                                        {/* Enforced Counter Number */}
                                        <Typography
                                            sx={{
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                fontSize: { xs: '1.8rem', md: '2.1rem' },
                                                lineHeight: 1
                                            }}
                                        >
                                            {stat.count}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Subtitle */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#94a3b8',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        display: 'block'
                                    }}
                                >
                                    {stat.subtitle}
                                </Typography>
                            </CardContent>
                        </Card>
                    </AnimatedCard>
                ))}
            </Box>

            {/* 3. Search & Filter Bar */}
            <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, mb: 3, border: '1px solid #e2e8f0', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Search by university name, contact, address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                                            <CloseIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                            }
                        }}
                        sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
                    />

                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, width: { xs: '100%', sm: 'auto' } }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                            <MenuItem value="ALL">All Statuses</MenuItem>
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* 4. Universities List (Table on Desktop, Cards on Mobile) */}
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                {/* 4A. Desktop & Tablet Table View (Hidden on Mobile) */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, width: '100%', overflowX: 'auto' }}>
                    <TableContainer sx={{ width: '100%' }}>
                        <Table size="small" sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75, width: 60 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75 }}>University Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75 }}>University Contact</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75 }}>Address</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75, textAlign: 'center' }}>Registered Players</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75, textAlign: 'center' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.75, textAlign: 'center' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                                            <CircularProgress size={32} sx={{ color: '#0b5299' }} />
                                            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                                                Loading universities...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : universities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                                            <SchoolIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569' }}>
                                                No Universities Found
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                                                {searchQuery ? `No results matching "${searchQuery}"` : 'Add your first university or import from Excel.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    universities.map((uni, idx) => (
                                        <TableRow key={uni._id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell sx={{ py: 1.5, color: '#64748b', fontWeight: 600 }}>
                                                {page * rowsPerPage + idx + 1}
                                            </TableCell>

                                            {/* University Name */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                                                    {uni.name}
                                                </Typography>
                                            </TableCell>

                                            {/* University Contact */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                {uni.phone ? (
                                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <PhoneOutlinedIcon sx={{ fontSize: 14, color: '#0b5299' }} /> {uni.phone}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Address */}
                                            <TableCell sx={{ py: 1.5 }}>
                                                {uni.address ? (
                                                    <Typography sx={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                                        <LocationOnOutlinedIcon sx={{ fontSize: 15, color: '#64748b', mt: 0.2, flexShrink: 0 }} />
                                                        <span>{uni.address}</span>
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                                                )}
                                            </TableCell>

                                            {/* Registered Players Count */}
                                            <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                                                {(uni.registeredPlayerCount ?? uni.registeredTeamCount) > 0 ? (
                                                    <Chip
                                                        size="small"
                                                        label={`${uni.registeredPlayerCount ?? uni.registeredTeamCount} Player(s)`}
                                                        sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '11px' }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>0</Typography>
                                                )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                                                <Tooltip title={`Click to toggle ${uni.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}>
                                                    <Chip
                                                        size="small"
                                                        label={uni.status}
                                                        onClick={() => handleToggleStatus(uni)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            fontWeight: 700,
                                                            fontSize: '11px',
                                                            bgcolor: uni.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                                            color: uni.status === 'ACTIVE' ? '#15803d' : '#64748b',
                                                            '&:hover': {
                                                                bgcolor: uni.status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <Tooltip title="Edit University">
                                                        <IconButton size="small" onClick={() => handleOpenEditModal(uni)} sx={{ color: '#0b5299' }}>
                                                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete University">
                                                        <IconButton size="small" onClick={() => handleOpenDeleteModal(uni)} sx={{ color: '#ef4444' }}>
                                                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* 4B. Mobile Cards View (Visible on Mobile < md, Zero Horizontal Scroll) */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                    {loading ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <CircularProgress size={32} sx={{ color: '#0b5299' }} />
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                                Loading universities...
                            </Typography>
                        </Box>
                    ) : universities.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: 'center', px: 2 }}>
                            <SchoolIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569', fontSize: '15px' }}>
                                No Universities Found
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '12px' }}>
                                {searchQuery ? `No results matching "${searchQuery}"` : 'Add your first university or import from Excel.'}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
                            {universities.map((uni, idx) => (
                                <Paper
                                    key={uni._id}
                                    variant="outlined"
                                    sx={{
                                        p: 1.75,
                                        borderRadius: 2.5,
                                        bgcolor: '#ffffff',
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.25,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: '#cbd5e1',
                                            boxShadow: '0 4px 12px rgba(11,82,153,0.06)'
                                        }
                                    }}
                                >
                                    {/* Top Row: S.No & Status Chip */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Chip
                                            label={`#${page * rowsPerPage + idx + 1}`}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '11px',
                                                bgcolor: '#f1f5f9',
                                                color: '#475569',
                                                height: 22
                                            }}
                                        />
                                        <Tooltip title={`Click to toggle ${uni.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}>
                                            <Chip
                                                size="small"
                                                label={uni.status}
                                                onClick={() => handleToggleStatus(uni)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    height: 22,
                                                    bgcolor: uni.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                                    color: uni.status === 'ACTIVE' ? '#15803d' : '#64748b',
                                                    '&:hover': {
                                                        bgcolor: uni.status === 'ACTIVE' ? '#bbf7d0' : '#e2e8f0'
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </Box>

                                    {/* University Name */}
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                        {uni.name}
                                    </Typography>

                                    {/* Contact Details */}
                                    {uni.phone ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <PhoneOutlinedIcon sx={{ fontSize: 15, color: '#0b5299' }} />
                                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                                {uni.phone}
                                            </Typography>
                                        </Box>
                                    ) : null}

                                    {/* Address */}
                                    {uni.address ? (
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                                            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: '#64748b', mt: 0.2, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '13px', color: '#475569', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                                {uni.address}
                                            </Typography>
                                        </Box>
                                    ) : null}

                                    {/* Bottom Row: Registered Players Count & Actions */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px dashed #f1f5f9', mt: 0.25 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '11px' }}>
                                                Players:
                                            </Typography>
                                            {(uni.registeredPlayerCount ?? uni.registeredTeamCount) > 0 ? (
                                                <Chip
                                                    size="small"
                                                    label={`${uni.registeredPlayerCount ?? uni.registeredTeamCount}`}
                                                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '11px', height: 20 }}
                                                />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>0</Typography>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                                                onClick={() => handleOpenEditModal(uni)}
                                                sx={{
                                                    fontSize: '11px',
                                                    py: 0.35,
                                                    px: 1.25,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    borderColor: '#cbd5e1',
                                                    color: '#0b5299',
                                                    borderRadius: 1
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDeleteModal(uni)}
                                                sx={{
                                                    color: '#ef4444',
                                                    bgcolor: '#fef2f2',
                                                    p: 0.6,
                                                    borderRadius: 1,
                                                    '&:hover': { bgcolor: '#fee2e2' }
                                                }}
                                            >
                                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* 4C. Adaptive Table Pagination (Zero Overflow on Mobile) */}
                <TablePagination
                    rowsPerPageOptions={[10, 15, 25, 50]}
                    component="div"
                    count={totalUniversities}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage={
                        <Box component="span" sx={{ fontSize: 'inherit' }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Rows per page:</Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Rows:</Box>
                        </Box>
                    }
                    sx={{
                        borderTop: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        overflowX: 'hidden !important',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        '& .MuiTablePagination-toolbar': {
                            px: { xs: 0.75, sm: 2 },
                            minHeight: { xs: 44, sm: 52 },
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            gap: { xs: 0.25, sm: 1 },
                            flexWrap: 'nowrap',
                            overflow: 'hidden',
                            overflowX: 'hidden !important'
                        },
                        '& .MuiTablePagination-selectLabel': {
                            m: 0,
                            fontSize: { xs: '11px', sm: '13px' },
                            color: '#64748b'
                        },
                        '& .MuiTablePagination-input': {
                            m: { xs: '0 2px', sm: '0 12px' },
                            '& .MuiSelect-select': {
                                py: { xs: 0.25, sm: 0.5 },
                                pl: { xs: 0.5, sm: 1 },
                                pr: { xs: '20px !important', sm: '24px !important' },
                                fontSize: { xs: '11px', sm: '13px' }
                            }
                        },
                        '& .MuiTablePagination-displayedRows': {
                            m: { xs: '0 2px', sm: '0 12px' },
                            fontSize: { xs: '11px', sm: '13px' },
                            color: '#64748b',
                            whiteSpace: 'nowrap'
                        },
                        '& .MuiTablePagination-actions': {
                            ml: { xs: 0.25, sm: 1.5 },
                            whiteSpace: 'nowrap',
                            '& .MuiIconButton-root': {
                                p: { xs: 0.25, sm: 0.75 }
                            }
                        }
                    }}
                />
            </Paper>

            {/* ------------------------------------------------------------- */}
            {/* ADD / EDIT UNIVERSITY DIALOG */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon sx={{ color: '#0b5299' }} />
                        {editingUniversity ? 'Edit University' : 'Add University'}
                    </Box>
                    <IconButton size="small" onClick={() => setModalOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
                    {/* Duplicate / Similarity Warning Banner */}
                    {checkingDuplicate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, color: '#64748b' }}>
                            <CircularProgress size={16} />
                            <Typography variant="caption">Checking for duplicate universities...</Typography>
                        </Box>
                    )}
                    {duplicateWarning && (
                        <Alert
                            severity={duplicateWarning.severity}
                            icon={duplicateWarning.severity === 'error' ? <CancelOutlinedIcon /> : <WarningAmberIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {duplicateWarning.message}
                            </Typography>
                        </Alert>
                    )}

                    {/* 1. University Name */}
                    <TextField
                        label="University Name*"
                        placeholder="e.g. Aditya University"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        fullWidth
                        required
                    />

                    {/* 2. University Contact */}
                    <TextField
                        label="University Contact*"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        fullWidth
                        type="tel"
                    />

                    {/* 3. Address */}
                    <TextField
                        label="Address*"
                        placeholder="Enter full address..."
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        fullWidth
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveUniversity}
                        disabled={saving || (duplicateWarning && duplicateWarning.isBlocked)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#d06c38',
                            '&:hover': { bgcolor: '#b85826' },
                            px: 3
                        }}
                    >
                        {saving ? <CircularProgress size={20} color="inherit" /> : editingUniversity ? 'Update University' : 'Create University'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------------------------------------------------------------- */}
            {/* BULK IMPORT DIALOG */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUploadOutlinedIcon sx={{ color: '#0b5299' }} />
                        Bulk Import Universities (Excel / CSV)
                    </Box>
                    <IconButton size="small" onClick={() => setImportModalOpen(false)}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
                    {/* Step 1: Template Download */}
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1e40af' }}>
                                    Step 1: Download Sample Excel Template
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#3b82f6', display: 'block', mt: 0.2 }}>
                                    The template contains columns: University Name, University Contact, Address, Status.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<FileDownloadOutlinedIcon />}
                                onClick={handleDownloadTemplate}
                                sx={{ bgcolor: '#0b5299', '&:hover': { bgcolor: '#083d73' }, textTransform: 'none', fontWeight: 600 }}
                            >
                                Download Template (.xlsx)
                            </Button>
                        </Box>
                    </Paper>

                    {/* Step 2: Upload File Box */}
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', mb: 1 }}>
                            Step 2: Choose Excel or CSV file
                        </Typography>
                        <Box
                            component="label"
                            sx={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: 3,
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                bgcolor: '#f8fafc',
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: '#0b5299', bgcolor: '#f0f7ff' }
                            }}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                hidden
                                onChange={handleFileSelected}
                            />
                            <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: '#0b5299', mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                                {importFile ? importFile.name : 'Click to browse Excel (.xlsx, .xls) or CSV file'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5 }}>
                                {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'Supports standard columns matching template'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Step 3: Preview */}
                    {importPreviewRows.length > 0 && !importResult && (
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#334155', mb: 1 }}>
                                Previewing first {importPreviewRows.length} rows:
                            </Typography>
                            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 220 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>University Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>University Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Address</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {importPreviewRows.map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{r['University Name'] || r['Name'] || r['name'] || '—'}</TableCell>
                                                <TableCell sx={{ fontSize: '12px' }}>{r['University Contact'] || r['Phone'] || r['phone'] || '—'}</TableCell>
                                                <TableCell sx={{ fontSize: '12px' }}>{r['Address'] || r['address'] || '—'}</TableCell>
                                                <TableCell sx={{ fontSize: '12px' }}>{r['Status'] || 'ACTIVE'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* Results Report */}
                    {importResult && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                                Import Summary
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
                                <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>
                                        {importResult.addedCount}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#15803d' }}>
                                        Added Successfully
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#ea580c' }}>
                                        {importResult.skippedCount}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#c2410c' }}>
                                        Duplicates Skipped
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626' }}>
                                        {importResult.errorCount}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#b91c1c' }}>
                                        Errors
                                    </Typography>
                                </Box>
                            </Box>

                            {importResult.skipped && importResult.skipped.length > 0 && (
                                <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#ea580c', display: 'block', mb: 0.5 }}>
                                        Skipped duplicates:
                                    </Typography>
                                    {importResult.skipped.map((s, idx) => (
                                        <Typography key={idx} variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                            • Row {s.row}: <b>{s.name}</b> ({s.reason})
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setImportModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                        Close
                    </Button>
                    {!importResult && (
                        <Button
                            variant="contained"
                            onClick={handleExecuteImport}
                            disabled={importing || !importFile}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: '#0b5299',
                                '&:hover': { bgcolor: '#083d73' },
                                px: 3
                            }}
                        >
                            {importing ? <CircularProgress size={20} color="inherit" /> : 'Start Import'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ------------------------------------------------------------- */}
            {/* DELETE CONFIRMATION DIALOG */}
            {/* ------------------------------------------------------------- */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Delete University
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                        Are you sure you want to delete <b>{universityToDelete?.name}</b>?
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', mt: 1 }}>
                        If teams are registered under this university, deletion will be blocked to preserve record integrity.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#dc2626',
                            '&:hover': { bgcolor: '#b91c1c' }
                        }}
                    >
                        {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UniversityMaster;
