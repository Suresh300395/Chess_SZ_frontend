import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import WebOutlinedIcon from '@mui/icons-material/WebOutlined';

const CommitteeCard = ({ member }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: { xs: 'center', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2.5, sm: 3, md: 3.5 },
                p: { xs: 2.5, sm: 3, md: 3.5 },
                borderRadius: '24px',
                bgcolor: '#ffffff',
                border: '1px solid #f0e6df',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 28px rgba(11, 82, 153, 0.08)'
                }
            }}
        >
            {/* Campus Watermark Background (Right side) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: { xs: '100%', sm: '55%' },
                    height: '100%',
                    backgroundImage: 'url("/hero.png")',
                    backgroundPosition: 'right 30%',
                    backgroundSize: 'cover',
                    opacity: 0.12,
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                    zIndex: 0,
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)',
                }}
            />

            {/* Bottom-right Organic Wave Accents */}
            <Box
                component="svg"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: { xs: '75%', sm: '55%' },
                    height: { xs: '65px', sm: '85px' },
                    pointerEvents: 'none',
                    zIndex: 1
                }}
            >
                {/* Subtle blue underwave */}
                <path
                    d="M0,120 C110,85 240,115 400,55 L400,120 Z"
                    fill="rgba(11, 82, 153, 0.07)"
                />
                {/* Soft orange decorative wave */}
                <path
                    d="M30,120 C130,80 260,110 400,40 L400,120 Z"
                    fill="rgba(245, 130, 32, 0.18)"
                />
            </Box>

            {/* Bottom-right Dot Grid Pattern */}
            <Box
                sx={{
                    position: 'absolute',
                    right: { xs: 16, sm: 24 },
                    bottom: 14,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 4px)',
                    gap: '7px',
                    opacity: 0.35,
                    pointerEvents: 'none',
                    zIndex: 2
                }}
            >
                {Array.from({ length: 15 }).map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: '#94a3b8'
                        }}
                    />
                ))}
            </Box>


            {/* Left: Avatar with Decorative Orange Arc & Badge */}
            <Box
                sx={{
                    position: 'relative',
                    width: { xs: 100, sm: 115 },
                    height: { xs: 100, sm: 115 },
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2
                }}
            >
                {/* Soft Peach Background Blob */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -6,
                        left: -8,
                        width: 'calc(100% + 14px)',
                        height: 'calc(100% + 14px)',
                        borderRadius: '50%',
                        bgcolor: '#fef5ec',
                        zIndex: 0
                    }}
                />

                {/* Decorative Orange Arc Accent */}
                <Box
                    component="svg"
                    viewBox="0 0 120 120"
                    sx={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        width: 'calc(100% + 12px)',
                        height: 'calc(100% + 12px)',
                        pointerEvents: 'none',
                        zIndex: 2
                    }}
                >
                    <path
                        d="M 60 4 A 56 56 0 0 1 116 60 A 56 56 0 0 1 96 102"
                        fill="none"
                        stroke="#f58220"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </Box>

                {/* Avatar Photo */}
                <Box
                    component="img"
                    src={member?.image || '/placeholder-avatar.jpg'}
                    alt={member?.name || 'Committee Member'}
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid #ffffff',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                        zIndex: 1,
                        bgcolor: '#f1f5f9'
                    }}
                />

                {/* Orange Badge at bottom right of Avatar */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: '#e66519',
                        border: '2.5px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(230, 101, 25, 0.35)',
                        zIndex: 3
                    }}
                >
                    <Box
                        component="img"
                        src="/commitee_card_icon.png"
                        alt="Badge Icon"
                        sx={{
                            width: 22,
                            height: 22,
                            objectFit: 'contain'
                        }}
                    />
                </Box>
            </Box>

            {/* Center Content: Name, Role, Position, Accent Line & Actions */}
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    textAlign: { xs: 'center', sm: 'left' },
                    zIndex: 2,
                    pr: { xs: 0, sm: 2 }
                }}
            >
                {/* Member Name */}
                <Typography
                    component="h3"
                    sx={{
                        m: 0,
                        color: '#0b2545',
                        fontSize: { xs: '22px', sm: '26px', md: '28px' },
                        fontWeight: 800,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.15,
                        textTransform: 'capitalize'
                    }}
                >
                    {member?.name ? member.name.toLowerCase() : 'Member Name'}
                </Typography>

                {/* Member Role / Designation */}
                <Typography
                    sx={{
                        color: '#e66519',
                        fontSize: { xs: '15px', sm: '17px' },
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        mt: 0.5,
                        lineHeight: 1.25
                    }}
                >
                    {member?.role ? member.role.toLowerCase() : 'Committee Member'}
                </Typography>

                {/* Position Row */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        mt: 1,
                        color: '#475569'
                    }}
                >
                    <PermIdentityRoundedIcon sx={{ fontSize: 20, color: '#475569' }} />
                    <Box sx={{ width: '1px', height: '14px', bgcolor: '#cbd5e1' }} />
                    <Typography
                        sx={{
                            color: '#475569',
                            fontSize: '15px',
                            fontWeight: 500,
                            textTransform: 'capitalize'
                        }}
                    >
                        {member?.position ? member.position.toLowerCase() : 'Member'}
                    </Typography>
                </Box>

                {/* Orange Horizontal Accent Bar */}
                <Box
                    sx={{
                        width: '46px',
                        height: '3.5px',
                        borderRadius: '3px',
                        bgcolor: '#e66519',
                        mt: 1.5,
                        mb: (member?.email || member?.phone || member?.website) ? 1.5 : 0.5
                    }}
                />

                {/* Functionality: Contact Buttons (Email, Phone, Website) */}
                {(member?.email || member?.phone || member?.website) && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            mt: 0.5
                        }}
                    >
                        {member?.email && (
                            <Tooltip title={`Email: ${member.email}`}>
                                <IconButton
                                    size="small"
                                    href={`mailto:${member.email}`}
                                    sx={{
                                        bgcolor: '#fff5ed',
                                        color: '#e66519',
                                        p: 0.75,
                                        borderRadius: '10px',
                                        border: '1px solid #fbdcc7',
                                        '&:hover': { bgcolor: '#fde4d0' }
                                    }}
                                >
                                    <EmailOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {member?.phone && (
                            <Tooltip title={`Phone: ${member.phone}`}>
                                <IconButton
                                    size="small"
                                    href={`tel:${member.phone}`}
                                    sx={{
                                        bgcolor: '#eff6ff',
                                        color: '#0b5299',
                                        p: 0.75,
                                        borderRadius: '10px',
                                        border: '1px solid #bfdbfe',
                                        '&:hover': { bgcolor: '#dbeafe' }
                                    }}
                                >
                                    <LocalPhoneOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {member?.website && (
                            <Tooltip title="Website">
                                <IconButton
                                    size="small"
                                    href={member.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{
                                        bgcolor: '#f8fafc',
                                        color: '#0f172a',
                                        p: 0.75,
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        '&:hover': { bgcolor: '#f1f5f9' }
                                    }}
                                >
                                    <WebOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default CommitteeCard;
