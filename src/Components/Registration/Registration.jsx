import React, { useState } from 'react';
import { Box } from '@mui/material';
import { toast } from 'sonner';

const Registration = () => {
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
        let newErrors = { team: {}, players: [], coaches: [] };
        let isValid = true;

        if (!teamDetails.universityName) { newErrors.team.universityName = 'University Name is required'; isValid = false; }
        else if (!/^[A-Za-z0-9\s\.\-']+$/.test(teamDetails.universityName)) { newErrors.team.universityName = 'Invalid University Name'; isValid = false; }

        if (!teamDetails.universityContact) { newErrors.team.universityContact = 'Contact is required'; isValid = false; }
        else if (!/^[6-9][0-9]{9}$/.test(teamDetails.universityContact)) { newErrors.team.universityContact = 'Must be 10 digits starting with 6-9'; isValid = false; }

        if (!teamDetails.address) { newErrors.team.address = 'Address is required'; isValid = false; }

        players.forEach((player, i) => {
            let pErrs = {};
            if (!player.playerName) { pErrs.playerName = 'Player Name is required'; isValid = false; }
            else if (!/^[A-Za-z\s\.\-']+$/.test(player.playerName)) { pErrs.playerName = 'Invalid Name'; isValid = false; }

            if (!player.mobileNo) { pErrs.mobileNo = 'Mobile is required'; isValid = false; }
            else if (!/^[6-9][0-9]{9}$/.test(player.mobileNo)) { pErrs.mobileNo = 'Must be 10 digits starting with 6-9'; isValid = false; }

            if (!player.gender) { pErrs.gender = 'Gender is required'; isValid = false; }
            if (!player.dob) { pErrs.dob = 'DOB is required'; isValid = false; }
            if (!player.transportMode) { pErrs.transportMode = 'Transport Mode is required'; isValid = false; }
            if ((player.transportMode === 'Train' || player.transportMode === 'Flight') && !player.transportNumber) {
                pErrs.transportNumber = 'Transport Number is required'; isValid = false;
            }
            if (!player.arrivalDate) { pErrs.arrivalDate = 'Arrival Date is required'; isValid = false; }
            if (!player.arrivalTime) { pErrs.arrivalTime = 'Arrival Time is required'; isValid = false; }
            if (!player.departureDate) { pErrs.departureDate = 'Departure Date is required'; isValid = false; }
            else if (player.arrivalDate && player.departureDate < player.arrivalDate) { pErrs.departureDate = 'Must be >= Arrival Date'; isValid = false; }
            if (!player.departureTime) { pErrs.departureTime = 'Departure Time is required'; isValid = false; }

            newErrors.players[i] = pErrs;
        });

        coaches.forEach((coach, i) => {
            let cErrs = {};
            if (!coach.name) { cErrs.name = 'Name is required'; isValid = false; }
            else if (!/^[A-Za-z\s\.\-']+$/.test(coach.name)) { cErrs.name = 'Invalid Name'; isValid = false; }

            if (!coach.mobileNo) { cErrs.mobileNo = 'Mobile is required'; isValid = false; }
            else if (!/^[6-9][0-9]{9}$/.test(coach.mobileNo)) { cErrs.mobileNo = 'Must be 10 digits starting with 6-9'; isValid = false; }

            if (!coach.mailId) { cErrs.mailId = 'Email is required'; isValid = false; }
            else if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(coach.mailId)) { cErrs.mailId = 'Invalid Email'; isValid = false; }

            if (!coach.gender) { cErrs.gender = 'Gender is required'; isValid = false; }
            
            newErrors.coaches[i] = cErrs;
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const response = await fetch('http://localhost:3003/api/registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        teamDetails,
                        players,
                        coaches
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    toast.success('Form submitted successfully!');
                    // Optionally reset form here
                    setTeamDetails({ universityName: '', address: '', universityContact: '' });
                    setPlayers([{ playerName: '', mobileNo: '', gender: '', dob: '', transportMode: '', transportNumber: '', arrivalDate: '', arrivalTime: '', departureDate: '', departureTime: '', accommodation: 'Yes' }]);
                    setCoaches([{ role: 'Coach', name: '', mobileNo: '', mailId: '', gender: '', foodType: 'Veg', accommodation: 'Yes' }]);
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to submit form');
                }
            } catch (error) {
                console.error('Submission error:', error);
                toast.error('Network error. Please try again later.');
            }
        } else {
            toast.error('Please fill all the required fields correctly');
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
                            <Box className="form-group">
                                <Box component="label">Name of University</Box>
                                <Box component="input" type="text" name="universityName" className="form-input" placeholder="Enter University Name" value={teamDetails.universityName} onChange={handleTeamChange} />
                                {errors.team.universityName && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.team.universityName}</Box>}
                            </Box>
                            <Box className="form-group">
                                <Box component="label">University Contact No</Box>
                                <Box component="input" type="tel" name="universityContact" className="form-input" placeholder="Contact Number" value={teamDetails.universityContact} onChange={handleTeamChange} maxLength="10" />
                                {errors.team.universityContact && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.team.universityContact}</Box>}
                            </Box>
                            <Box className="form-group">
                                <Box component="label">Address</Box>
                                <Box component="textarea" name="address" className="form-input" placeholder="Full Address" value={teamDetails.address} onChange={handleTeamChange} rows="1"></Box>
                                {errors.team.address && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.team.address}</Box>}
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
                                    <Box className="form-group">
                                        <Box component="label">Player Name (as per SSC)</Box>
                                        <Box component="input" type="text" name="playerName" className="form-input" placeholder="Full Name" value={player.playerName} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.playerName && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.playerName}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Mobile No</Box>
                                        <Box component="input" type="tel" name="mobileNo" className="form-input" placeholder="Mobile Number" value={player.mobileNo} onChange={(e) => handlePlayerChange(index, e)} maxLength="10" />
                                        {errors.players[index]?.mobileNo && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.mobileNo}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Gender</Box>
                                        <Box component="select" name="gender" className="form-select" value={player.gender} onChange={(e) => handlePlayerChange(index, e)}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </Box>
                                        {errors.players[index]?.gender && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.gender}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">DOB (as per SSC)</Box>
                                        <Box component="input" type="date" name="dob" className="form-input" value={player.dob} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.dob && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.dob}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Mode of Transport</Box>
                                        <Box component="select" name="transportMode" className="form-select" value={player.transportMode} onChange={(e) => handlePlayerChange(index, e)}>
                                            <option value="">Select Mode</option>
                                            <option value="Own">Own Vehicle</option>
                                            <option value="Bus">Bus</option>
                                            <option value="Train">Train</option>
                                            <option value="Flight">Flight</option>
                                        </Box>
                                        {errors.players[index]?.transportMode && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.transportMode}</Box>}
                                    </Box>
                                    {(player.transportMode === 'Train' || player.transportMode === 'Flight') && (
                                        <Box className="form-group">
                                            <Box component="label">{player.transportMode} No.</Box>
                                            <Box component="input" type="text" name="transportNumber" className="form-input" value={player.transportNumber || ''} onChange={(e) => handlePlayerChange(index, e)} placeholder={`Enter ${player.transportMode} No.`} />
                                            {errors.players[index]?.transportNumber && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.transportNumber}</Box>}
                                        </Box>
                                    )}
                                </Box>

                                <Box className="form-grid">
                                    <Box className="form-group">
                                        <Box component="label">Date of Arrival</Box>
                                        <Box component="input" type="date" name="arrivalDate" className="form-input" value={player.arrivalDate} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.arrivalDate && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.arrivalDate}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Time of Arrival</Box>
                                        <Box component="input" type="time" name="arrivalTime" className="form-input" value={player.arrivalTime} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.arrivalTime && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.arrivalTime}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Date of Departure</Box>
                                        <Box component="input" type="date" name="departureDate" className="form-input" value={player.departureDate} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.departureDate && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.departureDate}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Time of Departure</Box>
                                        <Box component="input" type="time" name="departureTime" className="form-input" value={player.departureTime} onChange={(e) => handlePlayerChange(index, e)} />
                                        {errors.players[index]?.departureTime && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.players[index]?.departureTime}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Accommodation Required?</Box>
                                        <Box className="radio-group">
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`player-accommodation-${index}`} value="Yes" checked={player.accommodation === 'Yes'} onChange={(e) => handlePlayerChange(index, { target: { name: 'accommodation', value: 'Yes' } })} />
                                                Yes
                                            </Box>
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`player-accommodation-${index}`} value="No" checked={player.accommodation === 'No'} onChange={(e) => handlePlayerChange(index, { target: { name: 'accommodation', value: 'No' } })} />
                                                No
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Box component="button" type="button" className="btn-secondary" onClick={addPlayer}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Another Player
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
                                    <Box className="form-group">
                                        <Box component="label">Role</Box>
                                        <Box component="select" name="role" className="form-select" value={coach.role} onChange={(e) => handleCoachChange(index, e)}>
                                            <option value="Coach">Coach</option>
                                            <option value="Manager">Manager</option>
                                        </Box>
                                        {errors.coaches[index]?.role && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.coaches[index]?.role}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Name</Box>
                                        <Box component="input" type="text" name="name" className="form-input" placeholder="Full Name" value={coach.name} onChange={(e) => handleCoachChange(index, e)} />
                                        {errors.coaches[index]?.name && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.coaches[index]?.name}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Mobile No</Box>
                                        <Box component="input" type="tel" name="mobileNo" className="form-input" placeholder="Mobile Number" value={coach.mobileNo} onChange={(e) => handleCoachChange(index, e)} maxLength="10" />
                                        {errors.coaches[index]?.mobileNo && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.coaches[index]?.mobileNo}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Mail ID</Box>
                                        <Box component="input" type="email" name="mailId" className="form-input" placeholder="Email Address" value={coach.mailId} onChange={(e) => handleCoachChange(index, e)} />
                                        {errors.coaches[index]?.mailId && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.coaches[index]?.mailId}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Gender</Box>
                                        <Box component="select" name="gender" className="form-select" value={coach.gender} onChange={(e) => handleCoachChange(index, e)}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </Box>
                                        {errors.coaches[index]?.gender && <Box component="span" sx={{color: "red", fontSize: "12px", mt: 0.5, display: "block"}} >{errors.coaches[index]?.gender}</Box>}
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Food Type</Box>
                                        <Box className="radio-group">
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`foodType-${index}`} value="Veg" checked={coach.foodType === 'Veg'} onChange={(e) => handleCoachChange(index, { target: { name: 'foodType', value: 'Veg' } })} />
                                                Veg
                                            </Box>
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`foodType-${index}`} value="Non-Veg" checked={coach.foodType === 'Non-Veg'} onChange={(e) => handleCoachChange(index, { target: { name: 'foodType', value: 'Non-Veg' } })} />
                                                Non-Veg
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box className="form-group">
                                        <Box component="label">Accommodation Required?</Box>
                                        <Box className="radio-group">
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`accommodation-${index}`} value="Yes" checked={coach.accommodation === 'Yes'} onChange={(e) => handleCoachChange(index, { target: { name: 'accommodation', value: 'Yes' } })} />
                                                Yes
                                            </Box>
                                            <Box component="label" className="radio-label">
                                                <Box component="input" type="radio" name={`accommodation-${index}`} value="No" checked={coach.accommodation === 'No'} onChange={(e) => handleCoachChange(index, { target: { name: 'accommodation', value: 'No' } })} />
                                                No
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ))}

                        <Box component="button" type="button" className="btn-secondary" onClick={addCoach}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Coach / Manager
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