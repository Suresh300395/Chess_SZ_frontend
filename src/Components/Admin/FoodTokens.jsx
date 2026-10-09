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
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import CancelIcon from '@mui/icons-material/Cancel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GroupsIcon from '@mui/icons-material/Groups';
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
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleDateString('en-US', { month: 'short' });
            const year = d.getFullYear();
            return `${weekday}, ${day} ${month}, ${year}`;
        }
        return dateStr;
    } catch {
        return dateStr;
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

    // Bulk Issue for whole team
    const handleBulkIssue = async () => {
        if (!selectedPerson || !selectedPerson.registrationId) return;
        setIssuingBulk(true);
        try {
            // Bulk issue for current active meal or prompt
            const currentMeal = MEAL_TYPES[1]; // Default to Lunch or prompt
            const res = await foodTokenAPI.issueBulk({
                registrationId: selectedPerson.registrationId,
                mealType: currentMeal
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                if (data.printPayloads && data.printPayloads.length > 0) {
                    toast.info(`Sending ${data.printPayloads.length} tokens to printer...`);
                    await printMultipleFoodTokens(data.printPayloads);
                }
                searchPeople(searchQuery);
            } else {
                toast.error(data.message || 'Failed to issue team tokens');
            }
        } catch (err) {
            toast.error('Bulk issue failed');
        } finally {
            setIssuingBulk(false);
        }
    };


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
                `"${t.mealDate || ''}"`,
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

    return (
        <Box sx={{ width: '100%', pb: 4 }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: '28px', lineHeight: 1.2 }}>
                    Food Tokens
                </Typography>
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
                                                        Stay: {person.arrivalDate} → {person.departureDate || person.arrivalDate}
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
                                                    Stay Period: {selectedPerson.arrivalDate || 'N/A'} {selectedPerson.arrivalTime || ''} → {selectedPerson.departureDate || selectedPerson.arrivalDate || 'N/A'} {selectedPerson.departureTime || ''}
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
                                                startIcon={issuingBulk ? <CircularProgress size={16} /> : <GroupsIcon />}
                                                onClick={handleBulkIssue}
                                                disabled={issuingBulk}
                                                sx={{ borderColor: '#d06c38', color: '#d06c38', '&:hover': { borderColor: '#b85928', bgcolor: '#fff5f0' } }}
                                            >
                                                Issue for Whole Team
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Multi-Day Token Sections */}
                                    {(() => {
                                        const stayDates = generateDateRange(selectedPerson.arrivalDate, selectedPerson.departureDate);
                                        const datesToRender = selectedDateFilter === 'ALL' ? stayDates : stayDates.filter(d => d === selectedDateFilter);
                                        const activeCardDate = selectedCardDate || datesToRender[0];

                                        return (
                                            <Box>
                                                {/* Stay Duration Overview Bar & Day Filter Pills */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    bgcolor: '#f8fafc',
                                                    borderRadius: 2.5,
                                                    mb: 3,
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '14px' }}>
                                                            Stay Duration:
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={`${stayDates.length} Day${stayDates.length > 1 ? 's' : ''} (${formatDateLabel(stayDates[0])} - ${formatDateLabel(stayDates[stayDates.length - 1])})`}
                                                            sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }}
                                                        />
                                                    </Box>

                                                    {stayDates.length > 1 && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                size="small"
                                                                label={`All Days (${stayDates.length})`}
                                                                clickable
                                                                color={selectedDateFilter === 'ALL' ? 'primary' : 'default'}
                                                                onClick={() => {
                                                                    setSelectedDateFilter('ALL');
                                                                    setSelectedCardDate(null);
                                                                }}
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                            {stayDates.map((date, idx) => (
                                                                <Chip
                                                                    key={date}
                                                                    size="small"
                                                                    label={`Day ${idx + 1}: ${date.slice(5)}`}
                                                                    clickable
                                                                    color={selectedDateFilter === date || activeCardDate === date ? 'primary' : 'default'}
                                                                    variant={selectedDateFilter === date || activeCardDate === date ? 'filled' : 'outlined'}
                                                                    onClick={() => {
                                                                        setSelectedDateFilter(date);
                                                                        setSelectedCardDate(date);
                                                                    }}
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Render Days in 3-Column Responsive Grid matching design */}
                                                <Box sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: {
                                                        xs: '1fr',
                                                        md: 'repeat(2, 1fr)',
                                                        lg: 'repeat(3, 1fr)'
                                                    },
                                                    gap: 2.5
                                                }}>
                                                    {datesToRender.map((date, dayIndex) => {
                                                        const dateIndex = stayDates.indexOf(date);
                                                        const dayNumber = dateIndex !== -1 ? dateIndex + 1 : dayIndex + 1;
                                                        const isArrivalDay = date === normalizeDateStr(selectedPerson.arrivalDate);
                                                        const isDepartureDay = date === normalizeDateStr(selectedPerson.departureDate);
                                                        const isToday = date === getTodayDateString();
                                                        const isSelected = activeCardDate === date;

                                                        const dayTokens = selectedPerson.tokensByDate?.[date] || (isToday ? selectedPerson.tokensToday : {}) || {};
                                                        const issuedCount = MEAL_TYPES.filter(m => Boolean(dayTokens[m])).length;
                                                        const allIssued = issuedCount === MEAL_TYPES.length;
                                                        const isDayLoading = issuingDayDate === date;

                                                        return (
                                                            <Paper
                                                                key={date}
                                                                elevation={0}
                                                                onClick={() => setSelectedCardDate(date)}
                                                                sx={{
                                                                    p: 2.5,
                                                                    borderRadius: 4,
                                                                    cursor: 'pointer',
                                                                    bgcolor: isSelected ? '#f8fbff' : (isArrivalDay ? '#f8fbff' : '#ffffff'),
                                                                    border: isSelected
                                                                        ? '2px solid #0b5299'
                                                                        : (isArrivalDay ? '1.5px solid #60a5fa' : '1px solid #e2e8f0'),
                                                                    boxShadow: isSelected
                                                                        ? '0 0 0 2px rgba(11, 82, 153, 0.15), 0 8px 24px rgba(11, 82, 153, 0.1)'
                                                                        : (isArrivalDay
                                                                            ? '0 0 0 1px #60a5fa, 0 4px 14px rgba(59, 130, 246, 0.08)'
                                                                            : '0 1px 3px rgba(0,0,0,0.02)'),
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'space-between',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                                                                        borderColor: isSelected ? '#0b5299' : '#94a3b8'
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

                                                                {/* Bottom of Day Card: Print All 4 Coupons Button */}
                                                                <Box sx={{ mt: 'auto', pt: 1 }}>
                                                                    <Divider sx={{ mb: 1.5, borderColor: isSelected ? '#bae6fd' : '#f1f5f9' }} />
                                                                    <Button
                                                                        fullWidth
                                                                        variant={allIssued ? 'outlined' : 'contained'}
                                                                        size="medium"
                                                                        disabled={isDayLoading || Boolean(issuingKey)}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedCardDate(date);
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
                                                            </Paper>
                                                        );
                                                    })}
                                                </Box>

                                                {/* Bottom Action Bar for Selected Day ("kinda") */}
                                                {activeCardDate && (
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            mt: 3.5,
                                                            p: 2.5,
                                                            borderRadius: 3.5,
                                                            bgcolor: '#f8fafc',
                                                            border: '2px solid #0b5299',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexWrap: 'wrap',
                                                            gap: 2,
                                                            boxShadow: '0 4px 16px rgba(11, 82, 153, 0.08)'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Box sx={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 2.5,
                                                                bgcolor: '#0b5299',
                                                                color: '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                <PrintIcon sx={{ fontSize: 26 }} />
                                                            </Box>
                                                            <Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                    <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>
                                                                        {formatDateCardHeader(activeCardDate)}
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        label={`Day ${stayDates.indexOf(activeCardDate) + 1}`}
                                                                        sx={{ bgcolor: '#0b5299', color: '#ffffff', fontWeight: 700, fontSize: '11px', height: 22 }}
                                                                    />
                                                                    {(() => {
                                                                        const actTokens = selectedPerson.tokensByDate?.[activeCardDate] || (activeCardDate === getTodayDateString() ? selectedPerson.tokensToday : {}) || {};
                                                                        const actCount = MEAL_TYPES.filter(m => Boolean(actTokens[m])).length;
                                                                        const isActAll = actCount === MEAL_TYPES.length;
                                                                        return (
                                                                            <Chip
                                                                                size="small"
                                                                                label={`${actCount}/${MEAL_TYPES.length} Issued`}
                                                                                color={isActAll ? 'success' : actCount > 0 ? 'info' : 'default'}
                                                                                sx={{ fontWeight: 700, fontSize: '11px', height: 22 }}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </Box>
                                                                <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.25 }}>
                                                                    Click button to print all 4 coupons (Breakfast, Lunch, Snacks, Dinner) for this day
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Button
                                                            variant="contained"
                                                            size="large"
                                                            disabled={issuingDayDate === activeCardDate || Boolean(issuingKey)}
                                                            onClick={() => handleIssueDay(activeCardDate)}
                                                            startIcon={issuingDayDate === activeCardDate ? <CircularProgress size={18} color="inherit" /> : <PrintIcon sx={{ fontSize: 20 }} />}
                                                            sx={{
                                                                bgcolor: '#d06c38',
                                                                color: '#ffffff',
                                                                fontWeight: 800,
                                                                fontSize: '14.5px',
                                                                textTransform: 'none',
                                                                borderRadius: '12px',
                                                                px: 3.5,
                                                                py: 1.2,
                                                                boxShadow: 'none',
                                                                '&:hover': {
                                                                    bgcolor: '#b85928',
                                                                    boxShadow: 'none'
                                                                }
                                                            }}
                                                        >
                                                            {issuingDayDate === activeCardDate ? 'Printing 4 Coupons...' : 'Print All 4 Coupons'}
                                                        </Button>
                                                    </Paper>
                                                )}
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
                    {stats && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                            <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #0b5299' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: '13px', fontWeight: 600 }}>Total Tokens Issued</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0b5299', mt: 0.5 }}>
                                    {stats.overall?.totalIssued || 0}
                                </Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #10b981' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: '13px', fontWeight: 600 }}>Active Valid Tokens</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                                    {stats.overall?.totalActive ?? ((stats.overall?.totalIssued || 0) - (stats.overall?.totalCancelled || 0))}
                                </Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #ef4444' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: '13px', fontWeight: 600 }}>Cancelled Tokens</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.5 }}>
                                    {stats.overall?.totalCancelled || 0}
                                </Typography>
                            </Paper>
                        </Box>
                    )}

                    {/* Breakdown by Meal Type */}
                    {stats?.byMeal && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                            {MEAL_TYPES.map(meal => {
                                const m = stats.byMeal[meal] || { issued: 0, cancelled: 0 };
                                return (
                                    <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }} key={meal}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{meal}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: '12px' }}>
                                            <span style={{ color: '#0b5299' }}>Issued: <b>{m.issued}</b></span>
                                            <span style={{ color: '#ef4444' }}>Cancelled: <b>{m.cancelled || 0}</b></span>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}

                    {/* Table Filters & Actions */}
                    <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Search code, name, team..."
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    sx={{ minWidth: 220 }}
                                />

                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Meal Type</InputLabel>
                                    <Select value={filterMeal} label="Meal Type" onChange={(e) => setFilterMeal(e.target.value)}>
                                        <MenuItem value="">All Meals</MenuItem>
                                        {MEAL_TYPES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="ISSUED">Issued</MenuItem>
                                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 140 }}>
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
                                sx={{ color: '#0b5299', borderColor: '#0b5299' }}
                            >
                                Export CSV
                            </Button>
                        </Box>

                        {/* Tokens Data Table */}
                        <TableContainer>
                            <Table size="small">
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
                                                <TableCell>{token.mealDate}</TableCell>
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
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                                                        <Tooltip title="Cancel token">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    disabled={token.status !== 'ISSUED'}
                                                                    onClick={() => handleOpenCancelDialog(token)}
                                                                    sx={{ color: '#ef4444' }}
                                                                >
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </Stack>
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

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>
                    Cancel Food Token
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: '14px', mb: 2 }}>
                        Are you sure you want to cancel token <b>{tokenToCancel?.code}</b> issued to <b>{tokenToCancel?.name}</b> for {tokenToCancel?.mealType}?
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Cancellation Reason *"
                        placeholder="e.g. Lost token, participant departed early"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        required
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmCancel}
                        disabled={cancelling || !cancelReason.trim()}
                    >
                        {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FoodTokens;
