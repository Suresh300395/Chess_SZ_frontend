import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tooltip,
    Card,
    CardContent,
    CircularProgress,
    Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HotelIcon from '@mui/icons-material/Hotel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LayersIcon from '@mui/icons-material/Layers';
import InfoIcon from '@mui/icons-material/Info';
import GroupsIcon from '@mui/icons-material/Groups';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import io from 'socket.io-client';
import { toast } from 'sonner';
import CustomTabs from '../Common/Tabs';
import { registrationAPI, blocksAPI, SOCKET_URL } from '../../utils/api';


const MAX_ROOM_CAPACITY = 4;

const HostelProvision = () => {
    const [accommodationList, setAccommodationList] = useState([]);
    const [dbBlocks, setDbBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Players');
    const tabsList = ['Players', 'Coaches / Managers'];

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Mapping Room
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedBuilding, setSelectedBuilding] = useState('Boys Hostel Block A');
    const [selectedFloor, setSelectedFloor] = useState('Floor 1');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Unassign confirmation dialog
    const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
    const [personToUnassign, setPersonToUnassign] = useState(null);
    const [unassigning, setUnassigning] = useState(false);

    // Guidelines management state
    const [guidelines, setGuidelines] = useState([]);
    const [guidelinesLoading, setGuidelinesLoading] = useState(true);
    const [guidelinesSaving, setGuidelinesSaving] = useState(false);
    const [newPoint, setNewPoint] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');

    const fetchGuidelines = async () => {
        try {
            setGuidelinesLoading(true);
            const res = await blocksAPI.getGuidelines();
            if (res.ok) {
                const data = await res.json();
                setGuidelines(data.points || []);
            }
        } catch (err) {
            console.error('Failed to load guidelines:', err);
        } finally {
            setGuidelinesLoading(false);
        }
    };

    const handleAddGuideline = () => {
        const trimmed = newPoint.trim();
        if (!trimmed) return;
        setGuidelines(prev => [...prev, trimmed]);
        setNewPoint('');
    };

    const handleDeleteGuideline = (index) => {
        setGuidelines(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setEditingText('');
        }
    };

    const handleStartEdit = (index, text) => {
        setEditingIndex(index);
        setEditingText(text);
    };

    const handleSaveEdit = (index) => {
        const trimmed = editingText.trim();
        if (!trimmed) return;
        setGuidelines(prev => prev.map((pt, i) => i === index ? trimmed : pt));
        setEditingIndex(null);
        setEditingText('');
    };

    const handleSaveGuidelines = async () => {
        try {
            setGuidelinesSaving(true);
            const res = await blocksAPI.updateGuidelines(guidelines);
            if (res.ok) {
                toast.success('Accommodation guidelines saved successfully!');
            } else {
                toast.error('Failed to save guidelines');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error saving guidelines');
        } finally {
            setGuidelinesSaving(false);
        }
    };

    const handleResetGuidelines = () => {
        const DEFAULT_GUIDELINES = [
            'Keep the room clean and maintain discipline.',
            'Any damage to property will be charged.',
            'Visitors are not allowed inside the hostel rooms.',
            'Follow hostel timings strictly.',
            'Report maintenance issues to the warden office.',
            'Ragging is strictly prohibited.'
        ];
        setGuidelines(DEFAULT_GUIDELINES);
        toast.info('Reset to default guidelines. Click "Save Guidelines" to persist.');
    };

    // Fetch all registrations (fetching both accommodation Yes & No)
    const fetchRegistrations = async () => {
        try {
            const response = await registrationAPI.getAll();
            if (response.ok) {
                const data = await response.json();
                let list = [];
                data.forEach(reg => {
                    if (reg.players && Array.isArray(reg.players)) {
                        reg.players.forEach(player => {
                            list.push({
                                registrationId: reg._id,
                                id: player._id || Math.random().toString(),
                                name: player.playerName,
                                role: 'Player',
                                university: reg.universityName,
                                gender: player.gender || 'Not Specified',
                                phone: player.mobileNo || 'N/A',
                                accommodation: player.accommodation || 'No',
                                roomAllocation: player.roomAllocation || null
                            });
                        });
                    }
                    if (reg.coaches && Array.isArray(reg.coaches)) {
                        reg.coaches.forEach(coach => {
                            list.push({
                                registrationId: reg._id,
                                id: coach._id || Math.random().toString(),
                                name: coach.name,
                                role: coach.role || 'Coach',
                                university: reg.universityName,
                                gender: coach.gender || 'Not Specified',
                                phone: coach.mobileNo || 'N/A',
                                accommodation: coach.accommodation || 'No',
                                roomAllocation: coach.roomAllocation || null
                            });
                        });
                    }
                });
                setAccommodationList(list);
            } else {
                toast.error('Failed to load participants list');
            }

            // Fetch dynamic blocks
            // Using API_BASE import is preferred, but using fetch from similar endpoints
            const API_BASE = SOCKET_URL.replace(/:3001$/, ':3003') + '/api';
            const blocksRes = await fetch(`${API_BASE}/blocks`);
            if (blocksRes.ok) {
                const blocksData = await blocksRes.json();
                setDbBlocks(blocksData);
            }
        } catch (err) {
            console.error('Error fetching registrations:', err);
            toast.error('Error connecting to server', { id: 'error-connecting-to-server' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
        fetchGuidelines();

        const socket = io(SOCKET_URL);
        socket.on('dataUpdated', () => {
            fetchRegistrations();
        });
        socket.on('accommodation_guidelines_updated', (data) => {
            if (data && data.points) {
                setGuidelines(data.points);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Helper: calculate occupancy for a specific building, floor, room
    const getRoomOccupancy = React.useCallback((building, floor, roomNumber, excludePersonId = null) => {
        return accommodationList.filter(p =>
            p.roomAllocation &&
            p.roomAllocation.building === building &&
            p.roomAllocation.floor === floor &&
            p.roomAllocation.roomNumber === roomNumber &&
            p.id !== excludePersonId
        ).length;
    }, [accommodationList]);

    // Filter list for active tab
    const tabFilteredList = useMemo(() => {
        return accommodationList.filter(person =>
            activeTab === 'Players' ? person.role === 'Player' : person.role !== 'Player'
        );
    }, [accommodationList, activeTab]);

    // Search results: Only show if searchQuery is not empty and accommodation is 'Yes'!
    // If Accommodation is 'No', do not show in Accommodation dashboard search
    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return [];

        return tabFilteredList.filter(person =>
            person.accommodation === 'Yes' &&
            ((person.name && person.name.toLowerCase().includes(query)) ||
            (person.university && person.university.toLowerCase().includes(query)))
        );
    }, [tabFilteredList, searchQuery]);

    // Mapped members list:
    // "and search box kinda evaitey rooms map map aina vaallu untaro vaallaney ikkada chupistam idi same for coach kuda"
    const mappedList = useMemo(() => {
        return tabFilteredList.filter(person => Boolean(person.roomAllocation));
    }, [tabFilteredList]);

    // Statistics for summary badges
    const stats = useMemo(() => {
        const total = tabFilteredList.length;
        const requestedAcc = tabFilteredList.filter(p => p.accommodation === 'Yes').length;
        const mappedCount = tabFilteredList.filter(p => Boolean(p.roomAllocation)).length;
        const pendingCount = tabFilteredList.filter(p => p.accommodation === 'Yes' && !p.roomAllocation).length;
        return { total, requestedAcc, mappedCount, pendingCount };
    }, [tabFilteredList]);

    const availableFloors = useMemo(() => {
        const currentBuildingObj = dbBlocks.find(b => b.name === selectedBuilding);
        return currentBuildingObj?.floors?.map(f => f.floorName) || [];
    }, [selectedBuilding, dbBlocks]);

    // Available rooms for selected building & floor (Filter out full rooms >= capacity)
    // "okavela aa room fill aipotey db lo manam aa room chupinchamu"
    const availableRooms = useMemo(() => {
        const currentBuildingObj = dbBlocks.find(b => b.name === selectedBuilding);
        const floorObj = currentBuildingObj?.floors?.find(f => f.floorName === selectedFloor);
        const rooms = floorObj?.rooms || [];
        const capacity = currentBuildingObj?.capacityPerRoom || 4;

        return rooms
            .map(room => {
                const occupancy = getRoomOccupancy(selectedBuilding, selectedFloor, room, selectedPerson?.id);
                const isCurrentPersonsRoom =
                    selectedPerson?.roomAllocation?.building === selectedBuilding &&
                    selectedPerson?.roomAllocation?.floor === selectedFloor &&
                    selectedPerson?.roomAllocation?.roomNumber === room;

                return {
                    roomNumber: room,
                    occupancy,
                    availableSlots: capacity - occupancy,
                    isFull: occupancy >= capacity && !isCurrentPersonsRoom,
                    capacity
                };
            })
            .filter(r => !r.isFull); // Hide filled rooms from dropdown!
    }, [selectedBuilding, selectedFloor, getRoomOccupancy, selectedPerson, dbBlocks]);

    // Handle Open Map Room Modal
    const handleOpenMapDialog = (person) => {
        setSelectedPerson(person);

        // Pre-fill building
        if (person.roomAllocation) {
            setSelectedBuilding(person.roomAllocation.building || (dbBlocks.length > 0 ? dbBlocks[0].name : ''));
            setSelectedFloor(person.roomAllocation.floor || '');
            setSelectedRoom(person.roomAllocation.roomNumber || '');
        } else {
            // Suggest default building
            const defaultBuilding = dbBlocks.length > 0 ? dbBlocks[0].name : '';
            setSelectedBuilding(defaultBuilding);
            const defaultBuildingObj = dbBlocks.find(b => b.name === defaultBuilding);
            const defaultFloor = defaultBuildingObj?.floors?.length > 0 ? defaultBuildingObj.floors[0].floorName : '';
            setSelectedFloor(defaultFloor);
            setSelectedRoom('');
        }

        setMapDialogOpen(true);
    };

    const handleCloseMapDialog = () => {
        setMapDialogOpen(false);
        setSelectedPerson(null);
        setSelectedRoom('');
    };

    // Handle Saving Room Allocation
    const handleSaveAllocation = async () => {
        if (!selectedRoom) {
            toast.error('Please select a room');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:3003/api/registration/assign-room', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationId: selectedPerson.registrationId,
                    personId: selectedPerson.id,
                    role: selectedPerson.role,
                    building: selectedBuilding,
                    floor: selectedFloor,
                    roomNumber: selectedRoom
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Room ${selectedRoom} mapped successfully to ${selectedPerson.name}!`);
                handleCloseMapDialog();
                fetchRegistrations();
            } else {
                toast.error(data.message || 'Failed to assign room');
            }
        } catch (err) {
            console.error('Error saving allocation:', err);
            toast.error('Server error while saving room allocation');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Open Unassign Dialog
    const handleOpenUnassignDialog = (person) => {
        setPersonToUnassign(person);
        setUnassignDialogOpen(true);
    };

    const handleCloseUnassignDialog = () => {
        setUnassignDialogOpen(false);
        setPersonToUnassign(null);
    };

    // Handle Confirm Unassign
    const handleConfirmUnassign = async () => {
        if (!personToUnassign) return;
        setUnassigning(true);
        try {
            const response = await fetch('http://localhost:3003/api/registration/unassign-room', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationId: personToUnassign.registrationId,
                    personId: personToUnassign.id,
                    role: personToUnassign.role
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Room unassigned for ${personToUnassign.name}`);
                handleCloseUnassignDialog();
                fetchRegistrations();
            } else {
                toast.error(data.message || 'Failed to unassign room');
            }
        } catch (err) {
            console.error('Error unassigning room:', err);
            toast.error('Server error while unassigning room');
        } finally {
            setUnassigning(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <HotelIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                    <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                        Accommodation Allocation
                    </Typography>
                </Box>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                    Search participants by name or university to assign hostel rooms, manage capacities, and review allocations.
                </Typography>
            </Box>

            {/* Quick Stats Banner */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
                {[
                    {
                        title: `Total ${activeTab}`,
                        count: stats.total,
                        subtitle: 'Total Enrolled',
                        badge: 'Total',
                        icon: <GroupsIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <GroupsIcon sx={{ fontSize: 90, color: '#0b5299' }} />,
                        gradient: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
                        shadow: 'rgba(11, 82, 153, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#93c5fd',
                        badgeBg: '#eff6ff',
                        badgeColor: '#1d4ed8'
                    },
                    {
                        title: 'Accommodation (Yes)',
                        count: stats.requestedAcc,
                        subtitle: 'Rooms Requested',
                        badge: 'Requested',
                        icon: <HotelIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <HotelIcon sx={{ fontSize: 90, color: '#059669' }} />,
                        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        shadow: 'rgba(5, 150, 105, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f6fdf9 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#a7f3d0',
                        badgeBg: '#ecfdf5',
                        badgeColor: '#047857'
                    },
                    {
                        title: 'Rooms Mapped',
                        count: stats.mappedCount,
                        subtitle: 'Allocated Rooms',
                        badge: 'Allocated',
                        icon: <HowToRegIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <HowToRegIcon sx={{ fontSize: 90, color: '#2563eb' }} />,
                        gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        shadow: 'rgba(37, 99, 235, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #eff6ff 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#bfdbfe',
                        badgeBg: '#eff6ff',
                        badgeColor: '#1d4ed8'
                    },
                    {
                        title: 'Pending Allocation',
                        count: stats.pendingCount,
                        subtitle: 'Yet To Be Allocated',
                        badge: 'Pending',
                        icon: <MeetingRoomIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                        bgIcon: <MeetingRoomIcon sx={{ fontSize: 90, color: '#d97706' }} />,
                        gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                        shadow: 'rgba(217, 119, 6, 0.22)',
                        bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
                        borderColor: '#e2e8f0',
                        hoverBorder: '#fde68a',
                        badgeBg: '#fffbeb',
                        badgeColor: '#b45309'
                    }
                ].map((stat, index) => (
                    <Card
                        key={index}
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

                        <CardContent sx={{ py: 2, pr: 2, pl: 1.25, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
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
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            fontSize: { xs: '2rem', md: '2.2rem' },
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
                ))}
            </Box>

            {/* Custom Tabs */}
            <Box sx={{ mb: 3 }}>
                <CustomTabs tabs={tabsList} activeTab={activeTab} setActiveTab={setActiveTab} />
            </Box>

            {/* Search Box Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 4,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: '0 4px 16px rgba(11, 82, 153, 0.05)'
                }}
            >
                <Typography sx={{ fontWeight: 600, color: '#0b5299', mb: 1.5, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon sx={{ fontSize: 20 }} />
                    Search Participants to Map Room
                </Typography>

                <TextField
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Type ${activeTab === 'Players' ? 'Player' : 'Coach'} name or University to search details...`}
                    variant="outlined"
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#0b5299' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                            sx: {
                                borderRadius: '10px',
                                bgcolor: '#ffffff',
                                '&:hover': { borderColor: '#0b5299' },
                                '&.Mui-focused': { borderColor: '#0b5299' }
                            }
                        }
                    }}
                />

                {/* Initial State Helper or Search Results */}
                {searchQuery.trim() === '' ? (
                    <Box
                        sx={{
                            mt: 2,
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            border: '1px dashed #cbd5e1'
                        }}
                    >
                        <InfoIcon sx={{ color: '#64748b' }} />
                        <Typography sx={{ color: '#475569', fontSize: '0.9rem' }}>
                            <b>Initial View:</b> Full participant table is hidden by default. Enter a <b>Name</b> or <b>University</b> in the search box above to find individuals and assign hostel rooms.
                        </Typography>
                    </Box>
                ) : (
                    /* Search Results Table */
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                                Search Results for "{searchQuery}" ({searchResults.length} found)
                            </Typography>
                            {searchResults.length > 0 && (
                                <Chip
                                    label={`${searchResults.length} Match${searchResults.length === 1 ? '' : 'es'}`}
                                    size="small"
                                    color="primary"
                                    sx={{ bgcolor: '#0b5299' }}
                                />
                            )}
                        </Box>

                        <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none', overflowX: 'auto', width: '100%' }}>
                            <Table sx={{ minWidth: 700 }} size="medium">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155', width: 60 }}>S.No</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>University</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Gender</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Phone</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Accommodation</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#334155', minWidth: 180 }}>Room Mapping</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {searchResults.length > 0 ? (
                                        searchResults.map((person, index) => (
                                            <TableRow
                                                key={person.id}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    '&:hover': { bgcolor: '#f8fafc' }
                                                }}
                                            >
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{person.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={person.role}
                                                        size="small"
                                                        color={person.role === 'Coach' ? 'secondary' : 'primary'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{person.university}</TableCell>
                                                <TableCell>{person.gender}</TableCell>
                                                <TableCell>{person.phone}</TableCell>
                                                {/* Accommodation Column: Yes / No from DB */}
                                                <TableCell>
                                                    {person.accommodation === 'Yes' ? (
                                                        <Chip
                                                            icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                                                            label="Yes"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#ecfdf5',
                                                                color: '#065f46',
                                                                fontWeight: 600,
                                                                borderColor: '#a7f3d0'
                                                            }}
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<CancelIcon sx={{ fontSize: '16px !important' }} />}
                                                            label="No"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#f1f5f9',
                                                                color: '#64748b',
                                                                fontWeight: 600,
                                                                borderColor: '#cbd5e1'
                                                            }}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                                {/* Room Mapping Column */}
                                                <TableCell>
                                                    {person.roomAllocation ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                icon={<HotelIcon sx={{ fontSize: '15px !important' }} />}
                                                                label={`${person.roomAllocation.roomNumber} (${person.roomAllocation.building.split(' ')[0]} ${person.roomAllocation.floor.replace('Floor ', 'F')})`}
                                                                size="small"
                                                                sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, border: '1px solid #bfdbfe' }}
                                                            />
                                                            <Tooltip title="Change Room Allocation">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenMapDialog(person)}
                                                                    sx={{ color: '#2563eb', bgcolor: '#f0fdf4', p: 0.5 }}
                                                                >
                                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<MeetingRoomIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => handleOpenMapDialog(person)}
                                                            sx={{
                                                                bgcolor: '#0b5299',
                                                                color: '#ffffff',
                                                                fontWeight: 600,
                                                                textTransform: 'none',
                                                                borderRadius: 1.5,
                                                                px: 1.8,
                                                                py: 0.6,
                                                                '&:hover': { bgcolor: '#093f77' }
                                                            }}
                                                        >
                                                            Map a Room
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No {activeTab.toLowerCase()} requesting accommodation found matching "{searchQuery}".
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Paper>

            {/* Currently Mapped Participants Section (Below Search Box) */}
            {/* "and search box kinda evaitey rooms map map aina vaallu untaro vaallaney ikkada chupistam idi same for coach kuda" */}
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HotelIcon sx={{ color: '#0b5299', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                            Currently Mapped {activeTab}
                        </Typography>
                        <Chip
                            label={`${mappedList.length} Allocated`}
                            size="small"
                            sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 600, border: '1px solid #a7f3d0' }}
                        />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Showing all {activeTab.toLowerCase()} with assigned rooms
                    </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)', borderRadius: 2.5, border: '1px solid #e2e8f0', overflowX: 'auto', width: '100%' }}>
                    <Table sx={{ minWidth: 700 }} aria-label="mapped accommodations table">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 60 }}>S.No</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>University</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Gender</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Accommodation</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Allocated Room</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 140 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} sx={{ color: '#0b5299', mb: 1 }} />
                                        <Typography sx={{ color: 'text.secondary' }}>Loading allocations...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : mappedList.length > 0 ? (
                                mappedList.map((person, index) => (
                                    <TableRow
                                        key={person.id}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            '&:hover': { bgcolor: '#f8fafc' }
                                        }}
                                    >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{person.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={person.role}
                                                size="small"
                                                color={person.role === 'Coach' ? 'secondary' : 'primary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{person.university}</TableCell>
                                        <TableCell>{person.gender}</TableCell>
                                        <TableCell>{person.phone}</TableCell>
                                        <TableCell>
                                            {person.accommodation === 'Yes' ? (
                                                <Chip
                                                    icon={<CheckCircleIcon sx={{ fontSize: '15px !important' }} />}
                                                    label="Yes"
                                                    size="small"
                                                    sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 600 }}
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<CancelIcon sx={{ fontSize: '15px !important' }} />}
                                                    label="No"
                                                    size="small"
                                                    sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}
                                                />
                                            )}
                                        </TableCell>
                                        {/* Allocated Room Column */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Chip
                                                    icon={<HotelIcon sx={{ fontSize: '15px !important' }} />}
                                                    label={person.roomAllocation.roomNumber}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#dbeafe',
                                                        color: '#1e40af',
                                                        fontWeight: 700,
                                                        width: 'fit-content'
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                    {person.roomAllocation.building} • {person.roomAllocation.floor}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        {/* Actions Column */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Tooltip title="Change Room">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenMapDialog(person)}
                                                        sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Unassign Room">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenUnassignDialog(person)}
                                                        sx={{ color: '#dc2626', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <HotelIcon sx={{ fontSize: 44, color: '#cbd5e1' }} />
                                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                                                No {activeTab.toLowerCase()} mapped to rooms yet.
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                Use the search box above to search by name or university and click "Map a Room".
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Accommodation Guidelines Management Section (Below Currently Mapped Participants Table) */}
            <Paper
                elevation={0}
                sx={{
                    mt: 4,
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 2, color: '#0b5299', display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.2rem' } }}>
                                    Accommodation Guidelines
                                </Typography>
                                <Chip
                                    label={`${guidelines.length} Points`}
                                    size="small"
                                    sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 600, border: '1px solid #a7f3d0' }}
                                />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', sm: '13px' }, mt: 0.25 }}>
                                Add or edit guidelines bullet points. These appear dynamically in the User Dashboard under Accommodation Details.
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleResetGuidelines}
                            startIcon={<RestartAltIcon />}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 600,
                                color: '#64748b',
                                borderColor: '#cbd5e1',
                                fontSize: '12.5px'
                            }}
                        >
                            Reset Defaults
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleSaveGuidelines}
                            disabled={guidelinesSaving}
                            startIcon={guidelinesSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            sx={{
                                bgcolor: '#0b5299',
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '12.5px',
                                px: 2.5,
                                boxShadow: '0 2px 8px rgba(11, 82, 153, 0.25)',
                                '&:hover': { bgcolor: '#09407a' }
                            }}
                        >
                            {guidelinesSaving ? 'Saving...' : 'Save Guidelines'}
                        </Button>
                    </Stack>
                </Box>

                {/* Add New Guideline Input */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a new accommodation guideline bullet point and press Enter or click 'Add Point'..."
                        value={newPoint}
                        onChange={(e) => setNewPoint(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddGuideline();
                            }
                        }}
                        sx={{
                            bgcolor: '#f8fafc',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                fontSize: '13.5px'
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddGuideline}
                        disabled={!newPoint.trim()}
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{
                            bgcolor: '#0b5299',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 2.5,
                            whiteSpace: 'nowrap',
                            height: 40,
                            flexShrink: 0,
                            fontSize: '13px'
                        }}
                    >
                        Add Point
                    </Button>
                </Box>

                {/* Guidelines List */}
                {guidelinesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: '#0b5299' }} />
                    </Box>
                ) : guidelines.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            No guidelines entered yet. Add bullet points above or click "Reset Defaults".
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.25}>
                        {guidelines.map((point, index) => {
                            const isEditing = editingIndex === index;
                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: { xs: 1.25, sm: 1.5 },
                                        bgcolor: isEditing ? '#eff6ff' : '#f8fafc',
                                        borderRadius: 2,
                                        border: isEditing ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                        gap: 1.5,
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: '50%',
                                                bgcolor: '#e0f2fe',
                                                color: '#0369a1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                flexShrink: 0
                                            }}
                                        >
                                            {index + 1}
                                        </Box>

                                        {isEditing ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSaveEdit(index);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingIndex(null);
                                                    }
                                                }}
                                                autoFocus
                                                sx={{
                                                    bgcolor: '#ffffff',
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                        fontSize: '13px'
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: '12.5px', sm: '13.5px' },
                                                    color: '#334155',
                                                    fontWeight: 500,
                                                    wordBreak: 'break-word',
                                                    flex: 1
                                                }}
                                            >
                                                {point}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                        {isEditing ? (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleSaveEdit(index)}
                                                    sx={{ color: '#16a34a', bgcolor: '#dcfce7', '&:hover': { bgcolor: '#bbf7d0' } }}
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setEditingIndex(null)}
                                                    sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                <Tooltip title="Edit Point">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleStartEdit(index, point)}
                                                        sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Point">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteGuideline(index)}
                                                        sx={{ color: '#dc2626', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Paper>

            {/* Modal: Map a Room Form */}
            <Dialog
                open={mapDialogOpen}
                onClose={handleCloseMapDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MeetingRoomIcon sx={{ color: '#0b5299' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b5299' }}>
                            {selectedPerson?.roomAllocation ? 'Change Room Allocation' : 'Map a Room'}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleCloseMapDialog}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ py: 2.5 }}>
                    {selectedPerson && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Participant Overview Card */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: '#f8fafc',
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', mb: 0.5 }}>
                                    {selectedPerson.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                                    {selectedPerson.university}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip label={selectedPerson.role} size="small" color="primary" variant="outlined" />
                                    <Chip label={`Gender: ${selectedPerson.gender}`} size="small" variant="outlined" />
                                    <Chip
                                        label={`Acc Requested: ${selectedPerson.accommodation}`}
                                        size="small"
                                        color={selectedPerson.accommodation === 'Yes' ? 'success' : 'default'}
                                    />
                                    {selectedPerson.roomAllocation && (
                                        <Chip
                                            label={`Current: ${selectedPerson.roomAllocation.roomNumber}`}
                                            size="small"
                                            sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}
                                        />
                                    )}
                                </Stack>
                            </Paper>

                            {selectedPerson.accommodation === 'No' && (
                                <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                                    <b>Note:</b> This participant requested <b>No</b> accommodation in their registration form. You can still map a room if approved.
                                </Alert>
                            )}

                            {/* Building Selector */}
                            <FormControl fullWidth size="small">
                                <InputLabel id="building-select-label">Building Name</InputLabel>
                                <Select
                                    labelId="building-select-label"
                                    value={selectedBuilding}
                                    label="Building Name"
                                    onChange={(e) => {
                                        setSelectedBuilding(e.target.value);
                                        setSelectedRoom(''); // Reset room on building change
                                    }}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <ApartmentIcon sx={{ color: '#0b5299', fontSize: 20 }} />
                                        </InputAdornment>
                                    }
                                >
                                    {dbBlocks.map(bldg => (
                                        <MenuItem key={bldg.name} value={bldg.name}>
                                            {bldg.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Floor Selector */}
                            <FormControl fullWidth size="small">
                                <InputLabel id="floor-select-label">Floor</InputLabel>
                                <Select
                                    labelId="floor-select-label"
                                    value={selectedFloor}
                                    label="Floor"
                                    onChange={(e) => {
                                        setSelectedFloor(e.target.value);
                                        setSelectedRoom(''); // Reset room on floor change
                                    }}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <LayersIcon sx={{ color: '#0b5299', fontSize: 20 }} />
                                        </InputAdornment>
                                    }
                                >
                                    {availableFloors.map(fl => (
                                        <MenuItem key={fl} value={fl}>
                                            {fl}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Room Selector (Filtered by max 4 members capacity) */}
                            <FormControl fullWidth size="small">
                                <InputLabel id="room-select-label">Room Number</InputLabel>
                                <Select
                                    labelId="room-select-label"
                                    value={selectedRoom}
                                    label="Room Number"
                                    onChange={(e) => setSelectedRoom(e.target.value)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <HotelIcon sx={{ color: '#0b5299', fontSize: 20 }} />
                                        </InputAdornment>
                                    }
                                >
                                    {availableRooms.map(item => (
                                        <MenuItem key={item.roomNumber} value={item.roomNumber}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                    {item.roomNumber}
                                                </Typography>
                                                <Chip
                                                    label={`${item.occupancy}/${item.capacity} Occupied (${item.availableSlots} beds left)`}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        bgcolor: item.occupancy === 0 ? '#ecfdf5' : '#eff6ff',
                                                        color: item.occupancy === 0 ? '#047857' : '#1d4ed8'
                                                    }}
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Notice if all rooms on this floor are full */}
                            {availableRooms.length === 0 && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    All rooms on <b>{selectedFloor}</b> of <b>{selectedBuilding}</b> are currently at maximum capacity. Please select another floor or building block.
                                </Alert>
                            )}

                            {/* Capacity Info helper */}
                            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                                <Typography variant="caption" sx={{ color: '#166534', display: 'block', fontWeight: 500 }}>
                                    ℹ️ <b>Hostel Rules:</b> Each room accommodates a maximum of 4 members. Fully occupied rooms (4/4 members) are automatically hidden from this list.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCloseMapDialog}
                        variant="outlined"
                        disabled={submitting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveAllocation}
                        variant="contained"
                        disabled={!selectedRoom || submitting}
                        sx={{
                            bgcolor: '#0b5299',
                            color: '#ffffff',
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            '&:hover': { bgcolor: '#093f77' }
                        }}
                    >
                        {submitting ? <CircularProgress size={22} color="inherit" /> : 'Confirm & Save Allocation'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal: Confirm Unassign Dialog */}
            <Dialog
                open={unassignDialogOpen}
                onClose={handleCloseUnassignDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ color: '#dc2626', fontWeight: 700, pb: 1 }}>
                    Unassign Room?
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#475569', fontSize: '0.95rem' }}>
                        Are you sure you want to remove the hostel room assignment for <b>{personToUnassign?.name}</b>?
                    </Typography>
                    {personToUnassign?.roomAllocation && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                            <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, display: 'block' }}>
                                Currently Assigned: {personToUnassign.roomAllocation.roomNumber} ({personToUnassign.roomAllocation.building}, {personToUnassign.roomAllocation.floor})
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseUnassignDialog} variant="outlined" disabled={unassigning} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmUnassign}
                        variant="contained"
                        color="error"
                        disabled={unassigning}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 2.5 }}
                    >
                        {unassigning ? <CircularProgress size={22} color="inherit" /> : 'Yes, Unassign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HostelProvision;
