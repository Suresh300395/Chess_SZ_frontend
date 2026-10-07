import React from 'react';
import { Box, IconButton } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import WebOutlinedIcon from '@mui/icons-material/WebOutlined';

const CommitteeCard = ({ member }) => {
    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: '12px', md: '16px' }, 
            padding: '16px', 
            borderRadius: '12px', 
            background: '#faf6f3', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            border: '1px solid #f0e6e0',
            flexDirection: { xs: 'column', sm: 'row' },
            width: '100%',
        }}>
            <Box 
                component="img" 
                src={member?.image || '/placeholder-avatar.jpg'} 
                alt={member?.name} 
                sx={{ 
                    width: '90px', 
                    height: '90px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    flexShrink: 0
                }} 
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <Box component="h3" sx={{ m: 0, color: 'var(--color-blue)', fontSize: '20px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {member?.name?.toLowerCase()}
                </Box>
                <Box component="span" sx={{ color: 'var(--color-orange)', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                    {member?.role?.toLowerCase()}
                </Box>
                <Box component="span" sx={{ color: '#6b7280', fontSize: '13px', fontWeight: 400, textTransform: 'capitalize' }}>
                    {member?.position?.toLowerCase()}
                </Box>
                
                <Box sx={{ width: '40px', height: '2px', background: 'var(--color-orange)', my: 1.5 }}></Box>
                
                <Box sx={{ display: 'flex', gap: '12px' }}>
                    {member?.email && (
                        <IconButton 
                            sx={{ 
                                background: 'rgba(208, 108, 56, 0.1)', 
                                color: 'var(--color-orange)', 
                                borderRadius: '12px',
                                padding: '8px',
                                '&:hover': { background: 'rgba(208, 108, 56, 0.2)' }
                            }} 
                            href={`mailto:${member.email}`}
                        >
                            <EmailOutlinedIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    )}
                    {member?.phone && (
                        <IconButton 
                            sx={{ 
                                background: 'rgba(11, 82, 153, 0.1)', 
                                color: 'var(--color-blue)', 
                                borderRadius: '12px',
                                padding: '8px',
                                '&:hover': { background: 'rgba(11, 82, 153, 0.2)' }
                            }} 
                            href={`tel:${member.phone}`}
                        >
                            <LocalPhoneOutlinedIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    )}
                    {member?.website && (
                        <IconButton 
                            sx={{ 
                                background: 'rgba(13, 35, 59, 0.1)', 
                                color: 'var(--color-navy)', 
                                borderRadius: '12px',
                                padding: '8px',
                                '&:hover': { background: 'rgba(13, 35, 59, 0.2)' }
                            }} 
                            href={member.website} 
                            target="_blank"
                        >
                            <WebOutlinedIcon sx={{ fontSize: '20px' }} />
                        </IconButton>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CommitteeCard;
