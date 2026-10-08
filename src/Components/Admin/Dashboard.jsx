import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import io from 'socket.io-client';
import { registrationAPI, SOCKET_URL } from '../../utils/api';


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

        const socket = io(SOCKET_URL);

        socket.on('dataUpdated', () => {
            fetchRegistrations();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await registrationAPI.getAll();

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
        {
            title: 'Total Players',
            count: totalPlayers,
            subtitle: 'Enrolled Chess Players',
            badge: 'Participants',
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
            title: 'Total Teams',
            count: totalTeams,
            subtitle: 'Registered Universities',
            badge: 'Institutions',
            icon: <EmojiEventsIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <EmojiEventsIcon sx={{ fontSize: 90, color: '#d06c38' }} />,
            gradient: 'linear-gradient(135deg, #d06c38 0%, #ea580c 100%)',
            shadow: 'rgba(208, 108, 56, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fffbf7 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#fed7aa',
            badgeBg: '#fff7ed',
            badgeColor: '#c2410c'
        },
        {
            title: 'Total Rounds',
            count: 0,
            subtitle: 'Tournament Fixtures',
            badge: 'Matches',
            icon: <FormatListNumberedIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
            bgIcon: <FormatListNumberedIcon sx={{ fontSize: 90, color: '#059669' }} />,
            gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            shadow: 'rgba(5, 150, 105, 0.22)',
            bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f6fdf9 100%)',
            borderColor: '#e2e8f0',
            hoverBorder: '#a7f3d0',
            badgeBg: '#ecfdf5',
            badgeColor: '#047857'
        }
    ];

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 1, fontSize: { xs: '1rem', md: '2rem' } }}>
                Welcome to Admin Dashboard
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Select an option from the sidebar to view details, manage registrations and organize the tournament.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, width: '100%', mb: 4 }}>
                {stats.map((stat, index) => (
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

                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            {/* Icon badge */}
                            <Box sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '11px',
                                background: stat.gradient,
                                boxShadow: `0 4px 12px ${stat.shadow}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 1.5,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}>
                                {stat.icon}
                            </Box>

                            {/* Title */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#64748b',
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    display: 'block'
                                }}
                            >
                                {stat.title}
                            </Typography>

                            {/* Enlaraged Counter Number */}
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    fontSize: { xs: '2.4rem', md: '2.85rem' },
                                    lineHeight: 1.1,
                                    my: 0.25
                                }}
                            >
                                {stat.count}
                            </Typography>

                            {/* Subtitle */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#94a3b8',
                                    fontSize: '0.78rem',
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
