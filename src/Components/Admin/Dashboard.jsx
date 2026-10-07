import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import io from 'socket.io-client';

const Dashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [totalTeams, setTotalTeams] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReg, setSelectedReg] = useState(null);

    const handleOpenDialog = (reg) => {
        setSelectedReg(reg);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReg(null);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        fetchRegistrations();

        const socket = io('http://localhost:3003');
        socket.on('dataUpdated', () => {
            fetchRegistrations();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch('http://localhost:3003/api/registration');
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data);

                // Calculate Stats
                setTotalTeams(data.length);
                let playersCount = 0;
                data.forEach(reg => {
                    if (reg.players && Array.isArray(reg.players)) {
                        playersCount += reg.players.length;
                    }
                });
                setTotalPlayers(playersCount);
            }
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    const stats = [
        { title: 'Total Players', count: totalPlayers, icon: <GroupsIcon sx={{ fontSize: 32, color: '#0b5299' }} /> },
        { title: 'Total Teams', count: totalTeams, icon: <EmojiEventsIcon sx={{ fontSize: 32, color: '#0b5299' }} /> },
        { title: 'Total Rounds', count: 0, icon: <FormatListNumberedIcon sx={{ fontSize: 32, color: '#0b5299' }} /> }
    ];

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 1, fontSize: { xs: '1rem', md: '2rem' } }}>
                Welcome to Admin Dashboard
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Select an option from the sidebar to view details, manage registrations and organize the tournament.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%', mb: 5 }}>
                {stats.map((stat, index) => (
                    <Box key={index} sx={{ flex: 1 }}>
                        <Card sx={{
                            borderRadius: 3,
                            bgcolor: 'aliceblue',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            height: '100%',
                            width: '100%',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(11, 82, 153, 0.1)',
                                    mr: 2,
                                    display: 'flex'
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
                                        {stat.title}
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#334155' }}>
                                        {stat.count}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>

            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 3, fontSize: { xs: '1rem', md: '2rem' } }}>
                Registered Teams Overview
            </Typography>

            <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="registered teams table">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                            <TableCell><b>S.No</b></TableCell>
                            <TableCell><b>University Name</b></TableCell>
                            <TableCell><b>Contact Details</b></TableCell>
                            <TableCell><b>Total Players</b></TableCell>
                            <TableCell><b>Total Coaches</b></TableCell>
                            <TableCell><b>Registration Date</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#64748b' }}>
                                    No registrations found yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((reg, index) => (
                                    <TableRow key={reg._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500, color: '#0f172a' }}>{reg.universityName}</TableCell>
                                        <TableCell>{reg.universityContact}</TableCell>
                                        <TableCell>{reg.players?.length || 0}</TableCell>
                                        <TableCell>{reg.coaches?.length || 0}</TableCell>
                                        <TableCell>{new Date(reg.createdAt).toLocaleDateString('en-GB')}</TableCell>
                                        <TableCell>
                                            <Button variant="outlined" size="small" sx={{ borderColor: '#0b5299', color: '#0b5299' }} onClick={() => handleOpenDialog(reg)}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={registrations.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            {/* View Details Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ bgcolor: '#0b5299', color: 'white', fontWeight: 'bold' }}>
                    Team Details - {selectedReg?.universityName}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedReg && (
                        <Box>
                            <Typography variant="h6" sx={{ color: '#d06c38', mb: 2, fontWeight: 'bold' }}>University Information</Typography>
                            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                                <Typography><b>University Name:</b> {selectedReg.universityName}</Typography>
                                <Typography><b>Contact:</b> {selectedReg.universityContact}</Typography>
                                <Typography><b>Address:</b> {selectedReg.address}</Typography>
                            </Box>

                            <Typography variant="h6" sx={{ color: '#d06c38', mt: 3, mb: 2, fontWeight: 'bold' }}>Players List ({selectedReg.players?.length || 0})</Typography>
                            {selectedReg.players && selectedReg.players.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableRow>
                                                <TableCell><b>Name</b></TableCell>
                                                <TableCell><b>Mobile</b></TableCell>
                                                <TableCell><b>Gender</b></TableCell>
                                                <TableCell><b>DOB</b></TableCell>
                                                <TableCell><b>Transport</b></TableCell>
                                                <TableCell><b>Arrival</b></TableCell>
                                                <TableCell><b>Departure</b></TableCell>
                                                <TableCell><b>Accommodation</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedReg.players.map((player, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{player.playerName}</TableCell>
                                                    <TableCell>{player.mobileNo}</TableCell>
                                                    <TableCell>{player.gender}</TableCell>
                                                    <TableCell>{player.dob}</TableCell>
                                                    <TableCell>{player.transportMode} {player.transportNumber ? `(${player.transportNumber})` : ''}</TableCell>
                                                    <TableCell>{player.arrivalDate} <br /> <small>{player.arrivalTime}</small></TableCell>
                                                    <TableCell>{player.departureDate} <br /> <small>{player.departureTime}</small></TableCell>
                                                    <TableCell>{player.accommodation}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="textSecondary" sx={{ mb: 4 }}>No players added.</Typography>
                            )}

                            <Typography variant="h6" sx={{ color: '#d06c38', mt: 3, mb: 2, fontWeight: 'bold' }}>Coaches List ({selectedReg.coaches?.length || 0})</Typography>
                            {selectedReg.coaches && selectedReg.coaches.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableRow>
                                                <TableCell><b>Name</b></TableCell>
                                                <TableCell><b>Role</b></TableCell>
                                                <TableCell><b>Mobile</b></TableCell>
                                                <TableCell><b>Email</b></TableCell>
                                                <TableCell><b>Gender</b></TableCell>
                                                <TableCell><b>Food</b></TableCell>
                                                <TableCell><b>Accommodation</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedReg.coaches.map((coach, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{coach.name}</TableCell>
                                                    <TableCell>{coach.role}</TableCell>
                                                    <TableCell>{coach.mobileNo}</TableCell>
                                                    <TableCell>{coach.mailId}</TableCell>
                                                    <TableCell>{coach.gender}</TableCell>
                                                    <TableCell>{coach.foodType}</TableCell>
                                                    <TableCell>{coach.accommodation}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="textSecondary">No coaches added.</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Button onClick={handleCloseDialog} variant="contained" sx={{ bgcolor: '#0b5299' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
