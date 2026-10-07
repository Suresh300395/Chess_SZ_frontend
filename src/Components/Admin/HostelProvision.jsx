import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import CustomTabs from '../Common/Tabs';

const HostelProvision = () => {
    const [accommodationList, setAccommodationList] = useState([]);
    const [activeTab, setActiveTab] = useState('Players');
    const tabsList = ['Players', 'Coaches / Managers'];

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const response = await fetch('http://localhost:3003/api/registration');
                if (response.ok) {
                    const data = await response.json();
                    let list = [];
                    data.forEach(reg => {
                        if (reg.players) {
                            reg.players.forEach(player => {
                                if (player.accommodation === 'Yes') {
                                    list.push({
                                        id: player._id || Math.random().toString(),
                                        name: player.playerName,
                                        role: 'Player',
                                        university: reg.universityName,
                                        gender: player.gender,
                                        phone: player.mobileNo
                                    });
                                }
                            });
                        }
                        if (reg.coaches) {
                            reg.coaches.forEach(coach => {
                                if (coach.accommodation === 'Yes') {
                                    list.push({
                                        id: coach._id || Math.random().toString(),
                                        name: coach.name,
                                        role: 'Coach',
                                        university: reg.universityName,
                                        gender: coach.gender,
                                        phone: coach.mobileNo
                                    });
                                }
                            });
                        }
                    });
                    setAccommodationList(list);
                }
            } catch (err) {
                console.error("Error fetching registrations:", err);
            }
        };

        fetchRegistrations();
    }, []);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 1, fontSize: { xs: '1rem', md: '2rem' } }}>
                Accommodation List
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                List of Players and Coaches who requested accommodation.
            </Typography>

            <Box sx={{ mb: 3 }}>
                <CustomTabs tabs={tabsList} activeTab={activeTab} setActiveTab={setActiveTab} />
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="accommodation table">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell><b>S.No</b></TableCell>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Role</b></TableCell>
                            <TableCell><b>University</b></TableCell>
                            <TableCell><b>Gender</b></TableCell>
                            <TableCell><b>Phone</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {accommodationList.filter(person => activeTab === 'Players' ? person.role === 'Player' : person.role === 'Coach').length > 0 ? (
                            accommodationList
                                .filter(person => activeTab === 'Players' ? person.role === 'Player' : person.role === 'Coach')
                                .map((person, index) => (
                                <TableRow key={person.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{person.name}</TableCell>
                                    <TableCell>
                                        <Chip label={person.role} size="small" color={person.role === 'Coach' ? 'secondary' : 'primary'} variant="outlined" />
                                    </TableCell>
                                    <TableCell>{person.university}</TableCell>
                                    <TableCell>{person.gender}</TableCell>
                                    <TableCell>{person.phone}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No {activeTab === 'Players' ? 'players' : 'coaches'} found needing accommodation.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default HostelProvision;
