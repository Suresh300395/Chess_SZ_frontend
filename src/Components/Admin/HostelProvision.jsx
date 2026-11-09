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
    Avatar,
    Divider,
    Grid
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
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import PaymentsIcon from '@mui/icons-material/Payments';
import PrintIcon from '@mui/icons-material/Print';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CustomTabs from '../Common/Tabs';
import CautionDepositReceiptModal from '../Common/CautionDepositReceiptModal';
import { registrationAPI, blocksAPI, SOCKET_URL } from '../../utils/api';
import { AnimatedText, AnimatedCard } from '../animations';

const HostelProvision = () => {
    const navigate = useNavigate();
    const [mappedViewMode, setMappedViewMode] = useState('table');
    const [searchViewMode, setSearchViewMode] = useState('table');
    const [accommodationList, setAccommodationList] = useState([]);
    const [dbBlocks, setDbBlocks] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Players');
    const tabsList = ['Players', 'Coaches / Managers'];

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Mapping Room
    const [mapDialogOpen, setMapDialogOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedHostel, setSelectedHostel] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Modal state for Bulk University Room Allotment
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkSelectedUniversity, setBulkSelectedUniversity] = useState('');
    const [bulkHostel, setBulkHostel] = useState('');
    const [bulkBuilding, setBulkBuilding] = useState('');
    const [bulkFloor, setBulkFloor] = useState('');
    const [bulkRoom, setBulkRoom] = useState('');
    const [bulkSelectedMemberIds, setBulkSelectedMemberIds] = useState([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [modalActiveTab, setModalActiveTab] = useState('Players');

    // Raw registrations list to access full registration objects (including cautionDeposit)
    const [rawRegistrations, setRawRegistrations] = useState([]);

    // Caution Deposit state for Step 3 in bulk modal
    const [cautionPaidByPersonId, setCautionPaidByPersonId] = useState('');
    const [cautionPaymentMode, setCautionPaymentMode] = useState('Cash');
    const [cautionDepositAmount, setCautionDepositAmount] = useState('2000');
    const [coachCautionAmounts, setCoachCautionAmounts] = useState({});
    const [cautionSubmitting, setCautionSubmitting] = useState(false);
    const [cautionReceiptModalOpen, setCautionReceiptModalOpen] = useState(false);
    const [selectedCoachReceipt, setSelectedCoachReceipt] = useState(null);
    const [coachCautionSubmittingId, setCoachCautionSubmittingId] = useState(null);

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

            // Fetch dynamic blocks & categories
            await fetchBlocksAndCategories();
        } catch (err) {
            console.error('Error fetching registrations:', err);
            toast.error('Error connecting to server', { id: 'error-connecting-to-server' });
        } finally {
            setLoading(false);
        }
    };

    const fetchBlocksAndCategories = async () => {
        try {
            const [blocksRes, categoriesRes] = await Promise.all([
                blocksAPI.getAll(),
                blocksAPI.getCategories()
            ]);
            let blocksData = [];
            let catData = [];
            if (blocksRes.ok) {
                blocksData = await blocksRes.json();
                setDbBlocks(blocksData);
            }
            if (categoriesRes.ok) {
                catData = await categoriesRes.json();
                setDbCategories(catData);
            }
            return { blocks: blocksData, categories: catData };
        } catch (err) {
            console.error('Error fetching blocks and categories:', err);
            return { blocks: [], categories: [] };
        }
    };

    useEffect(() => {
        fetchRegistrations();
        fetchGuidelines();
        fetchBlocksAndCategories();

        const socket = io(SOCKET_URL);
        socket.on('dataUpdated', () => {
            fetchRegistrations();
            fetchBlocksAndCategories();
        });
        socket.on('blocks_updated', () => {
            fetchBlocksAndCategories();
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
            String(p.roomAllocation.roomNumber) === String(roomNumber) &&
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

    // Group mapped participants by university
    const mappedByUniversity = useMemo(() => {
        const groups = {};
        mappedList.forEach(person => {
            const uniName = person.university?.trim() || 'Unknown University';
            if (!groups[uniName]) {
                groups[uniName] = {
                    university: uniName,
                    members: []
                };
            }
            groups[uniName].members.push(person);
        });
        return Object.values(groups).sort((a, b) => a.university.localeCompare(b.university));
    }, [mappedList]);

    // State for Managing University Mapped Participants Modal
    const [manageUniModalOpen, setManageUniModalOpen] = useState(false);
    const [selectedUniName, setSelectedUniName] = useState('');

    const handleOpenManageUniModal = (uniName) => {
        setSelectedUniName(uniName);
        setManageUniModalOpen(true);
    };

    const handleCloseManageUniModal = () => {
        setManageUniModalOpen(false);
        setSelectedUniName('');
    };

    const currentUniGroup = useMemo(() => {
        if (!selectedUniName) return null;
        return mappedByUniversity.find(u => u.university.toLowerCase() === selectedUniName.toLowerCase()) || null;
    }, [mappedByUniversity, selectedUniName]);

    // State for Vacate Rooms Flow
    const [vacateDialogOpen, setVacateDialogOpen] = useState(false);
    const [vacateStep, setVacateStep] = useState(1); // 1: Confirmation ("Are you sure you want to vacate? Yes/No"), 2: Checklist
    const [vacateSelectedIds, setVacateSelectedIds] = useState([]);
    const [vacating, setVacating] = useState(false);

    const handleOpenVacateDialog = () => {
        if (!currentUniGroup || currentUniGroup.members.length === 0) {
            toast.error('No allocated members to vacate');
            return;
        }
        setVacateStep(1);
        setVacateSelectedIds(currentUniGroup.members.map(m => m.id));
        setVacateDialogOpen(true);
    };

    const handleCloseVacateDialog = () => {
        if (vacating) return;
        setVacateDialogOpen(false);
        setVacateStep(1);
    };

    const handleConfirmYesVacate = () => {
        if (!currentUniGroup) return;
        setVacateSelectedIds(currentUniGroup.members.map(m => m.id));
        setVacateStep(2);
    };

    const handleToggleVacateMember = (memberId) => {
        setVacateSelectedIds(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleToggleSelectAllVacate = () => {
        if (!currentUniGroup) return;
        if (vacateSelectedIds.length === currentUniGroup.members.length) {
            setVacateSelectedIds([]);
        } else {
            setVacateSelectedIds(currentUniGroup.members.map(m => m.id));
        }
    };

    const handleExecuteVacateAndRedirect = async () => {
        if (!currentUniGroup || vacateSelectedIds.length === 0) {
            toast.error('Please select at least one participant to vacate');
            return;
        }

        const selectedMembers = currentUniGroup.members.filter(m => vacateSelectedIds.includes(m.id));
        if (selectedMembers.length === 0) return;

        setVacating(true);
        try {
            await Promise.all(
                selectedMembers.map(person =>
                    registrationAPI.unassignRoom({
                        registrationId: person.registrationId,
                        personId: person.id,
                        role: person.role
                    })
                )
            );

            toast.success(`Successfully vacated rooms for ${selectedMembers.length} participant(s) of ${selectedUniName}! Redirecting to Caution Deposit refund...`);
            
            await fetchRegistrations();

            setVacateDialogOpen(false);
            setManageUniModalOpen(false);

            const targetTab = activeTab === 'Players' ? 'team' : 'coach';
            navigate(`/admin/caution-deposite?search=${encodeURIComponent(selectedUniName)}&tab=${targetTab}`);
        } catch (err) {
            console.error('Error vacating rooms:', err);
            toast.error('Failed to vacate rooms. Please try again.');
        } finally {
            setVacating(false);
        }
    };

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
        const floorObj = currentBuildingObj?.floors?.find(f => f.floorName?.trim().toLowerCase() === selectedFloor?.trim().toLowerCase());
        let rooms = floorObj?.rooms || [];
        if ((!rooms || rooms.length === 0) && floorObj?.roomCount > 0) {
            rooms = Array.from({ length: floorObj.roomCount }, (_, i) => String(i + 1));
        }
        const capacity = currentBuildingObj?.capacityPerRoom || 4;

        return rooms
            .map(room => {
                const roomStr = String(room);
                const occupancy = getRoomOccupancy(selectedBuilding, selectedFloor, roomStr, selectedPerson?.id);
                const actualTotalOccupancy = getRoomOccupancy(selectedBuilding, selectedFloor, roomStr, null);
                const isCurrentPersonsRoom =
                    selectedPerson?.roomAllocation?.building === selectedBuilding &&
                    selectedPerson?.roomAllocation?.floor === selectedFloor &&
                    String(selectedPerson?.roomAllocation?.roomNumber) === roomStr;

                return {
                    roomNumber: roomStr,
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
    const handleOpenMapDialog = async (person) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setSelectedPerson(person);

        // Fetch fresh blocks & categories immediately from DB
        const fresh = await fetchBlocksAndCategories();
        const currentBlocks = fresh.blocks && fresh.blocks.length > 0 ? fresh.blocks : dbBlocks;
        const currentCategories = fresh.categories && fresh.categories.length > 0 ? fresh.categories : dbCategories;

        const hostels = Array.from(new Set([
            ...currentCategories.map(c => c.name?.trim()),
            ...currentBlocks.map(b => b.block?.trim())
        ].filter(Boolean)));
        const allHostels = hostels.length > 0 ? hostels : ['Boys Hostel', 'Girls Hostel', 'Staff Hostel', 'Guest House'];

        // Pre-fill building
        if (person.roomAllocation && person.roomAllocation.building) {
            const currentBldg = currentBlocks.find(b => b.name === person.roomAllocation.building);
            if (currentBldg?.block) setSelectedHostel(currentBldg.block);
            else if (allHostels.length > 0) setSelectedHostel(allHostels[0]);
            setSelectedBuilding(person.roomAllocation.building);
            setSelectedFloor(person.roomAllocation.floor || '');
            setSelectedRoom(person.roomAllocation.roomNumber || '');
        } else {
            // Suggest default building based on person gender if available
            let defHostel = '';
            const isFemale = person.gender && String(person.gender).toLowerCase().includes('female');
            if (isFemale) {
                defHostel = allHostels.find(h => h.toLowerCase().includes('girl') || h.toLowerCase().includes('women')) || allHostels[0] || '';
            } else {
                defHostel = allHostels.find(h => h.toLowerCase().includes('boy') || h.toLowerCase().includes('men')) || allHostels[0] || '';
            }
            if (!defHostel && allHostels.length > 0) defHostel = allHostels[0];

            setSelectedHostel(defHostel);
            const matchingBldgs = currentBlocks.filter(b => b.block?.trim().toLowerCase() === defHostel.trim().toLowerCase());
            const defaultBuilding = matchingBldgs.length > 0 ? matchingBldgs[0].name : '';
            setSelectedBuilding(defaultBuilding);
            const defaultBuildingObj = currentBlocks.find(b => b.name === defaultBuilding);
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

    // Members in bulk modal for selected modal tab ('Players' vs 'Coaches / Managers')
    const currentTabMembers = useMemo(() => {
        if (modalActiveTab === 'Coaches / Managers') {
            return {
                all: universityRoleStats.coaches?.all || [],
                unallotted: universityRoleStats.coaches?.unallotted || [],
                allotted: universityRoleStats.coaches?.allotted || []
            };
        }
        return {
            all: universityRoleStats.players?.all || [],
            unallotted: universityRoleStats.players?.unallotted || [],
            allotted: universityRoleStats.players?.allotted || []
        };
    }, [universityRoleStats, modalActiveTab]);

    const currentUniversityMembers = currentTabMembers;

    // All members across both Players & Coaches who have been allotted a room for bulkSelectedUniversity
    const allAllottedMembers = useMemo(() => {
        return universityRoleStats.allotted || [];
    }, [universityRoleStats]);

    const allAllottedPlayers = useMemo(() => {
        return universityRoleStats.players?.allotted || [];
    }, [universityRoleStats]);

    const allAllottedCoaches = useMemo(() => {
        return universityRoleStats.coaches?.allotted || [];
    }, [universityRoleStats]);

    // Find the full registration record for bulkSelectedUniversity
    const currentRegistration = useMemo(() => {
        return rawRegistrations.find(r => r.universityName === bulkSelectedUniversity) || null;
    }, [rawRegistrations, bulkSelectedUniversity]);

    // Caution deposit data for bulkSelectedUniversity
    const cautionDepositData = currentRegistration?.cautionDeposit || {
        paid: false,
        amount: 0,
        refundStatus: 'N/A'
    };

    // Auto-select player for "Paid by" dropdown if not yet selected
    useEffect(() => {
        if (allAllottedPlayers.length > 0) {
            setCautionPaidByPersonId(prev => {
                const exists = allAllottedPlayers.some(m => m.id === prev);
                return exists ? prev : (allAllottedPlayers[0]?.id || '');
            });
        } else {
            setCautionPaidByPersonId('');
        }
    }, [allAllottedPlayers, bulkSelectedUniversity]);

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
        const floorObj = buildingObj?.floors?.find(f => f.floorName?.trim().toLowerCase() === bulkFloor?.trim().toLowerCase());
        let rooms = floorObj?.rooms || [];
        if ((!rooms || rooms.length === 0) && floorObj?.roomCount > 0) {
            rooms = Array.from({ length: floorObj.roomCount }, (_, i) => String(i + 1));
        }
        const capacity = buildingObj?.capacityPerRoom || 4;

        return rooms.map(room => {
            const roomStr = String(room);
            const occupancy = getRoomOccupancy(bulkBuilding, bulkFloor, roomStr, null);
            const availableSlots = Math.max(0, capacity - occupancy);
            return {
                roomNumber: roomStr,
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

    const availableHostels = useMemo(() => {
        const fromCategories = dbCategories.map(c => c.name?.trim()).filter(Boolean);
        const fromBlocks = dbBlocks.map(b => b.block?.trim()).filter(Boolean);
        const combined = Array.from(new Set([...fromCategories, ...fromBlocks]));
        return combined.length > 0 ? combined : ['Boys Hostel', 'Girls Hostel', 'Staff Hostel', 'Guest House'];
    }, [dbCategories, dbBlocks]);

    const filteredBuildingsForHostel = useMemo(() => {
        if (!bulkHostel) return dbBlocks;
        return dbBlocks.filter(b => b.block?.trim().toLowerCase() === bulkHostel.trim().toLowerCase());
    }, [dbBlocks, bulkHostel]);

    const handleBulkHostelChange = (newHostel) => {
        setBulkHostel(newHostel);
        const match = dbBlocks.filter(b => b.block?.trim().toLowerCase() === newHostel?.trim().toLowerCase());
        const firstBldg = match.length > 0 ? match[0].name : '';
        setBulkBuilding(firstBldg);
        const bldgObj = match.find(b => b.name === firstBldg);
        const firstFl = bldgObj?.floors?.length > 0 ? bldgObj.floors[0].floorName : '';
        setBulkFloor(firstFl);
        setBulkRoom('');
        setBulkSelectedMemberIds([]);
    };

    const filteredBuildingsForSingle = useMemo(() => {
        if (!selectedHostel) return dbBlocks;
        return dbBlocks.filter(b => b.block?.trim().toLowerCase() === selectedHostel?.trim().toLowerCase());
    }, [dbBlocks, selectedHostel]);

    const handleSingleHostelChange = (newHostel) => {
        setSelectedHostel(newHostel);
        const match = dbBlocks.filter(b => b.block?.trim().toLowerCase() === newHostel?.trim().toLowerCase());
        const firstBldg = match.length > 0 ? match[0].name : '';
        setSelectedBuilding(firstBldg);
        const bldgObj = match.find(b => b.name === firstBldg);
        const firstFl = bldgObj?.floors?.length > 0 ? bldgObj.floors[0].floorName : '';
        setSelectedFloor(firstFl);
        setSelectedRoom('');
    };

    const handleSingleBuildingChange = (newBuilding) => {
        setSelectedBuilding(newBuilding);
        const bldgObj = dbBlocks.find(b => b.name === newBuilding);
        const firstFl = bldgObj?.floors?.length > 0 ? bldgObj.floors[0].floorName : '';
        setSelectedFloor(firstFl);
        setSelectedRoom('');
    };

    // Ensure floor is always valid when building changes
    useEffect(() => {
        if (selectedBuilding && availableFloors.length > 0) {
            if (!selectedFloor || !availableFloors.includes(selectedFloor)) {
                setSelectedFloor(availableFloors[0]);
                setSelectedRoom('');
            }
        }
    }, [selectedBuilding, availableFloors, selectedFloor]);

    useEffect(() => {
        if (bulkBuilding && bulkAvailableFloors.length > 0) {
            if (!bulkFloor || !bulkAvailableFloors.includes(bulkFloor)) {
                setBulkFloor(bulkAvailableFloors[0]);
                setBulkRoom('');
            }
        }
    }, [bulkBuilding, bulkAvailableFloors, bulkFloor]);

    const handleOpenBulkModal = async (universityName = null) => {
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
        setModalActiveTab(activeTab === 'Coaches / Managers' ? 'Coaches / Managers' : 'Players');

        const fresh = await fetchBlocksAndCategories();
        const currentBlocks = fresh.blocks && fresh.blocks.length > 0 ? fresh.blocks : dbBlocks;
        const currentCategories = fresh.categories && fresh.categories.length > 0 ? fresh.categories : dbCategories;

        const hostels = Array.from(new Set([
            ...currentCategories.map(c => c.name?.trim()),
            ...currentBlocks.map(b => b.block?.trim())
        ].filter(Boolean)));
        const allHostels = hostels.length > 0 ? hostels : ['Boys Hostel', 'Girls Hostel', 'Staff Hostel', 'Guest House'];
        const defaultHostel = allHostels.length > 0 ? allHostels[0] : '';
        setBulkHostel(defaultHostel);

        const buildingsInDefaultHostel = currentBlocks.filter(b => b.block?.trim().toLowerCase() === defaultHostel.trim().toLowerCase());
        const defaultBuilding = buildingsInDefaultHostel.length > 0 ? buildingsInDefaultHostel[0].name : '';
        setBulkBuilding(defaultBuilding);
        const defaultBuildingObj = currentBlocks.find(b => b.name === defaultBuilding);
        const defaultFloor = defaultBuildingObj?.floors?.length > 0 ? defaultBuildingObj.floors[0].floorName : '';
        setBulkFloor(defaultFloor);
        setBulkRoom('');

        setBulkModalOpen(true);
    };

    const handleModalTabChange = (newTab) => {
        setModalActiveTab(newTab);
        setBulkSelectedMemberIds([]);
        setBulkRoom('');
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

        const payingMember = allAllottedPlayers.find(m => m.id === cautionPaidByPersonId);
        if (!payingMember) {
            toast.error('Selected player not found among room-allotted players');
            return;
        }

        const amtToPay = Number(cautionDepositAmount);
        if (!amtToPay || amtToPay <= 0) {
            toast.error('Please enter a valid deposit amount');
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
                amount: amtToPay,
                paymentMode: cautionPaymentMode || 'Cash',
                notes: 'Manual cash collected at hostel desk'
            };

            const res = await registrationAPI.payCautionDeposit(payload);
            const data = await res.json();

            if (res.ok) {
                toast.success(`Caution deposit of ₹${amtToPay.toLocaleString('en-IN')} recorded from ${payingMember.name} (${bulkSelectedUniversity})!`);
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

    // Handle Manual Coach Caution Deposit Payment (Step 3)
    const handlePayCoachCautionDeposit = async (coach) => {
        if (!bulkSelectedUniversity || !currentRegistration) return;
        setCoachCautionSubmittingId(coach._id);
        const enteredAmt = Number(coachCautionAmounts[coach._id] !== undefined ? coachCautionAmounts[coach._id] : 2000);
        if (!enteredAmt || enteredAmt <= 0) {
            toast.error('Please enter a valid caution deposit amount');
            setCoachCautionSubmittingId(null);
            return;
        }
        try {
            const payload = {
                registrationId: currentRegistration._id,
                universityName: bulkSelectedUniversity,
                coachId: coach._id,
                paidBy: {
                    personId: coach._id,
                    name: coach.name,
                    role: coach.role || 'Coach',
                    phone: coach.mobileNo || coach.phone || '',
                    roomNumber: coach.roomAllocation?.roomNumber || ''
                },
                amount: enteredAmt,
                paymentMode: 'Cash',
                notes: 'Coach caution deposit collected at hostel desk'
            };

            const res = await registrationAPI.payCautionDeposit(payload);
            const data = await res.json();
            if (res.ok) {
                toast.success(`Caution deposit of ₹${enteredAmt.toLocaleString('en-IN')} recorded for Coach ${coach.name}!`);
                await fetchRegistrations();
            } else {
                toast.error(data.message || 'Failed to record coach caution deposit');
            }
        } catch (err) {
            console.error('Error recording coach caution deposit:', err);
            toast.error('Error recording coach caution deposit');
        } finally {
            setCoachCautionSubmittingId(null);
        }
    };

    // Handle Reset Coach Caution Deposit (Step 3)
    const handleResetCoachCautionDeposit = async (coach) => {
        if (!bulkSelectedUniversity || !currentRegistration) return;
        try {
            const res = await registrationAPI.resetCautionDeposit({
                registrationId: currentRegistration._id,
                universityName: bulkSelectedUniversity,
                coachId: coach._id
            });
            if (res.ok) {
                toast.info(`Caution deposit reset for Coach ${coach.name}`);
                await fetchRegistrations();
            } else {
                toast.error('Failed to reset coach caution deposit');
            }
        } catch (err) {
            console.error('Error resetting coach caution deposit:', err);
            toast.error('Failed to reset coach caution deposit');
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
                <AnimatedText direction="down" duration={0.45}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <HotelIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                        <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                            Accommodation Allocation
                        </Typography>
                    </Box>
                </AnimatedText>
                <AnimatedText delay={0.08} duration={0.4}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                        Search participants by name or university to assign hostel rooms, manage capacities, and review allocations.
                    </Typography>
                </AnimatedText>
            </Box>

            {/* Quick Stats Banner */}
            <Box key={activeTab} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
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
                        <AnimatedCard key={index} delay={index * 0.07} style={{ height: '100%', width: '100%' }}>
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
                        </AnimatedCard>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                    border: '1px solid #a7f3d0'
                                }}
                            />
                            {mappedByUniversity.length > 0 && (
                                <Chip
                                    icon={<SchoolIcon sx={{ fontSize: '15px !important', color: '#1e40af' }} />}
                                    label={`${mappedByUniversity.length} ${mappedByUniversity.length === 1 ? 'University' : 'Universities'}`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#eff6ff',
                                        color: '#1e40af',
                                        fontWeight: 600,
                                        border: '1px solid #bfdbfe'
                                    }}
                                />
                            )}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Showing all {activeTab.toLowerCase()} grouped by university with assigned rooms
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
                        </Box>
                    </Box>
                </Box>

                {loading ? (
                    <Paper sx={{ py: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                        <CircularProgress size={32} sx={{ color: '#0b5299', mb: 1 }} />
                        <Typography sx={{ color: 'text.secondary' }}>Loading allocations...</Typography>
                    </Paper>
                ) : mappedList.length === 0 ? (
                    <Paper sx={{ py: 6, textAlign: 'center', color: '#64748b', borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <HotelIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                        <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                            No {activeTab.toLowerCase()} mapped to rooms yet.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                            Use the search box above to search by name or university and click "Map a Room".
                        </Typography>
                    </Paper>
                ) : mappedViewMode === 'table' ? (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="Universities mapped table">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569', width: 65, py: 1.5, pl: 2.5 }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.5 }}>University Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.5 }}>Total Allocated {activeTab}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.5 }}>Allocated Rooms</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.5, width: 140, textAlign: 'center', pr: 2.5 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mappedByUniversity.map((uniGroup, index) => {
                                    const assignedRooms = [...new Set(uniGroup.members.map(m => m.roomAllocation?.roomNumber).filter(Boolean))];
                                    const count = uniGroup.members.length;
                                    return (
                                        <TableRow
                                            key={uniGroup.university}
                                            hover
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                transition: 'background-color 0.15s ease'
                                            }}
                                        >
                                            <TableCell sx={{ color: '#64748b', fontWeight: 600, pl: 2.5 }}>{index + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 2,
                                                            bgcolor: 'rgba(11, 82, 153, 0.08)',
                                                            color: '#0b5299',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <SchoolIcon sx={{ fontSize: 20 }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
                                                        {uniGroup.university}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${count} Allocated`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#ecfdf5',
                                                        color: '#047857',
                                                        fontWeight: 700,
                                                        fontSize: '12px',
                                                        border: '1px solid #a7f3d0'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
                                                    {assignedRooms.length > 0 ? (
                                                        assignedRooms.map((room) => (
                                                            <Chip
                                                                key={room}
                                                                icon={<HotelIcon sx={{ fontSize: '13px !important', color: '#1e40af' }} />}
                                                                label={room}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#eff6ff',
                                                                    color: '#1e40af',
                                                                    fontWeight: 600,
                                                                    fontSize: '11.5px',
                                                                    border: '1px solid #bfdbfe',
                                                                    height: 24
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>None</Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center', pr: 2.5 }}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleOpenManageUniModal(uniGroup.university)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontSize: '12.5px',
                                                        fontWeight: 600,
                                                        bgcolor: '#0b5299',
                                                        color: '#ffffff',
                                                        px: 2,
                                                        py: 0.6,
                                                        borderRadius: 2,
                                                        boxShadow: '0 2px 6px rgba(11,82,153,0.22)',
                                                        '&:hover': {
                                                            bgcolor: '#083c70',
                                                            boxShadow: '0 4px 10px rgba(11,82,153,0.32)'
                                                        }
                                                    }}
                                                >
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    /* Cards View */
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                        {mappedByUniversity.map((uniGroup) => {
                            const assignedRooms = [...new Set(uniGroup.members.map(m => m.roomAllocation?.roomNumber).filter(Boolean))];
                            const count = uniGroup.members.length;
                            return (
                                <Paper
                                    key={uniGroup.university}
                                    variant="outlined"
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: '#cbd5e1',
                                            boxShadow: '0 4px 16px rgba(11,82,153,0.08)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(11, 82, 153, 0.1)',
                                                        color: '#0b5299',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <SchoolIcon sx={{ fontSize: 22 }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.3 }}>
                                                    {uniGroup.university}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={`${count} Allocated`}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#ecfdf5',
                                                    color: '#047857',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    border: '1px solid #a7f3d0'
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Allocated Room(s)
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                {assignedRooms.length > 0 ? (
                                                    assignedRooms.map((room) => (
                                                        <Chip
                                                            key={room}
                                                            icon={<HotelIcon sx={{ fontSize: '13px !important', color: '#1e40af' }} />}
                                                            label={room}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#eff6ff',
                                                                color: '#1e40af',
                                                                fontWeight: 600,
                                                                fontSize: '11px',
                                                                border: '1px solid #bfdbfe'
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>None</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="small"
                                        startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleOpenManageUniModal(uniGroup.university)}
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            bgcolor: '#0b5299',
                                            color: '#ffffff',
                                            py: 0.8,
                                            borderRadius: 2,
                                            boxShadow: '0 2px 6px rgba(11,82,153,0.22)',
                                            '&:hover': {
                                                bgcolor: '#083c70',
                                                boxShadow: '0 4px 10px rgba(11,82,153,0.32)'
                                            }
                                        }}
                                    >
                                        Manage
                                    </Button>
                                </Paper>
                            );
                        })}
                    </Box>
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

            {/* Modal: Manage University Mapped Participants */}
            <Dialog
                open={manageUniModalOpen}
                onClose={handleCloseManageUniModal}
                maxWidth="lg"
                fullWidth
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        m: 0,
                        p: { xs: 2, sm: 2.5 },
                        bgcolor: '#0b5299',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', width: 44, height: 44 }}>
                            <SchoolIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', fontSize: { xs: '1.05rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                                {selectedUniName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>
                                Manage Allocated {activeTab} • {currentUniGroup?.members?.length || 0} Total
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        onClick={handleCloseManageUniModal}
                        sx={{
                            color: '#ffffff',
                            bgcolor: 'rgba(255,255,255,0.12)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: '24px !important', sm: '28px !important' }, bgcolor: '#ffffff' }}>
                    {(!currentUniGroup || currentUniGroup.members.length === 0) ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <HotelIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                                No allocated {activeTab.toLowerCase()} found for this university.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                                All participants have been unassigned.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Summary bar inside modal */}
                            <Box
                                sx={{
                                    mt: 0.5,
                                    p: 1.8,
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2.5,
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                        Allocated Rooms:
                                    </Typography>
                                    {[...new Set(currentUniGroup.members.map(m => m.roomAllocation?.roomNumber).filter(Boolean))].map(room => (
                                        <Chip
                                            key={room}
                                            icon={<HotelIcon sx={{ fontSize: '13px !important', color: '#1e40af' }} />}
                                            label={room}
                                            size="small"
                                            sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600, fontSize: '11px', border: '1px solid #bfdbfe' }}
                                        />
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Chip
                                        label={`${currentUniGroup.members.length} ${activeTab === 'Players' ? (currentUniGroup.members.length === 1 ? 'Player' : 'Players') : (currentUniGroup.members.length === 1 ? 'Coach' : 'Coaches')}`}
                                        size="small"
                                        sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 700, border: '1px solid #a7f3d0' }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        startIcon={<MeetingRoomIcon sx={{ fontSize: 16 }} />}
                                        onClick={handleOpenVacateDialog}
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            bgcolor: '#dc2626',
                                            color: '#ffffff',
                                            borderRadius: 2,
                                            px: 2,
                                            py: 0.6,
                                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                                            '&:hover': {
                                                bgcolor: '#b91c1c',
                                                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.35)'
                                            }
                                        }}
                                    >
                                        Vacate
                                    </Button>
                                </Box>
                            </Box>

                            {/* Table of Members */}
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <Table size="small" aria-label={`Participant details for ${selectedUniName}`}>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: '#475569', width: 55, py: 1.2 }}>S.No</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Gender</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Phone</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Accommodation</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', py: 1.2 }}>Allocated Room</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b', width: 150, py: 1.2, textAlign: 'center' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentUniGroup.members.map((person, index) => (
                                            <TableRow
                                                key={person.id}
                                                hover
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    transition: 'background-color 0.15s ease'
                                                }}
                                            >
                                                <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{index + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{person.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={person.role}
                                                        size="small"
                                                        color={person.role === 'Coach' ? 'secondary' : 'primary'}
                                                        variant="outlined"
                                                        sx={{ height: 22, fontSize: '11px', fontWeight: 600 }}
                                                    />
                                                </TableCell>
                                                <TableCell>{person.gender}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '13px', color: '#334155' }}>
                                                    {person.phone || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {person.accommodation === 'Yes' ? (
                                                        <Chip
                                                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                            label="Yes"
                                                            size="small"
                                                            sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 600, height: 22 }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
                                                            label="No"
                                                            size="small"
                                                            sx={{ bgcolor: '#f1f5f9', color: '#64748b', height: 22 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                                        <Chip
                                                            icon={<HotelIcon sx={{ fontSize: '14px !important', color: '#1e40af' }} />}
                                                            label={`Room ${person.roomAllocation.roomNumber}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#dbeafe',
                                                                color: '#1e40af',
                                                                fontWeight: 700,
                                                                width: 'fit-content',
                                                                height: 22
                                                            }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '11px' }}>
                                                            {person.roomAllocation.building} • {person.roomAllocation.floor}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                                        <Tooltip title="Change Room">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                                                                onClick={(e) => {
                                                                    e.currentTarget.blur();
                                                                    handleOpenMapDialog(person);
                                                                }}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    fontSize: '11.5px',
                                                                    fontWeight: 600,
                                                                    py: 0.3,
                                                                    px: 1,
                                                                    borderRadius: 1.5,
                                                                    color: '#2563eb',
                                                                    borderColor: '#bfdbfe',
                                                                    bgcolor: '#eff6ff',
                                                                    '&:hover': { bgcolor: '#dbeafe', borderColor: '#93c5fd' }
                                                                }}
                                                            >
                                                                Change
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Unassign Room">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.currentTarget.blur();
                                                                    handleOpenUnassignDialog(person);
                                                                }}
                                                                sx={{
                                                                    color: '#dc2626',
                                                                    bgcolor: '#fef2f2',
                                                                    p: 0.6,
                                                                    '&:hover': { bgcolor: '#fee2e2' }
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Showing <b>{currentUniGroup?.members?.length || 0}</b> mapped {activeTab.toLowerCase()}
                    </Typography>
                    <Button
                        onClick={handleCloseManageUniModal}
                        variant="contained"
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#0b5299',
                            color: '#ffffff',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            '&:hover': { bgcolor: '#083c70' }
                        }}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal: Vacate Rooms & Proceed to Refund */}
            <Dialog
                open={vacateDialogOpen}
                onClose={handleCloseVacateDialog}
                maxWidth={vacateStep === 1 ? "xs" : "md"}
                fullWidth
                disableRestoreFocus
                sx={{ zIndex: 1450 }}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 20px 45px rgba(0,0,0,0.22)',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                {vacateStep === 1 ? (
                    /* Step 1: Confirmation Popup (Are you sure you want to vacate? Yes / No) */
                    <>
                        <DialogTitle sx={{ m: 0, p: 2.5, bgcolor: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MeetingRoomIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '1.1rem' }}>
                                    Vacate Rooms?
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                                    {selectedUniName}
                                </Typography>
                            </Box>
                        </DialogTitle>

                        <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
                            <Typography sx={{ color: '#1e293b', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
                                Are you sure you want to vacate rooms for <b>{selectedUniName}</b>?
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                                When you proceed, you will review the list of participants to vacate their allocated rooms and then be redirected to the Caution Deposit refund section.
                            </Typography>
                        </DialogContent>

                        <DialogActions sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleCloseVacateDialog}
                                sx={{ textTransform: 'none', borderRadius: 2, color: '#64748b', borderColor: '#cbd5e1', fontWeight: 600 }}
                            >
                                No
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleConfirmYesVacate}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    fontWeight: 700,
                                    bgcolor: '#dc2626',
                                    boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                                    '&:hover': { bgcolor: '#b91c1c' }
                                }}
                            >
                                Yes
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    /* Step 2: Checked list of all players in university with bottom Vacate button */
                    <>
                        <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#0b5299', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', width: 40, height: 40 }}>
                                    <MeetingRoomIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                                        Vacate Participants - {selectedUniName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                        Check / uncheck participants to vacate before refunding caution deposit
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={handleCloseVacateDialog}
                                disabled={vacating}
                                sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#ffffff' }}>
                            {/* Select All Checkbox bar */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.2,
                                    px: 2,
                                    mb: 2,
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2,
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Checkbox
                                        checked={Boolean(currentUniGroup && vacateSelectedIds.length === currentUniGroup.members.length && currentUniGroup.members.length > 0)}
                                        indeterminate={Boolean(vacateSelectedIds.length > 0 && currentUniGroup && vacateSelectedIds.length < currentUniGroup.members.length)}
                                        onChange={handleToggleSelectAllVacate}
                                        disabled={vacating}
                                        size="small"
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        Select All Participants
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`${vacateSelectedIds.length} of ${currentUniGroup?.members?.length || 0} Selected`}
                                    size="small"
                                    color={vacateSelectedIds.length > 0 ? "primary" : "default"}
                                    sx={{ fontWeight: 700, fontSize: '11px' }}
                                />
                            </Box>

                            {/* Players Checked List */}
                            <Stack spacing={1.2} sx={{ maxHeight: '50vh', overflowY: 'auto', pr: 0.5 }}>
                                {currentUniGroup?.members?.map((person) => {
                                    const isChecked = vacateSelectedIds.includes(person.id);
                                    return (
                                        <Paper
                                            key={person.id}
                                            variant="outlined"
                                            onClick={() => !vacating && handleToggleVacateMember(person.id)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                                                bgcolor: isChecked ? '#eff6ff' : '#ffffff',
                                                cursor: vacating ? 'default' : 'pointer',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: isChecked ? '#dbeafe' : '#f8fafc',
                                                    borderColor: isChecked ? '#1d4ed8' : '#cbd5e1'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={() => handleToggleVacateMember(person.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    disabled={vacating}
                                                    size="small"
                                                />
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                            {person.name}
                                                        </Typography>
                                                        <Chip
                                                            label={person.role}
                                                            size="small"
                                                            color={person.role === 'Coach' ? 'secondary' : 'primary'}
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '10.5px', fontWeight: 600 }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                        {person.gender} • Phone: {person.phone || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ textAlign: 'right' }}>
                                                <Chip
                                                    icon={<HotelIcon sx={{ fontSize: '13px !important', color: '#1e40af' }} />}
                                                    label={`Room ${person.roomAllocation.roomNumber}`}
                                                    size="small"
                                                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '11px', height: 24 }}
                                                />
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3, fontSize: '11px' }}>
                                                    {person.roomAllocation.building} • {person.roomAllocation.floor}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setVacateStep(1)}
                                disabled={vacating}
                                sx={{ textTransform: 'none', borderRadius: 2, color: '#64748b', borderColor: '#cbd5e1' }}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={vacateSelectedIds.length === 0 || vacating}
                                onClick={handleExecuteVacateAndRedirect}
                                startIcon={vacating ? null : <MeetingRoomIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1,
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    bgcolor: '#dc2626',
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                    '&:hover': { bgcolor: '#b91c1c' }
                                }}
                            >
                                {vacating ? (
                                    <CircularProgress size={22} color="inherit" />
                                ) : (
                                    `Vacate (${vacateSelectedIds.length})`
                                )}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Modal: Map a Room Form */}
            <Dialog
                open={mapDialogOpen}
                onClose={handleCloseMapDialog}
                maxWidth="sm"
                fullWidth
                disableRestoreFocus
                sx={{ zIndex: 1400 }}
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

                            {/* Hostel Selector */}
                            <FormControl fullWidth size="small">
                                <InputLabel id="single-hostel-select-label">Hostel</InputLabel>
                                <Select
                                    labelId="single-hostel-select-label"
                                    value={selectedHostel}
                                    label="Hostel"
                                    onChange={(e) => handleSingleHostelChange(e.target.value)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <HotelIcon sx={{ color: '#0b5299', fontSize: 18 }} />
                                        </InputAdornment>
                                    }
                                >
                                    {availableHostels.map(h => (
                                        <MenuItem key={h} value={h}>
                                            {h}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Building Selector */}
                            <FormControl fullWidth size="small">
                                <InputLabel id="building-select-label">Building / Block</InputLabel>
                                <Select
                                    labelId="building-select-label"
                                    value={selectedBuilding}
                                    label="Building / Block"
                                    onChange={(e) => handleSingleBuildingChange(e.target.value)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <ApartmentIcon sx={{ color: '#0b5299', fontSize: 20 }} />
                                        </InputAdornment>
                                    }
                                >
                                    {filteredBuildingsForSingle.map(bldg => (
                                        <MenuItem key={bldg.name} value={bldg.name}>
                                            {bldg.name} {bldg.capacityPerRoom ? `(${bldg.capacityPerRoom} beds/room)` : ''}
                                        </MenuItem>
                                    ))}
                                    {filteredBuildingsForSingle.length === 0 && (
                                        <MenuItem disabled value="">
                                            No buildings found in this category
                                        </MenuItem>
                                    )}
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
                                    {availableFloors.length === 0 && (
                                        <MenuItem disabled value="">
                                            No floors available
                                        </MenuItem>
                                    )}
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
                                    {availableRooms.length === 0 && (
                                        <MenuItem disabled value="">
                                            No rooms available on this floor
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>

                            {/* Notice if no rooms available */}
                            {availableRooms.length === 0 && (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    {!selectedBuilding ? (
                                        'Please select a building block to view available rooms.'
                                    ) : !selectedFloor ? (
                                        'Please select a floor to view available rooms.'
                                    ) : (
                                        <>No vacant rooms available on <b>{selectedFloor}</b> of <b>{selectedBuilding}</b>. Rooms may be at full capacity or not configured in Manage Blocks.</>
                                    )}
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
                sx={{ zIndex: 1400 }}
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
                                            label={`${currentTabMembers.unallotted.length} ${modalActiveTab === 'Players' ? 'Players' : 'Coaches'} Pending / ${currentTabMembers.all.length} Total`}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                bgcolor: currentTabMembers.unallotted.length > 0 ? '#fef3c7' : '#ecfdf5',
                                                color: currentTabMembers.unallotted.length > 0 ? '#92400e' : '#065f46'
                                            }}
                                        />
                                        {cautionDepositData.paid ? (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                label={`Deposit: Paid (₹${Number(cautionDepositData.amount || 0).toLocaleString('en-IN')})`}
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
                    {/* Role Switcher Tabs (Players vs Coaches/Managers) */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2.5,
                        p: 0.5,
                        bgcolor: '#f1f5f9',
                        borderRadius: '50px',
                        border: '1px solid #e2e8f0',
                        width: 'fit-content',
                        mx: 'auto'
                    }}>
                        <Button
                            onClick={() => handleModalTabChange('Players')}
                            disableElevation
                            variant={modalActiveTab === 'Players' ? 'contained' : 'text'}
                            startIcon={<PersonIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: '50px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                px: 2.5,
                                py: 0.8,
                                minHeight: 38,
                                bgcolor: modalActiveTab === 'Players' ? '#d06c38' : 'transparent',
                                color: modalActiveTab === 'Players' ? '#ffffff' : '#0b5299',
                                boxShadow: modalActiveTab === 'Players' ? '0 4px 10px rgba(208, 108, 56, 0.3)' : 'none',
                                '&:hover': {
                                    bgcolor: modalActiveTab === 'Players' ? '#b85828' : 'rgba(11, 82, 153, 0.08)'
                                }
                            }}
                        >
                            Players
                            <Chip
                                label={`${universityRoleStats.players?.unallotted?.length || 0} Pending`}
                                size="small"
                                sx={{
                                    ml: 1,
                                    height: 20,
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    bgcolor: modalActiveTab === 'Players' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                    color: modalActiveTab === 'Players' ? '#ffffff' : '#334155'
                                }}
                            />
                        </Button>

                        <Button
                            onClick={() => handleModalTabChange('Coaches / Managers')}
                            disableElevation
                            variant={modalActiveTab === 'Coaches / Managers' ? 'contained' : 'text'}
                            startIcon={<GroupsIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                borderRadius: '50px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                px: 2.5,
                                py: 0.8,
                                minHeight: 38,
                                bgcolor: modalActiveTab === 'Coaches / Managers' ? '#d06c38' : 'transparent',
                                color: modalActiveTab === 'Coaches / Managers' ? '#ffffff' : '#0b5299',
                                boxShadow: modalActiveTab === 'Coaches / Managers' ? '0 4px 10px rgba(208, 108, 56, 0.3)' : 'none',
                                '&:hover': {
                                    bgcolor: modalActiveTab === 'Coaches / Managers' ? '#b85828' : 'rgba(11, 82, 153, 0.08)'
                                }
                            }}
                        >
                            Coaches / Managers
                            <Chip
                                label={`${universityRoleStats.coaches?.unallotted?.length || 0} Pending`}
                                size="small"
                                sx={{
                                    ml: 1,
                                    height: 20,
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    bgcolor: modalActiveTab === 'Coaches / Managers' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                    color: modalActiveTab === 'Coaches / Managers' ? '#ffffff' : '#334155'
                                }}
                            />
                        </Button>
                    </Box>

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
                                No {modalActiveTab === 'Players' ? 'Players' : 'Coaches / Managers'} Registered with Accommodation
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450 }}>
                                {bulkSelectedUniversity} does not have any {modalActiveTab.toLowerCase()} requesting hostel accommodation.
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

                                {/* Hostel Selector */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="bulk-hostel-label">Hostel</InputLabel>
                                    <Select
                                        labelId="bulk-hostel-label"
                                        value={bulkHostel}
                                        label="Hostel"
                                        onChange={(e) => handleBulkHostelChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><HotelIcon sx={{ color: '#0b5299', fontSize: 18 }} /></InputAdornment>}
                                    >
                                        {availableHostels.map(hostelName => (
                                            <MenuItem key={hostelName} value={hostelName}>
                                                {hostelName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Building / Block */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="bulk-building-label">Building / Block</InputLabel>
                                    <Select
                                        labelId="bulk-building-label"
                                        value={bulkBuilding}
                                        label="Building / Block"
                                        onChange={(e) => handleBulkBuildingChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><ApartmentIcon sx={{ color: '#0b5299', fontSize: 18 }} /></InputAdornment>}
                                    >
                                        {filteredBuildingsForHostel.map(bldg => (
                                            <MenuItem key={bldg.name} value={bldg.name}>
                                                {bldg.name} {bldg.capacityPerRoom ? `(${bldg.capacityPerRoom} beds/room)` : ''}
                                            </MenuItem>
                                        ))}
                                        {filteredBuildingsForHostel.length === 0 && (
                                            <MenuItem disabled value="">
                                                No buildings found in this category
                                            </MenuItem>
                                        )}
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
                                        {bulkAvailableFloors.length === 0 && (
                                            <MenuItem disabled value="">
                                                No floors available
                                            </MenuItem>
                                        )}
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
                                        {bulkAvailableRooms.length === 0 && (
                                            <MenuItem disabled value="">
                                                No rooms available on this floor
                                            </MenuItem>
                                        )}
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
                                        Step 2: Select {modalActiveTab === 'Players' ? 'Players' : 'Coaches / Managers'} ({currentTabMembers.unallotted.length} Unallotted)
                                    </Typography>
                                    <Chip
                                        label={`${bulkSelectedMemberIds.length} / ${currentRoomMaxSlots} Selected`}
                                        size="small"
                                        color={bulkSelectedMemberIds.length > 0 ? 'primary' : 'default'}
                                        sx={{ fontWeight: 700, height: 22 }}
                                    />
                                </Box>

                                <Typography variant="caption" sx={{ color: '#64748b', mb: 1.5, display: 'block' }}>
                                    Select up to {currentRoomMaxSlots} {modalActiveTab === 'Players' ? 'player(s)' : 'coach(es)/manager(s)'} to assign to Room {bulkRoom || '(Select Room)'}.
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
                        /* Clean & concise out-of members allotted status */
                        <Box sx={{
                            py: 1.8,
                            px: 3,
                            bgcolor: '#ecfdf5',
                            borderRadius: 2.5,
                            border: '1.5px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                            boxShadow: '0 1px 4px rgba(5, 150, 105, 0.08)'
                        }}>
                            <CheckCircleIcon sx={{ color: '#059669', fontSize: 26 }} />
                            <Typography sx={{ fontWeight: 700, color: '#065f46', fontSize: '1rem' }}>
                                {currentTabMembers.allotted.length} / {currentTabMembers.all.length} {modalActiveTab === 'Players' ? 'Players' : 'Coaches / Managers'} Allotted
                            </Typography>
                            <Chip
                                label="All Allotted"
                                size="small"
                                sx={{ bgcolor: '#d1fae5', color: '#047857', fontWeight: 700, height: 24, fontSize: '11.5px' }}
                            />
                        </Box>
                    )}

                    {/* Step 3: Caution Deposit (Manual Collection) - Separated by Role */}

                    {/* 1. PLAYERS TAB: Show Only Players Caution Deposit */}
                    {modalActiveTab === 'Players' && allAllottedPlayers.length > 0 && (
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
                                            Step 3: Players Caution Deposit (Manual Cash Collection)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Collect refundable security deposit in cash at hostel desk for allotted players
                                        </Typography>
                                    </Box>
                                </Box>

                                <Chip
                                    icon={cautionDepositData.paid ? <CheckCircleIcon sx={{ fontSize: '16px !important' }} /> : <PaymentsIcon sx={{ fontSize: '16px !important' }} />}
                                    label={cautionDepositData.paid ? `Paid: ₹${Number(cautionDepositData.amount || 0).toLocaleString('en-IN')}` : 'Caution Deposit Pending'}
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
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1.2fr 1.2fr auto' }, gap: 1.5, alignItems: 'center' }}>
                                        {/* Dropdown: Paid by - ONLY ALLOTTED PLAYERS */}
                                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { height: 40, bgcolor: '#ffffff' } }}>
                                            <InputLabel id="caution-paid-by-label">Paid by *</InputLabel>
                                            <Select
                                                labelId="caution-paid-by-label"
                                                value={cautionPaidByPersonId || (allAllottedPlayers[0]?.id || '')}
                                                label="Paid by *"
                                                onChange={(e) => setCautionPaidByPersonId(e.target.value)}
                                            >
                                                {allAllottedPlayers.map((member) => (
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

                                        {/* Amount: Editable */}
                                        <TextField
                                            label="Deposit Amount (₹) *"
                                            size="small"
                                            type="number"
                                            value={cautionDepositAmount}
                                            onChange={(e) => setCautionDepositAmount(e.target.value)}
                                            placeholder="2000"
                                            sx={{ '& .MuiOutlinedInput-root': { height: 40, bgcolor: '#ffffff' } }}
                                            slotProps={{
                                                input: {
                                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                    sx: { fontWeight: 700, color: '#0f172a' }
                                                }
                                            }}
                                        />

                                        {/* Payment Mode */}
                                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { height: 40, bgcolor: '#ffffff' } }}>
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
                                            disabled={cautionSubmitting || allAllottedPlayers.length === 0}
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
                                                    Caution Deposit Received: ₹{Number(cautionDepositData.amount || 0).toLocaleString('en-IN')}
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
                                                onClick={() => {
                                                    setSelectedCoachReceipt(null);
                                                    setCautionReceiptModalOpen(true);
                                                }}
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

                    {/* 2. COACHES / MANAGERS TAB: Show Only Coaches Caution Deposit */}
                    {modalActiveTab === 'Coaches / Managers' && currentRegistration?.coaches && currentRegistration.coaches.length > 0 && (allAllottedCoaches.length > 0 || currentRegistration.coaches.some(c => c.cautionDeposit?.paid)) && (
                        <Paper
                            variant="outlined"
                            sx={{
                                mt: 2.5,
                                p: 2.5,
                                borderRadius: 2.5,
                                bgcolor: '#ffffff',
                                border: '1.5px solid #cbd5e1',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}
                        >
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                    <Box sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: '#eff6ff',
                                        color: '#0b5299',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <PersonIcon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.2 }}>
                                            Step 3: Coaches Caution Deposit (Manual Cash Collection)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Collect refundable security deposit in cash at hostel desk for room-allotted coaches
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    size="small"
                                    label={`${currentRegistration.coaches.filter(c => c.cautionDeposit?.paid).length}/${currentRegistration.coaches.length} Coaches Paid`}
                                    sx={{ height: 24, fontSize: '12px', fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {currentRegistration.coaches.map(coach => {
                                    const isPaid = coach.cautionDeposit?.paid;
                                    const isRefunded = coach.cautionDeposit?.refundStatus === 'Refunded';
                                    const hasRoom = coach.roomAllocation && coach.roomAllocation.roomNumber;

                                    return (
                                        <Box
                                            key={coach._id}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: isPaid ? '#f0fdf4' : '#f8fafc',
                                                border: isPaid ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1.5
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: isPaid ? '#dcfce7' : '#e0f2fe', color: isPaid ? '#16a34a' : '#0369a1', width: 36, height: 36 }}>
                                                    <PersonIcon sx={{ fontSize: 20 }} />
                                                </Avatar>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                                            {coach.name}
                                                        </Typography>
                                                        <Chip
                                                            label={coach.role || 'Coach'}
                                                            size="small"
                                                            sx={{ height: 18, fontSize: '10px', bgcolor: '#e2e8f0', color: '#475569', fontWeight: 600 }}
                                                        />
                                                        {hasRoom ? (
                                                            <Chip
                                                                label={`Room ${coach.roomAllocation.roomNumber} (${coach.roomAllocation.building || ''})`}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: '10px', bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 600 }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="No room yet"
                                                                size="small"
                                                                sx={{ height: 18, fontSize: '10px', bgcolor: '#f1f5f9', color: '#94a3b8' }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2 }}>
                                                        Phone: {coach.mobileNo || coach.phone || 'N/A'}
                                                        {isPaid && ` • Receipt #${coach.cautionDeposit?.receiptNo || 'CD-COACH'} • Paid ₹${Number(coach.cautionDeposit?.amount || 0).toLocaleString('en-IN')}`}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {isPaid ? (
                                                    <>
                                                        <Chip
                                                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                            label={isRefunded ? 'Refunded' : `Deposit Paid (₹${Number(coach.cautionDeposit?.amount || 0).toLocaleString('en-IN')})`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isRefunded ? '#f1f5f9' : '#dcfce7',
                                                                color: isRefunded ? '#64748b' : '#166534',
                                                                fontWeight: 700,
                                                                height: 26,
                                                                fontSize: '11px'
                                                            }}
                                                        />
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<PrintIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => {
                                                                setSelectedCoachReceipt(coach);
                                                                setCautionReceiptModalOpen(true);
                                                            }}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontSize: '11px',
                                                                py: 0.2,
                                                                px: 1,
                                                                borderColor: '#16a34a',
                                                                color: '#16a34a',
                                                                borderRadius: 1.5,
                                                                '&:hover': { bgcolor: '#f0fdf4' }
                                                            }}
                                                        >
                                                            Receipt
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handleResetCoachCautionDeposit(coach)}
                                                            sx={{
                                                                textTransform: 'none',
                                                                color: '#94a3b8',
                                                                fontSize: '11px',
                                                                p: 0.5,
                                                                '&:hover': { color: '#ef4444' }
                                                            }}
                                                        >
                                                            Reset
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            placeholder="2000"
                                                            value={coachCautionAmounts[coach._id] !== undefined ? coachCautionAmounts[coach._id] : '2000'}
                                                            onChange={(e) => setCoachCautionAmounts(prev => ({ ...prev, [coach._id]: e.target.value }))}
                                                            slotProps={{
                                                                input: {
                                                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                                    sx: { height: 32, fontSize: '12px', width: 100, bgcolor: '#ffffff' }
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={coachCautionSubmittingId === coach._id ? <CircularProgress size={14} color="inherit" /> : <PaymentsIcon sx={{ fontSize: 16 }} />}
                                                            disabled={coachCautionSubmittingId === coach._id}
                                                            onClick={() => handlePayCoachCautionDeposit(coach)}
                                                            sx={{
                                                                bgcolor: '#059669',
                                                                color: '#ffffff',
                                                                fontWeight: 700,
                                                                fontSize: '12px',
                                                                borderRadius: 1.5,
                                                                textTransform: 'none',
                                                                height: 32,
                                                                whiteSpace: 'nowrap',
                                                                '&:hover': { bgcolor: '#047857' }
                                                            }}
                                                        >
                                                            Collect
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    )}

                    {/* 3. Allotted Members Section (Grouped by Room) */}
                    {currentTabMembers.allotted.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HotelIcon sx={{ color: '#059669', fontSize: 20 }} />
                                Allotted {modalActiveTab === 'Players' ? 'Players' : 'Coaches / Managers'} of {bulkSelectedUniversity} ({currentTabMembers.allotted.length} Total)
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
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
                                    <Paper key={roomTitle} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
                                            <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '0.92rem' }}>
                                                {roomTitle}
                                            </Typography>
                                            <Chip label={`${members.length} member(s)`} size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                                        </Box>
                                        <Stack spacing={0.8}>
                                            {members.map(m => (
                                                <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', py: 0.6, px: 1.2, borderRadius: 1.5, bgcolor: '#ffffff', border: '1px solid #f1f5f9' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.86rem' }}>
                                                            {m.name}
                                                        </Typography>
                                                        <Chip label={m.role} size="small" sx={{ height: 18, fontSize: '10px', bgcolor: m.role === 'Player' ? '#f1f5f9' : '#fef3c7', color: m.role === 'Player' ? '#334155' : '#92400e', fontWeight: 600 }} />
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            ({m.gender}, {m.phone})
                                                        </Typography>
                                                    </Box>
                                                    <Tooltip title="Unassign from Room">
                                                        <IconButton size="small" onClick={() => handleBulkUnassignSingle(m)} sx={{ color: '#ef4444', p: 0.4, '&:hover': { bgcolor: '#fef2f2' } }}>
                                                            <ClearIcon sx={{ fontSize: 16 }} />
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
                    {((modalActiveTab === 'Players' && cautionDepositData.paid && allAllottedPlayers.length > 0) ||
                        (modalActiveTab === 'Coaches / Managers' && currentRegistration?.coaches?.length > 0 && currentRegistration.coaches.every(c => c.cautionDeposit?.paid))) &&
                        bulkSelectedMemberIds.length === 0 ? (
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

            {/* Caution Deposit Reusable Receipt Modal */}
            <CautionDepositReceiptModal
                open={cautionReceiptModalOpen}
                onClose={() => {
                    setCautionReceiptModalOpen(false);
                    setSelectedCoachReceipt(null);
                }}
                receiptData={selectedCoachReceipt ? {
                    isCoach: true,
                    amount: selectedCoachReceipt.cautionDeposit?.amount || 2000,
                    paidBy: selectedCoachReceipt.name,
                    paidByRole: selectedCoachReceipt.role || 'Coach',
                    paidByPhone: selectedCoachReceipt.mobileNo || selectedCoachReceipt.phone || 'N/A',
                    roomNumber: selectedCoachReceipt.roomAllocation?.roomNumber || 'Allotted',
                    paymentMode: selectedCoachReceipt.cautionDeposit?.paymentMode || 'Cash',
                    receiptNo: selectedCoachReceipt.cautionDeposit?.receiptNo || 'CD-COACH',
                    paidAt: selectedCoachReceipt.cautionDeposit?.paidAt,
                    universityName: selectedCoachReceipt.university || selectedCoachReceipt.universityName || bulkSelectedUniversity || 'Aditya University'
                } : {
                    isCoach: false,
                    amount: cautionDepositData?.amount || 2000,
                    paidBy: cautionDepositData?.paidBy?.name || 'Representative',
                    paidByRole: cautionDepositData?.paidBy?.role || 'Player',
                    paidByPhone: cautionDepositData?.paidBy?.phone || 'N/A',
                    roomNumber: cautionDepositData?.paidBy?.roomNumber || 'Allotted',
                    paymentMode: cautionDepositData?.paymentMode || 'Cash',
                    receiptNo: cautionDepositData?.receiptNo || 'CD-MANUAL',
                    paidAt: cautionDepositData?.paidAt,
                    universityName: cautionDepositData?.universityName || bulkSelectedUniversity || 'Aditya University'
                }}
            />
        </Box>
    );
};

export default HostelProvision;
