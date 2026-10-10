import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Card,
    CardContent,
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
    InputAdornment,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Divider,
    Stack,
    Tooltip,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GroupsIcon from '@mui/icons-material/Groups';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import io from 'socket.io-client';
import { toast } from 'sonner';
import CustomTabs from '../Common/Tabs';
import { foodTokenAPI, SOCKET_URL } from '../../utils/api';
import { MEAL_TYPES, EVENT_NAME, ORGANIZATION_NAME } from '../../config/foodTokenConfig';
import { printFoodToken, printMultipleFoodTokens } from './FoodTokens/FoodTokenPrint';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDateStr = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[-/]/);
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    return trimmed;
};

const parseYMD = (str) => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
};

const generateDateRange = (arrivalDate, departureDate) => {
    const start = normalizeDateStr(arrivalDate);
    const end = normalizeDateStr(departureDate);
    if (!start && !end) {
        return [getTodayDateString()];
    }
    const startDate = start || end;
    const endDate = end || start;
    const s = parseYMD(startDate);
    const e = parseYMD(endDate);
    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) {
        return [startDate];
    }
    const dates = [];
    const curr = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    let count = 0;
    while (curr <= e && count < 31) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        count++;
    }
    return dates.length > 0 ? dates : [startDate];
};

const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            return d.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
};

const formatDateCardHeader = (dateStr) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
            return `${weekday}, ${formatDateDDMMYYYY(dateStr)}`;
        }
        return formatDateDDMMYYYY(dateStr);
    } catch {
        return formatDateDDMMYYYY(dateStr);
    }
};

const MEAL_CONFIG = {
    'Breakfast': {
        icon: WbSunnyOutlinedIcon,
        bgColor: '#fef3c7',
        iconColor: '#f59e0b'
    },
    'Lunch': {
        icon: RestaurantOutlinedIcon,
        bgColor: '#dcfce7',
        iconColor: '#16a34a'
    },
    'Snacks': {
        icon: CoffeeOutlinedIcon,
        bgColor: '#f3e8ff',
        iconColor: '#9333ea'
    },
    'Dinner': {
        icon: DarkModeOutlinedIcon,
        bgColor: '#e0f2fe',
        iconColor: '#0284c7'
    }
};

const TABS = ['Issue Tokens', 'Tokens Report'];

