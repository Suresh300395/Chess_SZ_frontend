import React, { useState, useRef } from 'react';
import {
    Box, TextField, MenuItem, FormControl, FormLabel, RadioGroup,
    FormControlLabel, Radio, Button, Typography, Dialog,
    DialogContent, DialogActions, IconButton, Autocomplete, CircularProgress,
    Chip
} from '@mui/material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Authentication from '../Admin/Authentication';
import { registrationAPI } from '../../utils/api';

const createInitialPlayer = () => ({
    playerName: '',
    mobileNo: '',
    gender: '',
    dob: '',
    transportMode: '',
    transportNumber: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    accommodation: 'Yes',
    isExisting: false
});

const createInitialCoach = () => ({
    role: 'Coach',
    name: '',
    mobileNo: '',
    mailId: '',
    gender: '',
    foodType: 'Veg',
    accommodation: 'Yes',
    isExisting: false
});

const Registration = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [copiedField, setCopiedField] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Existing university reuse state
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const isExistingUniversity = Boolean(selectedUniversity?._id);

    // Autocomplete search state
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchDebounceTimer = useRef(null);
    const searchAbortController = useRef(null);

    const [successModal, setSuccessModal] = useState({
        open: false,
        universityName: '',
        totalPlayers: 0,
        totalCoaches: 0,
        newPlayersAdded: 0,
        newCoachesAdded: 0,
        accountsCreated: 0,
        isExistingUniversity: false,
        sampleCredentials: {
            name: '',
            mobile: '',
            password: 'Aditya@123'
        }
    });

    const [teamDetails, setTeamDetails] = useState({
        universityName: '',
        address: '',
        universityContact: ''
    });

    const [players, setPlayers] = useState([createInitialPlayer()]);
    const [coaches, setCoaches] = useState([createInitialCoach()]);

    const [errors, setErrors] = useState({
        team: {},
        players: [],
        coaches: []
    });

    /**
     * Debounced university name search and Case B reset handling
     */
    const handleUniversityNameInput = (value) => {
        let finalValue = value;
        let errorMsg = '';

        // Text field: do not allow numbers in university name
        if (/[0-9]/.test(finalValue)) {
            errorMsg = 'Numbers are not allowed in university name';
        }
        finalValue = finalValue.replace(/[0-9]/g, '');

        // CASE B: If changing university name after selecting an existing university,
        // immediately clear loaded data and reset to fresh state
        if (selectedUniversity) {
            setSelectedUniversity(null);
            setTeamDetails({
                universityName: finalValue,
                universityContact: '',
                address: ''
            });
            setPlayers([createInitialPlayer()]);
            setCoaches([createInitialCoach()]);
            setErrors({
                team: errorMsg ? { universityName: errorMsg } : {},
                players: [],
                coaches: []
            });
        } else {
            setTeamDetails(prev => ({ ...prev, universityName: finalValue }));
            setErrors(prev => ({
                ...prev,
                team: { ...prev.team, universityName: errorMsg }
            }));
        }

        // Cancel previous pending search request / debounce timer
        if (searchDebounceTimer.current) {
            clearTimeout(searchDebounceTimer.current);
        }
        if (searchAbortController.current) {
            searchAbortController.current.abort();
        }

        const trimmed = finalValue.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchDebounceTimer.current = setTimeout(async () => {
            const controller = new AbortController();
            searchAbortController.current = controller;

            try {
                const res = await registrationAPI.searchUniversities(trimmed, controller.signal);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to search universities:', err);
                }
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    /**
     * CASE A: Existing University Selected from Autocomplete
     */
    const handleSelectUniversity = (uni) => {
        if (!uni) {
            handleUniversityNameInput('');
            return;
        }

        if (typeof uni === 'string') {
            handleUniversityNameInput(uni);
            return;
        }

        setSelectedUniversity(uni);
        setTeamDetails({
            universityName: uni.universityName,
            universityContact: uni.universityContact,
            address: uni.address
        });

        const loadedPlayers = (uni.players && uni.players.length > 0)
            ? uni.players.map(p => ({
                _id: p._id,
                playerName: p.playerName || '',
                mobileNo: p.mobileNo || '',
                gender: p.gender || '',
                dob: p.dob || '',
                transportMode: p.transportMode || '',
                transportNumber: p.transportNumber || '',
                arrivalDate: p.arrivalDate || '',
                arrivalTime: p.arrivalTime || '',
                departureDate: p.departureDate || '',
                departureTime: p.departureTime || '',
                accommodation: p.accommodation || 'Yes',
                isExisting: true
            }))
            : [createInitialPlayer()];

        const loadedCoaches = (uni.coaches && uni.coaches.length > 0)
            ? uni.coaches.map(c => ({
                _id: c._id,
                role: c.role || 'Coach',
                name: c.name || '',
                mobileNo: c.mobileNo || '',
                mailId: c.mailId || '',
                gender: c.gender || '',
                foodType: c.foodType || 'Veg',
                accommodation: c.accommodation || 'Yes',
                isExisting: true
            }))
            : [createInitialCoach()];

        setPlayers(loadedPlayers);
        setCoaches(loadedCoaches);
        setErrors({ team: {}, players: [], coaches: [] });
        toast.info(`Loaded existing details for ${uni.universityName}. Saved members are locked.`);
    };

    const handleTeamChange = (e) => {
        const { name, value } = e.target;
        if (isExistingUniversity && (name === 'universityContact' || name === 'address')) {
            return; // Locked for existing universities
        }

        let finalValue = value;
        let errorMsg = '';

        if (name === 'universityContact') {
            let digits = value.replace(/\D/g, '');
            if (digits.length === 12 && digits.startsWith('91')) {
                digits = digits.slice(2);
            } else if (digits.length === 11 && digits.startsWith('0')) {
                digits = digits.slice(1);
            }

            if (digits.length > 0 && !/^[6-9]/.test(digits)) {
                errorMsg = 'Mobile number must start with 6, 7, 8, or 9';
                setErrors(prev => ({
                    ...prev,
                    team: { ...prev.team, [name]: errorMsg }
                }));
                return;
            }
            finalValue = digits.slice(0, 10);
            if (finalValue.length === 10) {
                errorMsg = '';
            }
        }

        setTeamDetails(prev => ({ ...prev, [name]: finalValue }));
        setErrors(prev => ({
            ...prev,
            team: { ...prev.team, [name]: errorMsg }
        }));
    };

    const handlePlayerChange = (index, e) => {
        // Freeze existing player modifications
        if (players[index]?.isExisting) return;

        const { name, value } = e.target;
        let finalValue = value;
        let errorMsg = '';

        if (name === 'playerName') {
            if (/[0-9]/.test(value)) {
                errorMsg = 'Numbers are not allowed in player name';
            }
            finalValue = value.replace(/[0-9]/g, '');
        } else if (name === 'mobileNo') {
            let digits = value.replace(/\D/g, '');
            if (digits.length === 12 && digits.startsWith('91')) {
                digits = digits.slice(2);
            } else if (digits.length === 11 && digits.startsWith('0')) {
                digits = digits.slice(1);
            }

            if (digits.length > 0 && !/^[6-9]/.test(digits)) {
                errorMsg = 'Mobile number must start with 6, 7, 8, or 9';
                setErrors(prev => {
                    const newPlayers = [...(prev.players || [])];
                    newPlayers[index] = { ...(newPlayers[index] || {}), [name]: errorMsg };
                    return { ...prev, players: newPlayers };
                });
                return;
            }
            finalValue = digits.slice(0, 10);
            if (finalValue.length === 10) {
                errorMsg = '';
            }
        } else if (name === 'dob' || name === 'arrivalDate' || name === 'departureDate') {
            if (value) {
                const parts = value.split('-');
                if (parts[0] && parts[0].length > 4) {
                    parts[0] = parts[0].slice(0, 4);
                    finalValue = parts.join('-');
                }
            }
        }

        const updatedPlayers = [...players];
        updatedPlayers[index][name] = finalValue;
        setPlayers(updatedPlayers);

        setErrors(prev => {
            const newPlayers = [...(prev.players || [])];
            newPlayers[index] = { ...(newPlayers[index] || {}), [name]: errorMsg };
            return { ...prev, players: newPlayers };
        });
    };

    const handleCoachChange = (index, e) => {
        // Freeze existing coach modifications
        if (coaches[index]?.isExisting) return;

        const { name, value } = e.target;
        let finalValue = value;
        let errorMsg = '';

        if (name === 'name') {
            if (/[0-9]/.test(value)) {
                errorMsg = 'Numbers are not allowed in coach name';
            }
            finalValue = value.replace(/[0-9]/g, '');
        } else if (name === 'mobileNo') {
            let digits = value.replace(/\D/g, '');
            if (digits.length === 12 && digits.startsWith('91')) {
                digits = digits.slice(2);
            } else if (digits.length === 11 && digits.startsWith('0')) {
                digits = digits.slice(1);
            }

            if (digits.length > 0 && !/^[6-9]/.test(digits)) {
                errorMsg = 'Mobile number must start with 6, 7, 8, or 9';
                setErrors(prev => {
                    const newCoaches = [...(prev.coaches || [])];
                    newCoaches[index] = { ...(newCoaches[index] || {}), [name]: errorMsg };
                    return { ...prev, coaches: newCoaches };
                });
                return;
            }
            finalValue = digits.slice(0, 10);
            if (finalValue.length === 10) {
                errorMsg = '';
            }
        }

        const updatedCoaches = [...coaches];
        updatedCoaches[index][name] = finalValue;
        setCoaches(updatedCoaches);

        setErrors(prev => {
            const newCoaches = [...(prev.coaches || [])];
            newCoaches[index] = { ...(newCoaches[index] || {}), [name]: errorMsg };
            return { ...prev, coaches: newCoaches };
        });
    };

    const handleTeamBlur = (field) => {
        if (field === 'universityContact' && !isExistingUniversity) {
            const val = teamDetails.universityContact;
            if (val && val.length !== 10) {
                setErrors(prev => ({
                    ...prev,
                    team: { ...prev.team, universityContact: 'Must be exactly 10 digits' }
                }));
            }
        }
    };

    const handlePlayerBlur = (index, field) => {
        if (field === 'mobileNo' && !players[index]?.isExisting) {
            const val = players[index]?.mobileNo;
            if (val && val.length !== 10) {
                setErrors(prev => {
                    const newPlayers = [...(prev.players || [])];
                    newPlayers[index] = { ...(newPlayers[index] || {}), mobileNo: 'Must be exactly 10 digits' };
                    return { ...prev, players: newPlayers };
                });
            }
        }
    };

    const handleCoachBlur = (index, field) => {
        if (field === 'mobileNo' && !coaches[index]?.isExisting) {
            const val = coaches[index]?.mobileNo;
            if (val && val.length !== 10) {
                setErrors(prev => {
                    const newCoaches = [...(prev.coaches || [])];
                    newCoaches[index] = { ...(newCoaches[index] || {}), mobileNo: 'Must be exactly 10 digits' };
                    return { ...prev, coaches: newCoaches };
                });
            }
        }
    };

    const addPlayer = () => {
        setPlayers([...players, createInitialPlayer()]);
    };

    const removePlayer = (index) => {
        // Prevent removing existing saved records
        if (players[index]?.isExisting) return;
        const updatedPlayers = [...players];
        updatedPlayers.splice(index, 1);
        setPlayers(updatedPlayers);
    };

    const addCoach = () => {
        setCoaches([...coaches, createInitialCoach()]);
    };

    const removeCoach = (index) => {
        // Prevent removing existing saved records
        if (coaches[index]?.isExisting) return;
        const updatedCoaches = [...coaches];
        updatedCoaches.splice(index, 1);
        setCoaches(updatedCoaches);
    };

    const validateForm = () => {
        let isValid = true;
        let newErrors = { team: {}, players: [], coaches: [] };

        // Team validations
        if (!teamDetails.universityName.trim()) {
            newErrors.team.universityName = 'University name is required';
            isValid = false;
        } else if (/[0-9]/.test(teamDetails.universityName)) {
            newErrors.team.universityName = 'Numbers are not allowed in university name';
            isValid = false;
        }

        // For new university, contact and address are required
        if (!isExistingUniversity) {
            if (!teamDetails.universityContact.trim()) {
                newErrors.team.universityContact = 'University contact is required';
                isValid = false;
            } else if (!/^[6-9]/.test(teamDetails.universityContact)) {
                newErrors.team.universityContact = 'Must start with 6, 7, 8, or 9';
                isValid = false;
            } else if (!/^\d{10}$/.test(teamDetails.universityContact)) {
                newErrors.team.universityContact = 'Must be exactly 10 digits';
                isValid = false;
            }

            if (!teamDetails.address.trim()) {
                newErrors.team.address = 'Address is required';
                isValid = false;
            }
        }

        // For existing university, ensure at least one new player or coach is added
        if (isExistingUniversity) {
            const hasNewPlayer = players.some(p => !p.isExisting);
            const hasNewCoach = coaches.some(c => !c.isExisting);
            if (!hasNewPlayer && !hasNewCoach) {
                toast.error('Please add at least one new player or coach to register for this university.');
                return false;
            }
        }

        // Player validations (only validate newly added players!)
        players.forEach((player, index) => {
            let playerErrors = {};
            if (player.isExisting) {
                newErrors.players[index] = {};
                return;
            }

            if (!player.playerName.trim()) {
                playerErrors.playerName = 'Name is required';
                isValid = false;
            } else if (/[0-9]/.test(player.playerName)) {
                playerErrors.playerName = 'Numbers are not allowed in player name';
                isValid = false;
            }

            if (!player.mobileNo.trim()) {
                playerErrors.mobileNo = 'Mobile number is required';
                isValid = false;
            } else if (!/^[6-9]/.test(player.mobileNo)) {
                playerErrors.mobileNo = 'Must start with 6, 7, 8, or 9';
                isValid = false;
            } else if (!/^\d{10}$/.test(player.mobileNo)) {
                playerErrors.mobileNo = 'Must be exactly 10 digits';
                isValid = false;
            }

            if (!player.gender) {
                playerErrors.gender = 'Gender is required';
                isValid = false;
            }
            if (!player.dob) {
                playerErrors.dob = 'DOB is required';
                isValid = false;
            } else if (player.dob.split('-')[0]?.length > 4 || Number(player.dob.split('-')[0]) > 9999) {
                playerErrors.dob = 'Year cannot exceed 4 digits';
                isValid = false;
            }
            if (!player.transportMode) {
                playerErrors.transportMode = 'Transport mode is required';
                isValid = false;
            }
            if ((player.transportMode === 'Train' || player.transportMode === 'Flight') && !player.transportNumber) {
                playerErrors.transportNumber = 'Transport number is required';
                isValid = false;
            }
            if (!player.arrivalDate) {
                playerErrors.arrivalDate = 'Arrival date is required';
                isValid = false;
            } else if (player.arrivalDate.split('-')[0]?.length > 4 || Number(player.arrivalDate.split('-')[0]) > 9999) {
                playerErrors.arrivalDate = 'Year cannot exceed 4 digits';
                isValid = false;
            }
            if (!player.arrivalTime) {
                playerErrors.arrivalTime = 'Arrival time is required';
                isValid = false;
            }
            if (!player.departureDate) {
                playerErrors.departureDate = 'Departure date is required';
                isValid = false;
            } else if (player.departureDate.split('-')[0]?.length > 4 || Number(player.departureDate.split('-')[0]) > 9999) {
                playerErrors.departureDate = 'Year cannot exceed 4 digits';
                isValid = false;
            }
            if (!player.departureTime) {
                playerErrors.departureTime = 'Departure time is required';
                isValid = false;
            }
            newErrors.players[index] = playerErrors;
        });

        // Coach validations (only validate newly added coaches!)
        coaches.forEach((coach, index) => {
            let coachErrors = {};
            if (coach.isExisting) {
                newErrors.coaches[index] = {};
                return;
            }

            if (!coach.role) {
                coachErrors.role = 'Role is required';
                isValid = false;
            }
            if (!coach.name.trim()) {
                coachErrors.name = 'Name is required';
                isValid = false;
            } else if (/[0-9]/.test(coach.name)) {
                coachErrors.name = 'Numbers are not allowed in name';
                isValid = false;
            }

            if (!coach.mobileNo.trim()) {
                coachErrors.mobileNo = 'Mobile number is required';
                isValid = false;
            } else if (!/^[6-9]/.test(coach.mobileNo)) {
                coachErrors.mobileNo = 'Must start with 6, 7, 8, or 9';
                isValid = false;
            } else if (!/^\d{10}$/.test(coach.mobileNo)) {
                coachErrors.mobileNo = 'Must be exactly 10 digits';
                isValid = false;
            }

            if (!coach.mailId.trim()) {
                coachErrors.mailId = 'Email is required';
                isValid = false;
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(coach.mailId)) {
                coachErrors.mailId = 'Invalid email address';
                isValid = false;
            }
            if (!coach.gender) {
                coachErrors.gender = 'Gender is required';
                isValid = false;
            }
            newErrors.coaches[index] = coachErrors;
        });

        // Duplicate checks across form members
        const seenMobileIndices = new Map();
        // Pre-fill existing records so new members cannot duplicate existing ones
        players.forEach((p, idx) => {
            if (p.isExisting && p.mobileNo) seenMobileIndices.set(p.mobileNo.trim(), { type: 'existing', index: idx });
        });
        coaches.forEach((c, idx) => {
            if (c.isExisting && c.mobileNo) seenMobileIndices.set(c.mobileNo.trim(), { type: 'existing', index: idx });
        });

        players.forEach((player, index) => {
            if (player.isExisting) return;
            const mob = player.mobileNo?.trim();
            if (mob && /^\d{10}$/.test(mob)) {
                if (seenMobileIndices.has(mob)) {
                    newErrors.players[index].mobileNo = 'Duplicate mobile number in form';
                    const prev = seenMobileIndices.get(mob);
                    if (prev.type === 'player') {
                        newErrors.players[prev.index].mobileNo = 'Duplicate mobile number in form';
                    } else if (prev.type === 'coach') {
                        newErrors.coaches[prev.index].mobileNo = 'Duplicate mobile number in form';
                    }
                    isValid = false;
                } else {
                    seenMobileIndices.set(mob, { type: 'player', index });
                }
            }
        });

        const seenEmailIndices = new Map();
        coaches.forEach((c, idx) => {
            if (c.isExisting && c.mailId) seenEmailIndices.set(c.mailId.trim().toLowerCase(), { type: 'existing', index: idx });
        });

        coaches.forEach((coach, index) => {
            if (coach.isExisting) return;
            const mob = coach.mobileNo?.trim();
            if (mob && /^\d{10}$/.test(mob)) {
                if (seenMobileIndices.has(mob)) {
                    newErrors.coaches[index].mobileNo = 'Duplicate mobile number in form';
                    const prev = seenMobileIndices.get(mob);
                    if (prev.type === 'player') {
                        newErrors.players[prev.index].mobileNo = 'Duplicate mobile number in form';
                    } else if (prev.type === 'coach') {
                        newErrors.coaches[prev.index].mobileNo = 'Duplicate mobile number in form';
                    }
                    isValid = false;
                } else {
                    seenMobileIndices.set(mob, { type: 'coach', index });
                }
            }

            const email = coach.mailId?.trim().toLowerCase();
            if (email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                if (seenEmailIndices.has(email)) {
                    newErrors.coaches[index].mailId = 'Duplicate email address in form';
                    const prev = seenEmailIndices.get(email);
                    if (prev.type === 'coach') {
                        newErrors.coaches[prev.index].mailId = 'Duplicate email address in form';
                    }
                    isValid = false;
                } else {
                    seenEmailIndices.set(email, { type: 'coach', index });
                }
            }
        });

        setErrors(newErrors);

        if (!isValid) {
            toast.error('Please correct the errors in the form.');
        }

        return isValid;
    };

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName}!`);
        setTimeout(() => setCopiedField(''), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = {
            universityId: selectedUniversity?._id || undefined,
            teamDetails: {
                universityName: teamDetails.universityName,
                address: teamDetails.address,
                universityContact: teamDetails.universityContact
            },
            players: players.map(p => ({
                _id: p.isExisting ? p._id : undefined,
                playerName: p.playerName,
                mobileNo: p.mobileNo,
                gender: p.gender,
                dob: p.dob,
                transportMode: p.transportMode,
                transportNumber: p.transportNumber,
                arrivalDate: p.arrivalDate,
                arrivalTime: p.arrivalTime,
                departureDate: p.departureDate,
                departureTime: p.departureTime,
                accommodation: p.accommodation
            })),
            coaches: coaches.map(c => ({
                _id: c.isExisting ? c._id : undefined,
                role: c.role,
                name: c.name,
                mobileNo: c.mobileNo,
                mailId: c.mailId,
                gender: c.gender,
                foodType: c.foodType,
                accommodation: c.accommodation
            }))
        };

        setSubmitting(true);
        try {
            const res = await registrationAPI.submit(payload);
            const data = await res.json();

            if (res.ok) {
                toast.success(isExistingUniversity ? 'New participants registered successfully!' : 'Registration successful!');
                const sampleCreds = data.summary?.sampleCredentials || {
                    name: players.find(p => !p.isExisting)?.playerName || coaches.find(c => !c.isExisting)?.name || '',
                    mobile: players.find(p => !p.isExisting)?.mobileNo || coaches.find(c => !c.isExisting)?.mobileNo || '',
                    password: 'Aditya@123'
                };

                setSuccessModal({
                    open: true,
                    universityName: teamDetails.universityName,
                    totalPlayers: data.summary?.totalPlayers ?? players.length,
                    totalCoaches: data.summary?.totalCoaches ?? coaches.length,
                    newPlayersAdded: data.summary?.newPlayersAdded ?? (isExistingUniversity ? players.filter(p => !p.isExisting).length : players.length),
                    newCoachesAdded: data.summary?.newCoachesAdded ?? (isExistingUniversity ? coaches.filter(c => !c.isExisting).length : coaches.length),
                    accountsCreated: data.summary?.accountsCreated ?? 0,
                    isExistingUniversity: Boolean(data.summary?.isExistingUniversity),
                    sampleCredentials: sampleCreds
                });
            } else {
                toast.error(data.message || data.error || 'Failed to submit registration');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Server error, please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box className="registration-container">
            <Box className="registration-form-wrapper">
                <Box component="h1" className="registration-title">Registration</Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* University Details Section */}
                    <Box component="fieldset" className="section-fieldset">
                        <Box component="legend" className="section-legend">University Details of the Player</Box>

                        <Box className="form-grid">
                            {/* University Name: Autocomplete, Always Editable */}
                            <Box sx={{ mt: 1 }}>
                                <Autocomplete
                                    freeSolo
                                    options={searchResults}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.universityName || '')}
                                    filterOptions={(x) => x}
                                    loading={isSearching}
                                    value={teamDetails.universityName}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            handleUniversityNameInput(newInputValue);
                                        }
                                    }}
                                    onChange={(event, newValue) => {
                                        handleSelectUniversity(newValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            label="Name of University*"
                                            name="universityName"
                                            error={!!errors.team?.universityName}
                                            helperText={errors.team?.universityName || (isExistingUniversity ? "Saved university loaded" : "Type to search existing or enter new")}
                                            slotProps={{
                                                ...params.slotProps,
                                                input: {
                                                    ...(params.slotProps?.input || {}),
                                                    endAdornment: (
                                                        <>
                                                            {isSearching ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
                                                            {params.slotProps?.input?.endAdornment}
                                                        </>
                                                    )
                                                }
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option._id}>
                                            <Box sx={{ py: 0.5, width: '100%' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                                        {option.universityName}
                                                    </Typography>
                                                    <Chip
                                                        label="Registered"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '10px', bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="#64748b" sx={{ display: 'block', mt: 0.3 }}>
                                                    {option.address} • {option.players?.length || 0} Players, {option.coaches?.length || 0} Coaches
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                            </Box>

                            {/* Contact Number: Read-only if existing */}
                            <Box sx={{ mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="University Contact No*"
                                    name="universityContact"
                                    type="tel"
                                    value={teamDetails.universityContact}
                                    onChange={handleTeamChange}
                                    onBlur={() => handleTeamBlur('universityContact')}
                                    error={!!errors.team?.universityContact}
                                    helperText={errors.team?.universityContact || (isExistingUniversity ? 'Saved record (read-only)' : '')}
                                    disabled={isExistingUniversity}
                                    slotProps={{
                                        input: {
                                            readOnly: isExistingUniversity
                                        },
                                        htmlInput: {
                                            maxLength: 10,
                                            inputMode: 'numeric'
                                        }
                                    }}
                                    sx={isExistingUniversity ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                />
                            </Box>

                            {/* Address: Read-only if existing */}
                            <Box sx={{ mt: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    label="Address*"
                                    name="address"
                                    value={teamDetails.address}
                                    onChange={handleTeamChange}
                                    error={!!errors.team?.address}
                                    helperText={errors.team?.address || (isExistingUniversity ? 'Saved record (read-only)' : '')}
                                    disabled={isExistingUniversity}
                                    slotProps={{
                                        input: {
                                            readOnly: isExistingUniversity
                                        }
                                    }}
                                    sx={isExistingUniversity ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Players Section */}
                    <Box component="fieldset" className="section-fieldset">
                        <Box component="legend" className="section-legend">Player Details</Box>
                        {players.map((player, index) => (
                            <Box
                                key={player._id || index}
                                className="player-card"
                                sx={player.isExisting ? { borderLeft: '4px solid #0284c7' } : {}}
                            >
                                <Box className="player-header">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box component="h4">Player {index + 1}</Box>
                                        {player.isExisting ? (
                                            <Chip
                                                label="Saved Record"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#e0f2fe',
                                                    color: '#0369a1',
                                                    border: '1px solid #bae6fd'
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label="New Entry"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#fef3c7',
                                                    color: '#b45309',
                                                    border: '1px solid #fde68a'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    {!player.isExisting && (
                                        <Box component="button" type="button" className="remove-player-btn" onClick={() => removePlayer(index)}>
                                            Remove
                                        </Box>
                                    )}
                                </Box>

                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Player Name (as per SSC)*"
                                            name="playerName"
                                            value={player.playerName}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.playerName}
                                            helperText={errors.players[index]?.playerName}
                                            disabled={player.isExisting}
                                            slotProps={{ input: { readOnly: player.isExisting } }}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Mobile No*"
                                            name="mobileNo"
                                            type="tel"
                                            value={player.mobileNo}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            onBlur={() => handlePlayerBlur(index, 'mobileNo')}
                                            error={!!errors.players[index]?.mobileNo}
                                            helperText={errors.players[index]?.mobileNo}
                                            disabled={player.isExisting}
                                            slotProps={{
                                                input: { readOnly: player.isExisting },
                                                htmlInput: { maxLength: 10, inputMode: 'numeric' }
                                            }}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Gender*"
                                            name="gender"
                                            value={player.gender}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.gender}
                                            helperText={errors.players[index]?.gender}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="DOB (as per SSC)*"
                                            name="dob"
                                            type="date"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                htmlInput: { max: "9999-12-31", min: "1900-01-01" },
                                                input: { readOnly: player.isExisting }
                                            }}
                                            placeholder=" "
                                            value={player.dob}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.dob}
                                            helperText={errors.players[index]?.dob}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Mode of Transport*"
                                            name="transportMode"
                                            value={player.transportMode}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.transportMode}
                                            helperText={errors.players[index]?.transportMode}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        >
                                            <MenuItem value="Own">Own Vehicle</MenuItem>
                                            <MenuItem value="Bus">Bus</MenuItem>
                                            <MenuItem value="Train">Train</MenuItem>
                                            <MenuItem value="Flight">Flight</MenuItem>
                                        </TextField>
                                    </Box>
                                    {(player.transportMode === 'Train' || player.transportMode === 'Flight') && (
                                        <Box sx={{ mt: 1 }}>
                                            <TextField
                                                fullWidth
                                                label={`${player.transportMode} No.*`}
                                                name="transportNumber"
                                                value={player.transportNumber || ''}
                                                onChange={(e) => handlePlayerChange(index, e)}
                                                error={!!errors.players[index]?.transportNumber}
                                                helperText={errors.players[index]?.transportNumber}
                                                disabled={player.isExisting}
                                                slotProps={{ input: { readOnly: player.isExisting } }}
                                                sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                            />
                                        </Box>
                                    )}
                                </Box>

                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Date of Arrival*"
                                            name="arrivalDate"
                                            type="date"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                htmlInput: { max: "9999-12-31", min: "1900-01-01" },
                                                input: { readOnly: player.isExisting }
                                            }}
                                            placeholder=" "
                                            value={player.arrivalDate}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.arrivalDate}
                                            helperText={errors.players[index]?.arrivalDate}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Time of Arrival*"
                                            name="arrivalTime"
                                            type="time"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                input: { readOnly: player.isExisting }
                                            }}
                                            placeholder=" "
                                            value={player.arrivalTime}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.arrivalTime}
                                            helperText={errors.players[index]?.arrivalTime}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Date of Departure*"
                                            name="departureDate"
                                            type="date"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                htmlInput: { max: "9999-12-31", min: "1900-01-01" },
                                                input: { readOnly: player.isExisting }
                                            }}
                                            placeholder=" "
                                            value={player.departureDate}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.departureDate}
                                            helperText={errors.players[index]?.departureDate}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Time of Departure*"
                                            name="departureTime"
                                            type="time"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                input: { readOnly: player.isExisting }
                                            }}
                                            placeholder=" "
                                            value={player.departureTime}
                                            onChange={(e) => handlePlayerChange(index, e)}
                                            error={!!errors.players[index]?.departureTime}
                                            helperText={errors.players[index]?.departureTime}
                                            disabled={player.isExisting}
                                            sx={player.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Accommodation Required?*</FormLabel>
                                            <RadioGroup row name={`player-accommodation-${index}`} value={player.accommodation} onChange={(e) => handlePlayerChange(index, { target: { name: 'accommodation', value: e.target.value } })}>
                                                <FormControlLabel value="Yes" control={<Radio size="small" disabled={player.isExisting} />} label="Yes" />
                                                <FormControlLabel value="No" control={<Radio size="small" disabled={player.isExisting} />} label="No" />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                            <Box component="button" type="button" className="btn-secondary" onClick={addPlayer}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Another Player
                            </Box>
                        </Box>
                    </Box>

                    {/* Coach/Manager Section */}
                    <Box component="fieldset" className="section-fieldset">
                        <Box component="legend" className="section-legend">Coach / Manager Details</Box>
                        {coaches.map((coach, index) => (
                            <Box
                                key={coach._id || index}
                                className="player-card"
                                sx={coach.isExisting ? { borderLeft: '4px solid #0284c7' } : {}}
                            >
                                <Box className="player-header">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box component="h4">Member {index + 1}</Box>
                                        {coach.isExisting ? (
                                            <Chip
                                                label="Saved Record"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#e0f2fe',
                                                    color: '#0369a1',
                                                    border: '1px solid #bae6fd'
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label="New Entry"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    bgcolor: '#fef3c7',
                                                    color: '#b45309',
                                                    border: '1px solid #fde68a'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    {!coach.isExisting && (
                                        <Box component="button" type="button" className="remove-player-btn" onClick={() => removeCoach(index)}>
                                            Remove
                                        </Box>
                                    )}
                                </Box>
                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Role*"
                                            name="role"
                                            value={coach.role}
                                            onChange={(e) => handleCoachChange(index, e)}
                                            error={!!errors.coaches[index]?.role}
                                            helperText={errors.coaches[index]?.role}
                                            disabled={coach.isExisting}
                                            sx={coach.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        >
                                            <MenuItem value="Coach">Coach</MenuItem>
                                            <MenuItem value="Manager">Manager</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Name*"
                                            name="name"
                                            value={coach.name}
                                            onChange={(e) => handleCoachChange(index, e)}
                                            error={!!errors.coaches[index]?.name}
                                            helperText={errors.coaches[index]?.name}
                                            disabled={coach.isExisting}
                                            slotProps={{ input: { readOnly: coach.isExisting } }}
                                            sx={coach.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Mobile No*"
                                            name="mobileNo"
                                            type="tel"
                                            value={coach.mobileNo}
                                            onChange={(e) => handleCoachChange(index, e)}
                                            onBlur={() => handleCoachBlur(index, 'mobileNo')}
                                            error={!!errors.coaches[index]?.mobileNo}
                                            helperText={errors.coaches[index]?.mobileNo}
                                            disabled={coach.isExisting}
                                            slotProps={{
                                                input: { readOnly: coach.isExisting },
                                                htmlInput: { maxLength: 10, inputMode: 'numeric' }
                                            }}
                                            sx={coach.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Email Address*"
                                            name="mailId"
                                            type="email"
                                            value={coach.mailId}
                                            onChange={(e) => handleCoachChange(index, e)}
                                            error={!!errors.coaches[index]?.mailId}
                                            helperText={errors.coaches[index]?.mailId}
                                            disabled={coach.isExisting}
                                            slotProps={{ input: { readOnly: coach.isExisting } }}
                                            sx={coach.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Gender*"
                                            name="gender"
                                            value={coach.gender}
                                            onChange={(e) => handleCoachChange(index, e)}
                                            error={!!errors.coaches[index]?.gender}
                                            helperText={errors.coaches[index]?.gender}
                                            disabled={coach.isExisting}
                                            sx={coach.isExisting ? { bgcolor: '#f8fafc', borderRadius: 1 } : {}}
                                        >
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Food Type*</FormLabel>
                                            <RadioGroup row name={`foodType-${index}`} value={coach.foodType} onChange={(e) => handleCoachChange(index, { target: { name: 'foodType', value: e.target.value } })}>
                                                <FormControlLabel value="Veg" control={<Radio size="small" disabled={coach.isExisting} />} label="Veg" />
                                                <FormControlLabel value="Non-Veg" control={<Radio size="small" disabled={coach.isExisting} />} label="Non-Veg" />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Accommodation Required?*</FormLabel>
                                            <RadioGroup row name={`accommodation-${index}`} value={coach.accommodation} onChange={(e) => handleCoachChange(index, { target: { name: 'accommodation', value: e.target.value } })}>
                                                <FormControlLabel value="Yes" control={<Radio size="small" disabled={coach.isExisting} />} label="Yes" />
                                                <FormControlLabel value="No" control={<Radio size="small" disabled={coach.isExisting} />} label="No" />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                            <Box component="button" type="button" className="btn-secondary" onClick={addCoach}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Coach / Manager
                            </Box>
                        </Box>
                    </Box>

                    <Box
                        component="button"
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                        sx={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                        {submitting ? 'Submitting...' : (isExistingUniversity ? 'Submit New Participants' : 'Submit Registration')}
                    </Box>
                </Box>
            </Box>

            {/* Registration Success Popup Modal */}
            <Dialog
                open={successModal.open}
                onClose={() => { }}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 4,
                            p: { xs: 1, sm: 2 },
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            textAlign: 'center',
                            position: 'relative'
                        }
                    }
                }}
            >
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    {/* Success Icon */}
                    <Box sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)'
                    }}>
                        <CheckCircleIcon sx={{ fontSize: 44 }} />
                    </Box>

                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a', mb: 0.5 }}>
                        {successModal.isExistingUniversity ? 'Registration Updated! 🎉' : 'Registration Successful! 🎉'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                        {successModal.isExistingUniversity ? (
                            <>
                                New participants for <b>{successModal.universityName}</b> have been added successfully. Total: {successModal.totalPlayers} Players, {successModal.totalCoaches} Coaches/Managers.
                            </>
                        ) : (
                            <>
                                <b>{successModal.universityName}</b> team has been registered successfully.
                            </>
                        )}
                    </Typography>

                    {/* Example Credentials Card (Only if new accounts were created) */}
                    {successModal.accountsCreated > 0 && successModal.sampleCredentials.mobile ? (
                        <Box sx={{
                            bgcolor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 3,
                            p: 2.5,
                            mb: 2.5,
                            textAlign: 'left'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#0b5299', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '12px' }}>
                                    New Participant Login Credentials
                                </Typography>
                                {successModal.sampleCredentials.name && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        ({successModal.sampleCredentials.name})
                                    </Typography>
                                )}
                            </Box>

                            {/* Username / Mobile */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#fff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                mb: 1.5
                            }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 500 }}>
                                        Username (Mobile No)
                                    </Typography>
                                    <Typography variant="body1" fontWeight="700" sx={{ color: '#0f172a', letterSpacing: 0.5 }}>
                                        {successModal.sampleCredentials.mobile || '—'}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy(successModal.sampleCredentials.mobile, 'Username')}
                                    title="Copy Username"
                                    sx={{ color: copiedField === 'Username' ? '#16a34a' : '#64748b' }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            {/* Password */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#fff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 2,
                                px: 2,
                                py: 1
                            }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 500 }}>
                                        Default Password
                                    </Typography>
                                    <Typography variant="body1" fontWeight="700" sx={{ color: '#0b5299', letterSpacing: 0.5 }}>
                                        {successModal.sampleCredentials.password}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy(successModal.sampleCredentials.password, 'Password')}
                                    title="Copy Password"
                                    sx={{ color: copiedField === 'Password' ? '#16a34a' : '#64748b' }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{
                            bgcolor: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 3,
                            p: 2,
                            mb: 2.5,
                            textAlign: 'left'
                        }}>
                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                                Existing members retain their previous login credentials.
                            </Typography>
                        </Box>
                    )}

                    {/* Notice for newly added members */}
                    <Box sx={{
                        bgcolor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 2.5,
                        p: 2,
                        textAlign: 'left'
                    }}>
                        <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 700, mb: 0.8 }}>
                            {successModal.isExistingUniversity ? 'New Members Added:' : 'Accounts Created for All Members:'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1e40af', lineHeight: 1.6, display: 'block', mb: 0.4 }}>
                            {successModal.isExistingUniversity ? (
                                <>
                                    • Successfully appended <b>{successModal.newPlayersAdded} new player(s)</b> and <b>{successModal.newCoachesAdded} new coach/manager(s)</b> to {successModal.universityName}.
                                </>
                            ) : (
                                <>
                                    • User accounts have been created for all <b>{successModal.totalPlayers} Players</b> and <b>{successModal.totalCoaches} Coaches/Managers</b>.
                                </>
                            )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1e40af', lineHeight: 1.6, display: 'block' }}>
                            • Every new participant can log in using their own <b>Registered Mobile Number</b> and default password <b>{successModal.sampleCredentials.password}</b>.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 1, px: 3, display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setSuccessModal(prev => ({ ...prev, open: false }));
                            navigate('/');
                        }}
                        sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#64748b',
                            borderColor: '#cbd5e1',
                            flex: 1,
                            py: 1
                        }}
                    >
                        Done (Go to Home)
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSuccessModal(prev => ({ ...prev, open: false }));
                            setIsLoginModalOpen(true);
                        }}
                        sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#0b5299',
                            '&:hover': { bgcolor: '#083d73' },
                            flex: 1,
                            py: 1,
                            boxShadow: '0 4px 14px rgba(11,82,153,0.3)'
                        }}
                    >
                        Login Now
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Login Modal opened directly from success modal */}
            <Authentication
                open={isLoginModalOpen}
                onClose={() => {
                    setIsLoginModalOpen(false);
                    navigate('/');
                }}
                initialUsername={successModal.sampleCredentials.mobile}
                initialPassword={successModal.sampleCredentials.password}
            />
        </Box>
    );
};

export default Registration;
