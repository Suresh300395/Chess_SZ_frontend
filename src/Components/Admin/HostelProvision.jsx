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
    Stack,
    Checkbox,
    Avatar
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
import GroupsIcon from '@mui/icons-material/Groups';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import SchoolIcon from '@mui/icons-material/School';
import PaymentsIcon from '@mui/icons-material/Payments';
import PrintIcon from '@mui/icons-material/Print';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ReceiptIcon from '@mui/icons-material/Receipt';
import io from 'socket.io-client';
import { toast } from 'sonner';
import CustomTabs from '../Common/Tabs';
import { registrationAPI, blocksAPI, SOCKET_URL } from '../../utils/api';

const HostelProvision = () => {
    const [mappedViewMode, setMappedViewMode] = useState('table');
    const [searchViewMode, setSearchViewMode] = useState('table');
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

    // Modal state for Bulk University Room Allotment
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkSelectedUniversity, setBulkSelectedUniversity] = useState('');
    const [bulkBuilding, setBulkBuilding] = useState('');
    const [bulkFloor, setBulkFloor] = useState('');
    const [bulkRoom, setBulkRoom] = useState('');
    const [bulkSelectedMemberIds, setBulkSelectedMemberIds] = useState([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Raw registrations list to access full registration objects (including cautionDeposit)
    const [rawRegistrations, setRawRegistrations] = useState([]);

    // Caution Deposit state for Step 3 in bulk modal
    const [cautionPaidByPersonId, setCautionPaidByPersonId] = useState('');
    const [cautionPaymentMode, setCautionPaymentMode] = useState('Cash');
    const [cautionSubmitting, setCautionSubmitting] = useState(false);
    const [cautionReceiptModalOpen, setCautionReceiptModalOpen] = useState(false);

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
                setRawRegistrations(data);
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
                                roomAllocation: (player.roomAllocation && player.roomAllocation.roomNumber) ? player.roomAllocation : null
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
                                roomAllocation: (coach.roomAllocation && coach.roomAllocation.roomNumber) ? coach.roomAllocation : null
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
        socket.on('caution_deposit_updated', () => {
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
                const actualTotalOccupancy = getRoomOccupancy(selectedBuilding, selectedFloor, room, null);
                const isCurrentPersonsRoom =
                    selectedPerson?.roomAllocation?.building === selectedBuilding &&
                    selectedPerson?.roomAllocation?.floor === selectedFloor &&
                    selectedPerson?.roomAllocation?.roomNumber === room;

                return {
                    roomNumber: room,
                    occupancy,
                    actualTotalOccupancy,
                    isCurrentPersonsRoom,
                    availableSlots: capacity - occupancy,
                    isFull: occupancy >= capacity && !isCurrentPersonsRoom,
                    capacity
                };
            })
            .filter(r => !r.isFull); // Hide filled rooms from dropdown!
    }, [selectedBuilding, selectedFloor, getRoomOccupancy, selectedPerson, dbBlocks]);

    // Handle Open Map Room Modal
    const handleOpenMapDialog = (person) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
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

    // Unique list of universities requesting accommodation
    const universitiesList = useMemo(() => {
        const uniMap = new Map();
        accommodationList.forEach(p => {
            if (p.accommodation === 'Yes' && p.university) {
                if (!uniMap.has(p.university)) {
                    uniMap.set(p.university, {
                        university: p.university,
                        total: 0,
                        unallotted: 0,
                        allotted: 0
                    });
                }
                const info = uniMap.get(p.university);
                info.total++;
                if (p.roomAllocation) {
                    info.allotted++;
                } else {
                    info.unallotted++;
                }
            }
        });
        return Array.from(uniMap.values()).sort((a, b) => a.university.localeCompare(b.university));
    }, [accommodationList]);

    // Members separated by role ('Players' vs 'Coaches / Managers') for the selected university
    const universityRoleStats = useMemo(() => {
        if (!bulkSelectedUniversity) {
            return {
                players: { all: [], unallotted: [], allotted: [] },
                coaches: { all: [], unallotted: [], allotted: [] },
                totalUnallotted: 0,
                totalAllotted: 0,
                totalCount: 0
            };
        }
        const uniMembers = accommodationList.filter(p =>
            p.university === bulkSelectedUniversity &&
            p.accommodation === 'Yes'
        );

        const playersAll = uniMembers.filter(p => p.role === 'Player');
        const coachesAll = uniMembers.filter(p => p.role !== 'Player');

        const playersUnallotted = playersAll.filter(p => !p.roomAllocation);
        const playersAllotted = playersAll.filter(p => Boolean(p.roomAllocation));

        const coachesUnallotted = coachesAll.filter(p => !p.roomAllocation);
        const coachesAllotted = coachesAll.filter(p => Boolean(p.roomAllocation));

        const unallottedMembers = uniMembers.filter(p => !p.roomAllocation);
        const allottedMembers = uniMembers.filter(p => Boolean(p.roomAllocation));

        return {
            players: {
                all: playersAll,
                unallotted: playersUnallotted,
                allotted: playersAllotted
            },
            coaches: {
                all: coachesAll,
                unallotted: coachesUnallotted,
                allotted: coachesAllotted
            },
            all: uniMembers,
            unallotted: unallottedMembers,
            allotted: allottedMembers,
            totalUnallotted: unallottedMembers.length,
            totalAllotted: allottedMembers.length,
            totalCount: uniMembers.length
        };
    }, [accommodationList, bulkSelectedUniversity]);

    // All members in bulk modal (unified for selected university)
    const currentUniversityMembers = useMemo(() => {
        return {
            all: universityRoleStats.all || [],
            unallotted: universityRoleStats.unallotted || [],
            allotted: universityRoleStats.allotted || []
        };
    }, [universityRoleStats]);

    // Backward-compatible alias
    const currentTabMembers = currentUniversityMembers;

    // All members across both Players & Coaches who have been allotted a room for bulkSelectedUniversity
    const allAllottedMembers = useMemo(() => {
        return universityRoleStats.allotted || [];
    }, [universityRoleStats]);

    // Find the full registration record for bulkSelectedUniversity
    const currentRegistration = useMemo(() => {
        return rawRegistrations.find(r => r.universityName === bulkSelectedUniversity) || null;
    }, [rawRegistrations, bulkSelectedUniversity]);

    // Caution deposit data for bulkSelectedUniversity
    const cautionDepositData = currentRegistration?.cautionDeposit || {
        paid: false,
        amount: 2000,
        refundStatus: 'N/A'
    };

    // Auto-select member for "Paid by" dropdown if not yet selected
    useEffect(() => {
        if (allAllottedMembers.length > 0) {
            setCautionPaidByPersonId(prev => {
                const exists = allAllottedMembers.some(m => m.id === prev);
                return exists ? prev : (allAllottedMembers[0]?.id || '');
            });
        } else {
            setCautionPaidByPersonId('');
        }
    }, [allAllottedMembers, bulkSelectedUniversity]);

    const bulkAvailableFloors = useMemo(() => {
        const buildingObj = dbBlocks.find(b => b.name === bulkBuilding);
        return buildingObj?.floors?.map(f => f.floorName) || [];
    }, [bulkBuilding, dbBlocks]);

    const bulkBuildingObj = useMemo(() => {
        return dbBlocks.find(b => b.name === bulkBuilding);
    }, [bulkBuilding, dbBlocks]);

    const bulkRoomCapacity = bulkBuildingObj?.capacityPerRoom || 4;

    const bulkAvailableRooms = useMemo(() => {
        const buildingObj = dbBlocks.find(b => b.name === bulkBuilding);
        const floorObj = buildingObj?.floors?.find(f => f.floorName === bulkFloor);
        const rooms = floorObj?.rooms || [];
        const capacity = buildingObj?.capacityPerRoom || 4;

        return rooms.map(room => {
            const occupancy = getRoomOccupancy(bulkBuilding, bulkFloor, room, null);
            const availableSlots = Math.max(0, capacity - occupancy);
            return {
                roomNumber: room,
                occupancy,
                capacity,
                availableSlots,
                isFull: availableSlots <= 0
            };
        }).filter(r => !r.isFull);
    }, [bulkBuilding, bulkFloor, dbBlocks, getRoomOccupancy]);

    const selectedBulkRoomDetails = useMemo(() => {
        if (!bulkRoom) return null;
        return bulkAvailableRooms.find(r => r.roomNumber === bulkRoom) || null;
    }, [bulkAvailableRooms, bulkRoom]);

    const currentRoomMaxSlots = selectedBulkRoomDetails ? selectedBulkRoomDetails.availableSlots : bulkRoomCapacity;

    const handleOpenBulkModal = (universityName = null) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        let targetUni = universityName;
        if (!targetUni && searchResults.length > 0) {
            targetUni = searchResults[0].university;
        }
        if (!targetUni && universitiesList.length > 0) {
            const withPending = universitiesList.find(u => u.unallotted > 0);
            targetUni = withPending ? withPending.university : universitiesList[0].university;
        }

        setBulkSelectedUniversity(targetUni || '');
        setBulkSelectedMemberIds([]);

        const defaultBuilding = dbBlocks.length > 0 ? dbBlocks[0].name : '';
        setBulkBuilding(defaultBuilding);
        const defaultBuildingObj = dbBlocks.find(b => b.name === defaultBuilding);
        const defaultFloor = defaultBuildingObj?.floors?.length > 0 ? defaultBuildingObj.floors[0].floorName : '';
        setBulkFloor(defaultFloor);
        setBulkRoom('');

        setBulkModalOpen(true);
    };

    const handleCloseBulkModal = () => {
        setBulkModalOpen(false);
        setBulkSelectedMemberIds([]);
        setBulkRoom('');
    };

    const handleBulkBuildingChange = (newBuilding) => {
        setBulkBuilding(newBuilding);
        const buildingObj = dbBlocks.find(b => b.name === newBuilding);
        const firstFloor = buildingObj?.floors?.length > 0 ? buildingObj.floors[0].floorName : '';
        setBulkFloor(firstFloor);
        setBulkRoom('');
        setBulkSelectedMemberIds([]);
    };

    const handleBulkFloorChange = (newFloor) => {
        setBulkFloor(newFloor);
        setBulkRoom('');
        setBulkSelectedMemberIds([]);
    };

    const handleBulkRoomChange = (newRoom) => {
        setBulkRoom(newRoom);
        const roomInfo = bulkAvailableRooms.find(r => r.roomNumber === newRoom);
        const slots = roomInfo ? roomInfo.availableSlots : bulkRoomCapacity;
        const unallotted = currentUniversityMembers.unallotted;
        const toSelect = unallotted.slice(0, slots).map(m => m.id);
        setBulkSelectedMemberIds(toSelect);
    };

    const handleToggleMember = (id) => {
        const slots = selectedBulkRoomDetails ? selectedBulkRoomDetails.availableSlots : bulkRoomCapacity;
        setBulkSelectedMemberIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(mId => mId !== id);
            } else {
                if (prev.length >= slots) {
                    toast.warning(`Cannot select more than ${slots} member(s). Room capacity reached! Allot these first, then allot remaining members.`);
                    return prev;
                }
                return [...prev, id];
            }
        });
    };

    const handleSaveBulkAllocation = async () => {
        if (!bulkSelectedUniversity) {
            toast.error('Please select a university');
            return;
        }
        if (!bulkBuilding || !bulkFloor || !bulkRoom) {
            toast.error('Please select Building, Floor, and Room');
            return;
        }
        if (bulkSelectedMemberIds.length === 0) {
            toast.error('Please select at least 1 member to allot to this room');
            return;
        }

        const selectedMembers = currentUniversityMembers.unallotted.filter(m => bulkSelectedMemberIds.includes(m.id));
        if (selectedMembers.length === 0) {
            toast.error('No valid unallotted members selected');
            return;
        }

        setBulkSubmitting(true);
        try {
            const payload = {
                allocations: selectedMembers.map(m => ({
                    registrationId: m.registrationId,
                    personId: m.id,
                    role: m.role
                })),
                building: bulkBuilding,
                floor: bulkFloor,
                roomNumber: bulkRoom
            };

            const res = await registrationAPI.bulkAssignRoom(payload);
            const data = await res.json();

            if (res.ok) {
                toast.success(`Room ${bulkRoom} successfully allotted to ${selectedMembers.length} member(s) of ${bulkSelectedUniversity}!`);
                await fetchRegistrations();
                setBulkSelectedMemberIds([]);
                if (selectedMembers.length > 0) {
                    setCautionPaidByPersonId(selectedMembers[0].id);
                }

                const remainingCount = currentUniversityMembers.unallotted.length - selectedMembers.length;
                if (remainingCount > 0) {
                    toast.info(`${remainingCount} member(s) remaining for ${bulkSelectedUniversity}. You can collect the Caution Deposit in Step 3 below.`);
                    setBulkRoom('');
                } else {
                    toast.success(`All members of ${bulkSelectedUniversity} have been successfully allotted rooms! Please collect Caution Deposit in Step 3 below.`);
                    setBulkRoom('');
                }
            } else {
                toast.error(data.message || 'Failed to allot room in bulk');
            }
        } catch (err) {
            console.error('Error during bulk room allocation:', err);
            toast.error(err.message || 'Server error during bulk allocation');
        } finally {
            setBulkSubmitting(false);
        }
    };

    const handleBulkUnassignSingle = async (member) => {
        try {
            const res = await registrationAPI.unassignRoom({
                registrationId: member.registrationId,
                personId: member.id,
                role: member.role
            });
            if (res.ok) {
                toast.success(`Removed ${member.name} from room assignment.`);
                await fetchRegistrations();
            } else {
                toast.error('Failed to unassign room');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error unassigning room');
        }
    };

    // Handle Manual Caution Deposit Payment (Step 3)
    const handlePayCautionDeposit = async () => {
        if (!bulkSelectedUniversity) {
            toast.error('Please select a university');
            return;
        }
        if (!cautionPaidByPersonId) {
            toast.error('Please select the person who paid in the "Paid by" dropdown');
            return;
        }

        const payingMember = allAllottedMembers.find(m => m.id === cautionPaidByPersonId);
        if (!payingMember) {
            toast.error('Selected member not found among room-allotted members');
            return;
        }

        setCautionSubmitting(true);
        try {
            const payload = {
                registrationId: payingMember.registrationId || currentRegistration?._id,
                universityName: bulkSelectedUniversity,
                paidBy: {
                    personId: payingMember.id,
                    name: payingMember.name,
                    role: payingMember.role,
                    phone: payingMember.phone,
                    roomNumber: payingMember.roomAllocation?.roomNumber || ''
                },
                amount: 2000,
                paymentMode: cautionPaymentMode || 'Cash',
                notes: 'Manual cash collected at hostel desk'
            };

            const res = await registrationAPI.payCautionDeposit(payload);
            const data = await res.json();

            if (res.ok) {
                toast.success(`Caution deposit of ₹2,000 recorded from ${payingMember.name} (${bulkSelectedUniversity})!`);
                await fetchRegistrations();
            } else {
                toast.error(data.message || 'Failed to record caution deposit');
            }
        } catch (err) {
            console.error('Error recording caution deposit:', err);
            toast.error(err.message || 'Server error recording caution deposit');
        } finally {
            setCautionSubmitting(false);
        }
    };

    // Handle Reset / Re-collect Caution Deposit
    const handleResetCautionDeposit = async () => {
        if (!bulkSelectedUniversity) return;
        try {
            const res = await registrationAPI.resetCautionDeposit({
                registrationId: currentRegistration?._id,
                universityName: bulkSelectedUniversity
            });
            if (res.ok) {
                toast.info('Caution deposit status reset to unpaid');
                await fetchRegistrations();
            } else {
                toast.error('Failed to reset caution deposit');
            }
        } catch {
            toast.error('Failed to reset caution deposit');
        }
    };

    // Handle Saving Room Allocation
    const handleSaveAllocation = async () => {
        if (!selectedRoom) {
            toast.error('Please select a room');
            return;
        }

        setSubmitting(true);
        try {
            const response = await registrationAPI.assignRoom({
                registrationId: selectedPerson.registrationId,
                personId: selectedPerson.id,
                role: selectedPerson.role,
                building: selectedBuilding,
                floor: selectedFloor,
                roomNumber: selectedRoom
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
            toast.error(err.message || 'Server error while saving room allocation');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Open Unassign Dialog
    const handleOpenUnassignDialog = (person) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
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
            const response = await registrationAPI.unassignRoom({
                registrationId: personToUnassign.registrationId,
                personId: personToUnassign.id,
                role: personToUnassign.role
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
            toast.error(err.message || 'Server error while unassigning room');
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

                {/* Search Results Table / Cards */}
                {searchQuery.trim() !== '' && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                {searchResults.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<HotelIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleOpenBulkModal(searchResults[0]?.university)}
                                        sx={{
                                            borderColor: '#0b5299',
                                            color: '#0b5299',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            px: 1.5,
                                            py: 0.3,
                                            fontSize: '0.82rem',
                                            bgcolor: 'rgba(11, 82, 153, 0.04)',
                                            '&:hover': { bgcolor: 'rgba(11, 82, 153, 0.1)', borderColor: '#093f77' }
                                        }}
                                    >
                                        Allot Room for {searchResults[0]?.university || 'University'}
                                    </Button>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <Tooltip title="Cards View">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchViewMode('cards')}
                                        sx={{
                                            p: 0.6,
                                            borderRadius: 1.5,
                                            bgcolor: searchViewMode === 'cards' ? '#0b5299' : 'transparent',
                                            color: searchViewMode === 'cards' ? '#ffffff' : '#64748b',
                                            boxShadow: searchViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                            '&:hover': {
                                                bgcolor: searchViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                color: searchViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                            }
                                        }}
                                    >
                                        <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Table View">
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchViewMode('table')}
                                        sx={{
                                            p: 0.6,
                                            borderRadius: 1.5,
                                            bgcolor: searchViewMode === 'table' ? '#0b5299' : 'transparent',
                                            color: searchViewMode === 'table' ? '#ffffff' : '#64748b',
                                            boxShadow: searchViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                            '&:hover': {
                                                bgcolor: searchViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                color: searchViewMode === 'table' ? '#ffffff' : '#0b5299'
                                            }
                                        }}
                                    >
                                        <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {searchViewMode === 'cards' ? (
                            <Box>
                                {searchResults.length === 0 ? (
                                    <Paper sx={{ py: 4, textAlign: 'center', color: '#64748b', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                        <Typography sx={{ color: 'text.secondary' }}>
                                            No {activeTab.toLowerCase()} requesting accommodation found matching "{searchQuery}".
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                                        {searchResults.map((person, index) => (
                                            <Card
                                                key={person.id}
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
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 34, height: 34, bgcolor: '#e0f2fe', color: '#0b5299', fontSize: '0.85rem', fontWeight: 700 }}>
                                                                {person.name ? person.name.charAt(0).toUpperCase() : '#'}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.2 }}>
                                                                    {person.name}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                    #{index + 1}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        <Chip
                                                            label={person.role}
                                                            size="small"
                                                            color={person.role === 'Coach' ? 'secondary' : 'primary'}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                                        />
                                                    </Box>

                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, fontSize: '0.85rem' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#475569' }}>
                                                            <SchoolIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                                {person.university}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem' }}>
                                                            <span>Gender: <strong>{person.gender || 'N/A'}</strong></span>
                                                            <span>Phone: <strong>{person.phone || 'N/A'}</strong></span>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ bgcolor: '#f8fafc', p: 1.2, borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                            Accommodation:
                                                        </Typography>
                                                        {person.accommodation === 'Yes' ? (
                                                            <Chip
                                                                icon={<CheckCircleIcon sx={{ fontSize: '15px !important' }} />}
                                                                label="Yes"
                                                                size="small"
                                                                sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 600, height: 22 }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                icon={<CancelIcon sx={{ fontSize: '15px !important' }} />}
                                                                label="No"
                                                                size="small"
                                                                sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, height: 22 }}
                                                            />
                                                        )}
                                                    </Box>

                                                    <Box sx={{ pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        {person.roomAllocation ? (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                                                                <Chip
                                                                    icon={<HotelIcon sx={{ fontSize: '15px !important' }} />}
                                                                    label={`${person.roomAllocation.roomNumber} (${person.roomAllocation.building.split(' ')[0]} ${person.roomAllocation.floor.replace('Floor ', 'F')})`}
                                                                    size="small"
                                                                    sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, border: '1px solid #bfdbfe' }}
                                                                />
                                                                <Tooltip title="Change Room Allocation">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.currentTarget.blur();
                                                                            handleOpenMapDialog(person);
                                                                        }}
                                                                        sx={{ color: '#2563eb', bgcolor: '#f0fdf4', p: 0.6 }}
                                                                    >
                                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        ) : (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                fullWidth
                                                                startIcon={<MeetingRoomIcon sx={{ fontSize: 16 }} />}
                                                                onClick={(e) => {
                                                                    e.currentTarget.blur();
                                                                    handleOpenMapDialog(person);
                                                                }}
                                                                sx={{
                                                                    bgcolor: '#0b5299',
                                                                    color: '#ffffff',
                                                                    fontWeight: 600,
                                                                    textTransform: 'none',
                                                                    borderRadius: 1.5,
                                                                    py: 0.6,
                                                                    '&:hover': { bgcolor: '#093f77' }
                                                                }}
                                                            >
                                                                Map a Room
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ) : (
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
                                        <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Room Mapping</TableCell>
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
                                                                    onClick={(e) => {
                                                                        e.currentTarget.blur();
                                                                        handleOpenMapDialog(person);
                                                                    }}
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
                                                            onClick={(e) => {
                                                                e.currentTarget.blur();
                                                                handleOpenMapDialog(person);
                                                            }}
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
                        )}
                    </Box>
                )}
            </Paper>

            {/* Currently Mapped Participants Section (Below Search Box) */}
            {/* "and search box kinda evaitey rooms map map aina vaallu untaro vaallaney ikkada chupistam idi same for coach kuda" */}
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HotelIcon sx={{ color: '#0b5299', fontSize: 24 }} />
                            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                                Currently Mapped {activeTab}
                            </Typography>
                            <Chip
                                label={`${mappedList.length} Allocated`}
                                size="small"
                                sx={{
                                    bgcolor: '#ecfdf5',
                                    color: '#047857',
                                    fontWeight: 600,
                                    border: '1px solid #a7f3d0',
                                    display: { xs: 'none', sm: 'inline-flex' }
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Showing all {activeTab.toLowerCase()} with assigned rooms
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <Tooltip title="Cards View">
                                <IconButton
                                    size="small"
                                    onClick={() => setMappedViewMode('cards')}
                                    sx={{
                                        p: 0.6,
                                        borderRadius: 1.5,
                                        bgcolor: mappedViewMode === 'cards' ? '#0b5299' : 'transparent',
                                        color: mappedViewMode === 'cards' ? '#ffffff' : '#64748b',
                                        boxShadow: mappedViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                        '&:hover': {
                                            bgcolor: mappedViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                            color: mappedViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                        }
                                    }}
                                >
                                    <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Table View">
                                <IconButton
                                    size="small"
                                    onClick={() => setMappedViewMode('table')}
                                    sx={{
                                        p: 0.6,
                                        borderRadius: 1.5,
                                        bgcolor: mappedViewMode === 'table' ? '#0b5299' : 'transparent',
                                        color: mappedViewMode === 'table' ? '#ffffff' : '#64748b',
                                        boxShadow: mappedViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                        '&:hover': {
                                            bgcolor: mappedViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                            color: mappedViewMode === 'table' ? '#ffffff' : '#0b5299'
                                        }
                                    }}
                                >
                                    <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                {mappedViewMode === 'cards' ? (
                    <Box>
                        {mappedList.length === 0 ? (
                            <Paper sx={{ py: 6, textAlign: 'center', color: '#64748b', borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                <HotelIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                                <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                                    No {activeTab.toLowerCase()} mapped to rooms yet.
                                </Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                                {mappedList.map((person, index) => (
                                    <Paper
                                        key={`${person.id}-${index}`}
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
                                                boxShadow: '0 6px 16px rgba(11,82,153,0.08)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: '11px', bgcolor: '#f1f5f9', color: '#475569', height: 22 }}
                                                />
                                                <Chip
                                                    label={person.role}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                                                />
                                            </Box>
                                            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', wordBreak: 'break-word', mb: 0.5 }}>
                                                {person.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 1.5 }}>
                                                {person.university}
                                            </Typography>

                                            <Box sx={{ p: 1.2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe', mb: 1.5 }}>
                                                <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600, display: 'block', mb: 0.3 }}>
                                                    ALLOCATED ROOM
                                                </Typography>
                                                <Typography sx={{ fontWeight: 700, color: '#1d4ed8', fontSize: '1rem' }}>
                                                    {person.roomAllocation.roomNumber}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                    {person.roomAllocation.building} • {person.roomAllocation.floor}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Gender</Typography>
                                                    <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '12.5px' }}>{person.gender}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Phone</Typography>
                                                    <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '12.5px' }}>{person.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                                onClick={(e) => {
                                                    e.currentTarget.blur();
                                                    handleOpenMapDialog(person);
                                                }}
                                                sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe' }}
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                                onClick={(e) => {
                                                    e.currentTarget.blur();
                                                    handleOpenUnassignDialog(person);
                                                }}
                                                sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600, borderColor: '#fecaca' }}
                                            >
                                                Unassign
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : (
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
                                                        onClick={(e) => {
                                                            e.currentTarget.blur();
                                                            handleOpenMapDialog(person);
                                                        }}
                                                        sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Unassign Room">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.currentTarget.blur();
                                                            handleOpenUnassignDialog(person);
                                                        }}
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
                )}
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

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: { xs: 'stretch', sm: 'flex-end' },
                            mt: { xs: 1.5, sm: 0 }
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleResetGuidelines}
                            startIcon={<RestartAltIcon />}
                            sx={{
                                width: { xs: '100%', sm: 'auto' },
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 600,
                                color: '#64748b',
                                borderColor: '#cbd5e1',
                                fontSize: '12.5px',
                                py: { xs: 0.8, sm: 0.5 }
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
                                width: { xs: '100%', sm: 'auto' },
                                bgcolor: '#0b5299',
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '12.5px',
                                px: 2.5,
                                py: { xs: 0.8, sm: 0.5 },
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
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: { borderRadius: 3, p: 1 }
                    }
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
                                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                                    <Chip label={selectedPerson.role} size="small" color="primary" variant="outlined" />
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
                                                    label={
                                                        item.isCurrentPersonsRoom
                                                            ? `${item.actualTotalOccupancy}/${item.capacity} Occupied (Current Room)`
                                                            : `${item.occupancy}/${item.capacity} Occupied (${item.availableSlots} beds left)`
                                                    }
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: item.isCurrentPersonsRoom ? 600 : 500,
                                                        bgcolor: item.isCurrentPersonsRoom
                                                            ? '#eff6ff'
                                                            : (item.occupancy === 0 ? '#ecfdf5' : '#eff6ff'),
                                                        color: item.isCurrentPersonsRoom
                                                            ? '#1d4ed8'
                                                            : (item.occupancy === 0 ? '#047857' : '#1d4ed8'),
                                                        border: item.isCurrentPersonsRoom ? '1px solid #bfdbfe' : 'none'
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
                disableRestoreFocus
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
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

            {/* Modal: Bulk University Room Allotment */}
            <Dialog
                open={bulkModalOpen}
                onClose={handleCloseBulkModal}
                maxWidth="md"
                fullWidth
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            p: 0,
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HotelIcon />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem', lineHeight: 1.2 }}>
                                    {bulkSelectedUniversity || 'University'} - Room Allotment
                                </Typography>
                                {bulkSelectedUniversity && (
                                    <>
                                        <Chip
                                            label={`${universityRoleStats.totalUnallotted} Pending / ${universityRoleStats.totalCount} Total`}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                bgcolor: universityRoleStats.totalUnallotted > 0 ? '#fef3c7' : '#ecfdf5',
                                                color: universityRoleStats.totalUnallotted > 0 ? '#92400e' : '#065f46'
                                            }}
                                        />
                                        {cautionDepositData.paid ? (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                label="Deposit: Paid (₹2,000)"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#dcfce7',
                                                    color: '#166534',
                                                    border: '1px solid #bbf7d0'
                                                }}
                                            />
                                        ) : allAllottedMembers.length > 0 ? (
                                            <Chip
                                                icon={<PaymentsIcon sx={{ fontSize: '14px !important' }} />}
                                                label="Deposit Pending"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#fef3c7',
                                                    color: '#92400e',
                                                    border: '1px solid #fde68a'
                                                }}
                                            />
                                        ) : null}
                                    </>
                                )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Allot hostel rooms by university batch according to room capacity
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={handleCloseBulkModal} sx={{ color: '#64748b' }}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
                    {/* Room Configuration & Member Selection or Empty/Celebration State */}
                    {currentTabMembers.all.length === 0 ? (
                        <Box sx={{
                            p: 4,
                            textAlign: 'center',
                            bgcolor: '#f8fafc',
                            borderRadius: 3,
                            border: '1.5px dashed #cbd5e1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1.5
                        }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <GroupsIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                                No Members Registered with Accommodation
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450 }}>
                                {bulkSelectedUniversity} does not have any members requesting hostel accommodation.
                            </Typography>
                        </Box>
                    ) : currentTabMembers.unallotted.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                            {/* LEFT COLUMN: Room Selector */}
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MeetingRoomIcon sx={{ color: '#0b5299', fontSize: 20 }} />
                                    Step 1: Select Room to Allot
                                </Typography>

                                {/* Building */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="bulk-building-label">Building / Block</InputLabel>
                                    <Select
                                        labelId="bulk-building-label"
                                        value={bulkBuilding}
                                        label="Building / Block"
                                        onChange={(e) => handleBulkBuildingChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><ApartmentIcon sx={{ color: '#0b5299', fontSize: 18 }} /></InputAdornment>}
                                    >
                                        {dbBlocks.map(bldg => (
                                            <MenuItem key={bldg.name} value={bldg.name}>
                                                {bldg.name} {bldg.capacityPerRoom ? `(${bldg.capacityPerRoom} beds/room)` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Floor */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="bulk-floor-label">Floor</InputLabel>
                                    <Select
                                        labelId="bulk-floor-label"
                                        value={bulkFloor}
                                        label="Floor"
                                        onChange={(e) => handleBulkFloorChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><LayersIcon sx={{ color: '#0b5299', fontSize: 18 }} /></InputAdornment>}
                                    >
                                        {bulkAvailableFloors.map(fl => (
                                            <MenuItem key={fl} value={fl}>{fl}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Room */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="bulk-room-label">Room Number</InputLabel>
                                    <Select
                                        labelId="bulk-room-label"
                                        value={bulkRoom}
                                        label="Room Number"
                                        onChange={(e) => handleBulkRoomChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><HotelIcon sx={{ color: '#0b5299', fontSize: 18 }} /></InputAdornment>}
                                    >
                                        {bulkAvailableRooms.map(item => (
                                            <MenuItem key={item.roomNumber} value={item.roomNumber}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                                        Room {item.roomNumber}
                                                    </Typography>
                                                    <Chip
                                                        label={`${item.availableSlots} of ${item.capacity} slots free`}
                                                        size="small"
                                                        sx={{
                                                            fontSize: '0.72rem',
                                                            height: 20,
                                                            bgcolor: item.occupancy === 0 ? '#ecfdf5' : '#eff6ff',
                                                            color: item.occupancy === 0 ? '#047857' : '#1d4ed8',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {bulkAvailableRooms.length === 0 && (
                                    <Alert severity="warning" sx={{ fontSize: '0.8rem', borderRadius: 2 }}>
                                        No vacant rooms available on this floor. Please choose another floor or building.
                                    </Alert>
                                )}


                            </Paper>

                            {/* RIGHT COLUMN: Member Selection */}
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                                        Step 2: Select Members ({currentTabMembers.unallotted.length} Unallotted)
                                    </Typography>
                                    <Chip
                                        label={`${bulkSelectedMemberIds.length} / ${currentRoomMaxSlots} Selected`}
                                        size="small"
                                        color={bulkSelectedMemberIds.length > 0 ? 'primary' : 'default'}
                                        sx={{ fontWeight: 700, height: 22 }}
                                    />
                                </Box>

                                <Typography variant="caption" sx={{ color: '#64748b', mb: 1.5, display: 'block' }}>
                                    Select up to {currentRoomMaxSlots} member(s) to assign to Room {bulkRoom || '(Select Room)'}.
                                </Typography>

                                {/* Member Checkbox List */}
                                <Box sx={{ flex: 1, maxHeight: 320, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {currentTabMembers.unallotted.map((person) => {
                                        const isSelected = bulkSelectedMemberIds.includes(person.id);
                                        return (
                                            <Box
                                                key={person.id}
                                                onClick={() => handleToggleMember(person.id)}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1.2,
                                                    borderRadius: 2,
                                                    border: isSelected ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                                                    bgcolor: isSelected ? '#f0f7ff' : '#f8fafc',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { bgcolor: isSelected ? '#e0f2fe' : '#f1f5f9' }
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    size="small"
                                                    sx={{ p: 0.5, mr: 1, color: '#0b5299' }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                                                            {person.name}
                                                        </Typography>
                                                        <Chip
                                                            label={person.role}
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '10px',
                                                                fontWeight: 600,
                                                                bgcolor: person.role === 'Player' ? '#f1f5f9' : '#fef3c7',
                                                                color: person.role === 'Player' ? '#334155' : '#92400e'
                                                            }}
                                                        />
                                                        <Chip
                                                            label={person.gender}
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '10px',
                                                                bgcolor: person.gender === 'Female' ? '#fce7f3' : '#e0f2fe',
                                                                color: person.gender === 'Female' ? '#9d174d' : '#0369a1',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                        Phone: {person.phone}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Paper>
                        </Box>
                    ) : (
                        /* Celebration when all members of this tab are allotted */
                        <Box sx={{
                            p: 3,
                            textAlign: 'center',
                            bgcolor: '#ecfdf5',
                            borderRadius: 3,
                            border: '1.5px solid #a7f3d0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1.5
                        }}>
                            <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircleIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#065f46' }}>
                                All members of {bulkSelectedUniversity} are successfully allotted rooms!
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#047857', maxWidth: 500 }}>
                                Every member requesting accommodation from this university has been assigned a hostel room. You can review or modify their allocations in the list below.
                            </Typography>
                        </Box>
                    )}

                    {/* Step 3: Caution Deposit (Manual Collection) - Appears after room allot is done */}
                    {allAllottedMembers.length > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{
                                mt: 2.5,
                                p: 2.5,
                                borderRadius: 2.5,
                                bgcolor: cautionDepositData.paid ? '#f0fdf4' : '#ffffff',
                                border: cautionDepositData.paid ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                                boxShadow: cautionDepositData.paid ? '0 2px 8px rgba(34, 197, 94, 0.08)' : '0 2px 8px rgba(0,0,0,0.03)'
                            }}
                        >
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                    <Box sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: cautionDepositData.paid ? '#dcfce7' : '#eff6ff',
                                        color: cautionDepositData.paid ? '#16a34a' : '#0b5299',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <PaymentsIcon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.2 }}>
                                            Step 3: Caution Deposit (Manual Cash Collection)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Collect ₹2,000 refundable security deposit in cash at hostel desk
                                        </Typography>
                                    </Box>
                                </Box>

                                <Chip
                                    icon={cautionDepositData.paid ? <CheckCircleIcon sx={{ fontSize: '16px !important' }} /> : <PaymentsIcon sx={{ fontSize: '16px !important' }} />}
                                    label={cautionDepositData.paid ? `Paid: ₹${cautionDepositData.amount || 2000}` : 'Caution Deposit Pending (₹2,000)'}
                                    size="small"
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: cautionDepositData.paid ? '#dcfce7' : '#fef3c7',
                                        color: cautionDepositData.paid ? '#166534' : '#92400e',
                                        border: cautionDepositData.paid ? '1px solid #bbf7d0' : '1px solid #fde68a',
                                        height: 26,
                                        fontSize: '11.5px'
                                    }}
                                />
                            </Box>

                            {/* Content: Form if Unpaid, Receipt Summary if Paid */}
                            {!cautionDepositData.paid ? (
                                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    {/* Manual Notice */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe' }}>
                                        <LocalAtmIcon sx={{ color: '#1d4ed8', fontSize: 20 }} />
                                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
                                            Offline / Counter Payment: Collect physical cash of ₹2,000 from the room/university representative and select their name below.
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1.2fr 1.2fr auto' }, gap: 1.5, alignItems: 'center' }}>
                                        {/* Dropdown: Paid by */}
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="caution-paid-by-label">Paid by *</InputLabel>
                                            <Select
                                                labelId="caution-paid-by-label"
                                                value={cautionPaidByPersonId || (allAllottedMembers[0]?.id || '')}
                                                label="Paid by *"
                                                onChange={(e) => setCautionPaidByPersonId(e.target.value)}
                                            >
                                                {allAllottedMembers.map((member) => (
                                                    <MenuItem key={member.id} value={member.id}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 1 }}>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                                {member.name} ({member.role})
                                                            </Typography>
                                                            <Chip
                                                                label={member.roomAllocation ? `Room ${member.roomAllocation.roomNumber}` : 'Allocated'}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: '10px', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                                                            />
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Amount: Fixed 2000 */}
                                        <TextField
                                            label="Amount"
                                            size="small"
                                            value="₹ 2,000"
                                            InputProps={{
                                                readOnly: true,
                                                sx: { fontWeight: 700, color: '#0f172a', bgcolor: '#ffffff' }
                                            }}
                                            helperText="Fixed refundable deposit"
                                        />

                                        {/* Payment Mode */}
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="caution-mode-label">Mode</InputLabel>
                                            <Select
                                                labelId="caution-mode-label"
                                                value={cautionPaymentMode}
                                                label="Mode"
                                                onChange={(e) => setCautionPaymentMode(e.target.value)}
                                            >
                                                <MenuItem value="Cash">Cash (Manual)</MenuItem>
                                                <MenuItem value="UPI">UPI / QR Code</MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* Pay Button */}
                                        <Button
                                            variant="contained"
                                            onClick={handlePayCautionDeposit}
                                            disabled={cautionSubmitting || allAllottedMembers.length === 0}
                                            startIcon={cautionSubmitting ? <CircularProgress size={16} color="inherit" /> : <PaymentsIcon sx={{ fontSize: 18 }} />}
                                            sx={{
                                                bgcolor: '#059669',
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                height: 40,
                                                px: 3,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                whiteSpace: 'nowrap',
                                                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                                                '&:hover': { bgcolor: '#047857' }
                                            }}
                                        >
                                            {cautionSubmitting ? 'Recording...' : 'Pay'}
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                /* Paid State View */
                                <Box sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 2, border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 44, height: 44 }}>
                                                <CheckCircleIcon sx={{ fontSize: 26 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#166534', fontSize: '0.98rem' }}>
                                                    Caution Deposit Received: ₹{cautionDepositData.amount || 2000}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem' }}>
                                                    Paid by: <strong>{cautionDepositData.paidBy?.name || 'Representative'}</strong> ({cautionDepositData.paidBy?.role || 'Member'} - Room {cautionDepositData.paidBy?.roomNumber || 'Allotted'})
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                                    Receipt #{cautionDepositData.receiptNo || 'N/A'} • Mode: {cautionDepositData.paymentMode || 'Cash'} • {cautionDepositData.paidAt ? new Date(cautionDepositData.paidAt).toLocaleDateString() + ' ' + new Date(cautionDepositData.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                                                onClick={() => setCautionReceiptModalOpen(true)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderColor: '#16a34a',
                                                    color: '#16a34a',
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#15803d' }
                                                }}
                                            >
                                                View / Print Receipt
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={handleResetCautionDeposit}
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#94a3b8',
                                                    fontSize: '0.78rem',
                                                    '&:hover': { color: '#ef4444', bgcolor: 'transparent' }
                                                }}
                                            >
                                                Reset
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* 3. Allotted Members Section (Grouped by Room) */}
                    {currentTabMembers.allotted.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HotelIcon sx={{ color: '#059669', fontSize: 20 }} />
                                Allotted Members of {bulkSelectedUniversity} ({currentTabMembers.allotted.length} Total)
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                                {Object.entries(
                                    currentTabMembers.allotted.reduce((acc, member) => {
                                        const roomKey = member.roomAllocation
                                            ? `Room ${member.roomAllocation.roomNumber} (${member.roomAllocation.building} - ${member.roomAllocation.floor})`
                                            : 'Unknown Room';
                                        if (!acc[roomKey]) acc[roomKey] = [];
                                        acc[roomKey].push(member);
                                        return acc;
                                    }, {})
                                ).map(([roomTitle, members]) => (
                                    <Paper key={roomTitle} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 0.5, borderBottom: '1px solid #e2e8f0' }}>
                                            <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '0.85rem' }}>
                                                {roomTitle}
                                            </Typography>
                                            <Chip label={`${members.length} member(s)`} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                                        </Box>
                                        <Stack spacing={0.6}>
                                            {members.map(m => (
                                                <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', py: 0.3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                                                            {m.name}
                                                        </Typography>
                                                        <Chip label={m.role} size="small" sx={{ height: 16, fontSize: '9px' }} />
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            ({m.gender}, {m.phone})
                                                        </Typography>
                                                    </Box>
                                                    <Tooltip title="Unassign from Room">
                                                        <IconButton size="small" onClick={() => handleBulkUnassignSingle(m)} sx={{ color: '#ef4444', p: 0.3 }}>
                                                            <ClearIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        onClick={handleCloseBulkModal}
                        variant="outlined"
                        disabled={bulkSubmitting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Close
                    </Button>
                    {cautionDepositData.paid && allAllottedMembers.length > 0 && bulkSelectedMemberIds.length === 0 ? (
                        <Button
                            onClick={() => {
                                handleCloseBulkModal();
                                toast.success(`Hostel allotment & caution deposit complete for ${bulkSelectedUniversity}!`);
                            }}
                            variant="contained"
                            startIcon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                bgcolor: '#059669',
                                color: '#ffffff',
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3.5,
                                fontWeight: 700,
                                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                                '&:hover': { bgcolor: '#047857' }
                            }}
                        >
                            Done
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSaveBulkAllocation}
                            variant="contained"
                            disabled={
                                !bulkRoom ||
                                bulkSelectedMemberIds.length === 0 ||
                                bulkSubmitting ||
                                currentTabMembers.unallotted.length === 0
                            }
                            startIcon={bulkSubmitting ? <CircularProgress size={18} color="inherit" /> : <MeetingRoomIcon />}
                            sx={{
                                bgcolor: '#0b5299',
                                color: '#ffffff',
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3,
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#093f77' }
                            }}
                        >
                            {bulkSubmitting
                                ? 'Allotting...'
                                : `Allot Room ${bulkRoom || ''} to ${bulkSelectedMemberIds.length} ${bulkSelectedMemberIds.length === 1 ? 'Member' : 'Members'}`}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Printable Caution Deposit Receipt Modal */}
            <Dialog
                open={cautionReceiptModalOpen}
                onClose={() => setCautionReceiptModalOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ color: '#059669', fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Hostel Caution Deposit Receipt</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setCautionReceiptModalOpen(false)}>
                        <ClearIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Box id="caution-deposit-printable-receipt" sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: 2, bgcolor: '#fcfdfd' }}>
                        <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid #e2e8f0', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b5299' }}>
                                SOUTH ZONE INTER-UNIVERSITY TOURNAMENT
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                                HOSTEL ACCOMMODATION - CAUTION DEPOSIT RECEIPT
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                (Official Cash / Manual Payment Voucher)
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, fontSize: '0.88rem' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIPT NO:</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{cautionDepositData.receiptNo || 'CD-MANUAL'}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DATE & TIME:</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    {cautionDepositData.paidAt ? (new Date(cautionDepositData.paidAt).toLocaleDateString() + ' ' + new Date(cautionDepositData.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Pending Collection'}
                                </Typography>
                            </Box>
                            <Box sx={{ gridColumn: 'span 2' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>UNIVERSITY / INSTITUTION:</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '1rem' }}>{bulkSelectedUniversity}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RECEIVED FROM (PAID BY):</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    {cautionDepositData.paidBy?.name || 'Representative'} ({cautionDepositData.paidBy?.role || 'Member'})
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Phone: {cautionDepositData.paidBy?.phone || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ALLOTTED HOSTEL ROOM:</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    Room {cautionDepositData.paidBy?.roomNumber || 'Allotted'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PAYMENT MODE:</Typography>
                                <Typography sx={{ fontWeight: 700, color: '#047857' }}>{cautionDepositData.paymentMode || 'Cash'} (Manual Desk Receipt)</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AMOUNT RECEIVED:</Typography>
                                <Typography sx={{ fontWeight: 800, color: '#047857', fontSize: '1.2rem' }}>₹{cautionDepositData.amount || 2000}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ bgcolor: '#ecfdf5', p: 1.5, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Amount in Words: Rupees Two Thousand Only (Refundable Deposit)
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.75rem', display: 'block' }}>
                                Note: This caution deposit is refundable at the time of vacating the hostel room and returning the keys, subject to room clearance and no property damage.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 3, borderTop: '1px dashed #cbd5e1' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Payer Signature</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                                    {cautionDepositData.collectedBy || 'Hostel Desk In-charge'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Authorized Signature & Stamp</Typography>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setCautionReceiptModalOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                        sx={{ textTransform: 'none', bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                    >
                        Print Receipt
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HostelProvision;
