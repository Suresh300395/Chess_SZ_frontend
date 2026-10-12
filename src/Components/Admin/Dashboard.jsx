import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle, DialogContent, Chip, IconButton, Tooltip } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import io from 'socket.io-client';
import { registrationAPI, SOCKET_URL } from '../../utils/api';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';


const Dashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [totalTeams, setTotalTeams] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReg, setSelectedReg] = useState(null);
    const [playerViewMode, setPlayerViewMode] = useState('cards');
    const [coachViewMode, setCoachViewMode] = useState('cards');
    const [teamsViewMode, setTeamsViewMode] = useState('table');

    const handleOpenDialog = (reg) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
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
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <DashboardIcon sx={{ color: '#0b5299', fontSize: { xs: 28, md: 34 } }} />
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.25rem', md: '2rem' } }}>
                    Welcome to Admin Dashboard
                </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Select an option from the sidebar to view details, manage registrations and organize the tournament.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: { xs: 2, sm: 2.5, md: 3 }, width: '100%', mb: 4 }}>
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
                                    {/* Title */}
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

                                    {/* Enlaraged Counter Number */}
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.8rem' } }}>
                    Registered Teams Overview
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ffffff', p: 0.4, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <Tooltip title="Cards View">
                        <IconButton
                            size="small"
                            onClick={() => setTeamsViewMode('cards')}
                            sx={{
                                p: 0.6,
                                borderRadius: 1.5,
                                bgcolor: teamsViewMode === 'cards' ? '#0b5299' : 'transparent',
                                color: teamsViewMode === 'cards' ? '#ffffff' : '#64748b',
                                boxShadow: teamsViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                '&:hover': {
                                    bgcolor: teamsViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                    color: teamsViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                }
                            }}
                        >
                            <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Table View">
                        <IconButton
                            size="small"
                            onClick={() => setTeamsViewMode('table')}
                            sx={{
                                p: 0.6,
                                borderRadius: 1.5,
                                bgcolor: teamsViewMode === 'table' ? '#0b5299' : 'transparent',
                                color: teamsViewMode === 'table' ? '#ffffff' : '#64748b',
                                boxShadow: teamsViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                '&:hover': {
                                    bgcolor: teamsViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                    color: teamsViewMode === 'table' ? '#ffffff' : '#0b5299'
                                }
                            }}
                        >
                            <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Paper sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
                {teamsViewMode === 'cards' ? (
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                        {registrations.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center', color: '#64748b' }}>
                                <Typography>No registrations found yet.</Typography>
                            </Box>
                        ) : (
                            <Box 
                                sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                                    gap: 2 
                                }}
                            >
                                {registrations
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((reg, index) => (
                                        <Paper
                                            key={reg._id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                borderRadius: 2.5,
                                                bgcolor: '#ffffff',
                                                borderColor: '#e2e8f0',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    borderColor: '#cbd5e1',
                                                    boxShadow: '0 6px 16px rgba(11,82,153,0.08)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                                                    <Chip
                                                        label={`#${page * rowsPerPage + index + 1}`}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '11px',
                                                            bgcolor: '#f1f5f9',
                                                            color: '#475569',
                                                            height: 22
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                        {formatDateDDMMYYYY(reg.createdAt)}
                                                    </Typography>
                                                </Box>

                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.3, mb: 0.5, wordBreak: 'break-word' }}>
                                                    {reg.universityName}
                                                </Typography>

                                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 2 }}>
                                                    <b>Contact:</b> {reg.universityContact || 'N/A'}
                                                </Typography>

                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                                                    <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1.5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11px' }}>
                                                            PLAYERS
                                                        </Typography>
                                                        <Typography sx={{ fontWeight: 700, color: '#0b5299', fontSize: '1.15rem' }}>
                                                            {reg.players?.length || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1.5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11px' }}>
                                                            COACHES
                                                        </Typography>
                                                        <Typography sx={{ fontWeight: 700, color: '#d06c38', fontSize: '1.15rem' }}>
                                                            {reg.coaches?.length || 0}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleOpenDialog(reg)}
                                                sx={{
                                                    mt: 1,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    borderColor: '#0b5299',
                                                    color: '#0b5299',
                                                    borderRadius: 1.5,
                                                    py: 0.7,
                                                    '&:hover': {
                                                        bgcolor: '#0b5299',
                                                        color: '#ffffff',
                                                        borderColor: '#0b5299'
                                                    }
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </Paper>
                                    ))}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
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
                                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748b' }}>
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
                                                <TableCell>{formatDateDDMMYYYY(reg.createdAt)}</TableCell>
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
                    </TableContainer>
                )}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={registrations.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
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
            </Paper>

            {/* View Details Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="lg" 
                fullWidth 
                disableRestoreFocus
                slotProps={{
                    paper: {
                        sx: {
                            m: { xs: 1, sm: 2 },
                            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: '90%' },
                            maxWidth: { xs: 'calc(100% - 16px)', sm: '750px', md: '1100px' },
                            borderRadius: { xs: 2.5, sm: 3 },
                            maxHeight: { xs: '95vh', sm: '90vh' },
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column'
                        }
                    }
                }}
            >
                <DialogTitle 
                    sx={{ 
                        bgcolor: '#0b5299', 
                        color: 'white', 
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 2, sm: 3 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                        <EmojiEventsIcon sx={{ color: '#f59e0b', fontSize: { xs: 22, sm: 26 }, flexShrink: 0 }} />
                        <Typography 
                            sx={{ 
                                fontWeight: 700, 
                                fontSize: { xs: '0.95rem', sm: '1.2rem' },
                                lineHeight: 1.3,
                                color: '#ffffff',
                                wordBreak: 'break-word'
                            }}
                        >
                            Team Details - {selectedReg?.universityName}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={handleCloseDialog}
                        sx={{ 
                            color: '#ffffff', 
                            flexShrink: 0,
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } 
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#ffffff' }}>
                    {selectedReg && (
                        <Box>
                            {/* University Information Section */}
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: '#d06c38', 
                                    mb: 1.5, 
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1rem', sm: '1.15rem' }
                                }}
                            >
                                University Information
                            </Typography>
                            <Box 
                                sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
                                    gap: { xs: 1.5, sm: 2.5 }, 
                                    mb: 3,
                                    p: { xs: 1.5, sm: 2 },
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2,
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                        University Name
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: { xs: '0.88rem', sm: '0.95rem' }, wordBreak: 'break-word' }}>
                                        {selectedReg.universityName}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                        Contact
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: { xs: '0.88rem', sm: '0.95rem' }, wordBreak: 'break-word' }}>
                                        {selectedReg.universityContact || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.3 }}>
                                        Address
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: { xs: '0.88rem', sm: '0.95rem' }, wordBreak: 'break-word' }}>
                                        {selectedReg.address || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Players List Header & Mode Switch */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        color: '#d06c38', 
                                        fontWeight: 'bold',
                                        fontSize: { xs: '1rem', sm: '1.15rem' }
                                    }}
                                >
                                    Players List ({selectedReg.players?.length || 0})
                                </Typography>
                                {selectedReg.players && selectedReg.players.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', p: 0.4, borderRadius: 2 }}>
                                        <Tooltip title="Cards View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setPlayerViewMode('cards')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: playerViewMode === 'cards' ? '#0b5299' : 'transparent',
                                                    color: playerViewMode === 'cards' ? '#ffffff' : '#64748b',
                                                    boxShadow: playerViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: playerViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: playerViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Table View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setPlayerViewMode('table')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: playerViewMode === 'table' ? '#0b5299' : 'transparent',
                                                    color: playerViewMode === 'table' ? '#ffffff' : '#64748b',
                                                    boxShadow: playerViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: playerViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: playerViewMode === 'table' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>

                            {selectedReg.players && selectedReg.players.length > 0 ? (
                                <>
                                    {/* Cards View (Mobile & Desktop) */}
                                    <Box sx={{ 
                                        display: playerViewMode === 'cards' ? 'grid' : 'none', 
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                                        gap: 1.5, 
                                        mb: 3 
                                    }}>
                                        {selectedReg.players.map((player, i) => (
                                            <Paper
                                                key={i}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: '#f8fafc',
                                                    borderColor: '#e2e8f0',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                        {i + 1}. {player.playerName}
                                                    </Typography>
                                                    <Chip
                                                        label={player.gender}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '11px',
                                                            bgcolor: player.gender?.toLowerCase() === 'female' ? '#fce7f3' : '#dbeafe',
                                                            color: player.gender?.toLowerCase() === 'female' ? '#9d174d' : '#1e40af',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, fontSize: '12px' }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mobile</Typography>
                                                        <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '12.5px' }}>{player.mobileNo || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>DOB</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12.5px' }}>{formatDateDDMMYYYY(player.dob)}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Transport</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12.5px', wordBreak: 'break-word' }}>
                                                            {player.transportMode || 'N/A'} {player.transportNumber ? `(${player.transportNumber})` : ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Accommodation</Typography>
                                                        <Chip
                                                            label={player.accommodation || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '10.5px',
                                                                bgcolor: player.accommodation?.toLowerCase() === 'yes' ? '#dcfce7' : '#f1f5f9',
                                                                color: player.accommodation?.toLowerCase() === 'yes' ? '#15803d' : '#64748b',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Arrival</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12px' }}>
                                                            {formatDateDDMMYYYY(player.arrivalDate)} {player.arrivalTime ? `(${player.arrivalTime})` : ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Departure</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12px' }}>
                                                            {formatDateDDMMYYYY(player.departureDate)} {player.departureTime ? `(${player.departureTime})` : ''}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>

                                    {/* Table View (Mobile & Desktop) */}
                                    <Box sx={{ display: playerViewMode === 'table' ? 'block' : 'none' }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: { xs: 'block', sm: 'none' }, 
                                                color: '#64748b', 
                                                mb: 0.5, 
                                                fontStyle: 'italic',
                                                fontSize: '11px'
                                            }}
                                        >
                                            👉 Swipe horizontally to view all columns
                                        </Typography>
                                        <TableContainer 
                                            component={Paper} 
                                            variant="outlined" 
                                            sx={{ 
                                                mb: 3, 
                                                overflowX: 'auto',
                                                WebkitOverflowScrolling: 'touch',
                                                width: '100%',
                                                borderRadius: 2,
                                                borderColor: '#e2e8f0'
                                            }}
                                        >
                                            <Table size="small" sx={{ minWidth: 720 }}>
                                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Name</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Mobile</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Gender</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>DOB</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Transport</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Arrival</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Departure</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Accommodation</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedReg.players.map((player, i) => (
                                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{player.playerName}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{player.mobileNo}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{player.gender}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDDMMYYYY(player.dob)}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{player.transportMode} {player.transportNumber ? `(${player.transportNumber})` : ''}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDDMMYYYY(player.arrivalDate)} <br /> <small>{player.arrivalTime}</small></TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDDMMYYYY(player.departureDate)} <br /> <small>{player.departureTime}</small></TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{player.accommodation}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </>
                            ) : (
                                <Typography color="textSecondary" sx={{ mb: 3 }}>No players added.</Typography>
                            )}

                            {/* Coaches List Header & Mode Switch */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        color: '#d06c38', 
                                        fontWeight: 'bold',
                                        fontSize: { xs: '1rem', sm: '1.15rem' }
                                    }}
                                >
                                    Coaches List ({selectedReg.coaches?.length || 0})
                                </Typography>
                                {selectedReg.coaches && selectedReg.coaches.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', p: 0.4, borderRadius: 2 }}>
                                        <Tooltip title="Cards View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setCoachViewMode('cards')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: coachViewMode === 'cards' ? '#0b5299' : 'transparent',
                                                    color: coachViewMode === 'cards' ? '#ffffff' : '#64748b',
                                                    boxShadow: coachViewMode === 'cards' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: coachViewMode === 'cards' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: coachViewMode === 'cards' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <GridViewRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Table View">
                                            <IconButton
                                                size="small"
                                                onClick={() => setCoachViewMode('table')}
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: 1.5,
                                                    bgcolor: coachViewMode === 'table' ? '#0b5299' : 'transparent',
                                                    color: coachViewMode === 'table' ? '#ffffff' : '#64748b',
                                                    boxShadow: coachViewMode === 'table' ? '0 1px 3px rgba(11,82,153,0.3)' : 'none',
                                                    '&:hover': {
                                                        bgcolor: coachViewMode === 'table' ? '#0b5299' : 'rgba(0,0,0,0.06)',
                                                        color: coachViewMode === 'table' ? '#ffffff' : '#0b5299'
                                                    }
                                                }}
                                            >
                                                <TableRowsRoundedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>

                            {selectedReg.coaches && selectedReg.coaches.length > 0 ? (
                                <>
                                    {/* Cards View (Mobile & Desktop) */}
                                    <Box sx={{ 
                                        display: coachViewMode === 'cards' ? 'grid' : 'none', 
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                                        gap: 1.5, 
                                        mb: 3 
                                    }}>
                                        {selectedReg.coaches.map((coach, i) => (
                                            <Paper
                                                key={i}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: '#f8fafc',
                                                    borderColor: '#e2e8f0',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                        {i + 1}. {coach.name}
                                                    </Typography>
                                                    <Chip
                                                        label={coach.role || 'Coach'}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '11px',
                                                            bgcolor: '#e0e7ff',
                                                            color: '#3730a3',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, fontSize: '12px' }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Mobile</Typography>
                                                        <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '12.5px' }}>{coach.mobileNo || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Email</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12px', wordBreak: 'break-all' }}>{coach.mailId || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Gender</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12.5px' }}>{coach.gender || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Food</Typography>
                                                        <Typography sx={{ fontWeight: 500, color: '#334155', fontSize: '12.5px' }}>{coach.foodType || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box sx={{ gridColumn: 'span 2' }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Accommodation</Typography>
                                                        <Chip
                                                            label={coach.accommodation || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '10.5px',
                                                                bgcolor: coach.accommodation?.toLowerCase() === 'yes' ? '#dcfce7' : '#f1f5f9',
                                                                color: coach.accommodation?.toLowerCase() === 'yes' ? '#15803d' : '#64748b',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>

                                    {/* Table View (Mobile & Desktop) */}
                                    <Box sx={{ display: coachViewMode === 'table' ? 'block' : 'none' }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: { xs: 'block', sm: 'none' }, 
                                                color: '#64748b', 
                                                mb: 0.5, 
                                                fontStyle: 'italic',
                                                fontSize: '11px'
                                            }}
                                        >
                                            👉 Swipe horizontally to view all columns
                                        </Typography>
                                        <TableContainer 
                                            component={Paper} 
                                            variant="outlined" 
                                            sx={{ 
                                                overflowX: 'auto',
                                                WebkitOverflowScrolling: 'touch',
                                                width: '100%',
                                                borderRadius: 2,
                                                borderColor: '#e2e8f0'
                                            }}
                                        >
                                            <Table size="small" sx={{ minWidth: 650 }}>
                                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Name</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Role</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Mobile</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Email</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Gender</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Food</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>Accommodation</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedReg.coaches.map((coach, i) => (
                                                        <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{coach.name}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.role}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.mobileNo}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.mailId}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.gender}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.foodType}</TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{coach.accommodation}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </>
                            ) : (
                                <Typography color="textSecondary">No coaches added.</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