const FoodTokens = () => {
    const [activeTab, setActiveTab] = useState(TABS[0]);

    // -------------------------------------------------------------
    // TAB 1: ISSUE TOKENS STATE
    // -------------------------------------------------------------
    const [searchQuery, setSearchQuery] = useState('');
    const [peopleList, setPeopleList] = useState([]);
    const [loadingPeople, setLoadingPeople] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
    const [issuingKey, setIssuingKey] = useState(null); // `${date}_${meal}`
    const [issuingDayDate, setIssuingDayDate] = useState(null); // `${date}`
    const [issuingBulk, setIssuingBulk] = useState(false);
    const [selectedCardDate, setSelectedCardDate] = useState(null);
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);
    const [selectedTeamMeals, setSelectedTeamMeals] = useState({});
    const [issuingTeamBulk, setIssuingTeamBulk] = useState(false);

    // -------------------------------------------------------------
    // TAB 2: TOKENS REPORT & STATS STATE
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    const [stats, setStats] = useState(null);
    const [tokensList, setTokensList] = useState([]);
    const [totalTokens, setTotalTokens] = useState(0);
    const [loadingTokens, setLoadingTokens] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [filterMeal, setFilterMeal] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPersonType, setFilterPersonType] = useState('');
    const [filterSearch, setFilterSearch] = useState('');

    // Cancel Dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [tokenToCancel, setTokenToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // -------------------------------------------------------------
    // SHARED REFRESH CALLBACKS
    // -------------------------------------------------------------
    const fetchStats = useCallback(async () => {
        try {
            const res = await foodTokenAPI.getStats();
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (err) {
            console.error('Stats error:', err);
        }
    }, []);

    const fetchTokensList = useCallback(async () => {
        setLoadingTokens(true);
        try {
            const params = {
                page: page + 1,
                limit: rowsPerPage
            };
            if (filterMeal) params.mealType = filterMeal;
            if (filterStatus) params.status = filterStatus;
            if (filterPersonType) params.personType = filterPersonType;
            if (filterSearch) params.search = filterSearch;

            const res = await foodTokenAPI.getAll(params);
            const data = await res.json();
            if (res.ok) {
                setTokensList(data.tokens || []);
                setTotalTokens(data.total || 0);
            }
        } catch (err) {
            console.error('Tokens list error:', err);
        } finally {
            setLoadingTokens(false);
        }
    }, [page, rowsPerPage, filterMeal, filterStatus, filterPersonType, filterSearch]);

    const searchPeople = useCallback(async (query) => {
        if (!query || !query.trim()) {
            setPeopleList([]);
            setLoadingPeople(false);
            return;
        }
        setLoadingPeople(true);
        try {
            const res = await foodTokenAPI.searchPeople(query.trim());
            const data = await res.json();
            if (res.ok) {
                const list = data.people || [];
                setPeopleList(list);
                // Synchronize selectedPerson if tokens have changed without triggering loops
                setSelectedPerson(prev => {
                    if (!prev) return null;
                    const match = list.find(p => p.personRef === prev.personRef);
                    if (!match) return prev;
                    if (JSON.stringify(prev.tokensByDate || {}) === JSON.stringify(match.tokensByDate || {})) {
                        return prev;
                    }
                    return match;
                });
            } else {
                toast.error(data.message || 'Failed to search participants');
            }
        } catch (err) {
            console.error(err);
            toast.error('Network error while searching');
        } finally {
            setLoadingPeople(false);
        }
    }, []);

    // Refs for socket callbacks to avoid re-subscribing on state change
    const searchQueryRef = useRef(searchQuery);
    searchQueryRef.current = searchQuery;

    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // -------------------------------------------------------------
    // REALTIME SOCKET UPDATES
    // -------------------------------------------------------------
    useEffect(() => {
        let socket;
        try {
            socket = io(SOCKET_URL);
            socket.on('foodTokenUpdated', () => {
                if (activeTabRef.current === 'Tokens Report') {
                    fetchStats();
                    fetchTokensList();
                } else if (activeTabRef.current === 'Issue Tokens' && searchQueryRef.current.trim()) {
                    searchPeople(searchQueryRef.current);
                }
            });
        } catch (e) {
            console.error('Socket connection error:', e);
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [fetchStats, fetchTokensList, searchPeople]);

    // Debounce search query - only runs when search query is typed
    useEffect(() => {
        if (!searchQuery.trim()) {
            setPeopleList([]);
            return;
        }
        const timer = setTimeout(() => {
            searchPeople(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchPeople]);

    // Issue Token for a specific meal and date
    const handleIssue = async (mealType, targetDate) => {
        if (!selectedPerson) return;
        const dateToUse = targetDate || getTodayDateString();
        const key = `${dateToUse}_${mealType}`;
        setIssuingKey(key);
        try {
            const payload = {
                personType: selectedPerson.personType,
                personRef: selectedPerson.personRef,
                mealType,
                mealDate: dateToUse
            };
            const res = await foodTokenAPI.issue(payload);
            const data = await res.json();

            if (res.status === 201) {
                toast.success(`Token for ${mealType} on ${dateToUse} issued! Printing...`);
                // Auto trigger thermal print
                try {
                    await printFoodToken(data.printPayload);
                } catch (printErr) {
                    toast.warning('Token issued successfully, but print dialog failed. Use Reprint.');
                }
                const newToken = data.token;
                const updatePersonTokens = (person) => {
                    if (!person) return null;
                    const byDate = { ...(person.tokensByDate || {}) };
                    if (!byDate[dateToUse]) byDate[dateToUse] = {};
                    byDate[dateToUse][mealType] = newToken;
                    const todayTokens = { ...(person.tokensToday || {}) };
                    if (dateToUse === getTodayDateString()) {
                        todayTokens[mealType] = newToken;
                    }
                    return {
                        ...person,
                        tokensByDate: byDate,
                        tokensToday: todayTokens
                    };
                };

                setSelectedPerson(prev => updatePersonTokens(prev));
                setPeopleList(prev => prev.map(p =>
                    p.personRef === selectedPerson.personRef ? updatePersonTokens(p) : p
                ));
                fetchStats();
            } else if (res.status === 409) {
                toast.info(data.message || 'Token already issued. You can reprint.');
                if (data.printPayload) {
                    try {
                        await printFoodToken(data.printPayload);
                    } catch (e) { }
                }
                if (data.existingToken) {
                    const exToken = data.existingToken;
                    const updatePersonTokens = (person) => {
                        if (!person) return null;
                        const byDate = { ...(person.tokensByDate || {}) };
                        if (!byDate[dateToUse]) byDate[dateToUse] = {};
                        byDate[dateToUse][mealType] = exToken;
                        const todayTokens = { ...(person.tokensToday || {}) };
                        if (dateToUse === getTodayDateString()) {
                            todayTokens[mealType] = exToken;
                        }
                        return {
                            ...person,
                            tokensByDate: byDate,
                            tokensToday: todayTokens
                        };
                    };
                    setSelectedPerson(prev => updatePersonTokens(prev));
                    setPeopleList(prev => prev.map(p =>
                        p.personRef === selectedPerson.personRef ? updatePersonTokens(p) : p
                    ));
                }
            } else {
                toast.error(data.message || 'Failed to issue token');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to issue token');
        } finally {
            setIssuingKey(null);
        }
    };

    // Bulk Issue All Remaining Meals for a Single Person on a specific Date
    const handleIssueDay = async (targetDate) => {
        if (!selectedPerson) return;
        setIssuingDayDate(targetDate);
        try {
            const payload = {
                personType: selectedPerson.personType,
                personRef: selectedPerson.personRef,
                mealDate: targetDate
            };
            const res = await foodTokenAPI.issueDay(payload);
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || `All 4 tokens for ${targetDate} ready! Printing...`);
                if (data.printPayloads && data.printPayloads.length > 0) {
                    toast.info(`Sending ${data.printPayloads.length} tokens to printer...`);
                    await printMultipleFoodTokens(data.printPayloads);
                }
                const newTokens = data.tokens || [];
                const updatePersonTokens = (person) => {
                    if (!person) return null;
                    const byDate = { ...(person.tokensByDate || {}) };
                    if (!byDate[targetDate]) byDate[targetDate] = {};
                    newTokens.forEach(t => {
                        byDate[targetDate][t.mealType] = t;
                    });
                    const todayTokens = { ...(person.tokensToday || {}) };
                    if (targetDate === getTodayDateString()) {
                        newTokens.forEach(t => {
                            todayTokens[t.mealType] = t;
                        });
                    }
                    return {
                        ...person,
                        tokensByDate: byDate,
                        tokensToday: todayTokens
                    };
                };
                setSelectedPerson(prev => updatePersonTokens(prev));
                setPeopleList(prev => prev.map(p =>
                    p.personRef === selectedPerson.personRef ? updatePersonTokens(p) : p
                ));
                fetchStats();
            } else {
                toast.error(data.message || 'Failed to issue day tokens');
            }
        } catch (err) {
            toast.error('Failed to issue day tokens');
        } finally {
            setIssuingDayDate(null);
        }
    };

    // Reprint Token
    const handleReprint = async (tokenId) => {
        try {
            const res = await foodTokenAPI.reprint(tokenId);
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Reprinting token...');
                await printFoodToken(data.printPayload);
            } else {
                toast.error(data.message || 'Failed to reprint token');
            }
        } catch (err) {
            toast.error('Print service error');
        }
    };

    // Open Dialog for Team Tokens with day-wise checkboxes
    const handleOpenTeamDialog = () => {
        if (!selectedPerson || !selectedPerson.registrationId) return;
        const stayDates = generateDateRange(selectedPerson.arrivalDate, selectedPerson.departureDate);
        const initialMap = {};
        stayDates.forEach(date => {
            MEAL_TYPES.forEach(meal => {
                initialMap[`${date}_${meal}`] = true;
            });
        });
        setSelectedTeamMeals(initialMap);
        setTeamDialogOpen(true);
    };

    // Toggle specific meal in team dialog
    const handleToggleTeamMeal = (date, meal) => {
        const key = `${date}_${meal}`;
        setSelectedTeamMeals(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Toggle entire day in team dialog
    const handleToggleTeamDay = (date) => {
        setSelectedTeamMeals(prev => {
            const next = { ...prev };
            const allSelected = MEAL_TYPES.every(m => next[`${date}_${m}`]);
            MEAL_TYPES.forEach(m => {
                if (allSelected) {
                    delete next[`${date}_${m}`];
                } else {
                    next[`${date}_${m}`] = true;
                }
            });
            return next;
        });
    };

    // Toggle all days and meals in team dialog
    const handleToggleSelectAllTeamMeals = (allKeys, isAllSelected) => {
        if (isAllSelected) {
            setSelectedTeamMeals({});
        } else {
            const map = {};
            allKeys.forEach(k => { map[k] = true; });
            setSelectedTeamMeals(map);
        }
    };

    // Confirm and Issue Selected Coupons for Whole Team
    const handleConfirmTeamIssue = async () => {
        if (!selectedPerson || !selectedPerson.registrationId) return;

        const selections = [];
        Object.entries(selectedTeamMeals).forEach(([key, isSelected]) => {
            if (isSelected) {
                const lastUnderscore = key.lastIndexOf('_');
                const mealDate = key.substring(0, lastUnderscore);
                const mealType = key.substring(lastUnderscore + 1);
                selections.push({ mealDate, mealType });
            }
        });

        if (selections.length === 0) {
            toast.warning('Please select at least one coupon to issue');
            return;
        }

        setIssuingTeamBulk(true);
        try {
            const res = await foodTokenAPI.issueBulk({
                registrationId: selectedPerson.registrationId,
                selections
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Tokens issued successfully');
                setTeamDialogOpen(false);
                if (data.printPayloads && data.printPayloads.length > 0) {
                    toast.info(`Sending ${data.printPayloads.length} tokens to printer...`);
                    await printMultipleFoodTokens(data.printPayloads);
                }
                searchPeople(searchQuery);
                fetchStats();
            } else {
                toast.error(data.message || 'Failed to issue team tokens');
            }
        } catch (err) {
            toast.error('Bulk issue failed: ' + err.message);
        } finally {
            setIssuingTeamBulk(false);
        }
    };


    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'Tokens Report') {
            fetchStats();
            fetchTokensList();
        }
    }, [activeTab, fetchStats, fetchTokensList]);


    // Cancel action
    const handleOpenCancelDialog = (token) => {
        setTokenToCancel(token);
        setCancelReason('');
        setCancelDialogOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!tokenToCancel || !cancelReason.trim()) {
            toast.warning('Please enter a cancellation reason');
            return;
        }
        setCancelling(true);
        try {
            const res = await foodTokenAPI.cancel(tokenToCancel._id, cancelReason);
            const data = await res.json();
            if (res.ok) {
                toast.success('Token cancelled successfully');
                setCancelDialogOpen(false);
                setTokenToCancel(null);
                fetchStats();
                fetchTokensList();
            } else {
                toast.error(data.message || 'Failed to cancel token');
            }
        } catch (err) {
            toast.error('Network error while cancelling');
        } finally {
            setCancelling(false);
        }
    };

    // Export tokens to CSV
    const handleExportCSV = () => {
        if (!tokensList.length) {
            toast.info('No token records to export');
            return;
        }

        const headers = ['Code', 'Name', 'Identifier', 'Role', 'Team/University', 'Meal Type', 'Date', 'Status', 'Issued By', 'Print Count', 'Redeemed At'];
        const csvRows = [headers.join(',')];

        tokensList.forEach(t => {
            const row = [
                `"${t.code}"`,
                `"${t.name || ''}"`,
                `"${t.identifier || ''}"`,
                `"${t.personType || ''}"`,
                `"${t.teamOrSport || ''}"`,
                `"${t.mealType || ''}"`,
                `"${formatDateDDMMYYYY(t.mealDate)}"`,
                `"${t.status || ''}"`,
                `"${t.issuedBy || ''}"`,
                t.printCount || 1,
                t.redeemedAt ? `"${new Date(t.redeemedAt).toLocaleString()}"` : '""'
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `food_tokens_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Team Dialog Calculations
    const teamStayDates = selectedPerson ? generateDateRange(selectedPerson.arrivalDate, selectedPerson.departureDate) : [];
    const allTeamKeys = [];
    teamStayDates.forEach(date => {
        MEAL_TYPES.forEach(meal => {
            allTeamKeys.push(`${date}_${meal}`);
        });
    });
    const selectedTeamCount = Object.values(selectedTeamMeals).filter(Boolean).length;
    const isAllTeamSelected = allTeamKeys.length > 0 && allTeamKeys.every(k => selectedTeamMeals[k]);
    const isSomeTeamSelected = allTeamKeys.some(k => selectedTeamMeals[k]) && !isAllTeamSelected;

    return (
        <Box sx={{ width: '100%', pb: 4 }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <RestaurantIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                    <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: '28px', lineHeight: 1.2 }}>
                        Food Tokens
                    </Typography>
                </Box>
                <Typography sx={{ color: 'text.secondary', fontSize: '14px', mt: 0.5 }}>
                    Issue and thermal print food tokens for players, coaches, and managers.
                </Typography>
            </Box>

            {/* Sub-Navigation Tabs */}
            <Box sx={{ mb: 3 }}>
                <CustomTabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
            </Box>

            {/* ============================================================= */}
            {/* TAB 1: ISSUE TOKENS */}
            {/* ============================================================= */}
            {activeTab === 'Issue Tokens' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Top: Participant Search & List */}
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '16px', mb: 2 }}>
                                Search Eligible People
                            </Typography>

                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, mobile, university..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#0b5299' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery ? (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setPeopleList([]);
                                                    }}
                                                    edge="end"
                                                >
                                                    <CancelIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null
                                    }
                                }}
                                sx={{ mb: searchQuery.trim() ? 2 : 0 }}
                            />

                            {loadingPeople ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size={32} sx={{ color: '#0b5299' }} />
                                </Box>
                            ) : !searchQuery.trim() ? (
                                null
                            ) : peopleList.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <PersonIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                                    <Typography variant="body2">No matching players, coaches, or managers found for "{searchQuery}".</Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                                    gap: 1.5,
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    pr: 0.5
                                }}>
                                    {peopleList.map((person) => {
                                        const isSelected = selectedPerson?.personRef === person.personRef;
                                        const issuedCount = Object.keys(person.tokensToday || {}).length;

                                        return (
                                            <Box
                                                key={`${person.personType}-${person.personRef}`}
                                                onClick={() => {
                                                    setSelectedPerson(person);
                                                    setSelectedDateFilter('ALL');
                                                    setSelectedCardDate(null);
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    mb: 1.5,
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    border: isSelected ? '2px solid #0b5299' : '1px solid #e2e8f0',
                                                    bgcolor: isSelected ? '#f0f7ff' : '#ffffff',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: isSelected ? '#f0f7ff' : '#f8fafc', borderColor: '#0b5299' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                                                        {person.name}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={person.roleLabel}
                                                        sx={{
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            bgcolor: person.personType === 'MANAGER' ? '#f3e8ff' : person.personType === 'COACH' ? '#dcfce7' : '#e0f2fe',
                                                            color: person.personType === 'MANAGER' ? '#7e22ce' : person.personType === 'COACH' ? '#15803d' : '#0369a1'
                                                        }}
                                                    />
                                                </Box>

                                                <Typography sx={{ fontSize: '13px', color: '#475569', mt: 0.5 }}>
                                                    {person.teamOrSport}
                                                </Typography>

                                                {person.arrivalDate && (
                                                    <Typography sx={{ fontSize: '12px', color: '#0b5299', fontWeight: 600, mt: 0.5 }}>
                                                        Stay: {formatDateDDMMYYYY(person.arrivalDate)} → {formatDateDDMMYYYY(person.departureDate || person.arrivalDate)}
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                    <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                                                        {person.identifier}
                                                        {person.block ? ` • ${person.block} (${person.room})` : ''}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={person.tokensByDate ? `${Object.values(person.tokensByDate).reduce((acc, meals) => acc + Object.keys(meals).length, 0)} Total Tokens` : `${issuedCount}/4 Today`}
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontSize: '10px', height: 20, fontWeight: 700 }}
                                                    />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* Bottom: Selected Person Token Issuance */}
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            {selectedPerson ? (
                                <Box>
                                    {/* Person Header Banner */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2, mb: 3, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 2 }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b5299' }}>
                                                    {selectedPerson.name}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={selectedPerson.roleLabel}
                                                    sx={{
                                                        fontWeight: 600,
                                                        bgcolor: selectedPerson.personType === 'MANAGER' ? '#f3e8ff' : selectedPerson.personType === 'COACH' ? '#dcfce7' : '#e0f2fe',
                                                        color: selectedPerson.personType === 'MANAGER' ? '#7e22ce' : selectedPerson.personType === 'COACH' ? '#15803d' : '#0369a1'
                                                    }}
                                                />
                                            </Box>
                                            <Typography sx={{ color: '#475569', fontSize: '14px', mt: 0.5 }}>
                                                {selectedPerson.teamOrSport} • Mobile: {selectedPerson.identifier}
                                            </Typography>
                                            {(selectedPerson.arrivalDate || selectedPerson.departureDate) && (
                                                <Typography sx={{ color: '#0b5299', fontSize: '13px', fontWeight: 700, mt: 0.5 }}>
                                                    Stay Period: {formatDateDDMMYYYY(selectedPerson.arrivalDate)} {selectedPerson.arrivalTime || ''} → {formatDateDDMMYYYY(selectedPerson.departureDate || selectedPerson.arrivalDate)} {selectedPerson.departureTime || ''}
                                                </Typography>
                                            )}
                                            {selectedPerson.block && (
                                                <Typography sx={{ color: '#64748b', fontSize: '13px', fontWeight: 500, mt: 0.25 }}>
                                                    Accommodation: {selectedPerson.block} — Room {selectedPerson.room}
                                                </Typography>
                                            )}
                                        </Box>

                                        {selectedPerson.registrationId && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={issuingTeamBulk ? <CircularProgress size={16} /> : <ConfirmationNumberOutlinedIcon sx={{ fontSize: 18 }} />}
                                                onClick={handleOpenTeamDialog}
                                                disabled={issuingTeamBulk}
                                                sx={{ borderColor: '#d06c38', color: '#d06c38', '&:hover': { borderColor: '#b85928', bgcolor: '#fff5f0' } }}
                                            >
                                                Issue All Tokens
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Multi-Day Token Sections */}
                                    {(() => {
                                        const stayDates = generateDateRange(selectedPerson.arrivalDate, selectedPerson.departureDate);

                                        return (
                                            <Box>
                                                {/* Render Days in Responsive Grid matching design */}
                                                <Box sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: {
                                                        xs: '1fr',
                                                        sm: 'repeat(2, 1fr)',
                                                        lg: 'repeat(3, 1fr)'
                                                    },
                                                    gap: 2.5,
                                                    width: '100%'
                                                }}>
                                                    {stayDates.map((date, dayIndex) => {
                                                        const dateIndex = stayDates.indexOf(date);
                                                        const dayNumber = dateIndex !== -1 ? dateIndex + 1 : dayIndex + 1;
                                                        const isArrivalDay = date === normalizeDateStr(selectedPerson.arrivalDate);
                                                        const isDepartureDay = date === normalizeDateStr(selectedPerson.departureDate);
                                                        const isToday = date === getTodayDateString();

                                                        const dayTokens = selectedPerson.tokensByDate?.[date] || (isToday ? selectedPerson.tokensToday : {}) || {};
                                                        const issuedCount = MEAL_TYPES.filter(m => Boolean(dayTokens[m])).length;
                                                        const allIssued = issuedCount === MEAL_TYPES.length;
                                                        const isDayLoading = issuingDayDate === date;

                                                        const isCardSelected = selectedCardDate === date;

                                                        return (
                                                            <Paper
                                                                key={date}
                                                                elevation={0}
                                                                onClick={() => setSelectedCardDate(prev => prev === date ? null : date)}
                                                                sx={{
                                                                    p: 2.5,
                                                                    borderRadius: 4,
                                                                    cursor: 'pointer',
                                                                    bgcolor: '#ffffff',
                                                                    border: isCardSelected ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                                                                    boxShadow: isCardSelected
                                                                        ? '0 4px 16px rgba(11, 82, 153, 0.08)'
                                                                        : '0 1px 3px rgba(0,0,0,0.02)',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'space-between',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                                                                        borderColor: isCardSelected ? '#0b5299' : '#94a3b8'
                                                                    }
                                                                }}
                                                            >
                                                                {/* Day Header */}
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    justifyContent: 'space-between',
                                                                    mb: 2.5
                                                                }}>
                                                                    <Box>
                                                                        <Typography sx={{
                                                                            fontWeight: 800,
                                                                            fontSize: '17px',
                                                                            color: '#0f172a',
                                                                            lineHeight: 1.2
                                                                        }}>
                                                                            {formatDateCardHeader(date)}
                                                                        </Typography>
                                                                        <Typography sx={{
                                                                            fontSize: '13px',
                                                                            color: '#64748b',
                                                                            fontWeight: 500,
                                                                            mt: 0.5
                                                                        }}>
                                                                            Day {dayNumber}
                                                                        </Typography>
                                                                    </Box>

                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        {isArrivalDay && (
                                                                            <Chip
                                                                                label="Arrival Day"
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#fef3c7',
                                                                                    color: '#b45309',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '11px',
                                                                                    height: 24,
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {isDepartureDay && (
                                                                            <Chip
                                                                                label="Departure Day"
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#ffe4e6',
                                                                                    color: '#e11d48',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '11px',
                                                                                    height: 24,
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {(!isArrivalDay && !isDepartureDay || issuedCount > 0) && (
                                                                            <Chip
                                                                                label={`${issuedCount}/${MEAL_TYPES.length} Issued`}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: allIssued ? '#dcfce7' : '#f1f5f9',
                                                                                    color: allIssued ? '#16a34a' : '#64748b',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '11px',
                                                                                    height: 24,
                                                                                    borderRadius: '12px'
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                </Box>

                                                                {/* 4 Meal Rows for this Day */}
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1.5 }}>
                                                                    {MEAL_TYPES.map((meal) => {
                                                                        const cfg = MEAL_CONFIG[meal] || {
                                                                            icon: RestaurantIcon,
                                                                            bgColor: '#f1f5f9',
                                                                            iconColor: '#64748b'
                                                                        };
                                                                        const IconComp = cfg.icon;
                                                                        const existingToken = dayTokens[meal];
                                                                        const isIssued = Boolean(existingToken);
                                                                        const itemKey = `${date}_${meal}`;
                                                                        const isLoadingThis = issuingKey === itemKey;

                                                                        return (
                                                                            <Box
                                                                                key={meal}
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'space-between',
                                                                                    py: 0.8,
                                                                                    px: 0.5
                                                                                }}
                                                                            >
                                                                                {/* Left: Round Icon & Meal Info */}
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, pr: 1 }}>
                                                                                    <Box sx={{
                                                                                        width: 40,
                                                                                        height: 40,
                                                                                        borderRadius: '50%',
                                                                                        bgcolor: cfg.bgColor,
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        flexShrink: 0
                                                                                    }}>
                                                                                        <IconComp sx={{ color: cfg.iconColor, fontSize: 20 }} />
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 0 }}>
                                                                                        <Typography sx={{ fontWeight: 700, fontSize: '14.5px', color: '#1e293b', lineHeight: 1.2 }}>
                                                                                            {meal}
                                                                                        </Typography>
                                                                                        <Typography sx={{
                                                                                            fontSize: '12px',
                                                                                            color: isIssued ? '#16a34a' : '#94a3b8',
                                                                                            fontWeight: isIssued ? 600 : 400,
                                                                                            mt: 0.25,
                                                                                            lineHeight: 1.2
                                                                                        }}>
                                                                                            {isIssued ? `Issued • ${existingToken.code}` : 'Not issued'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Box>

                                                                                {/* Right: Action Button */}
                                                                                <Box sx={{ flexShrink: 0 }}>
                                                                                    {isIssued ? (
                                                                                        <Button
                                                                                            variant="outlined"
                                                                                            size="small"
                                                                                            startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleReprint(existingToken._id || existingToken.id);
                                                                                            }}
                                                                                            sx={{
                                                                                                borderColor: '#0b5299',
                                                                                                color: '#0b5299',
                                                                                                fontWeight: 600,
                                                                                                fontSize: '12.5px',
                                                                                                textTransform: 'none',
                                                                                                borderRadius: '10px',
                                                                                                px: 2,
                                                                                                py: 0.8,
                                                                                                whiteSpace: 'nowrap',
                                                                                                '&:hover': {
                                                                                                    bgcolor: '#f0f7ff',
                                                                                                    borderColor: '#083d73'
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            Reprint
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <Button
                                                                                            variant="contained"
                                                                                            size="small"
                                                                                            disabled={Boolean(issuingKey) || isDayLoading}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleIssue(meal, date);
                                                                                            }}
                                                                                            startIcon={isLoadingThis ? <CircularProgress size={14} color="inherit" /> : <PrintIcon sx={{ fontSize: 16 }} />}
                                                                                            sx={{
                                                                                                bgcolor: '#d06c38',
                                                                                                color: '#ffffff',
                                                                                                fontWeight: 600,
                                                                                                fontSize: '12.5px',
                                                                                                textTransform: 'none',
                                                                                                borderRadius: '10px',
                                                                                                px: 2,
                                                                                                py: 0.8,
                                                                                                boxShadow: 'none',
                                                                                                whiteSpace: 'nowrap',
                                                                                                '&:hover': {
                                                                                                    bgcolor: '#b85928',
                                                                                                    boxShadow: 'none'
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {isLoadingThis ? 'Issuing...' : 'Issue & Print'}
                                                                                        </Button>
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Box>

                                                                {/* Bottom of Day Card: Print All 4 Coupons Button - only visible when card is clicked */}
                                                                {isCardSelected && (
                                                                    <Box sx={{ mt: 'auto', pt: 1 }}>
                                                                        <Divider sx={{ mb: 1.5, borderColor: '#f1f5f9' }} />
                                                                        <Button
                                                                            fullWidth
                                                                            variant={allIssued ? 'outlined' : 'contained'}
                                                                            size="medium"
                                                                            disabled={isDayLoading || Boolean(issuingKey)}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleIssueDay(date);
                                                                            }}
                                                                            startIcon={isDayLoading ? <CircularProgress size={16} color="inherit" /> : <PrintIcon sx={{ fontSize: 18 }} />}
                                                                            sx={{
                                                                                bgcolor: allIssued ? 'transparent' : '#0b5299',
                                                                                color: allIssued ? '#0b5299' : '#ffffff',
                                                                                borderColor: '#0b5299',
                                                                                fontWeight: 700,
                                                                                fontSize: '13px',
                                                                                textTransform: 'none',
                                                                                borderRadius: '10px',
                                                                                py: 0.9,
                                                                                boxShadow: 'none',
                                                                                '&:hover': {
                                                                                    bgcolor: allIssued ? '#f0f7ff' : '#083d73',
                                                                                    borderColor: '#083d73',
                                                                                    boxShadow: 'none'
                                                                                }
                                                                            }}
                                                                        >
                                                                            {isDayLoading ? 'Printing 4 Coupons...' : (allIssued ? 'Print All 4 Coupons' : 'Issue & Print All 4 Coupons')}
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                            </Paper>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        );
                                    })()}
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, color: 'text.secondary' }}>
                                    <RestaurantIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569' }}>
                                        Select a Player, Coach, or Manager
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                                        Choose someone from the search list above to issue or reprint their tokens.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* ============================================================= */}
            {/* TAB 2: TOKENS REPORT & MANAGEMENT */}
            {/* ============================================================= */}
            {activeTab === 'Tokens Report' && (
                <Box>
                    {/* Stats Summary Cards */}
                    {/* Stats Summary Card (Full Width - Dashboard Style) */}
                    {stats && (
                        <Box sx={{ width: '100%', mb: 3 }}>
                            <Card
                                sx={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    width: '100%',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                        borderColor: '#93c5fd'
                                    }
                                }}
                            >
                                {/* Corner Category Badge */}
                                <Chip
                                    label="Total"
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 14,
                                        right: 14,
                                        bgcolor: '#eff6ff',
                                        color: '#1d4ed8',
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
                                    <ConfirmationNumberOutlinedIcon sx={{ fontSize: 90, color: '#0b5299' }} />
                                </Box>

                                <CardContent sx={{ py: 2, pr: 2, pl: 1.25, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
                                        {/* Icon badge */}
                                        <Box sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
                                            boxShadow: '0 4px 12px rgba(11, 82, 153, 0.22)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.05)' }
                                        }}>
                                            <ConfirmationNumberOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />
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
                                                TOTAL TOKENS ISSUED
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    fontSize: { xs: '2rem', md: '2.2rem' },
                                                    lineHeight: 1
                                                }}
                                            >
                                                {stats.overall?.totalIssued || 0}
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
                                        Total Active Food Coupons
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Breakdown by Meal Type (Dashboard Style) */}
                    {stats?.byMeal && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
                            {[
                                {
                                    mealKey: 'Breakfast',
                                    title: 'BREAKFAST',
                                    count: stats.byMeal?.['Breakfast']?.issued || 0,
                                    subtitle: 'Morning Meal Tokens',
                                    badge: 'Morning',
                                    icon: <WbSunnyOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                                    bgIcon: <WbSunnyOutlinedIcon sx={{ fontSize: 90, color: '#d97706' }} />,
                                    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                                    shadow: 'rgba(217, 119, 6, 0.22)',
                                    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
                                    borderColor: '#e2e8f0',
                                    hoverBorder: '#fde68a',
                                    badgeBg: '#fffbeb',
                                    badgeColor: '#b45309'
                                },
                                {
                                    mealKey: 'Lunch',
                                    title: 'LUNCH',
                                    count: stats.byMeal?.['Lunch']?.issued || 0,
                                    subtitle: 'Afternoon Meal Tokens',
                                    badge: 'Afternoon',
                                    icon: <RestaurantOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                                    bgIcon: <RestaurantOutlinedIcon sx={{ fontSize: 90, color: '#059669' }} />,
                                    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    shadow: 'rgba(5, 150, 105, 0.22)',
                                    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f6fdf9 100%)',
                                    borderColor: '#e2e8f0',
                                    hoverBorder: '#a7f3d0',
                                    badgeBg: '#ecfdf5',
                                    badgeColor: '#047857'
                                },
                                {
                                    mealKey: 'Snacks',
                                    title: 'SNACKS',
                                    count: stats.byMeal?.['Snacks']?.issued || 0,
                                    subtitle: 'Evening Refreshments',
                                    badge: 'Evening',
                                    icon: <CoffeeOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                                    bgIcon: <CoffeeOutlinedIcon sx={{ fontSize: 90, color: '#d06c38' }} />,
                                    gradient: 'linear-gradient(135deg, #d06c38 0%, #ea580c 100%)',
                                    shadow: 'rgba(208, 108, 56, 0.22)',
                                    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbf7 100%)',
                                    borderColor: '#e2e8f0',
                                    hoverBorder: '#fed7aa',
                                    badgeBg: '#fff7ed',
                                    badgeColor: '#c2410c'
                                },
                                {
                                    mealKey: 'Dinner',
                                    title: 'DINNER',
                                    count: stats.byMeal?.['Dinner']?.issued || 0,
                                    subtitle: 'Night Meal Tokens',
                                    badge: 'Night',
                                    icon: <DarkModeOutlinedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
                                    bgIcon: <DarkModeOutlinedIcon sx={{ fontSize: 90, color: '#0b5299' }} />,
                                    gradient: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
                                    shadow: 'rgba(11, 82, 153, 0.22)',
                                    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
                                    borderColor: '#e2e8f0',
                                    hoverBorder: '#93c5fd',
                                    badgeBg: '#eff6ff',
                                    badgeColor: '#1d4ed8'
                                }
                            ].map((stat, idx) => (
                                <Card
                                    key={idx}
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
                                    {/* Corner Category Badge */}
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
                    )}

                    {/* Table Filters & Actions */}
                    <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, width: '100%' }}>
                                <TextField
                                    size="small"
                                    placeholder="Search code, name, team..."
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    sx={{ minWidth: { xs: '100%', sm: 180, md: 220 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}
                                />

                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                    <InputLabel>Meal Type</InputLabel>
                                    <Select value={filterMeal} label="Meal Type" onChange={(e) => setFilterMeal(e.target.value)}>
                                        <MenuItem value="">All Meals</MenuItem>
                                        {MEAL_TYPES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="ISSUED">Issued</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                    <InputLabel>Role / Type</InputLabel>
                                    <Select value={filterPersonType} label="Role / Type" onChange={(e) => setFilterPersonType(e.target.value)}>
                                        <MenuItem value="">All Roles</MenuItem>
                                        <MenuItem value="PLAYER">Player</MenuItem>
                                        <MenuItem value="COACH">Coach</MenuItem>
                                        <MenuItem value="MANAGER">Manager</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleExportCSV}
                                sx={{ color: '#0b5299', borderColor: '#0b5299', width: { xs: '100%', sm: 'auto' } }}
                            >
                                Export CSV
                            </Button>
                        </Box>

                        {/* Tokens Data Table */}
                        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
                            <Table size="small" sx={{ minWidth: 650 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Token Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Participant Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>University / Team</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Meal</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Prints</TableCell>
                                        <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingTokens ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                <CircularProgress size={28} sx={{ color: '#0b5299' }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : tokensList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                No food tokens found for the selected criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tokensList.map((token) => (
                                            <TableRow key={token._id} hover>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0b5299' }}>
                                                    {token.code}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{token.name}</TableCell>
                                                <TableCell sx={{ color: '#475569' }}>{token.teamOrSport}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{token.mealType}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{formatDateDDMMYYYY(token.mealDate)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={token.status}
                                                        color={token.status === 'ISSUED' ? 'success' : 'error'}
                                                        sx={{ fontWeight: 700, fontSize: '11px' }}
                                                    />
                                                </TableCell>
                                                <TableCell>{token.printCount || 1}</TableCell>
                                                <TableCell sx={{ textAlign: 'right' }}>
                                                    <Tooltip title="Reprint token receipt">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                disabled={token.status !== 'ISSUED'}
                                                                onClick={() => handleReprint(token._id)}
                                                                sx={{ color: '#0b5299' }}
                                                            >
                                                                <PrintIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50]}
                            component="div"
                            count={totalTokens}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        />
                    </Paper>
                </Box>
            )}

            {/* Issue Team Food Tokens Dialog */}
            <Dialog
                open={teamDialogOpen}
                onClose={() => !issuingTeamBulk && setTeamDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        p: 2.5,
                        pb: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #e2e8f0'
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Box
                                sx={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    bgcolor: '#fff5f0',
                                    color: '#d06c38',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ConfirmationNumberOutlinedIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                    Issue Food Tokens for Whole Team
                                </Typography>
                                <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.25 }}>
                                    {selectedPerson?.teamOrSport ? `${selectedPerson.teamOrSport} • ` : ''}
                                    Stay: {formatDateDDMMYYYY(selectedPerson?.arrivalDate)} → {formatDateDDMMYYYY(selectedPerson?.departureDate || selectedPerson?.arrivalDate)} ({teamStayDates.length} {teamStayDates.length === 1 ? 'Day' : 'Days'})
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setTeamDialogOpen(false)}
                        disabled={issuingTeamBulk}
                        sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
                    {/* Top Control Bar: Select All & Counters */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.75,
                            px: 2,
                            mb: 2.5,
                            borderRadius: 2,
                            border: '1px solid #cbd5e1',
                            bgcolor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1.5
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isAllTeamSelected}
                                    indeterminate={isSomeTeamSelected}
                                    onChange={() => handleToggleSelectAllTeamMeals(allTeamKeys, isAllTeamSelected)}
                                    color="primary"
                                    sx={{
                                        color: '#0b5299',
                                        '&.Mui-checked': { color: '#0b5299' },
                                        '&.MuiCheckbox-indeterminate': { color: '#0b5299' }
                                    }}
                                />
                            }
                            label={
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                                    Select All Coupons (All Days & Meals)
                                </Typography>
                            }
                        />

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                size="small"
                                label={`${selectedTeamCount} / ${allTeamKeys.length} Coupons Selected`}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    bgcolor: selectedTeamCount > 0 ? '#eff6ff' : '#f1f5f9',
                                    color: selectedTeamCount > 0 ? '#1d4ed8' : '#64748b',
                                    border: selectedTeamCount > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                                }}
                            />
                            {selectedTeamCount > 0 && (
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => setSelectedTeamMeals({})}
                                    disabled={issuingTeamBulk}
                                    sx={{ fontSize: '12px', color: '#64748b', minWidth: 'auto', p: '2px 8px' }}
                                >
                                    Deselect All
                                </Button>
                            )}
                        </Stack>
                    </Paper>

                    {/* Day-wise Coupon Groups */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {teamStayDates.map((date, dayIdx) => {
                            const isDayAll = MEAL_TYPES.every(m => selectedTeamMeals[`${date}_${m}`]);
                            const isDaySome = MEAL_TYPES.some(m => selectedTeamMeals[`${date}_${m}`]) && !isDayAll;
                            const daySelectedCount = MEAL_TYPES.filter(m => selectedTeamMeals[`${date}_${m}`]).length;

                            return (
                                <Paper
                                    key={date}
                                    elevation={0}
                                    sx={{
                                        borderRadius: 2,
                                        border: daySelectedCount > 0 ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                                        bgcolor: '#ffffff',
                                        overflow: 'hidden',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {/* Day Header */}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.25,
                                            bgcolor: daySelectedCount > 0 ? '#f0f7ff' : '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Chip
                                                size="small"
                                                label={`Day ${dayIdx + 1}`}
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#0b5299',
                                                    color: '#ffffff'
                                                }}
                                            />
                                            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                                                {formatDateCardHeader(date)}
                                            </Typography>
                                        </Box>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={isDayAll}
                                                    indeterminate={isDaySome}
                                                    onChange={() => handleToggleTeamDay(date)}
                                                    sx={{
                                                        color: '#0b5299',
                                                        '&.Mui-checked': { color: '#0b5299' }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                                    Select Day
                                                </Typography>
                                            }
                                            sx={{ m: 0 }}
                                        />
                                    </Box>

                                    {/* Meals Checkboxes Grid */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                                            gap: 1.5
                                        }}
                                    >
                                        {MEAL_TYPES.map(meal => {
                                            const cfg = MEAL_CONFIG[meal] || {};
                                            const IconComponent = cfg.icon || RestaurantIcon;
                                            const key = `${date}_${meal}`;
                                            const isChecked = !!selectedTeamMeals[key];

                                            return (
                                                <Box
                                                    key={meal}
                                                    onClick={() => handleToggleTeamMeal(date, meal)}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        border: isChecked ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                                                        bgcolor: isChecked ? '#f8fafc' : '#ffffff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        transition: 'all 0.15s ease',
                                                        userSelect: 'none',
                                                        '&:hover': {
                                                            borderColor: '#0b5299',
                                                            bgcolor: '#f8fafc'
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                        <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 1.5,
                                                                bgcolor: cfg.bgColor || '#f1f5f9',
                                                                color: cfg.iconColor || '#475569',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <IconComponent sx={{ fontSize: 18 }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                                {meal}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                                                                Coupon
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Checkbox
                                                        size="small"
                                                        checked={isChecked}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => handleToggleTeamMeal(date, meal)}
                                                        sx={{
                                                            p: 0.5,
                                                            color: '#94a3b8',
                                                            '&.Mui-checked': { color: '#0b5299' }
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 2,
                        px: { xs: 2, sm: 3 },
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: 1.5,
                        justifyContent: 'space-between',
                        bgcolor: '#ffffff'
                    }}
                >
                    <Typography sx={{ fontSize: '13px', color: '#64748b', fontWeight: 500, textAlign: { xs: 'center', sm: 'left' } }}>
                        {selectedTeamCount > 0 ? (
                            <span><b>{selectedTeamCount}</b> coupon type(s) selected for issuance</span>
                        ) : (
                            <span style={{ color: '#ef4444' }}>Please select at least one coupon</span>
                        )}
                    </Typography>

                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                        <Button
                            onClick={() => setTeamDialogOpen(false)}
                            disabled={issuingTeamBulk}
                            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirmTeamIssue}
                            disabled={issuingTeamBulk || selectedTeamCount === 0}
                            startIcon={issuingTeamBulk ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                            sx={{
                                bgcolor: '#0b5299',
                                '&:hover': { bgcolor: '#083d73' },
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1,
                                borderRadius: 1.5,
                                boxShadow: '0 2px 8px rgba(11, 82, 153, 0.25)'
                            }}
                        >
                            {issuingTeamBulk ? 'Issuing & Printing...' : 'Issue & Print'}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FoodTokens;
