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
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import GroupsIcon from '@mui/icons-material/Groups';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ViewListIcon from '@mui/icons-material/ViewList';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import io from 'socket.io-client';
import { toast } from 'sonner';
import CustomTabs from '../Common/Tabs';
import { foodTokenAPI, SOCKET_URL } from '../../utils/api';
import { MEAL_TYPES, EVENT_NAME, ORGANIZATION_NAME } from '../../config/foodTokenConfig';
import { printFoodToken, printMultipleFoodTokens } from './FoodTokens/FoodTokenPrint';
import { AnimatedCard, AnimatedText } from '../animations';
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

    // Multi-Selection and University Bulk Issue State
    const [selectedPeopleRefs, setSelectedPeopleRefs] = useState([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogPeople, setBulkDialogPeople] = useState([]);
    const [bulkDialogMeals, setBulkDialogMeals] = useState({});
    const [issuingMultiBulk, setIssuingMultiBulk] = useState(false);

    // Missing Departure Details State (for players without departure date)
    const [missingDepPlayers, setMissingDepPlayers] = useState([]);
    const [loadingMissingDep, setLoadingMissingDep] = useState(false);
    const [editingDepDates, setEditingDepDates] = useState({});
    const [savingDepPlayerRef, setSavingDepPlayerRef] = useState(null);
    const [missingDepSearch, setMissingDepSearch] = useState('');

    // -------------------------------------------------------------
    // TAB 2: TOKENS REPORT & STATS STATE
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    const [stats, setStats] = useState(null);
    const [tokenReportSubTab, setTokenReportSubTab] = useState('REDEEMED'); // 'ISSUED' | 'REDEEMED' | 'BOTH' | 'ALL'
    const [filterMeal, setFilterMeal] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPersonType, setFilterPersonType] = useState('');
    const [filterMealDate, setFilterMealDate] = useState(''); // Date filter (YYYY-MM-DD)
    const [filterSearch, setFilterSearch] = useState('');
    const [debouncedFilterSearch, setDebouncedFilterSearch] = useState('');
    const [tokensViewMode, setTokensViewMode] = useState('table');
    const [exportingCsv, setExportingCsv] = useState(false);
    const summaryDateInputRef = useRef(null);
    // Date range filter for summary table
    const getTodayYMD = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const [summaryDateMode, setSummaryDateMode] = useState('today'); // 'today' | 'custom' | 'all'
    const [summaryFromDate, setSummaryFromDate] = useState(getTodayYMD);
    const [summaryToDate, setSummaryToDate] = useState(getTodayYMD);

    // Debounce search query to prevent typing lag
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterSearch(filterSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [filterSearch]);

    // 1. ISSUED TOKENS STATE
    const [issuedList, setIssuedList] = useState([]);
    const [totalIssuedTokens, setTotalIssuedTokens] = useState(0);
    const [loadingIssued, setLoadingIssued] = useState(false);
    const [issuedPage, setIssuedPage] = useState(0);
    const [issuedRowsPerPage, setIssuedRowsPerPage] = useState(20);

    // 2. REDEEMED TOKENS STATE
    const [redeemedList, setRedeemedList] = useState([]);
    const [totalRedeemedTokens, setTotalRedeemedTokens] = useState(0);
    const [loadingRedeemed, setLoadingRedeemed] = useState(false);
    const [redeemedPage, setRedeemedPage] = useState(0);
    const [redeemedRowsPerPage, setRedeemedRowsPerPage] = useState(20);

    // 3. ALL TOKENS STATE (for 'ALL' tab)
    const [allTokensList, setAllTokensList] = useState([]);
    const [totalAllTokens, setTotalAllTokens] = useState(0);
    const [loadingAll, setLoadingAll] = useState(false);
    const [allPage, setAllPage] = useState(0);
    const [allRowsPerPage, setAllRowsPerPage] = useState(20);

    // Backward-compatibility aliases
    const tokensList = tokenReportSubTab === 'REDEEMED' ? redeemedList : tokenReportSubTab === 'ALL' ? allTokensList : issuedList;
    const loadingTokens = tokenReportSubTab === 'REDEEMED' ? loadingRedeemed : tokenReportSubTab === 'ALL' ? loadingAll : loadingIssued;
    const totalTokens = tokenReportSubTab === 'REDEEMED' ? totalRedeemedTokens : tokenReportSubTab === 'ALL' ? totalAllTokens : totalIssuedTokens;
    const page = tokenReportSubTab === 'REDEEMED' ? redeemedPage : tokenReportSubTab === 'ALL' ? allPage : issuedPage;
    const setPage = tokenReportSubTab === 'REDEEMED' ? setRedeemedPage : tokenReportSubTab === 'ALL' ? setAllPage : setIssuedPage;
    const rowsPerPage = tokenReportSubTab === 'REDEEMED' ? redeemedRowsPerPage : tokenReportSubTab === 'ALL' ? allRowsPerPage : issuedRowsPerPage;
    const setRowsPerPage = tokenReportSubTab === 'REDEEMED' ? setRedeemedRowsPerPage : tokenReportSubTab === 'ALL' ? setAllRowsPerPage : setIssuedRowsPerPage;

    // Cancel Dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [tokenToCancel, setTokenToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // -------------------------------------------------------------
    // SHARED REFRESH CALLBACKS
    // -------------------------------------------------------------
    const fetchStats = useCallback(async (params = {}) => {
        try {
            const res = await foodTokenAPI.getStats(params);
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (err) {
            console.error('Stats error:', err);
        }
    }, []);

    // Build stats params based on summaryDateMode
    const buildSummaryStatsParams = useCallback((mode, fromDate, toDate) => {
        if (mode === 'today') {
            const today = (() => {
                const d = new Date();
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            })();
            return { fromDate: today, toDate: today };
        }
        if (mode === 'custom') {
            const p = {};
            if (fromDate) p.fromDate = fromDate;
            if (toDate) p.toDate = toDate;
            return p;
        }
        return {}; // 'all'
    }, []);

    const handleDateFilterChange = (dateVal) => {
        setFilterMealDate(dateVal);
        setIssuedPage(0);
        setRedeemedPage(0);
        setAllPage(0);
        fetchStats(dateVal ? { mealDate: dateVal } : {});
    };

    const fetchIssuedTokens = useCallback(async () => {
        setLoadingIssued(true);
        try {
            const params = {
                page: issuedPage + 1,
                limit: issuedRowsPerPage,
                status: 'ISSUED'
            };
            if (filterMeal) params.mealType = filterMeal;
            if (filterMealDate) params.mealDate = filterMealDate;
            if (filterPersonType) params.personType = filterPersonType;
            if (debouncedFilterSearch && debouncedFilterSearch.trim()) params.search = debouncedFilterSearch.trim();

            const res = await foodTokenAPI.getAll(params);
            const data = await res.json();
            if (res.ok) {
                setIssuedList(data.tokens || []);
                setTotalIssuedTokens(data.total || 0);
            }
        } catch (err) {
            console.error('Issued tokens error:', err);
        } finally {
            setLoadingIssued(false);
        }
    }, [issuedPage, issuedRowsPerPage, filterMeal, filterMealDate, filterPersonType, debouncedFilterSearch]);

    const fetchRedeemedTokens = useCallback(async () => {
        setLoadingRedeemed(true);
        try {
            const params = {
                page: redeemedPage + 1,
                limit: redeemedRowsPerPage,
                status: 'REDEEMED'
            };
            if (filterMeal) params.mealType = filterMeal;
            if (filterMealDate) params.mealDate = filterMealDate;
            if (filterPersonType) params.personType = filterPersonType;
            if (debouncedFilterSearch && debouncedFilterSearch.trim()) params.search = debouncedFilterSearch.trim();

            const res = await foodTokenAPI.getAll(params);
            const data = await res.json();
            if (res.ok) {
                setRedeemedList(data.tokens || []);
                setTotalRedeemedTokens(data.total || 0);
            }
        } catch (err) {
            console.error('Redeemed tokens error:', err);
        } finally {
            setLoadingRedeemed(false);
        }
    }, [redeemedPage, redeemedRowsPerPage, filterMeal, filterMealDate, filterPersonType, debouncedFilterSearch]);

    const fetchAllTokens = useCallback(async () => {
        setLoadingAll(true);
        try {
            const params = {
                page: allPage + 1,
                limit: allRowsPerPage
            };
            if (filterMeal) params.mealType = filterMeal;
            if (filterMealDate) params.mealDate = filterMealDate;
            if (filterStatus) params.status = filterStatus;
            if (filterPersonType) params.personType = filterPersonType;
            if (debouncedFilterSearch && debouncedFilterSearch.trim()) params.search = debouncedFilterSearch.trim();

            const res = await foodTokenAPI.getAll(params);
            const data = await res.json();
            if (res.ok) {
                setAllTokensList(data.tokens || []);
                setTotalAllTokens(data.total || 0);
            }
        } catch (err) {
            console.error('All tokens error:', err);
        } finally {
            setLoadingAll(false);
        }
    }, [allPage, allRowsPerPage, filterMeal, filterMealDate, filterStatus, filterPersonType, debouncedFilterSearch]);

    const fetchTokensList = useCallback(() => {
        fetchIssuedTokens();
        fetchRedeemedTokens();
        if (tokenReportSubTab === 'ALL') {
            fetchAllTokens();
        }
    }, [fetchIssuedTokens, fetchRedeemedTokens, fetchAllTokens, tokenReportSubTab]);

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

    const fetchMissingDeparturePlayers = useCallback(async () => {
        setLoadingMissingDep(true);
        try {
            const res = await foodTokenAPI.getMissingDeparture();
            const data = await res.json();
            if (res.ok) {
                const list = data.players || [];
                setMissingDepPlayers(list);
                setEditingDepDates(prev => {
                    const next = { ...prev };
                    list.forEach(p => {
                        if (!next[p.playerRef]) {
                            next[p.playerRef] = {
                                departureDate: p.departureDate || '',
                                departureTime: p.departureTime || ''
                            };
                        }
                    });
                    return next;
                });
            } else {
                console.error('Failed to fetch missing departure players:', data.message);
            }
        } catch (err) {
            console.error('Error fetching missing departure players:', err);
        } finally {
            setLoadingMissingDep(false);
        }
    }, []);

    const handleDepDateChange = (playerRef, field, value) => {
        setEditingDepDates(prev => ({
            ...prev,
            [playerRef]: {
                ...(prev[playerRef] || {}),
                [field]: value
            }
        }));
    };

    const handleSavePlayerDeparture = async (player) => {
        const editData = editingDepDates[player.playerRef] || {};
        const departureDate = editData.departureDate;
        const departureTime = editData.departureTime || '';

        if (!departureDate || !departureDate.trim()) {
            toast.warning(`Please select a departure date for ${player.playerName}`);
            return;
        }

        setSavingDepPlayerRef(player.playerRef);
        try {
            const res = await foodTokenAPI.updateDeparture({
                registrationId: player.registrationId,
                playerRef: player.playerRef,
                departureDate: departureDate.trim(),
                departureTime: departureTime.trim()
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || `Departure details saved for ${player.playerName}! Tokens enabled.`);
                await fetchMissingDeparturePlayers();
                if (searchQueryRef.current && searchQueryRef.current.trim()) {
                    searchPeople(searchQueryRef.current);
                }
                setSelectedPerson(prev => {
                    if (!prev || prev.personRef !== player.playerRef) return prev;
                    return {
                        ...prev,
                        hasDepartureDate: true,
                        departureDate: departureDate.trim(),
                        departureTime: departureTime.trim()
                    };
                });
            } else {
                toast.error(data.message || 'Failed to update departure details');
            }
        } catch (err) {
            console.error('Save departure error:', err);
            toast.error('Network error while updating departure details');
        } finally {
            setSavingDepPlayerRef(null);
        }
    };

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
                } else if (activeTabRef.current === 'Issue Tokens') {
                    if (searchQueryRef.current.trim()) {
                        searchPeople(searchQueryRef.current);
                    }
                    fetchMissingDeparturePlayers();
                }
            });
        } catch (e) {
            console.error('Socket connection error:', e);
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [fetchStats, fetchTokensList, searchPeople, fetchMissingDeparturePlayers]);

    // Fetch missing departure players when Issue Tokens tab is active
    useEffect(() => {
        if (activeTab === 'Issue Tokens') {
            fetchMissingDeparturePlayers();
        }
    }, [activeTab, fetchMissingDeparturePlayers]);

    // Debounce search query - only runs when search query is typed
    useEffect(() => {
        setSelectedPeopleRefs([]);
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
        if (selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) {
            toast.error(`Cannot issue token: ${selectedPerson.name} has no departure date. Please add departure details below.`);
            return;
        }
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
        if (selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) {
            toast.error(`Cannot issue tokens: ${selectedPerson.name} has no departure date. Please add departure details below.`);
            return;
        }
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
        if (selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) {
            toast.error(`Cannot issue team tokens: ${selectedPerson.name} has no departure date. Please add departure details below.`);
            return;
        }
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

    // -------------------------------------------------------------
    // MULTI-SELECTION & UNIVERSITY BULK ISSUE HANDLERS
    // -------------------------------------------------------------
    const handleTogglePersonSelect = (personRef) => {
        const person = peopleList.find(p => p.personRef === personRef);
        if (person && (person.hasDepartureDate === false || !person.departureDate)) {
            toast.warning(`Cannot select ${person.name}: Departure date is missing. Please add departure details below.`);
            return;
        }
        setSelectedPeopleRefs(prev => {
            if (prev.includes(personRef)) {
                return prev.filter(id => id !== personRef);
            } else {
                return [...prev, personRef];
            }
        });
    };

    const handleToggleSelectAllPeople = () => {
        const eligiblePeople = peopleList.filter(p => p.hasDepartureDate !== false && Boolean(p.departureDate));
        if (eligiblePeople.length === 0) {
            toast.warning('No eligible participants with departure details found.');
            return;
        }
        if (selectedPeopleRefs.length === eligiblePeople.length) {
            setSelectedPeopleRefs([]);
        } else {
            setSelectedPeopleRefs(eligiblePeople.map(p => p.personRef));
        }
    };

    const getPeopleStayDates = (people) => {
        if (!people || people.length === 0) return [getTodayDateString()];
        const allDates = new Set();
        people.forEach(p => {
            const range = generateDateRange(p.arrivalDate, p.departureDate);
            range.forEach(d => allDates.add(d));
        });
        const sorted = Array.from(allDates).sort();
        return sorted.length > 0 ? sorted : [getTodayDateString()];
    };

    const handleOpenBulkDialog = (customPeople = null) => {
        const rawTarget = customPeople || (
            selectedPeopleRefs.length > 0
                ? peopleList.filter(p => selectedPeopleRefs.includes(p.personRef))
                : peopleList
        );

        const targetPeople = (rawTarget || []).filter(p => p.hasDepartureDate !== false && Boolean(p.departureDate));

        if (!targetPeople || targetPeople.length === 0) {
            toast.warning('No eligible participants to issue tokens. Please add departure details below.');
            return;
        }

        if (rawTarget && rawTarget.length > targetPeople.length) {
            toast.info(`Excluded ${rawTarget.length - targetPeople.length} participant(s) without departure dates.`);
        }

        const dates = getPeopleStayDates(targetPeople);
        const initialMap = {};
        dates.forEach(date => {
            MEAL_TYPES.forEach(meal => {
                initialMap[`${date}_${meal}`] = true;
            });
        });

        setBulkDialogPeople(targetPeople);
        setBulkDialogMeals(initialMap);
        setBulkDialogOpen(true);
    };

    const handleToggleBulkMeal = (date, meal) => {
        const key = `${date}_${meal}`;
        setBulkDialogMeals(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleToggleBulkDay = (date) => {
        setBulkDialogMeals(prev => {
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

    const handleToggleSelectAllBulkMeals = (allKeys, isAllSelected) => {
        if (isAllSelected) {
            setBulkDialogMeals({});
        } else {
            const map = {};
            allKeys.forEach(k => { map[k] = true; });
            setBulkDialogMeals(map);
        }
    };

    const handleSetBulkTodayOnly = () => {
        const today = getTodayDateString();
        const map = {};
        MEAL_TYPES.forEach(m => {
            map[`${today}_${m}`] = true;
        });
        setBulkDialogMeals(map);
    };

    const handleSetBulkAllDays = (allKeys) => {
        const map = {};
        allKeys.forEach(k => { map[k] = true; });
        setBulkDialogMeals(map);
    };

    const handleConfirmMultiBulkIssue = async () => {
        if (!bulkDialogPeople || bulkDialogPeople.length === 0) return;

        const selections = [];
        Object.entries(bulkDialogMeals).forEach(([key, isSelected]) => {
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

        setIssuingMultiBulk(true);
        try {
            const personRefs = bulkDialogPeople.map(p => p.personRef);
            const res = await foodTokenAPI.issueBulk({
                personRefs,
                selections
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || `Tokens issued successfully for ${bulkDialogPeople.length} people!`);
                setBulkDialogOpen(false);
                if (data.printPayloads && data.printPayloads.length > 0) {
                    toast.info(`Sending ${data.printPayloads.length} tokens to printer...`);
                    await printMultipleFoodTokens(data.printPayloads);
                }
                searchPeople(searchQuery);
                fetchStats();
            } else {
                toast.error(data.message || 'Failed to issue tokens');
            }
        } catch (err) {
            toast.error('Bulk issue failed: ' + err.message);
        } finally {
            setIssuingMultiBulk(false);
        }
    };


    useEffect(() => {
        const today = (() => {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        })();
        fetchStats({ fromDate: today, toDate: today });
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'Tokens Report') {
            const p = buildSummaryStatsParams(summaryDateMode, summaryFromDate, summaryToDate);
            fetchStats(p);
            fetchTokensList();
        }
    }, [activeTab, fetchStats, fetchTokensList, buildSummaryStatsParams, summaryDateMode, summaryFromDate, summaryToDate]);


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

    // Export tokens to CSV (Fetches all matching tokens across all pages, tab-wise)
    const handleExportCSV = async () => {
        setExportingCsv(true);
        const toastId = toast.loading('Preparing full CSV export...');
        try {
            let fileSuffix = 'report';
            const params = {
                all: 'true',
                limit: 0
            };

            if (filterMeal) params.mealType = filterMeal;
            if (filterMealDate) params.mealDate = filterMealDate;
            if (filterPersonType) params.personType = filterPersonType;
            if (debouncedFilterSearch && debouncedFilterSearch.trim()) params.search = debouncedFilterSearch.trim();

            if (tokenReportSubTab === 'ISSUED') {
                params.status = 'ISSUED';
                fileSuffix = 'issued';
            } else if (tokenReportSubTab === 'REDEEMED') {
                params.status = 'REDEEMED';
                fileSuffix = 'redeemed';
            } else if (tokenReportSubTab === 'BOTH') {
                fileSuffix = 'issued_and_redeemed';
            } else {
                if (filterStatus) params.status = filterStatus;
                fileSuffix = 'all';
            }

            const res = await foodTokenAPI.getAll(params);
            const data = await res.json();
            let listToExport = (data && data.tokens) ? data.tokens : [];

            if (tokenReportSubTab === 'BOTH') {
                listToExport = listToExport.filter(t => t.status === 'ISSUED' || t.status === 'REDEEMED');
            }

            if (!listToExport.length) {
                toast.dismiss(toastId);
                toast.info('No token records found to export');
                return;
            }

            const headers = ['Code', 'Name', 'Role', 'Identifier', 'Team/University', 'Meal Type', 'Date', 'Hostel Block', 'Room', 'Status', 'Issued By', 'Print Count', 'Redeemed At', 'Redeemed By'];
            const csvRows = [headers.join(',')];

            listToExport.forEach(t => {
                const row = [
                    `"${t.code || ''}"`,
                    `"${t.name || ''}"`,
                    `"${t.personType || ''}"`,
                    `"${t.identifier || ''}"`,
                    `"${t.teamOrSport || ''}"`,
                    `"${t.mealType || ''}"`,
                    `"${formatDateDDMMYYYY(t.mealDate)}"`,
                    `"${t.block || ''}"`,
                    `"${t.room || ''}"`,
                    `"${t.status || ''}"`,
                    `"${t.issuedBy || ''}"`,
                    t.printCount || 1,
                    t.redeemedAt ? `"${new Date(t.redeemedAt).toLocaleString('en-IN')}"` : '""',
                    `"${t.redeemedBy || ''}"`
                ];
                csvRows.push(row.join(','));
            });

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `food_tokens_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.dismiss(toastId);
            toast.success(`Exported ${listToExport.length} token records successfully!`);
        } catch (err) {
            console.error('CSV export error:', err);
            toast.dismiss(toastId);
            toast.error('Failed to export CSV: ' + err.message);
        } finally {
            setExportingCsv(false);
        }
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

    // Bulk Dialog Calculations
    const bulkStayDates = bulkDialogPeople.length > 0 ? getPeopleStayDates(bulkDialogPeople) : [];
    const allBulkKeys = [];
    bulkStayDates.forEach(date => {
        MEAL_TYPES.forEach(meal => {
            allBulkKeys.push(`${date}_${meal}`);
        });
    });
    const selectedBulkCount = Object.values(bulkDialogMeals).filter(Boolean).length;
    const isAllBulkSelected = allBulkKeys.length > 0 && allBulkKeys.every(k => bulkDialogMeals[k]);
    const isSomeBulkSelected = allBulkKeys.some(k => bulkDialogMeals[k]) && !isAllBulkSelected;

    return (
        <Box sx={{ width: '100%', pb: 4 }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <AnimatedText direction="down" delay={0.03}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <RestaurantIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                        <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: '28px', lineHeight: 1.2 }}>
                            Food Tokens
                        </Typography>
                    </Box>
                </AnimatedText>
                <AnimatedText delay={0.06}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '14px', mt: 0.5 }}>
                        Issue and thermal print food tokens for players, coaches, and managers.
                    </Typography>
                </AnimatedText>
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
                                <Box>
                                    {/* University / Multi-Selection Action Toolbar */}
                                    {(() => {
                                        const eligiblePeople = peopleList.filter(p => p.hasDepartureDate !== false && Boolean(p.departureDate && p.departureDate.trim()));
                                        const isAllSelected = eligiblePeople.length > 0 && selectedPeopleRefs.length === eligiblePeople.length;
                                        const isSomeSelected = selectedPeopleRefs.length > 0 && !isAllSelected;
                                        const detectedUniv = peopleList[0]?.teamOrSport || '';
                                        const isUniformUniv = peopleList.every(p => p.teamOrSport === detectedUniv);

                                        return (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    px: 2,
                                                    mb: 2,
                                                    borderRadius: 2.5,
                                                    border: '1px solid #bfdbfe',
                                                    background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5
                                                }}
                                            >
                                                {/* Left: Checkbox & Info */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={isAllSelected}
                                                                indeterminate={isSomeSelected}
                                                                onChange={handleToggleSelectAllPeople}
                                                                disabled={eligiblePeople.length === 0}
                                                                sx={{
                                                                    color: '#0b5299',
                                                                    '&.Mui-checked': { color: '#0b5299' },
                                                                    '&.MuiCheckbox-indeterminate': { color: '#0b5299' }
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                                                Select All ({eligiblePeople.length}{eligiblePeople.length < peopleList.length ? ` / ${peopleList.length}` : ''})
                                                            </Typography>
                                                        }
                                                        sx={{ mr: 0 }}
                                                    />

                                                    {isUniformUniv && detectedUniv && (
                                                        <Chip
                                                            size="small"
                                                            icon={<GroupsIcon sx={{ fontSize: '16px !important' }} />}
                                                            label={detectedUniv}
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '12px',
                                                                bgcolor: '#ffffff',
                                                                color: '#0b5299',
                                                                border: '1px solid #93c5fd'
                                                            }}
                                                        />
                                                    )}

                                                    <Chip
                                                        size="small"
                                                        label={`${selectedPeopleRefs.length} Selected`}
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '12px',
                                                            bgcolor: selectedPeopleRefs.length > 0 ? '#0b5299' : '#e2e8f0',
                                                            color: selectedPeopleRefs.length > 0 ? '#ffffff' : '#64748b'
                                                        }}
                                                    />

                                                    {selectedPeopleRefs.length > 0 && (
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => setSelectedPeopleRefs([])}
                                                            sx={{ fontSize: '12px', color: '#64748b', textTransform: 'none', p: 0, minWidth: 'auto' }}
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </Box>

                                                {/* Right: Actions */}
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    {selectedPeopleRefs.length > 0 && selectedPeopleRefs.length < eligiblePeople.length && (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<ConfirmationNumberOutlinedIcon sx={{ fontSize: 18 }} />}
                                                            onClick={() => handleOpenBulkDialog()}
                                                            sx={{
                                                                bgcolor: '#0b5299',
                                                                '&:hover': { bgcolor: '#083d73' },
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                fontSize: '13px',
                                                                borderRadius: 2,
                                                                px: 2,
                                                                boxShadow: '0 2px 8px rgba(11, 82, 153, 0.25)'
                                                            }}
                                                        >
                                                            Issue Selected ({selectedPeopleRefs.length})
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<PrintIcon sx={{ fontSize: 18 }} />}
                                                        onClick={() => handleOpenBulkDialog(eligiblePeople)}
                                                        disabled={eligiblePeople.length === 0}
                                                        sx={{
                                                            bgcolor: '#d06c38',
                                                            '&:hover': { bgcolor: '#b85928' },
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            fontSize: '13px',
                                                            borderRadius: 2,
                                                            px: 2,
                                                            boxShadow: '0 2px 8px rgba(208, 108, 56, 0.25)'
                                                        }}
                                                    >
                                                        Issue All ({eligiblePeople.length} People)
                                                    </Button>
                                                </Stack>
                                            </Paper>
                                        );
                                    })()}

                                    {/* People Cards Grid */}
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
                                            const isChecked = selectedPeopleRefs.includes(person.personRef);
                                            const issuedCount = Object.keys(person.tokensToday || {}).length;
                                            const hasDep = person.hasDepartureDate !== false && Boolean(person.departureDate && person.departureDate.trim());

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
                                                        border: isSelected
                                                            ? '2px solid #0b5299'
                                                            : !hasDep
                                                                ? '1px dashed #f97316'
                                                                : isChecked
                                                                    ? '2px solid #3b82f6'
                                                                    : '1px solid #e2e8f0',
                                                        bgcolor: isSelected
                                                            ? '#f0f7ff'
                                                            : !hasDep
                                                                ? '#fffaf0'
                                                                : isChecked
                                                                    ? '#f8fafc'
                                                                    : '#ffffff',
                                                        opacity: !hasDep && !isSelected ? 0.78 : 1,
                                                        boxShadow: isChecked || isSelected ? '0 2px 8px rgba(11, 82, 153, 0.08)' : 'none',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: isSelected ? '#f0f7ff' : !hasDep ? '#fff7ed' : '#f8fafc',
                                                            borderColor: !hasDep ? '#ea580c' : '#0b5299'
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Tooltip title={!hasDep ? "Departure date missing. Add departure details below to enable food tokens." : ""}>
                                                                <span>
                                                                    <Checkbox
                                                                        size="small"
                                                                        checked={isChecked}
                                                                        disabled={!hasDep}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleTogglePersonSelect(person.personRef);
                                                                        }}
                                                                        sx={{
                                                                            p: 0,
                                                                            color: !hasDep ? '#cbd5e1' : '#94a3b8',
                                                                            '&.Mui-checked': { color: '#0b5299' }
                                                                        }}
                                                                    />
                                                                </span>
                                                            </Tooltip>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '15px', color: !hasDep ? '#64748b' : '#0f172a' }}>
                                                                {person.name}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                            {!hasDep && (
                                                                <Chip
                                                                    size="small"
                                                                    label="⚠️ No Departure"
                                                                    sx={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        height: 20,
                                                                        bgcolor: '#ffedd5',
                                                                        color: '#c2410c',
                                                                        border: '1px solid #fed7aa'
                                                                    }}
                                                                />
                                                            )}
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
                                                    </Box>

                                                    <Typography sx={{ fontSize: '13px', color: '#475569', mt: 0.5, pl: 3.5 }}>
                                                        {person.teamOrSport}
                                                    </Typography>

                                                    {person.arrivalDate && (
                                                        <Typography sx={{
                                                            fontSize: '12px',
                                                            color: !hasDep ? '#c2410c' : '#0b5299',
                                                            fontWeight: 600,
                                                            mt: 0.5,
                                                            pl: 3.5
                                                        }}>
                                                            Stay: {formatDateDDMMYYYY(person.arrivalDate)} → {hasDep ? formatDateDDMMYYYY(person.departureDate) : 'Departure Missing (Disabled)'}
                                                        </Typography>
                                                    )}

                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pl: 3.5 }}>
                                                        <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                                                            {person.identifier}
                                                            {person.block ? ` • ${person.block} (${person.room})` : ''}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={!hasDep ? "Disabled" : (person.tokensByDate ? `${Object.values(person.tokensByDate).reduce((acc, meals) => acc + Object.keys(meals).length, 0)} Total Tokens` : `${issuedCount}/4 Today`)}
                                                            color={!hasDep ? "default" : "primary"}
                                                            variant={!hasDep ? "filled" : "outlined"}
                                                            sx={{
                                                                fontSize: '10px',
                                                                height: 20,
                                                                fontWeight: 700,
                                                                bgcolor: !hasDep ? '#f1f5f9' : undefined,
                                                                color: !hasDep ? '#94a3b8' : undefined
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
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
                                                {(selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) && (
                                                    <Chip
                                                        size="small"
                                                        label="⚠️ No Departure Date"
                                                        sx={{
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            bgcolor: '#ffedd5',
                                                            color: '#c2410c',
                                                            border: '1px solid #fed7aa'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography sx={{ color: '#475569', fontSize: '14px', mt: 0.5 }}>
                                                {selectedPerson.teamOrSport} • Mobile: {selectedPerson.identifier}
                                            </Typography>
                                            {(selectedPerson.arrivalDate || selectedPerson.departureDate) && (
                                                <Typography sx={{ color: (selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) ? '#c2410c' : '#0b5299', fontSize: '13px', fontWeight: 700, mt: 0.5 }}>
                                                    Stay Period: {formatDateDDMMYYYY(selectedPerson.arrivalDate)} {selectedPerson.arrivalTime || ''} → {(selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) ? 'Missing (Disabled)' : `${formatDateDDMMYYYY(selectedPerson.departureDate)} ${selectedPerson.departureTime || ''}`}
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
                                                disabled={issuingTeamBulk || selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate}
                                                sx={{ borderColor: '#d06c38', color: '#d06c38', '&:hover': { borderColor: '#b85928', bgcolor: '#fff5f0' } }}
                                            >
                                                Issue All Tokens
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Warning banner if departure date is missing */}
                                    {(selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate) && (
                                        <Alert
                                            severity="warning"
                                            icon={<WarningAmberIcon />}
                                            sx={{
                                                mb: 3,
                                                borderRadius: 2,
                                                border: '1px solid #fed7aa',
                                                bgcolor: '#fff7ed',
                                                color: '#9a3412',
                                                '& .MuiAlert-icon': { color: '#ea580c' }
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 700, fontSize: '14px' }}>
                                                Departure Date Missing — Food Tokens Disabled
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', mt: 0.5 }}>
                                                Food tokens cannot be issued for <strong>{selectedPerson.name}</strong> because departure date & time were not provided at registration. Please add departure details in the <strong>"Players Missing Departure Details"</strong> section below to enable token generation.
                                            </Typography>
                                        </Alert>
                                    )}

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
                                                                                            disabled={Boolean(issuingKey) || isDayLoading || selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate}
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
                                                                            disabled={isDayLoading || Boolean(issuingKey) || selectedPerson.hasDepartureDate === false || !selectedPerson.departureDate}
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

                    {/* Bottom: Players Missing Departure Details */}
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#ffffff' }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fff7ed', color: '#ea580c', display: 'flex' }}>
                                        <WarningAmberIcon sx={{ fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                Players Missing Departure Details
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={`${missingDepPlayers.length} Pending`}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '12px',
                                                    bgcolor: missingDepPlayers.length > 0 ? '#ffedd5' : '#dcfce7',
                                                    color: missingDepPlayers.length > 0 ? '#c2410c' : '#15803d'
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.25 }}>
                                            Add departure date and time to enable food token generation for these registered participants.
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by name, university..."
                                        value={missingDepSearch}
                                        onChange={(e) => setMissingDepSearch(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                        sx={{ minWidth: 230 }}
                                    />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={loadingMissingDep ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                                        onClick={fetchMissingDeparturePlayers}
                                        disabled={loadingMissingDep}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#0b5299', borderColor: '#cbd5e1' }}
                                    >
                                        Refresh
                                    </Button>
                                </Box>
                            </Box>

                            {/* Content */}
                            {loadingMissingDep ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                                    <CircularProgress size={36} sx={{ color: '#0b5299' }} />
                                </Box>
                            ) : (() => {
                                const filtered = missingDepPlayers.filter(p => {
                                    if (!missingDepSearch.trim()) return true;
                                    const s = missingDepSearch.toLowerCase().trim();
                                    return (
                                        (p.playerName && p.playerName.toLowerCase().includes(s)) ||
                                        (p.universityName && p.universityName.toLowerCase().includes(s)) ||
                                        (p.mobileNo && p.mobileNo.includes(s))
                                    );
                                });

                                if (missingDepPlayers.length === 0) {
                                    return (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px dashed #86efac' }}>
                                            <CheckCircleOutlineIcon sx={{ fontSize: 44, color: '#16a34a', mb: 1 }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#15803d' }}>
                                                All Registered Players Have Departure Details!
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#166534', mt: 0.5 }}>
                                                All participants are eligible for food token generation.
                                            </Typography>
                                        </Box>
                                    );
                                }

                                if (filtered.length === 0) {
                                    return (
                                        <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                            <Typography sx={{ fontSize: '14px' }}>
                                                No players matching "{missingDepSearch}".
                                            </Typography>
                                        </Box>
                                    );
                                }

                                return (
                                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 420 }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc' }}>Player Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc' }}>University / Team</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc' }}>Arrival Info</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc' }}>Departure Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc' }}>Departure Time</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, py: 1.5, color: '#334155', bgcolor: '#f8fafc', textAlign: 'center' }}>Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filtered.map((player) => {
                                                    const editData = editingDepDates[player.playerRef] || {
                                                        departureDate: '',
                                                        departureTime: ''
                                                    };
                                                    const isSaving = savingDepPlayerRef === player.playerRef;

                                                    return (
                                                        <TableRow key={player.playerRef} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                                                                    {player.playerName}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                                                                    {player.mobileNo || 'No phone'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
                                                                    {player.universityName}
                                                                </Typography>
                                                                {player.block && (
                                                                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                                                                        {player.block} (Room {player.room})
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0b5299' }}>
                                                                    {formatDateDDMMYYYY(player.arrivalDate)}
                                                                </Typography>
                                                                {player.arrivalTime && (
                                                                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                                                                        Time: {player.arrivalTime}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <TextField
                                                                    type="date"
                                                                    size="small"
                                                                    value={editData.departureDate || ''}
                                                                    onChange={(e) => handleDepDateChange(player.playerRef, 'departureDate', e.target.value)}
                                                                    slotProps={{
                                                                        inputLabel: { shrink: true }
                                                                    }}
                                                                    sx={{ width: 160 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <TextField
                                                                    type="time"
                                                                    size="small"
                                                                    value={editData.departureTime || ''}
                                                                    onChange={(e) => handleDepDateChange(player.playerRef, 'departureTime', e.target.value)}
                                                                    slotProps={{
                                                                        inputLabel: { shrink: true }
                                                                    }}
                                                                    sx={{ width: 130 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
                                                                    disabled={isSaving || !editData.departureDate}
                                                                    onClick={() => handleSavePlayerDeparture(player)}
                                                                    sx={{
                                                                        bgcolor: '#16a34a',
                                                                        '&:hover': { bgcolor: '#15803d' },
                                                                        textTransform: 'none',
                                                                        fontWeight: 700,
                                                                        fontSize: '12px',
                                                                        borderRadius: 2,
                                                                        px: 1.75,
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                >
                                                                    {isSaving ? 'Saving...' : 'Save & Enable'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                );
                            })()}
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* ============================================================= */}
            {/* TAB 2: TOKENS REPORT & MANAGEMENT */}
            {/* ============================================================= */}
            {activeTab === 'Tokens Report' && (() => {
                // Table rendering helper
                const renderTable = (list, loading, total, currentPage, setCurrentPage, currentRowsPerPage, setCurrentRowsPerPage, isRedeemed, isAll) => (
                    <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
                        <Table size="small" sx={{ minWidth: 920 }}>
                            <TableHead sx={{ bgcolor: isRedeemed ? '#f0fdf4' : isAll ? '#f8fafc' : '#f0f7ff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Token Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Participant Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Role & Contact</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>University / Team</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Meal & Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Hostel</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                                    {(isRedeemed || isAll) && (
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Redemption Details</TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, textAlign: 'center' }}>Prints</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={isRedeemed || isAll ? 10 : 9} sx={{ textAlign: 'center', py: 5 }}>
                                            <CircularProgress size={28} sx={{ color: isRedeemed ? '#16a34a' : '#0b5299' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : list.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isRedeemed || isAll ? 10 : 9} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                            {isRedeemed
                                                ? 'No redeemed food tokens found for the selected criteria.'
                                                : 'No issued food tokens found for the selected criteria.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    list.map((token) => (
                                        <TableRow key={token._id} hover sx={{ '&:hover': { bgcolor: isRedeemed ? '#f0fdf4' : '#f0f7ff' } }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: isRedeemed ? '#15803d' : '#0b5299', fontSize: '0.9rem' }}>
                                                {token.code}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{token.name}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                                                        {token.personType}
                                                    </Typography>
                                                    {token.identifier && (
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            {token.identifier}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569' }}>{token.teamOrSport || '-'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: isRedeemed ? '#15803d' : '#0b5299' }}>
                                                        {token.mealType}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                        {formatDateDDMMYYYY(token.mealDate)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                                {token.block || token.room ? (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                                                            {token.block || 'Hostel'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            Room: {token.room || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={token.status}
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '11px',
                                                        bgcolor: token.status === 'REDEEMED' ? '#dcfce7' : token.status === 'ISSUED' ? '#dbeafe' : '#fee2e2',
                                                        color: token.status === 'REDEEMED' ? '#15803d' : token.status === 'ISSUED' ? '#1d4ed8' : '#b91c1c',
                                                        border: '1px solid',
                                                        borderColor: token.status === 'REDEEMED' ? '#86efac' : token.status === 'ISSUED' ? '#93c5fd' : '#fca5a5'
                                                    }}
                                                />
                                            </TableCell>
                                            {(isRedeemed || isAll) && (
                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    {token.status === 'REDEEMED' && token.redeemedAt ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                            <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700 }}>
                                                                {new Date(token.redeemedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} {new Date(token.redeemedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                by {token.redeemedBy || 'Staff'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                            Not redeemed
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>{token.printCount || 1}</TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Tooltip title="Reprint token receipt">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            disabled={token.status === 'CANCELLED'}
                                                            onClick={() => handleReprint(token._id)}
                                                            sx={{ color: isRedeemed ? '#16a34a' : '#0b5299' }}
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
                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50]}
                            component="div"
                            count={total}
                            rowsPerPage={currentRowsPerPage}
                            page={currentPage}
                            onPageChange={(e, newPage) => setCurrentPage(newPage)}
                            onRowsPerPageChange={(e) => { setCurrentRowsPerPage(parseInt(e.target.value, 10)); setCurrentPage(0); }}
                            labelRowsPerPage={
                                <Box component="span" sx={{ fontSize: 'inherit' }}>
                                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Rows per page:</Box>
                                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Rows:</Box>
                                </Box>
                            }
                            sx={{
                                borderTop: '1px solid #f1f5f9',
                                '& .MuiTablePagination-toolbar': {
                                    px: { xs: 1, sm: 2 },
                                    minHeight: { xs: 48, sm: 52 },
                                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                                    gap: { xs: 0.5, sm: 1 }
                                },
                                '& .MuiTablePagination-selectLabel': {
                                    m: 0,
                                    fontSize: { xs: '12px', sm: '14px' }
                                },
                                '& .MuiTablePagination-input': {
                                    m: { xs: '0 4px 0 2px', sm: '0 16px' }
                                },
                                '& .MuiTablePagination-displayedRows': {
                                    m: { xs: '0 4px', sm: '0 16px' },
                                    fontSize: { xs: '12px', sm: '14px' }
                                },
                                '& .MuiTablePagination-actions': {
                                    ml: { xs: 0.5, sm: 2 },
                                    '& .MuiIconButton-root': {
                                        p: { xs: 0.5, sm: 1 }
                                    }
                                }
                            }}
                        />
                    </TableContainer>
                );

                // Cards rendering helper
                const renderCards = (list, loading, isRedeemed) => (
                    <Box sx={{ p: { xs: 1, sm: 2 } }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={32} sx={{ color: isRedeemed ? '#16a34a' : '#0b5299' }} />
                            </Box>
                        ) : list.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                {isRedeemed
                                    ? 'No redeemed food tokens found for the selected criteria.'
                                    : 'No issued food tokens found for the selected criteria.'}
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                                {list.map((token) => (
                                    <Card
                                        key={token._id}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: isRedeemed ? '#bbf7d0' : '#e2e8f0',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                boxShadow: isRedeemed ? '0 6px 16px rgba(22,163,74,0.12)' : '0 6px 16px rgba(11,82,153,0.1)',
                                                borderColor: isRedeemed ? '#86efac' : '#93c5fd'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: isRedeemed ? '#15803d' : '#0b5299', fontSize: '0.95rem', bgcolor: isRedeemed ? '#f0fdf4' : '#eff6ff', px: 1, py: 0.3, borderRadius: 1 }}>
                                                    {token.code}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={token.status}
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '11px',
                                                        bgcolor: token.status === 'REDEEMED' ? '#dcfce7' : token.status === 'ISSUED' ? '#dbeafe' : '#fee2e2',
                                                        color: token.status === 'REDEEMED' ? '#15803d' : token.status === 'ISSUED' ? '#1d4ed8' : '#b91c1c',
                                                        border: '1px solid',
                                                        borderColor: token.status === 'REDEEMED' ? '#86efac' : token.status === 'ISSUED' ? '#93c5fd' : '#fca5a5'
                                                    }}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.3 }}>
                                                    {token.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3, fontSize: '0.85rem' }}>
                                                    {token.personType} {token.identifier ? `• ${token.identifier}` : ''} {token.teamOrSport ? `• ${token.teamOrSport}` : ''}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ bgcolor: '#f8fafc', p: 1.2, borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Meal & Date
                                                    </Typography>
                                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                                                        {token.mealType} • {formatDateDDMMYYYY(token.mealDate)}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={`Prints: ${token.printCount || 1}`}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem', height: 22 }}
                                                />
                                            </Box>

                                            {(token.block || token.room) && (
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', px: 0.5 }}>
                                                    Hostel: {token.block || 'N/A'} - Room: {token.room || 'N/A'}
                                                </Typography>
                                            )}

                                            {token.status === 'REDEEMED' && token.redeemedAt && (
                                                <Box sx={{ bgcolor: '#f0fdf4', p: 1, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                                                    <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, display: 'block' }}>
                                                        Redeemed: {new Date(token.redeemedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} {new Date(token.redeemedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#166534' }}>
                                                        by {token.redeemedBy || 'Staff'}
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5, borderTop: '1px solid #f1f5f9' }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<PrintIcon fontSize="small" />}
                                                    disabled={token.status === 'CANCELLED'}
                                                    onClick={() => handleReprint(token._id)}
                                                    sx={{
                                                        color: isRedeemed ? '#16a34a' : '#0b5299',
                                                        borderColor: isRedeemed ? '#bbf7d0' : '#bfdbfe',
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        fontSize: '0.82rem',
                                                        '&:hover': {
                                                            borderColor: isRedeemed ? '#16a34a' : '#0b5299',
                                                            bgcolor: isRedeemed ? '#f0fdf4' : '#eff6ff'
                                                        }
                                                    }}
                                                >
                                                    Reprint Token
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>
                );

                return (
                    <Box>
                        {/* 1. Stats Summary Cards */}
                        {stats && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
                                {/* Total Active Tokens Created */}
                                <Card
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                            borderColor: '#cbd5e1'
                                        }
                                    }}
                                >
                                    <Chip
                                        label="Overall"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            bgcolor: '#f1f5f9',
                                            color: '#475569',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            height: '22px',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <CardContent sx={{ py: 2, pr: 2, pl: 1.5, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                boxShadow: '0 4px 12px rgba(71, 85, 105, 0.25)'
                                            }}>
                                                <ConfirmationNumberOutlinedIcon sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
                                                    TOTAL TOKENS CREATED
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1 }}>
                                                    {(stats.overall?.totalIssued || 0) + (stats.overall?.totalRedeemed || 0)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500, display: 'block' }}>
                                            Total food tokens created for event
                                        </Typography>
                                    </CardContent>
                                </Card>

                                {/* Issued (Pending) Tokens Card - Clickable */}
                                <Card
                                    onClick={() => setTokenReportSubTab('ISSUED')}
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '16px',
                                        background: tokenReportSubTab === 'ISSUED' ? 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
                                        border: tokenReportSubTab === 'ISSUED' ? '2px solid #0b5299' : '1px solid #bfdbfe',
                                        boxShadow: tokenReportSubTab === 'ISSUED' ? '0 6px 16px rgba(11, 82, 153, 0.16)' : '0 2px 12px rgba(11, 82, 153, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 24px rgba(11, 82, 153, 0.15)',
                                            borderColor: '#0b5299'
                                        }
                                    }}
                                >
                                    <Chip
                                        label="Pending"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            bgcolor: '#eff6ff',
                                            color: '#1d4ed8',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            height: '22px',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <CardContent sx={{ py: 2, pr: 2, pl: 1.5, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #0b5299 0%, #1e40af 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                boxShadow: '0 4px 12px rgba(11, 82, 153, 0.25)'
                                            }}>
                                                <ConfirmationNumberOutlinedIcon sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#0b5299', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
                                                    ISSUED (PENDING)
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, color: '#0b5299', fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1 }}>
                                                    {stats.overall?.totalIssued || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#0b5299', fontSize: '0.78rem', fontWeight: 600, display: 'block' }}>
                                            Click to view Issued Table
                                        </Typography>
                                    </CardContent>
                                </Card>

                                {/* Redeemed (Served) Tokens Card - Clickable */}
                                <Card
                                    onClick={() => setTokenReportSubTab('REDEEMED')}
                                    sx={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '16px',
                                        background: tokenReportSubTab === 'REDEEMED' ? 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
                                        border: tokenReportSubTab === 'REDEEMED' ? '2px solid #16a34a' : '1px solid #bbf7d0',
                                        boxShadow: tokenReportSubTab === 'REDEEMED' ? '0 6px 16px rgba(22, 163, 74, 0.16)' : '0 2px 12px rgba(22, 163, 74, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 24px rgba(22, 163, 74, 0.15)',
                                            borderColor: '#16a34a'
                                        }
                                    }}
                                >
                                    <Chip
                                        label="Meals Served"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            bgcolor: '#ecfdf5',
                                            color: '#047857',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            height: '22px',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <CardContent sx={{ py: 2, pr: 2, pl: 1.5, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                                            }}>
                                                <RestaurantIcon sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
                                                    REDEEMED (SERVED)
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, color: '#15803d', fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1 }}>
                                                    {stats.overall?.totalRedeemed || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#16a34a', fontSize: '0.78rem', fontWeight: 600, display: 'block' }}>
                                            Click to view Redeemed Table
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        )}

                        {/* Breakdown by Meal Type (Dashboard Style) */}
                        {stats?.byMeal && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2, mb: 3, width: '100%' }}>
                                {[
                                    {
                                        mealKey: 'Breakfast',
                                        title: 'BREAKFAST',
                                        total: (stats.byMeal?.['Breakfast']?.issued || 0) + (stats.byMeal?.['Breakfast']?.redeemed || 0),
                                        issued: stats.byMeal?.['Breakfast']?.issued || 0,
                                        redeemed: stats.byMeal?.['Breakfast']?.redeemed || 0,
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
                                        total: (stats.byMeal?.['Lunch']?.issued || 0) + (stats.byMeal?.['Lunch']?.redeemed || 0),
                                        issued: stats.byMeal?.['Lunch']?.issued || 0,
                                        redeemed: stats.byMeal?.['Lunch']?.redeemed || 0,
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
                                        mealKey: 'Dinner',
                                        title: 'DINNER',
                                        total: (stats.byMeal?.['Dinner']?.issued || 0) + (stats.byMeal?.['Dinner']?.redeemed || 0),
                                        issued: stats.byMeal?.['Dinner']?.issued || 0,
                                        redeemed: stats.byMeal?.['Dinner']?.redeemed || 0,
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
                                                        {stat.total}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={`Issued: ${stat.issued}`}
                                                    size="small"
                                                    sx={{ fontSize: '0.72rem', height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                                                />
                                                <Chip
                                                    label={`Redeemed: ${stat.redeemed}`}
                                                    size="small"
                                                    sx={{ fontSize: '0.72rem', height: 20, bgcolor: '#ecfdf5', color: '#047857', fontWeight: 600 }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {/* 2. DATE-WISE MEAL TOKENS & REDEMPTION SUMMARY TABLE */}
                        {stats && (
                            <Paper sx={{
                                p: { xs: 2, sm: 2.5 },
                                mb: 3,
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#ffffff',
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
                            }}>
                                {/* Header row */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2, pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1rem', sm: '1.1rem' }, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            📅 Meal Tokens & Redemption Summary
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                                            Date-wise issued, breakfast, lunch, dinner & redeemed count
                                        </Typography>
                                    </Box>

                                    {/* Date Mode Selector */}
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Dropdown: Today / Custom / All */}
                                        <FormControl size="small" sx={{ minWidth: 130 }}>
                                            <Select
                                                value={summaryDateMode}
                                                onChange={(e) => {
                                                    const mode = e.target.value;
                                                    setSummaryDateMode(mode);
                                                    const today = (() => {
                                                        const d = new Date();
                                                        const y = d.getFullYear();
                                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                                        const day = String(d.getDate()).padStart(2, '0');
                                                        return `${y}-${m}-${day}`;
                                                    })();
                                                    if (mode === 'today') {
                                                        setSummaryFromDate(today);
                                                        setSummaryToDate(today);
                                                        fetchStats({ fromDate: today, toDate: today });
                                                    } else if (mode === 'all') {
                                                        fetchStats({});
                                                    }
                                                    // For 'custom', user will pick dates
                                                }}
                                                displayEmpty
                                                renderValue={(val) => {
                                                    if (val === 'today') return (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <TodayIcon sx={{ fontSize: 16, color: '#0b5299' }} />
                                                            <span>Today</span>
                                                        </Box>
                                                    );
                                                    if (val === 'custom') return (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <DateRangeIcon sx={{ fontSize: 16, color: '#7c3aed' }} />
                                                            <span>Custom</span>
                                                        </Box>
                                                    );
                                                    return (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <ViewListIcon sx={{ fontSize: 16, color: '#047857' }} />
                                                            <span>All Dates</span>
                                                        </Box>
                                                    );
                                                }}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.84rem',
                                                    borderRadius: 2,
                                                    color: '#0b5299',
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#0b5299' },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#083d73' },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0b5299' },
                                                    '& .MuiSelect-select': { py: 0.8, pl: 1.5, pr: 3 }
                                                }}
                                            >
                                                <MenuItem value="today" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                                                    <TodayIcon sx={{ fontSize: 17, color: '#0b5299' }} /> Today
                                                </MenuItem>
                                                <MenuItem value="custom" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                                                    <DateRangeIcon sx={{ fontSize: 17, color: '#7c3aed' }} /> Custom
                                                </MenuItem>
                                                <MenuItem value="all" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                                                    <ViewListIcon sx={{ fontSize: 17, color: '#047857' }} /> All Dates
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* From–To date pickers when Custom is selected */}
                                        {summaryDateMode === 'custom' && (
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    label="From"
                                                    value={summaryFromDate}
                                                    onChange={(e) => {
                                                        setSummaryFromDate(e.target.value);
                                                        fetchStats({ fromDate: e.target.value, toDate: summaryToDate });
                                                    }}
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                    sx={{ width: 145, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>→</Typography>
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    label="To"
                                                    value={summaryToDate}
                                                    onChange={(e) => {
                                                        setSummaryToDate(e.target.value);
                                                        fetchStats({ fromDate: summaryFromDate, toDate: e.target.value });
                                                    }}
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                    sx={{ width: 145, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* Date-wise Table */}
                                {stats.byDate && stats.byDate.length > 0 ? (
                                    <TableContainer sx={{ overflowX: 'auto', width: '100%', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Table size="small" sx={{ minWidth: 580 }}>
                                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#1e293b', fontSize: '0.82rem' }}>Meal Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#0b5299', fontSize: '0.82rem', textAlign: 'center' }}>Total Issued</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#b45309', fontSize: '0.82rem', textAlign: 'center' }}>Breakfast</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#047857', fontSize: '0.82rem', textAlign: 'center' }}>Lunch</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#1d4ed8', fontSize: '0.82rem', textAlign: 'center' }}>Dinner</TableCell>
                                                    <TableCell sx={{ fontWeight: 800, py: 1.5, color: '#15803d', fontSize: '0.82rem', textAlign: 'center' }}>Total Redeemed</TableCell>
                                                </TableRow>
                                                {/* Sub-header: total / redeemed label */}
                                                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8' }} />
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>count</TableCell>
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>total / redeemed</TableCell>
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>total / redeemed</TableCell>
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>total / redeemed</TableCell>
                                                    <TableCell sx={{ py: 0.5, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>count</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {stats.byDate.map((row) => (
                                                    <TableRow key={row.date} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', py: 1.2 }}>
                                                            {formatDateDDMMYYYY(row.date)}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center', py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 800, color: '#0b5299', fontSize: '1rem' }}>
                                                                {row.totalTokens}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center', py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.95rem' }}>
                                                                {row.breakfast.total}
                                                                <Box component="span" sx={{ color: '#15803d', fontWeight: 800, ml: 0.4 }}>
                                                                    / {row.breakfast.redeemed}
                                                                </Box>
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center', py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem' }}>
                                                                {row.lunch.total}
                                                                <Box component="span" sx={{ color: '#15803d', fontWeight: 800, ml: 0.4 }}>
                                                                    / {row.lunch.redeemed}
                                                                </Box>
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center', py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.95rem' }}>
                                                                {row.dinner.total}
                                                                <Box component="span" sx={{ color: '#15803d', fontWeight: 800, ml: 0.4 }}>
                                                                    / {row.dinner.redeemed}
                                                                </Box>
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center', py: 1.2 }}>
                                                            <Typography sx={{ fontWeight: 800, color: '#15803d', fontSize: '1rem' }}>
                                                                {row.totalRedeemed}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {summaryDateMode === 'today' ? 'No tokens issued for today.' : 'No tokens found for the selected date range.'}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        )}

                        {/* 4. Filter Bar & Actions */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, width: '100%' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search code, name, team, phone..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        sx={{ minWidth: { xs: '100%', sm: 180, md: 220 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}
                                    />

                                    <TextField
                                        type="date"
                                        size="small"
                                        label="Filter Date"
                                        value={filterMealDate || ''}
                                        onChange={(e) => handleDateFilterChange(e.target.value)}
                                        slotProps={{
                                            inputLabel: { shrink: true },
                                            input: {
                                                endAdornment: filterMealDate ? (
                                                    <InputAdornment position="end">
                                                        <IconButton size="small" onClick={() => handleDateFilterChange('')} edge="end" sx={{ p: 0.2 }}>
                                                            <CloseIcon sx={{ fontSize: 15, color: '#64748b' }} />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : null
                                            }
                                        }}
                                        sx={{ minWidth: { xs: '100%', sm: 155 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}
                                    />

                                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                        <InputLabel>Meal Type</InputLabel>
                                        <Select value={filterMeal} label="Meal Type" onChange={(e) => { setFilterMeal(e.target.value); setIssuedPage(0); setRedeemedPage(0); setAllPage(0); }}>
                                            <MenuItem value="">All Meals</MenuItem>
                                            {MEAL_TYPES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    {tokenReportSubTab === 'ALL' && (
                                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                            <InputLabel>Status</InputLabel>
                                            <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setAllPage(0); }}>
                                                <MenuItem value="">All Statuses</MenuItem>
                                                <MenuItem value="ISSUED">Issued</MenuItem>
                                                <MenuItem value="REDEEMED">Redeemed</MenuItem>
                                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}

                                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                                        <InputLabel>Role / Type</InputLabel>
                                        <Select value={filterPersonType} label="Role / Type" onChange={(e) => { setFilterPersonType(e.target.value); setIssuedPage(0); setRedeemedPage(0); setAllPage(0); }}>
                                            <MenuItem value="">All Roles</MenuItem>
                                            <MenuItem value="PLAYER">Player</MenuItem>
                                            <MenuItem value="COACH">Coach</MenuItem>
                                            <MenuItem value="MANAGER">Manager</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <Tooltip title="Cards View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setTokensViewMode('cards')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: tokensViewMode === 'cards' ? '#0b5299' : 'transparent',
                                                    color: tokensViewMode === 'cards' ? '#ffffff' : '#64748b',
                                                    boxShadow: tokensViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: tokensViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: tokensViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Table View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setTokensViewMode('table')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: tokensViewMode === 'table' ? '#0b5299' : 'transparent',
                                                    color: tokensViewMode === 'table' ? '#ffffff' : '#64748b',
                                                    boxShadow: tokensViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: tokensViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: tokensViewMode === 'table' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        disabled={exportingCsv}
                                        startIcon={exportingCsv ? <CircularProgress size={16} sx={{ color: '#0b5299' }} /> : <DownloadIcon />}
                                        onClick={handleExportCSV}
                                        sx={{ color: '#0b5299', borderColor: '#0b5299', flex: { xs: 1, sm: 'none' }, whiteSpace: 'nowrap' }}
                                    >
                                        {exportingCsv ? 'Exporting...' : 'Export CSV'}
                                    </Button>
                                </Box>
                            </Box>

                            {/* 4. Display Redeemed Tokens Only */}
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                        <RestaurantIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>
                                                Redeemed Food Tokens (Meals Served)
                                            </Typography>
                                            <Chip size="small" label={`${totalRedeemedTokens} Served`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22 }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Food tokens verified and redeemed at the dining hall counter
                                        </Typography>
                                    </Box>
                                </Box>
                                {tokensViewMode === 'cards'
                                    ? renderCards(redeemedList, loadingRedeemed, true)
                                    : renderTable(redeemedList, loadingRedeemed, totalRedeemedTokens, redeemedPage, setRedeemedPage, redeemedRowsPerPage, setRedeemedRowsPerPage, true, false)}
                            </Box>
                        </Paper>
                    </Box>
                );
            })()}

            {/* Issue Team Food Tokens Dialog */}
            <Dialog
                open={teamDialogOpen}
                onClose={() => !issuingTeamBulk && setTeamDialogOpen(false)}
                maxWidth="md"
                fullWidth
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                        }
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

            {/* Issue Bulk Food Tokens for University / Selected Participants Dialog */}
            <Dialog
                open={bulkDialogOpen}
                onClose={() => !issuingMultiBulk && setBulkDialogOpen(false)}
                maxWidth="md"
                fullWidth
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                        }
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
                                <GroupsIcon fontSize="medium" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                    Issue Food Tokens — {bulkDialogPeople[0]?.teamOrSport || 'Selected Participants'}
                                </Typography>
                                <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.25 }}>
                                    {bulkDialogPeople.length} People Selected • Stay Dates: {formatDateDDMMYYYY(bulkStayDates[0])} → {formatDateDDMMYYYY(bulkStayDates[bulkStayDates.length - 1])} ({bulkStayDates.length} {bulkStayDates.length === 1 ? 'Day' : 'Days'})
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setBulkDialogOpen(false)}
                        disabled={issuingMultiBulk}
                        sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
                    {/* Selected Participants Chips Bar */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            mb: 2,
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff'
                        }}
                    >
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Participants Included ({bulkDialogPeople.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: '90px', overflowY: 'auto' }}>
                            {bulkDialogPeople.map(p => (
                                <Chip
                                    key={p.personRef}
                                    size="small"
                                    label={`${p.name} (${p.roleLabel})`}
                                    sx={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        bgcolor: p.personType === 'MANAGER' ? '#f3e8ff' : p.personType === 'COACH' ? '#dcfce7' : '#e0f2fe',
                                        color: p.personType === 'MANAGER' ? '#7e22ce' : p.personType === 'COACH' ? '#15803d' : '#0369a1'
                                    }}
                                />
                            ))}
                        </Box>
                    </Paper>

                    {/* Top Control Bar: Select All, Presets & Counters */}
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
                                    checked={isAllBulkSelected}
                                    indeterminate={isSomeBulkSelected}
                                    onChange={() => handleToggleSelectAllBulkMeals(allBulkKeys, isAllBulkSelected)}
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
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSetBulkAllDays(allBulkKeys)}
                                disabled={issuingMultiBulk}
                                sx={{ fontSize: '12px', textTransform: 'none', borderColor: '#bfdbfe', color: '#0b5299', py: 0.25 }}
                            >
                                All Stay Days
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleSetBulkTodayOnly}
                                disabled={issuingMultiBulk}
                                sx={{ fontSize: '12px', textTransform: 'none', borderColor: '#bfdbfe', color: '#0b5299', py: 0.25 }}
                            >
                                Today Only
                            </Button>
                            <Chip
                                size="small"
                                label={`${selectedBulkCount} / ${allBulkKeys.length} Meals Selected`}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    bgcolor: selectedBulkCount > 0 ? '#eff6ff' : '#f1f5f9',
                                    color: selectedBulkCount > 0 ? '#1d4ed8' : '#64748b',
                                    border: selectedBulkCount > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                                }}
                            />
                            {selectedBulkCount > 0 && (
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => setBulkDialogMeals({})}
                                    disabled={issuingMultiBulk}
                                    sx={{ fontSize: '12px', color: '#64748b', minWidth: 'auto', p: '2px 8px' }}
                                >
                                    Deselect All
                                </Button>
                            )}
                        </Stack>
                    </Paper>

                    {/* Day-wise Coupon Groups */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {bulkStayDates.map((date, dayIdx) => {
                            const isDayAll = MEAL_TYPES.every(m => bulkDialogMeals[`${date}_${m}`]);
                            const isDaySome = MEAL_TYPES.some(m => bulkDialogMeals[`${date}_${m}`]) && !isDayAll;
                            const daySelectedCount = MEAL_TYPES.filter(m => bulkDialogMeals[`${date}_${m}`]).length;

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
                                                    onChange={() => handleToggleBulkDay(date)}
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
                                            const isChecked = !!bulkDialogMeals[key];

                                            return (
                                                <Box
                                                    key={meal}
                                                    onClick={() => handleToggleBulkMeal(date, meal)}
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
                                                        onChange={() => handleToggleBulkMeal(date, meal)}
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
                        {selectedBulkCount > 0 ? (
                            <span><b>{bulkDialogPeople.length}</b> people × <b>{selectedBulkCount}</b> meal coupons = up to <b>{bulkDialogPeople.length * selectedBulkCount}</b> tokens</span>
                        ) : (
                            <span style={{ color: '#ef4444' }}>Please select at least one coupon</span>
                        )}
                    </Typography>

                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                        <Button
                            onClick={() => setBulkDialogOpen(false)}
                            disabled={issuingMultiBulk}
                            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirmMultiBulkIssue}
                            disabled={issuingMultiBulk || selectedBulkCount === 0}
                            startIcon={issuingMultiBulk ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
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
                            {issuingMultiBulk ? 'Issuing & Printing...' : 'Issue & Print'}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FoodTokens;
