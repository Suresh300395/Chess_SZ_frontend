import React, { useState } from 'react';
import { Box, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, Typography, Paper } from '@mui/material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { registrationAPI } from '../../utils/api';


const Registration = () => {
    const navigate = useNavigate();
    const [teamDetails, setTeamDetails] = useState({
        universityName: '',
        address: '',
        universityContact: ''
    });

    const [players, setPlayers] = useState([{
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
        accommodation: 'Yes'
    }]);

    const [coaches, setCoaches] = useState([{
        role: 'Coach',
        name: '',
        mobileNo: '',
        mailId: '',
        gender: '',
        foodType: 'Veg',
        accommodation: 'Yes'
    }]);

    const handleTeamChange = (e) => {
        const { name, value } = e.target;
        setTeamDetails({ ...teamDetails, [name]: value });
    };

    const handlePlayerChange = (index, e) => {
        const { name, value } = e.target;
        const updatedPlayers = [...players];
        updatedPlayers[index][name] = value;
        setPlayers(updatedPlayers);
    };

    const addPlayer = () => {
        setPlayers([...players, {
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
            accommodation: 'Yes'
        }]);
    };

    const removePlayer = (index) => {
        const updatedPlayers = [...players];
        updatedPlayers.splice(index, 1);
        setPlayers(updatedPlayers);
    };

    const handleCoachChange = (index, e) => {
        const { name, value } = e.target;
        const updatedCoaches = [...coaches];
        updatedCoaches[index][name] = value;
        setCoaches(updatedCoaches);
    };

    const addCoach = () => {
        setCoaches([...coaches, {
            role: 'Coach',
            name: '',
            mobileNo: '',
            mailId: '',
            gender: '',
            foodType: 'Veg',
            accommodation: 'Yes'
        }]);
    };

    const removeCoach = (index) => {
        const updatedCoaches = [...coaches];
        updatedCoaches.splice(index, 1);
        setCoaches(updatedCoaches);
    };

    const [errors, setErrors] = useState({
        team: {},
        players: [],
        coaches: []
    });

    const validateForm = () => {
        let isValid = true;
        let newErrors = { team: {}, players: [], coaches: [] };

        // Team validations
        if (!teamDetails.universityName.trim()) {
            newErrors.team.universityName = 'University name is required';
            isValid = false;
        }
        if (!teamDetails.universityContact.trim()) {
            newErrors.team.universityContact = 'University contact is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(teamDetails.universityContact)) {
            newErrors.team.universityContact = 'Must be exactly 10 digits';
            isValid = false;
        }
        if (!teamDetails.address.trim()) {
            newErrors.team.address = 'Address is required';
            isValid = false;
        }

        // Player validations
        players.forEach((player, index) => {
            let playerErrors = {};
            if (!player.playerName.trim()) {
                playerErrors.playerName = 'Name is required';
                isValid = false;
            }
            if (!player.mobileNo.trim()) {
                playerErrors.mobileNo = 'Mobile number is required';
                isValid = false;
            } else if (!/^\d{10}$/.test(player.mobileNo)) {
                playerErrors.mobileNo = 'Must be 10 digits';
                isValid = false;
            }
            if (!player.gender) {
                playerErrors.gender = 'Gender is required';
                isValid = false;
            }
            if (!player.dob) {
                playerErrors.dob = 'DOB is required';
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
            }
            if (!player.arrivalTime) {
                playerErrors.arrivalTime = 'Arrival time is required';
                isValid = false;
            }
            if (!player.departureDate) {
                playerErrors.departureDate = 'Departure date is required';
                isValid = false;
            }
            if (!player.departureTime) {
                playerErrors.departureTime = 'Departure time is required';
                isValid = false;
            }
            newErrors.players[index] = playerErrors;
        });

        // Coach validations
        coaches.forEach((coach, index) => {
            let coachErrors = {};
            if (!coach.role) {
                coachErrors.role = 'Role is required';
                isValid = false;
            }
            if (!coach.name.trim()) {
                coachErrors.name = 'Name is required';
                isValid = false;
            }
            if (!coach.mobileNo.trim()) {
                coachErrors.mobileNo = 'Mobile number is required';
                isValid = false;
            } else if (!/^\d{10}$/.test(coach.mobileNo)) {
                coachErrors.mobileNo = 'Must be 10 digits';
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

        setErrors(newErrors);

        if (!isValid) {
            toast.error('Please correct the errors in the form.');
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        const payload = {
            teamDetails: {
                universityName: teamDetails.universityName,
                address: teamDetails.address,
                universityContact: teamDetails.universityContact
            },
            players: players.map(p => ({
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
                role: c.role,
                name: c.name,
                mobileNo: c.mobileNo,
                mailId: c.mailId,
                gender: c.gender,
                foodType: c.foodType,
                accommodation: c.accommodation
            }))
        };

        try {
            const res = await registrationAPI.submit(payload);

            if (res.ok) {
                toast.success('Registration successful!');
                navigate('/user/dashboard');
            } else {
                const data = await res.json();
                toast.error(data.message || data.error || 'Failed to submit registration');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Server error, please try again.');
        }
    };

    return (
        <Box className="registration-container">
            <Box className="registration-form-wrapper">
                <Box component="h1" className="registration-title">Registration</Box>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* University Details Section */}
                    <Box component="fieldset" className="section-fieldset">
                        <Box component="legend" className="section-legend">University Details</Box>
                        <Box className="form-grid">
                            <Box sx={{ mt: 1 }}>
                                <TextField fullWidth label="Name of University*" name="universityName" value={teamDetails.universityName} onChange={handleTeamChange} error={!!errors.team?.universityName} helperText={errors.team?.universityName} />
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <TextField fullWidth label="University Contact No*" name="universityContact" type="tel" inputProps={{ maxLength: 10 }} value={teamDetails.universityContact} onChange={handleTeamChange} error={!!errors.team?.universityContact} helperText={errors.team?.universityContact} />
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <TextField fullWidth multiline rows={1} label="Address*" name="address" value={teamDetails.address} onChange={handleTeamChange} error={!!errors.team?.address} helperText={errors.team?.address} />
                            </Box>
                        </Box>
                    </Box>

                    {/* Players Section */}
                    <Box component="fieldset" className="section-fieldset">
                        <Box component="legend" className="section-legend">Player Details</Box>
                        {players.map((player, index) => (
                            <Box key={index} className="player-card">
                                <Box className="player-header">
                                    <Box component="h4">Player {index + 1}</Box>
                                    {index > 0 && (
                                        <Box component="button" type="button" className="remove-player-btn" onClick={() => removePlayer(index)}>
                                            Remove
                                        </Box>
                                    )}
                                </Box>

                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Player Name (as per SSC)*" name="playerName" value={player.playerName} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.playerName} helperText={errors.players[index]?.playerName} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Mobile No*" name="mobileNo" type="tel" inputProps={{ maxLength: 10 }} value={player.mobileNo} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.mobileNo} helperText={errors.players[index]?.mobileNo} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField select fullWidth label="Gender*" name="gender" value={player.gender} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.gender} helperText={errors.players[index]?.gender}>
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="DOB (as per SSC)*" name="dob" type="date" InputLabelProps={{ shrink: true }} slotProps={{ inputLabel: { shrink: true } }} placeholder=" " value={player.dob} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.dob} helperText={errors.players[index]?.dob} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField select fullWidth label="Mode of Transport*" name="transportMode" value={player.transportMode} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.transportMode} helperText={errors.players[index]?.transportMode}>
                                            <MenuItem value="Own">Own Vehicle</MenuItem>
                                            <MenuItem value="Bus">Bus</MenuItem>
                                            <MenuItem value="Train">Train</MenuItem>
                                            <MenuItem value="Flight">Flight</MenuItem>
                                        </TextField>
                                    </Box>
                                    {(player.transportMode === 'Train' || player.transportMode === 'Flight') && (
                                        <Box sx={{ mt: 1 }}>
                                            <TextField fullWidth label={`${player.transportMode} No.*`} name="transportNumber" value={player.transportNumber || ''} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.transportNumber} helperText={errors.players[index]?.transportNumber} />
                                        </Box>
                                    )}
                                </Box>

                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Date of Arrival*" name="arrivalDate" type="date" InputLabelProps={{ shrink: true }} slotProps={{ inputLabel: { shrink: true } }} placeholder=" " value={player.arrivalDate} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.arrivalDate} helperText={errors.players[index]?.arrivalDate} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Time of Arrival*" name="arrivalTime" type="time" InputLabelProps={{ shrink: true }} slotProps={{ inputLabel: { shrink: true } }} placeholder=" " value={player.arrivalTime} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.arrivalTime} helperText={errors.players[index]?.arrivalTime} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Date of Departure*" name="departureDate" type="date" InputLabelProps={{ shrink: true }} slotProps={{ inputLabel: { shrink: true } }} placeholder=" " value={player.departureDate} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.departureDate} helperText={errors.players[index]?.departureDate} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Time of Departure*" name="departureTime" type="time" InputLabelProps={{ shrink: true }} slotProps={{ inputLabel: { shrink: true } }} placeholder=" " value={player.departureTime} onChange={(e) => handlePlayerChange(index, e)} error={!!errors.players[index]?.departureTime} helperText={errors.players[index]?.departureTime} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Accommodation Required?*</FormLabel>
                                            <RadioGroup row name={`player-accommodation-${index}`} value={player.accommodation} onChange={(e) => handlePlayerChange(index, { target: { name: 'accommodation', value: e.target.value } })}>
                                                <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                                                <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
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
                            <Box key={index} className="player-card">
                                <Box className="player-header">
                                    <Box component="h4">Member {index + 1}</Box>
                                    {index > 0 && (
                                        <Box component="button" type="button" className="remove-player-btn" onClick={() => removeCoach(index)}>
                                            Remove
                                        </Box>
                                    )}
                                </Box>
                                <Box className="form-grid">
                                    <Box sx={{ mt: 1 }}>
                                        <TextField select fullWidth label="Role*" name="role" value={coach.role} onChange={(e) => handleCoachChange(index, e)} error={!!errors.coaches[index]?.role} helperText={errors.coaches[index]?.role}>
                                            <MenuItem value="Coach">Coach</MenuItem>
                                            <MenuItem value="Manager">Manager</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Name*" name="name" value={coach.name} onChange={(e) => handleCoachChange(index, e)} error={!!errors.coaches[index]?.name} helperText={errors.coaches[index]?.name} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Mobile No*" name="mobileNo" type="tel" inputProps={{ maxLength: 10 }} value={coach.mobileNo} onChange={(e) => handleCoachChange(index, e)} error={!!errors.coaches[index]?.mobileNo} helperText={errors.coaches[index]?.mobileNo} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Email Address*" name="mailId" type="email" value={coach.mailId} onChange={(e) => handleCoachChange(index, e)} error={!!errors.coaches[index]?.mailId} helperText={errors.coaches[index]?.mailId} />
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <TextField select fullWidth label="Gender*" name="gender" value={coach.gender} onChange={(e) => handleCoachChange(index, e)} error={!!errors.coaches[index]?.gender} helperText={errors.coaches[index]?.gender}>
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Food Type*</FormLabel>
                                            <RadioGroup row name={`foodType-${index}`} value={coach.foodType} onChange={(e) => handleCoachChange(index, { target: { name: 'foodType', value: e.target.value } })}>
                                                <FormControlLabel value="Veg" control={<Radio size="small" />} label="Veg" />
                                                <FormControlLabel value="Non-Veg" control={<Radio size="small" />} label="Non-Veg" />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ fontSize: '12px', mb: 0.5, color: '#0D233B', fontWeight: 500 }}>Accommodation Required?*</FormLabel>
                                            <RadioGroup row name={`accommodation-${index}`} value={coach.accommodation} onChange={(e) => handleCoachChange(index, { target: { name: 'accommodation', value: e.target.value } })}>
                                                <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                                                <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
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

                    <Box component="button" type="submit" className="btn-primary">
                        Submit
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Registration;
